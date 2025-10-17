import React, { createContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, increment, setDoc } from 'firebase/firestore';

export type CountableEvent = 'correctPatterns' | 'simulatorRuns' | 'savedAnalyses' | 'loggedTrades';

const defaultCounts: Record<CountableEvent, number> = { 
    correctPatterns: 0, 
    simulatorRuns: 0, 
    savedAnalyses: 0, 
    loggedTrades: 0 
};

interface CompletionContextType {
    completedLessons: Set<string>;
    completionCounts: Record<CountableEvent, number>;
    logLessonCompleted: (lessonKey: string) => Promise<void>;
    getCompletionCount: (event: CountableEvent) => number;
    incrementCount: (event: CountableEvent) => Promise<void>;
    getCompletedLessons: () => Set<string>;
}

export const CompletionContext = createContext<CompletionContextType | undefined>(undefined);

export const CompletionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [completedLessons, setCompletedLessons] = useState(new Set<string>());
    const [completionCounts, setCompletionCounts] = useState<Record<CountableEvent, number>>(defaultCounts);

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setCompletedLessons(new Set(data.completedLessons || []));
                    setCompletionCounts(prev => ({...prev, ...data.completionCounts}));
                }
            } else {
                // Reset state on logout
                setCompletedLessons(new Set());
                setCompletionCounts(defaultCounts);
            }
        };
        fetchData();
    }, [currentUser]);

    const logLessonCompleted = useCallback(async (lessonKey: string) => {
        if (!currentUser || completedLessons.has(lessonKey)) return;
        
        const newSet = new Set(completedLessons);
        newSet.add(lessonKey);
        setCompletedLessons(newSet);

        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
            completedLessons: arrayUnion(lessonKey)
        });
    }, [currentUser, completedLessons]);

    const getCompletionCount = useCallback((event: CountableEvent): number => {
        return completionCounts[event] || 0;
    }, [completionCounts]);
    
    const incrementCount = useCallback(async (event: CountableEvent) => {
        if (!currentUser) return;

        setCompletionCounts(prev => ({ ...prev, [event]: (prev[event] || 0) + 1 }));

        const userDocRef = doc(db, 'users', currentUser.uid);
        // Using setDoc with merge to safely create/update nested field
        await setDoc(userDocRef, {
            completionCounts: {
                [event]: increment(1)
            }
        }, { merge: true });

    }, [currentUser]);

    const getCompletedLessons = useCallback(() => {
        return completedLessons;
    }, [completedLessons]);

    const value = useMemo(() => ({
        completedLessons,
        completionCounts,
        logLessonCompleted,
        getCompletionCount,
        incrementCount,
        getCompletedLessons,
    }), [completedLessons, completionCounts, logLessonCompleted, getCompletionCount, incrementCount, getCompletedLessons]);

    return (
        <CompletionContext.Provider value={value}>
            {children}
        </CompletionContext.Provider>
    );
};
