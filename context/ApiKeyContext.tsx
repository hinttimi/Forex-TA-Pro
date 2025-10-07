import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';

const API_KEY_STORAGE_KEY = 'gemini_api_key';

interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  isKeyModalOpen: boolean;
  openKeyModal: () => void;
  closeKeyModal: () => void;
}

export const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  useEffect(() => {
    try {
        const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (storedKey) {
          setApiKeyState(storedKey);
        } else {
          setIsKeyModalOpen(true);
        }
    } catch (error) {
        console.error('Could not access localStorage:', error);
        setIsKeyModalOpen(true); // Assume no key if localStorage is inaccessible
    }
  }, []);

  const setApiKey = useCallback((key: string | null) => {
    setApiKeyState(key);
    if (key) {
      try {
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
        setIsKeyModalOpen(false);
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

  const openKeyModal = () => setIsKeyModalOpen(true);
  
  const closeKeyModal = () => {
      // Only allow closing the modal if a key has been set
      if (apiKey) {
        setIsKeyModalOpen(false);
      }
  };

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, isKeyModalOpen, openKeyModal, closeKeyModal }}>
      {children}
    </ApiKeyContext.Provider>
  );
};
