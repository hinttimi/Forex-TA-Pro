import React, { createContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { MENTOR_PERSONAS, MENTOR_VOICES } from '../constants/mentorSettings';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface MentorSettings {
    personaId: string;
    voiceId: string;
}

interface MentorSettingsContextType extends MentorSettings {
    setPersonaId: (id: string) => void;
    setVoiceId: (id: string) => void;
}

export const MentorSettingsContext = createContext<MentorSettingsContextType | undefined>(undefined);

export const MentorSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [settings, setSettings] = useState<MentorSettings>({
        personaId: MENTOR_PERSONAS[0].id,
        voiceId: MENTOR_VOICES[0].id,
    });

    useEffect(() => {
        const fetchSettings = async () => {
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists() && docSnap.data().mentorSettings) {
                    setSettings(docSnap.data().mentorSettings);
                }
            }
        };
        fetchSettings();
    }, [currentUser]);

    const updateSettingsInFirestore = async (newSettings: Partial<MentorSettings>) => {
        if (!currentUser) return;
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
            await updateDoc(userDocRef, {
                mentorSettings: { ...settings, ...newSettings }
            });
        } catch (error) {
            console.error("Failed to save mentor settings:", error);
        }
    };

    const setPersonaId = (id: string) => {
        setSettings(prev => ({ ...prev, personaId: id }));
        updateSettingsInFirestore({ personaId: id });
    };

    const setVoiceId = (id: string) => {
        setSettings(prev => ({ ...prev, voiceId: id }));
        updateSettingsInFirestore({ voiceId: id });
    };

    const value = useMemo(() => ({
        ...settings,
        setPersonaId,
        setVoiceId,
    }), [settings]);

    return (
        <MentorSettingsContext.Provider value={value}>
            {children}
        </MentorSettingsContext.Provider>
    );
};