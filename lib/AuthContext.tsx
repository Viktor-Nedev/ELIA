"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  User, 
  onIdTokenChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);


  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    if (user) {
      // If logged in, don't allow access to auth pages
      if (["/login", "/signup"].includes(pathname)) {
        router.push("/");
      }
    } else {
      // If logged out, only allow access to public pages
      const publicPages = ["/home", "/login", "/signup"];
      
      // Check if current path starts with any public page (to handle /login?redirect=...)
      // But for exact matches or simple logic:
      if (!publicPages.includes(pathname)) {
        router.push("/home");
      }
    }
  }, [user, loading, pathname, router]);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Sign-Up Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Sign-Out Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    signInWithGoogle,
    signUpWithEmail,
    signOut
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
