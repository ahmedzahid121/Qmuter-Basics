
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const useAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            try {
                // Force refresh the token to get the latest custom claims.
                const tokenResult = await firebaseUser.getIdTokenResult(true);
                const claims = tokenResult.claims;
                setIsAdmin(claims.role === 'admin');
            } catch (error) {
                console.error("Error getting token result:", error);
                setIsAdmin(false);
            }
        } else {
            setIsAdmin(false);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  return { isAdmin, loading };
};
