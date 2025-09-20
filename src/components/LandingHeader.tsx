"use client";

import { useState } from 'react';
import Link from "next/link";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from './ui/skeleton';

const navLinks = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#blog", label: "Blog" },
];

export default function LandingHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, loading } = useAuth();

  const handleSignOut = () => {
    signOut();
    setIsOpen(false);
  }

  const authButtons = (
    <>
      {loading ? (
        <div className='flex items-center gap-2'>
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-28" />
        </div>
      ) : user ? (
        <>
          <Button variant="ghost" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button onClick={signOut}>Log Out</Button>
        </>
      ) : (
        <>
          <Button variant="ghost" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </>
      )}
    </>
  );

  const mobileAuthButtons = (
    <>
      {loading ? (
        <>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </>
      ) : user ? (
        <>
          <Button variant="outline" asChild className='w-full'>
            <Link href="/dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link>
          </Button>
          <Button onClick={handleSignOut} className='w-full'>Log Out</Button>
        </>
      ) : (
        <>
          <Button variant="outline" asChild className='w-full'>
            <Link href="/login" onClick={() => setIsOpen(false)}>Sign In</Link>
          </Button>
          <Button asChild className='w-full'>
            <Link href="/signup" onClick={() => setIsOpen(false)}>Get Started</Link>
          </Button>
        </>
      )}
    </>
  )


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-8 w-auto" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {authButtons}
        </div>

        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle className="sr-only">Menu</SheetTitle>
              </SheetHeader>
              <div className="grid gap-6">
                <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                  <Logo className="h-8 w-auto" />
                </Link>
                <div className="grid gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                <div className="grid gap-4 border-t pt-6">
                    {mobileAuthButtons}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
