
import { useCallback } from 'react';

const LESSONS_KEY = 'completedLessons';
const COMPLETION_COUNTS_KEY = 'completionCounts';

type CountableEvent = 'correctPatterns' | 'simulatorRuns' | 'savedAnalyses' | 'loggedTrades';

export const useCompletion = () => {
  const getCompletedLessons = useCallback((): Set<string> => {
    try {
      const completed = localStorage.getItem(LESSONS_KEY);
      return completed ? new Set(JSON.parse(completed)) : new Set();
    } catch (error) {
      console.error('Could not parse completed lessons from localStorage', error);
      return new Set();
    }
  }, []);

  const logLessonCompleted = useCallback((lessonKey: string) => {
    const completed = getCompletedLessons();
    completed.add(lessonKey);
    localStorage.setItem(LESSONS_KEY, JSON.stringify(Array.from(completed)));
  }, [getCompletedLessons]);

  const getCompletionCounts = useCallback((): Record<CountableEvent, number> => {
    try {
        const counts = localStorage.getItem(COMPLETION_COUNTS_KEY);
        const defaultCounts = { correctPatterns: 0, simulatorRuns: 0, savedAnalyses: 0, loggedTrades: 0 };
        return counts ? { ...defaultCounts, ...JSON.parse(counts) } : defaultCounts;
    } catch (error) {
        console.error('Could not parse completion counts from localStorage', error);
        return { correctPatterns: 0, simulatorRuns: 0, savedAnalyses: 0, loggedTrades: 0 };
    }
  }, []);

  const getCompletionCount = useCallback((event: CountableEvent): number => {
    return getCompletionCounts()[event] || 0;
  }, [getCompletionCounts]);

  const incrementCount = useCallback((event: CountableEvent) => {
    const counts = getCompletionCounts();
    counts[event] = (counts[event] || 0) + 1;
    localStorage.setItem(COMPLETION_COUNTS_KEY, JSON.stringify(counts));
  }, [getCompletionCounts]);

  const logCorrectPattern = useCallback(() => incrementCount('correctPatterns'), [incrementCount]);
  const logSimulatorCompletion = useCallback(() => incrementCount('simulatorRuns'), [incrementCount]);
  const logSavedAnalysis = useCallback(() => incrementCount('savedAnalyses'), [incrementCount]);
  const logTradeLogged = useCallback(() => incrementCount('loggedTrades'), [incrementCount]);

  return { 
    logLessonCompleted, 
    getCompletedLessons,
    logCorrectPattern,
    logSimulatorCompletion,
    logSavedAnalysis,
    getCompletionCount,
    logTradeLogged,
  };
};
