
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  GoogleAuthProvider,
  OAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Renamed to avoid conflict with FirebaseUser
type QmuterUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'driver' | 'passenger';
  phoneNumber?: string;
  country?: string;
  licenseNumber?: string;
  carModel?: string;
  // Gamification fields
  totalRides: number;
  totalCO2Saved: number; // in kg
  totalMoneySaved: number; // in currency
  badgeTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Eco Hero';
  walletBalance: number;
  onboardingComplete: boolean;
  emailVerified?: boolean;
  // Timestamps
  createdAt?: any;
  updatedAt?: any;
};

// Define the shape of the sign-up data
interface SignUpData {
    email: string;
    password?: string; // Optional for social sign-ins
    fullName: string;
    phoneNumber: string;
    country: string;
}

interface AuthContextType {
  user: QmuterUser | null;
  loading: boolean;
  role: 'driver' | 'passenger' | null;
  signIn: (email:string, pass: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => void;
  setRole: (role: 'driver' | 'passenger') => void;
  updateUser: (data: Partial<Omit<QmuterUser, 'uid' | 'email'>>) => void;
  sendVerificationEmail: () => Promise<void>;
  isEmailVerified: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<QmuterUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      try {
        if (firebaseUser) {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const firestoreData = userSnap.data() as Omit<QmuterUser, 'uid' | 'email' | 'displayName' | 'photoURL'>;
            // Combine auth data with firestore data, ensuring onboardingComplete is always a boolean
            setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                ...firestoreData,
                walletBalance: firestoreData.walletBalance ?? 0,
                onboardingComplete: firestoreData.onboardingComplete || false,
                emailVerified: firebaseUser.emailVerified,
              });
          } else {
            // This is a new user (likely via social sign-in), create their doc
            const newUser: QmuterUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: 'passenger',
              totalRides: 0,
              totalCO2Saved: 0,
              totalMoneySaved: 0,
              badgeTier: 'Bronze',
              walletBalance: 0,
              onboardingComplete: false,
              emailVerified: firebaseUser.emailVerified,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            await setDoc(userRef, newUser);
            setUser(newUser);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        // If there's an error, we still want to stop loading
        // but we don't set the user to null in case it's a temporary network issue
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
    // onAuthStateChanged will handle setting the user state
  };
  
  const signUp = async (data: SignUpData) => {
    const { email, password, fullName, phoneNumber, country } = data;
    if (!password) throw new Error("Password is required for email sign up.");

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Send email verification
    await sendEmailVerification(firebaseUser, {
      url: `${window.location.origin}/dashboard`, // Redirect URL after verification
      handleCodeInApp: false,
    });
    
    // Update the Firebase Auth profile
    await updateProfile(firebaseUser, {
        displayName: fullName,
    });

    // Create a new user document in Firestore
    const newUser: QmuterUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: fullName,
      photoURL: firebaseUser.photoURL,
      role: 'passenger', // Default role
      phoneNumber,
      country,
      totalRides: 0,
      totalCO2Saved: 0,
      totalMoneySaved: 0,
      badgeTier: 'Bronze',
      walletBalance: 0,
      onboardingComplete: false,
      emailVerified: firebaseUser.emailVerified,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userRef = doc(db, 'users', firebaseUser.uid);
    await setDoc(userRef, newUser);
    setUser(newUser);
  };
  
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    // onAuthStateChanged will handle user creation/update in firestore
  };

  const signInWithApple = async () => {
    const provider = new OAuthProvider('apple.com');
    await signInWithPopup(auth, provider);
    // onAuthStateChanged will handle user creation/update in firestore
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  const setRole = async (role: 'driver' | 'passenger') => {
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { role });
    }
  };

  const updateUser = async (data: Partial<Omit<QmuterUser, 'uid' | 'email'>>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, data);
    }
  };

  const sendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/dashboard`,
        handleCodeInApp: false,
      });
    }
  };
  
  const role = user?.role ?? null;
  const isEmailVerified = user?.emailVerified ?? false;

  const value = {
    user,
    loading,
    role,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithApple,
    signOut,
    setRole,
    updateUser,
    sendVerificationEmail,
    isEmailVerified,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
