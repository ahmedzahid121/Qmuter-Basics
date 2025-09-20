
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/hooks/use-admin';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAdmin();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) {
      return; // Still checking, do nothing.
    }

    if (!isAdmin) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to view this page.',
      });
      router.replace('/dashboard'); // Redirect non-admins
    }
  }, [isAdmin, loading, router, toast]);

  if (loading || !isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
