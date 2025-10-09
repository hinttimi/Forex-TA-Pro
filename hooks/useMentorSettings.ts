import { useContext } from 'react';
import { MentorSettingsContext } from '../context/MentorSettingsContext';

export const useMentorSettings = () => {
    const context = useContext(MentorSettingsContext);
    if (context === undefined) {
        throw new Error('useMentorSettings must be used within a MentorSettingsProvider');
    }
    return context;
};
