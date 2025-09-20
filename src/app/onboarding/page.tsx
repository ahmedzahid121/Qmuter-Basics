'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Logo from '@/components/Logo';
import { Car, User, Leaf, TrendingUp, Award, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NameSelectionStep } from '@/components/NameSelectionStep';

const totalSteps = 6;

const slideVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setRole, updateUser } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<'driver' | 'passenger' | null>(null);
  const [selectedDisplayName, setSelectedDisplayName] = useState<string>('');

  const nextStep = () => setStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleRoleSelect = (role: 'driver' | 'passenger') => {
    setSelectedRole(role);
    setRole(role);
    nextStep();
  };

  const handleNameSelection = (displayName: string) => {
    setSelectedDisplayName(displayName);
    nextStep();
  };

  const handleFinish = async () => {
    try {
      // Update user with the selected display name and mark onboarding as complete
      await updateUser({ 
        displayName: selectedDisplayName,
        onboardingComplete: true 
      });
      
      toast({
          title: "🎉 Welcome to the Qmuter crew!",
          description: `Great to meet you, ${selectedDisplayName}! Let's find you a ride.`,
      });
      router.push('/dashboard');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Please try again.",
      });
    }
  };
  
  const progress = (step / totalSteps) * 100;

  return (
    <div className="w-full max-w-md">
        <div className="mb-4">
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground mt-2">Step {step} of {totalSteps}</p>
        </div>
        <Card className="overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={slideVariants}
                    transition={{ duration: 0.3 }}
                >
                    {step === 1 && <WelcomeStep onNext={nextStep} />}
                    {step === 2 && <RoleStep onSelect={handleRoleSelect} />}
                    {step === 3 && <MissionStep onNext={nextStep} />}
                    {step === 4 && <ProfileStep user={user} onNext={nextStep} />}
                    {step === 5 && <NameSelectionStep onNext={handleNameSelection} currentName={user?.displayName} />}
                    {step === 6 && <BadgeStep onFinish={handleFinish} displayName={selectedDisplayName} />}
                </motion.div>
            </AnimatePresence>
        </Card>
        {step > 1 && step < 6 && (
             <Button variant="ghost" onClick={prevStep} className="mt-4 w-full">Back</Button>
        )}
    </div>
  );
}

const WelcomeStep = ({ onNext }: { onNext: () => void }) => (
  <div className="p-6 text-center">
    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
        <Logo className="h-12 mx-auto text-primary" />
    </motion.div>
    <h2 className="text-2xl font-bold mt-4">Welcome to Qmuter!</h2>
    <p className="text-muted-foreground mt-2">Let's fix your commute together. The smart, simple, and sustainable way to travel.</p>
    <Button onClick={onNext} className="mt-6 w-full">Let's Go!</Button>
  </div>
);

const RoleStep = ({ onSelect }: { onSelect: (role: 'driver' | 'passenger') => void }) => (
    <div className="p-6 text-center">
        <h2 className="text-2xl font-bold">What's Your Superpower?</h2>
        <p className="text-muted-foreground mt-2">How will you be using Qmuter most of the time? (You can always switch later!)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <Card onClick={() => onSelect('driver')} className="p-6 text-center hover:bg-primary/10 cursor-pointer transition-colors duration-200">
                <Car className="h-12 w-12 mx-auto text-primary" />
                <h3 className="font-semibold text-lg mt-2">I'm Driving</h3>
            </Card>
             <Card onClick={() => onSelect('passenger')} className="p-6 text-center hover:bg-primary/10 cursor-pointer transition-colors duration-200">
                <User className="h-12 w-12 mx-auto text-primary" />
                <h3 className="font-semibold text-lg mt-2">I Need a Ride</h3>
            </Card>
        </div>
    </div>
);

const MissionStep = ({ onNext }: { onNext: () => void }) => (
  <div className="p-6 text-center">
    <h2 className="text-2xl font-bold">Your Mission, Should You Choose to Accept It</h2>
     <p className="text-muted-foreground mt-2">By sharing rides, you're making a real impact.</p>
    <div className="space-y-4 mt-6">
        <Card className="p-4 flex items-center gap-4 text-left">
            <div className="bg-primary/10 p-2 rounded-lg"><TrendingUp className="h-6 w-6 text-primary" /></div>
            <div>
                <h3 className="font-semibold">Save Money</h3>
                <p className="text-sm text-muted-foreground">Cut down on fuel and maintenance costs.</p>
            </div>
        </Card>
         <Card className="p-4 flex items-center gap-4 text-left">
            <div className="bg-green-500/10 p-2 rounded-lg"><Leaf className="h-6 w-6 text-green-600" /></div>
            <div>
                <h3 className="font-semibold">Reduce CO₂</h3>
                <p className="text-sm text-muted-foreground">Fewer cars on the road means a healthier planet.</p>
            </div>
        </Card>
         <Card className="p-4 flex items-center gap-4 text-left">
            <div className="bg-yellow-500/10 p-2 rounded-lg"><Award className="h-6 w-6 text-yellow-600" /></div>
            <div>
                <h3 className="font-semibold">Earn Rewards</h3>
                <p className="text-sm text-muted-foreground">Gain badges and perks for your contribution.</p>
            </div>
        </Card>
    </div>
    <Button onClick={onNext} className="mt-6 w-full">I'm In!</Button>
  </div>
);

const ProfileStep = ({ user, onNext }: { user: any, onNext: () => void }) => (
     <div className="p-6 text-center">
        <h2 className="text-2xl font-bold">You're Looking Good!</h2>
        <p className="text-muted-foreground mt-2">We've set up your profile with the basics. You can add more details later.</p>
        <div className="mt-6 flex flex-col items-center gap-4">
             <div className="flex items-center gap-4 rounded-lg border p-4 w-full">
                <User className="h-5 w-5 text-muted-foreground"/>
                <p className="font-medium">{user?.displayName || 'Your Name'}</p>
            </div>
             <div className="flex items-center gap-4 rounded-lg border p-4 w-full">
                <svg className="h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" /><path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" /></svg>
                <p className="font-medium">{user?.email || 'your@email.com'}</p>
            </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4">For your security, we only use verified accounts and never share your contact details without permission.</p>
        <Button onClick={onNext} className="mt-6 w-full">Looks Great!</Button>
     </div>
);

const BadgeStep = ({ onFinish, displayName }: { onFinish: () => void, displayName: string }) => (
    <div className="p-6 text-center">
        <h2 className="text-2xl font-bold">Earn Your First Badge</h2>
        <p className="text-muted-foreground mt-2">Complete your first shared commute to unlock the "Green Starter" badge.</p>
        <div className="mt-6 flex flex-col items-center gap-2 p-6 bg-muted rounded-lg">
            <div className="relative">
                <Leaf className="h-20 w-20 text-green-500" />
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}>
                     <CheckCircle2 className="absolute -bottom-2 -right-2 h-8 w-8 text-white bg-green-500 rounded-full" />
                </motion.div>
            </div>
            <h3 className="font-bold text-xl mt-2">Green Starter</h3>
            <p className="text-muted-foreground text-sm">Welcome to the community!</p>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
            <p>Ready to start your journey, <strong>{displayName}</strong>?</p>
        </div>
        <Button onClick={onFinish} className="mt-6 w-full">Complete Onboarding</Button>
    </div>
);
