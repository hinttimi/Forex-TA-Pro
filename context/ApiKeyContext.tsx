import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';


interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  isKeyModalOpen: boolean;
  openKeyModal: () => void;
  closeKeyModal: () => void;
  wasKeyJustSet: boolean;
}

export const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [wasKeyJustSet, setWasKeyJustSet] = useState(false);

  useEffect(() => {
    const fetchApiKey = async () => {
      if (currentUser) {
        setIsLoading(true);
        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists() && docSnap.data().apiKey) {
              setApiKeyState(docSnap.data().apiKey);
            } else {
              setApiKeyState(null);
              // If user is logged in but has no key, prompt them to set it.
              setIsKeyModalOpen(true);
            }
        } catch (error) {
            console.error("Error fetching API key from Firestore:", error);
            setApiKeyState(null);
        } finally {
            setIsLoading(false);
        }
      } else {
        // When user logs out
        setApiKeyState(null);
        setIsLoading(false);
      }
    };
    fetchApiKey();
  }, [currentUser]);

  const setApiKey = useCallback(async (key: string | null) => {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      await updateDoc(userDocRef, { apiKey: key });
      setApiKeyState(key);
      if (key) {
        setIsKeyModalOpen(false);
        setWasKeyJustSet(true);
        setTimeout(() => setWasKeyJustSet(false), 1000); 
      }
    } catch (error) {
      console.error('Could not save API key to Firestore:', error);
    }
  }, [currentUser]);

  const openKeyModal = useCallback(() => setIsKeyModalOpen(true), []);
  
  const closeKeyModal = useCallback(() => setIsKeyModalOpen(false), []);

  const value = useMemo(() => ({
    apiKey,
    setApiKey,
    isKeyModalOpen,
    openKeyModal,
    closeKeyModal,
    wasKeyJustSet
  }), [apiKey, isKeyModalOpen, wasKeyJustSet, setApiKey, openKeyModal, closeKeyModal]);

  if (isLoading) {
      return null; // Or a loading spinner for the whole app
  }

  return (
    <ApiKeyContext.Provider value={value}>
      {children}
    </ApiKeyContext.Provider>
  );
};