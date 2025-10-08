import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

const API_KEY_STORAGE_KEY = 'gemini_api_key';

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
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [wasKeyJustSet, setWasKeyJustSet] = useState(false);

  useEffect(() => {
    try {
        const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (storedKey) {
          setApiKeyState(storedKey);
        }
    } catch (error) {
        console.error('Could not access localStorage:', error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const setApiKey = useCallback((key: string | null) => {
    setApiKeyState(key);
    if (key) {
      try {
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
        setIsKeyModalOpen(false);
        setWasKeyJustSet(true);
        // Reset after a short delay so tour doesn't re-trigger on refresh
        setTimeout(() => setWasKeyJustSet(false), 1000); 
      } catch (error) {
        console.error('Could not save API key to localStorage:', error);
      }
    } else {
      try {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
      } catch (error) {
        console.error('Could not remove API key from localStorage:', error);
      }
    }
  }, []);

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
