import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, createUserProfileDocument } from '../firebase';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ currentUser: null, userProfile: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      try {
        if (user) {
          // This call ensures a profile exists, especially for Google Sign-In.
          // It won't overwrite existing data like the username set during email sign-up.
          await createUserProfileDocument(user);
          
          // Fetch the complete user profile from Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
              setUserProfile(docSnap.data() as UserProfile);
          }
          
          setCurrentUser(user);
        } else {
            // User is signed out, clear all data
            setCurrentUser(null);
            setUserProfile(null);
        }
      } catch (error) {
        console.error("Error during auth state change post-processing:", error);
        // If profile fetching fails, still log the user in to prevent being stuck.
        setCurrentUser(user);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
  };

  if (loading) {
      return (
          <div className="w-screen h-screen flex items-center justify-center bg-[--color-obsidian-slate]">
              <LoadingSpinner />
          </div>
      )
  }

  return (
    <AuthContext.Provider value={value}>
        {children}
    </AuthContext.Provider>
  );
};