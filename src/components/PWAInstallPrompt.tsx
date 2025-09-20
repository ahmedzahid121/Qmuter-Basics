"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, X, Smartphone, Zap, Wifi, Shield } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if app is already installed
    const checkInstallation = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };

    // Check online status
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      toast({
        title: "App Installed!",
        description: "Qmuter is now installed on your device.",
        variant: "default"
      });
    };

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial checks
    checkInstallation();
    checkOnlineStatus();

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast({
          title: "Installation Started",
          description: "Qmuter is being installed on your device...",
          variant: "default"
        });
      } else {
        toast({
          title: "Installation Cancelled",
          description: "You can install Qmuter later from your browser menu.",
          variant: "default"
        });
      }

      // Clear the deferred prompt
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Installation failed:', error);
      toast({
        title: "Installation Failed",
        description: "Please try installing from your browser menu.",
        variant: "destructive"
      });
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
  };

  // Don't show if already installed or offline
  if (isInstalled || !isOnline) {
    return null;
  }

  return (
    <Dialog open={showInstallPrompt} onOpenChange={setShowInstallPrompt}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-green-600" />
            Install Qmuter App
          </DialogTitle>
          <DialogDescription>
            Get the best experience with our mobile app. Install Qmuter for faster access and offline features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Native App Experience</p>
                <p className="text-sm text-muted-foreground">Works like a real mobile app</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium">Faster Loading</p>
                <p className="text-sm text-muted-foreground">Cached for instant access</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Wifi className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Offline Support</p>
                <p className="text-sm text-muted-foreground">Works without internet</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Secure & Private</p>
                <p className="text-sm text-muted-foreground">Your data stays safe</p>
              </div>
            </div>
          </div>

          {/* Features Badge */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">GPS Tracking</Badge>
            <Badge variant="secondary">Offline Maps</Badge>
            <Badge variant="secondary">Push Notifications</Badge>
            <Badge variant="secondary">Emergency Button</Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleInstall} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Install App
            </Button>
            <Button onClick={handleDismiss} variant="outline">
              <X className="mr-2 h-4 w-4" />
              Later
            </Button>
          </div>

          {/* Manual Install Instructions */}
          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">Manual Installation:</p>
            <p>• <strong>Chrome:</strong> Tap ⋮ → "Add to Home screen"</p>
            <p>• <strong>Safari:</strong> Tap Share → "Add to Home Screen"</p>
            <p>• <strong>Firefox:</strong> Tap ⋮ → "Install App"</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook for PWA functionality
export function usePWA() {
  const [isPWA, setIsPWA] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check if running as PWA
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      setIsPWA(isStandalone || isFullscreen);
    };

    // Check online status
    const checkOnline = () => {
      setIsOnline(navigator.onLine);
    };

    checkPWA();
    checkOnline();

    window.addEventListener('online', checkOnline);
    window.addEventListener('offline', checkOnline);

    return () => {
      window.removeEventListener('online', checkOnline);
      window.removeEventListener('offline', checkOnline);
    };
  }, []);

  return { isPWA, isOnline };
} 