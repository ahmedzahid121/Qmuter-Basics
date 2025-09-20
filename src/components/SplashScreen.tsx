"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users, Shield, ArrowRight } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Detect if app is running in standalone mode (PWA)
  const isStandalone = 
    typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );

  useEffect(() => {
    // Show splash content after a brief delay
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 500);

    // Check authentication status with timeout
    const checkAuth = async () => {
      try {
        // Wait for auth to be ready
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds timeout
        
        while (loading && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }

        if (user) {
          // User is authenticated, redirect to dashboard
          setTimeout(() => {
            router.push('/dashboard');
            onComplete();
          }, 2500);
        } else {
          // User not authenticated, show auth options
          setTimeout(() => {
            setIsChecking(false);
          }, 2000);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setError('Failed to check authentication status');
        setTimeout(() => {
          setIsChecking(false);
        }, 2000);
      }
    };

    checkAuth();
    
    return () => clearTimeout(contentTimer);
  }, [user, loading, router, onComplete]);

  const handleGetStarted = () => {
    router.push('/signup');
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-500 via-teal-400 to-emerald-400 flex items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-white/20 blur-xl"></div>
          <div className="absolute top-40 right-16 w-24 h-24 rounded-full bg-white/15 blur-lg"></div>
          <div className="absolute bottom-32 left-20 w-40 h-40 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute bottom-20 right-10 w-28 h-28 rounded-full bg-white/20 blur-xl"></div>
        </div>

        <div className="relative z-10 text-center">
          {/* Logo Animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20,
              duration: 1.2
            }}
            className="mb-8"
          >
            <div className="w-24 h-24 mx-auto bg-white rounded-3xl shadow-2xl flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                <MapPin className="w-8 h-8 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Brand Name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-5xl font-bold text-white mb-4 tracking-tight"
          >
            Qmuter
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-xl text-teal-50 font-light"
          >
            Where locals share routes
          </motion.p>

          {/* Loading Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="mt-12"
          >
            <div className="w-8 h-8 mx-auto">
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
            <p className="text-teal-50 mt-4 text-sm">
              {error ? 'Connection error' : 'Checking your account...'}
            </p>
            {error && (
              <p className="text-red-200 text-xs mt-2">
                Please check your internet connection
              </p>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 via-teal-400 to-emerald-400 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-white/20 blur-xl"></div>
        <div className="absolute top-40 right-16 w-24 h-24 rounded-full bg-white/15 blur-lg"></div>
        <div className="absolute bottom-32 left-20 w-40 h-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 rounded-full bg-white/20 blur-xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : -20 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="pt-16 px-6 text-center"
        >
          <div className="w-20 h-20 mx-auto bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center">
              <MapPin className="w-7 h-7 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Qmuter</h1>
          <p className="text-teal-50 text-lg font-light">Smart commuting for everyone</p>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 30 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl font-bold text-white mb-4 leading-tight">
              Fair, Simple &<br />Community-Driven
            </h2>
            <p className="text-teal-50 text-lg leading-relaxed max-w-sm mx-auto">
              Share everyday routes with people nearby and make commuting smarter, simpler, and more connected.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 30 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="space-y-4 mb-12"
          >
            <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <p className="text-white font-medium">Competitive with public transport</p>
            </div>
            
            <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
              <p className="text-white font-medium">Direct routes, no unnecessary stops</p>
            </div>
            
            <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <p className="text-white font-medium">Community-approved routes</p>
            </div>
          </motion.div>
        </div>

        {/* Bottom Action */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 50 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="pb-12 px-6"
        >
          <button
            onClick={handleGetStarted}
            className="w-full bg-white text-teal-600 font-bold text-lg py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <p className="text-center text-teal-50 text-sm mt-4 opacity-80">
            Join the community of smart commuters
          </p>
        </motion.div>
      </div>
    </div>
  );
} 