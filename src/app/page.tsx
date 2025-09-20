"use client";

import Link from "next/link";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  MapPin, 
  Navigation,
  ArrowRight,
  Check,
  Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleGetStarted = () => {
    if (user) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/signup';
    }
  };

  const handleDownload = async () => {
    if (deferredPrompt && isInstallable) {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setIsInstallable(false);
    } else {
      // Fallback: redirect to signup or show instructions
      if (user) {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/signup';
      }
    }
  };

  const handleLogin = () => {
    if (user) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 relative overflow-hidden">
      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-teal-700">Qmuter</div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-gray-600 hover:text-gray-800" onClick={handleLogin}>
            Log In
          </Button>
          <Button className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-2 rounded-lg" onClick={handleGetStarted}>
            Get Started
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-120px)]">
          {/* Left Side - Hero Content */}
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Where locals
                <br />
                share routes
              </h1>
              <p className="text-xl text-gray-100 leading-relaxed max-w-lg">
                Qmuter helps you share everyday routes—like school runs or office commutes—with people nearby. Whether you're dropping your neighbour's kids at school or heading to work with someone on your street, Qmuter makes commuting smarter, simpler, and more connected.
              </p>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={handleDownload}
                className="bg-white text-teal-700 hover:bg-gray-50 px-8 py-3 rounded-lg font-medium inline-flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                {isInstallable ? 'Install App' : 'Download to your mobile screen'}
              </Button>
              <p className="text-sm text-gray-200">
                {isInstallable 
                  ? 'Install Qmuter on your device for the best experience'
                  : 'Available to be downloaded via mobile to your iOS and Android.'
                }
              </p>
            </div>
          </motion.div>

          {/* Right Side - Features Card */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 rounded-3xl p-8 relative z-10">
              <CardContent className="p-0">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Fair, Simple & Community-Driven
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0 mt-1">
                        <Check className="w-4 h-4 text-gray-400 m-0.5" />
                      </div>
                      <div>
                        <p className="text-gray-700 leading-relaxed">
                          <span className="font-semibold">Fares that are competitive with public transport.</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0 mt-1">
                        <Check className="w-4 h-4 text-gray-400 m-0.5" />
                      </div>
                      <div>
                        <p className="text-gray-700 leading-relaxed">
                          <span className="font-semibold">Direct routes with no unnecessary stops</span>—just one pickup and one drop-off.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0 mt-1">
                        <Check className="w-4 h-4 text-gray-400 m-0.5" />
                      </div>
                      <div>
                        <p className="text-gray-700 leading-relaxed">
                          <span className="font-semibold">New routes are approved via community voting</span>, giving you a voice.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0 mt-1">
                        <Check className="w-4 h-4 text-gray-400 m-0.5" />
                      </div>
                      <div>
                        <p className="text-gray-700 leading-relaxed">
                          <span className="font-semibold">A secure wallet ensures fares cover costs</span>, not attract commercial drivers.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Route Search Preview */}
                <div className="border-t pt-8">
                  <div className="grid grid-cols-1 gap-3 mb-4">
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-teal-600" />
                      <Input 
                        placeholder="From where?" 
                        className="pl-12 py-4 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-base"
                      />
                    </div>
                    <div className="relative">
                      <Navigation className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-500" />
                      <Input 
                        placeholder="To where?" 
                        className="pl-12 py-4 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-base"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleGetStarted}
                    className="w-full py-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-base"
                  >
                    Find your ride
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Background Curved Shape */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-teal-600 to-teal-700"
          style={{
            clipPath: 'polygon(0% 0%, 65% 0%, 45% 100%, 0% 100%)'
          }}
        />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-white/5 rounded-full blur-xl" />
      <div className="absolute bottom-1/3 left-1/12 w-24 h-24 bg-white/5 rounded-full blur-lg" />
    </div>
  );
}
