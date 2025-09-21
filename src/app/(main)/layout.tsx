"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import BottomNav from "@/components/BottomNav";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DevCacheMonitor } from "@/components/CacheStats";
import SplashScreen from "@/components/SplashScreen";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showSplash, setShowSplash] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // TEMPORARY: Disable authentication for testing
  const BYPASS_AUTH = true; // Set to false to re-enable authentication

  const isPublicPage = pathname === '/';

  // Detect if app is running in standalone mode (PWA)
  const isStandalone = 
    typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );

  useEffect(() => {
    // TEMPORARY: Skip authentication checks if bypass is enabled
    if (BYPASS_AUTH) {
      setAuthChecked(true);
      setShowSplash(false);
      return;
    }

    // Only show splash screen for PWA or first load
    if (!isStandalone && !showSplash) {
      setShowSplash(false);
      return;
    }

    if (loading) return;

    // Auth check completed
    setAuthChecked(true);

    if (user && !user.onboardingComplete) {
      router.replace('/onboarding');
      return;
    }

    if (!user && !isPublicPage) {
      router.replace("/login");
    }
  }, [user, loading, router, isPublicPage, pathname, isStandalone, showSplash]);

  // Show splash screen for PWA or during initial load
  if (!BYPASS_AUTH && showSplash && (isStandalone || !authChecked)) {
    return (
      <SplashScreen 
        onComplete={() => {
          setShowSplash(false);
        }} 
      />
    );
  }

  if (isPublicPage) {
    return <>{children}</>;
  }
  
  const showLoader = BYPASS_AUTH ? false : (loading || !user || (user && !user.onboardingComplete));

  return (
    <ErrorBoundary>
      <div className="flex h-screen flex-col">
        <main className="flex-1 overflow-y-auto pb-20">
          {showLoader ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-gray-600">Loading your account...</p>
                {loading && (
                  <p className="text-sm text-gray-500 mt-2">
                    Checking authentication...
                  </p>
                )}
              </div>
            </div>
          ) : (
            children
          )}
        </main>
        <BottomNav />
        <DevCacheMonitor />
      </div>
    </ErrorBoundary>
  );
}
