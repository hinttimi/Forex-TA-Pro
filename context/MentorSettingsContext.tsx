import React, { createContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { MENTOR_PERSONAS, MENTOR_VOICES } from '../constants/mentorSettings';

const SETTINGS_KEY = 'mentorSettings';

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
    const [settings, setSettings] = useState<MentorSettings>(() => {
        try {
            const storedSettings = localStorage.getItem(SETTINGS_KEY);
            if (storedSettings) {
                return JSON.parse(storedSettings);
            }
        } catch (error) {
            console.error("Failed to load mentor settings from localStorage:", error);
        }
        // Default settings
        return {
            personaId: MENTOR_PERSONAS[0].id,
            voiceId: MENTOR_VOICES[0].id,
        };
    });

    useEffect(() => {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error("Failed to save mentor settings to localStorage:", error);
        }
    }, [settings]);

    const setPersonaId = (id: string) => {
        setSettings(prev => ({ ...prev, personaId: id }));
    };

    const setVoiceId = (id: string) => {
        setSettings(prev => ({ ...prev, voiceId: id }));
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
