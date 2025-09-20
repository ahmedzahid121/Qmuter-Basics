"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, LayoutGrid, MessageSquare, User, ShieldCheck, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/hooks/use-admin";

export default function BottomNav() {
  const pathname = usePathname();
  const { isAdmin } = useAdmin();

  const navItems = [
    { href: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
    { href: "/my-rides", icon: Car, label: "My Rides" },
    { href: "/plan-route", label: "Plan Route", special: true },
    isAdmin
      ? { href: "/admin", icon: ShieldCheck, label: "Admin" }
      : { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/95 backdrop-blur-sm">
      <div className="mx-auto grid h-16 max-w-md grid-cols-4 items-center">
        {navItems.map((item) => {
          if (item.special) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative -top-4 flex justify-center"
                aria-label={item.label}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lg transition-transform duration-200 ease-in-out group-hover:scale-105 sm:h-16 sm:w-16">
                  <MapPin className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
              </Link>
            );
          }

          const isActive = pathname === item.href;
          const Icon = item.icon!;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-full flex-col items-center justify-center gap-1 rounded-md p-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-accent-foreground sm:p-2 sm:text-sm",
                isActive && "text-primary"
              )}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
