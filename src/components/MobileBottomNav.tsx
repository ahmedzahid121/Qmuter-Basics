"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { usePWA } from '@/components/PWAInstallPrompt';
import { 
  Home, 
  Search, 
  User, 
  MapPin,
  Car,
  Users,
  Settings,
  Bell
} from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isPWA } = usePWA();
  const [showNotifications, setShowNotifications] = useState(false);

  // Don't show on auth pages, admin pages, or landing page
  if (pathname === '/' ||
      pathname.startsWith('/login') || 
      pathname.startsWith('/signup') || 
      pathname.startsWith('/admin') ||
      pathname.startsWith('/onboarding')) {
    return null;
  }

  const navItems = [
    {
      href: '/dashboard',
      icon: Home,
      label: 'Home',
      active: pathname === '/dashboard'
    },
    {
      href: '/my-rides',
      icon: Car,
      label: 'My Rides',
      active: pathname === '/my-rides'
    },
    {
      href: '/plan-route',
      icon: Search,
      label: 'Plan Route',
      active: pathname === '/plan-route'
    },
    {
      href: '/profile',
      icon: User,
      label: 'Profile',
      active: pathname === '/profile'
    }
  ];

  return (
    <>
      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 ${
        isPWA ? 'pb-2' : 'pb-safe'
      }`}>
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full py-2 px-1 rounded-lg transition-colors ${
                  item.active
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-600 hover:text-green-600'
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Floating Action Button for Quick Actions */}
      {user && (
        <div className="fixed bottom-20 right-4 z-50">
          <div className="flex flex-col gap-2">
            {/* Emergency Button */}
            <button
              onClick={() => {
                // This would trigger emergency functionality
                console.log('Emergency button pressed');
              }}
              className="w-12 h-12 bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-700 transition-colors"
              title="Emergency"
            >
              <span className="text-lg">🚨</span>
            </button>

            {/* Quick Actions */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-12 h-12 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 transition-colors"
              title="Quick Actions"
            >
              <Bell className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Actions Menu */}
          {showNotifications && (
            <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-48">
              <div className="space-y-1">
                <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Share Location
                </button>
                <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Find Riders
                </button>
                <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Spacer for Mobile */}
      <div className="h-20 md:hidden" />
    </>
  );
}

// Mobile-specific hook for better UX
export function useMobileOptimization() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  useState(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setIsLandscape(window.innerHeight < window.innerWidth);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile, isLandscape };
} 