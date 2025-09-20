
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { PaymentModal } from "@/components/PaymentModal";

import { 
  LogOut, 
  User,
  Car,
  History,
  CalendarClock,
  Wallet,
  ShieldCheck as ShieldCheckIcon,
  MapPin,
  Settings,
  HelpCircle,
  ChevronRight,
  Pencil,
  Award, 
  Label,
} from "lucide-react";

const tiers = {
    'Bronze': { icon: ShieldCheckIcon, color: "text-amber-700" },
    'Silver': { icon: ShieldCheckIcon, color: "text-gray-400" },
    'Gold': { icon: Award, color: "text-yellow-500" },
    'Platinum': { icon: Award, color: "text-cyan-400" },
    'Eco Hero': { icon: Award, color: "text-green-500" },
};

const ProfileInfoRow = ({ label, value }: { label: string, value: string | null | undefined }) => (
    <div className="flex justify-between items-center text-sm py-2">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-right">{value || 'Not set'}</span>
    </div>
);

const personalDetailsSchema = z.object({
  displayName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phoneNumber: z.string().min(10, { message: "Please enter a valid phone number." }),
});

const driverDetailsSchema = z.object({
    licenseNumber: z.string().min(5, { message: "Please enter a valid license number."}),
    carModel: z.string().min(3, { message: "Please enter a valid car model."}),
})

export default function ProfilePage() {
  const { user, signOut, updateUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isPersonalDetailsOpen, setIsPersonalDetailsOpen] = useState(false);
  const [isDriverDetailsOpen, setIsDriverDetailsOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  const personalDetailsForm = useForm<z.infer<typeof personalDetailsSchema>>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      displayName: "",
      phoneNumber: "",
    },
  });

  const driverDetailsForm = useForm<z.infer<typeof driverDetailsSchema>>({
    resolver: zodResolver(driverDetailsSchema),
    defaultValues: {
      licenseNumber: "",
      carModel: "",
    },
  });

  useEffect(() => {
    if (user) {
      personalDetailsForm.reset({
        displayName: user.displayName || "",
        phoneNumber: (user as any).phoneNumber || "",
      });
      driverDetailsForm.reset({
        licenseNumber: (user as any).licenseNumber || "",
        carModel: (user as any).carModel || "",
      });
    }
  }, [user, personalDetailsForm, driverDetailsForm]);

  const handleSignOut = () => {
    signOut();
    router.replace("/");
  };
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('');
  }

  function onPersonalDetailsSubmit(values: z.infer<typeof personalDetailsSchema>) {
    updateUser({ displayName: values.displayName, phoneNumber: values.phoneNumber });
    toast({ title: "Success", description: "Your personal details have been updated." });
    setIsPersonalDetailsOpen(false);
  }

  function onDriverDetailsSubmit(values: z.infer<typeof driverDetailsSchema>) {
    updateUser({ licenseNumber: values.licenseNumber, carModel: values.carModel });
    toast({ title: "Success", description: "Your driver details have been updated." });
    setIsDriverDetailsOpen(false);
  }

  const handleTopUpSuccess = (amount: number) => {
    if (user) {
        const newBalance = (user.walletBalance || 0) + amount;
        updateUser({ walletBalance: newBalance });
    }
  };

  const UserBadge = () => {
    if (!user?.badgeTier) return null;
    const tierInfo = tiers[user.badgeTier as keyof typeof tiers];
    if (!tierInfo) return null;
    const Icon = tierInfo.icon;
    return (
         <div className={`flex items-center gap-1.5 text-sm font-semibold ${tierInfo.color}`}>
            <Icon className="h-5 w-5" />
            <span>{user.badgeTier} Tier</span>
        </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl p-4 pb-28">
      <div className="flex flex-col items-center pt-8">
        <Avatar className="h-24 w-24 border-4 border-background shadow-md">
          <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? 'User'} data-ai-hint="person avatar" />
          <AvatarFallback className="text-3xl">{getInitials(user?.displayName)}</AvatarFallback>
        </Avatar>
        <h1 className="mt-4 text-2xl font-bold">{user?.displayName}</h1>
        <div className="mt-2">
          <UserBadge />
        </div>
      </div>
      
      <Card className="mt-8">
          <CardContent className="p-2 sm:p-4">
            <Accordion type="single" collapsible className="w-full">
              
              <AccordionItem value="personal-details">
                <AccordionTrigger className="px-2">
                  <div className="flex items-center">
                    <User className="mr-4 h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Personal Details</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-2">
                  <ProfileInfoRow label="Full Name" value={user?.displayName} />
                  <ProfileInfoRow label="Phone Number" value={(user as any)?.phoneNumber} />
                  <Dialog open={isPersonalDetailsOpen} onOpenChange={setIsPersonalDetailsOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="mt-4 w-full">
                        <Pencil className="mr-2 h-4 w-4" /> Edit Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Personal Details</DialogTitle>
                        <DialogDescription>
                          Make changes to your personal details here. Click save when you're done.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...personalDetailsForm}>
                        <form onSubmit={personalDetailsForm.handleSubmit(onPersonalDetailsSubmit)} className="space-y-4">
                          <FormField
                            control={personalDetailsForm.control}
                            name="displayName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your full name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                           <FormField
                            control={personalDetailsForm.control}
                            name="phoneNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your phone number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                            <Button type="submit">Save changes</Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="driver-details">
                <AccordionTrigger className="px-2">
                  <div className="flex items-center">
                    <Car className="mr-4 h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Driver Details</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-2">
                  <ProfileInfoRow label="License No." value={(user as any)?.licenseNumber} />
                  <ProfileInfoRow label="Car Model" value={(user as any)?.carModel} />
                  <ProfileInfoRow label="Car Photo" value="Uploaded" />
                  <Dialog open={isDriverDetailsOpen} onOpenChange={setIsDriverDetailsOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="mt-4 w-full">
                        <Pencil className="mr-2 h-4 w-4" /> Edit Driver Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Driver Details</DialogTitle>
                         <DialogDescription>
                          Make changes to your driver details here. Click save when you're done.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...driverDetailsForm}>
                        <form onSubmit={driverDetailsForm.handleSubmit(onDriverDetailsSubmit)} className="space-y-4">
                          <FormField
                            control={driverDetailsForm.control}
                            name="licenseNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>License Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your license number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                           <FormField
                            control={driverDetailsForm.control}
                            name="carModel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Car Model</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Toyota Camry 2021" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                             <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                            <Button type="submit">Save changes</Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="wallet-billing">
                <AccordionTrigger className="px-2">
                  <div className="flex items-center">
                    <Wallet className="mr-4 h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Wallet & Billing</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-2">
                  <ProfileInfoRow label="Current Balance" value={`$${(user?.walletBalance || 0).toFixed(2)}`} />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4 w-full"
                    onClick={() => setIsTopUpOpen(true)}
                  >
                    Top-up Wallet
                  </Button>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="trust-verification">
                <AccordionTrigger className="px-2">
                  <div className="flex items-center">
                    <ShieldCheckIcon className="mr-4 h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Trust & Verification</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-2">
                   <ProfileInfoRow label="Email" value="Verified" />
                   <ProfileInfoRow label="Phone Number" value="Not Verified" />
                   <Button variant="outline" size="sm" className="mt-4 w-full">
                    Verify Phone Number
                  </Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="saved-locations" className="border-b-0">
                <AccordionTrigger className="px-2">
                  <div className="flex items-center">
                    <MapPin className="mr-4 h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Saved Locations</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-2">
                   <ProfileInfoRow label="Home" value="123 Main St, Anytown" />
                   <ProfileInfoRow label="Work" value="456 Oak Ave, Otherville" />
                   <Button variant="outline" size="sm" className="mt-4 w-full">
                    <Pencil className="mr-2 h-4 w-4" /> Manage Locations
                  </Button>
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </CardContent>
      </Card>

      <Card className="mt-4">
          <CardContent className="p-0">
             <div className="divide-y divide-border">
                <Link href="/my-rides" className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer" role="button">
                    <div className="flex items-center">
                        <History className="mr-4 h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Ride History</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
                <Link href="/my-rides" className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer" role="button">
                    <div className="flex items-center">
                        <CalendarClock className="mr-4 h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">My Scheduled Rides</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
                 <Link href="#" className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer" role="button">
                    <div className="flex items-center">
                        <Settings className="mr-4 h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Account Settings</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
                <Link href="#" className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer" role="button">
                    <div className="flex items-center">
                        <HelpCircle className="mr-4 h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Help / Support</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
             </div>
          </CardContent>
      </Card>
      
      <div className="mt-8">
        <Button variant="destructive" className="w-full" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onSuccess={handleTopUpSuccess}
      />
    </div>
  );
}
