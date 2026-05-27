'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { authService } from '@/lib/services/authService';

interface AuthContextType {
  user: User | null | undefined;
  loading: boolean;
  isAdmin: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone?: any) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, authLoading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [customLoading, setCustomLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const handleUser = async () => {
      if (authLoading) return;
      
      if (firebaseUser) {
        if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
          // mock env
          setIsAdmin(false);
          setCustomLoading(false);
          return;
        }

        // Ensure user is synced to Firestore
        await authService.syncUserToFirestore(firebaseUser);

        // Listen to the user document in real-time
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const { onSnapshot } = await import('firebase/firestore'); // dynamic import if needed, or rely on existing import
        
        unsubscribe = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            setIsAdmin(userDoc.data().role === 'admin');
          } else {
            setIsAdmin(false);
          }
          setCustomLoading(false);
        });

      } else {
        setIsAdmin(false);
        setCustomLoading(false);
      }
    };
    
    handleUser();

    return () => unsubscribe();
  }, [firebaseUser, authLoading]);

  const signInWithEmail = async (email: string, password: string) => {
    await authService.loginWithEmail(email, password);
  };

  const signUp = async (email: string, password: string, name: string, phone?: any) => {
    await authService.registerWithEmail(email, password, name, phone);
  };

  const signInWithGoogle = async () => {
    await authService.loginWithGoogle();
  };

  const signOut = async () => {
    await authService.logout();
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{
      user: firebaseUser,
      loading: authLoading || customLoading,
      isAdmin,
      signInWithEmail,
      signUp,
      signInWithGoogle,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
