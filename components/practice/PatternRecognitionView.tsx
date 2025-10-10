

import React, { useState, useEffect, useCallback } from 'react';
import { generateChartImage } from '../../services/geminiService';
import { MODULES } from '../../constants';
import { Lesson } from '../../types';
import { LoadingSpinner } from '../LoadingSpinner';
import { ArrowRightIcon } from '../icons/ArrowRightIcon';
import { ChartDisplay } from '../ChartDisplay';
import { useCompletion } from '../../hooks/useCompletion';
import { useBadges } from '../../hooks/useBadges';
import { useApiKey } from '../../hooks/useApiKey';

const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const allVisualLessons = MODULES.flatMap(m => m.lessons).filter(l =>
  !l.key.includes('forex-basics') &&
  !l.key.includes('what-is-liquidity') &&
  !l.key.includes('risk-management') &&
  !l.key.includes('psychology')
);

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const SHARP_EYE_GOAL = 10;

export const PatternRecognitionView: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [chartImageUrl, setChartImageUrl] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState<Lesson | null>(null);
    const [options, setOptions] = useState<Lesson[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [error, setError] = useState<string | null>(null);

    const { apiKey, openKeyModal } = useApiKey();
    const { logCorrectPattern, getCompletionCount } = useCompletion();
    const { unlockBadge } = useBadges();

    const loadNewPattern = useCallback(async () => {
        setIsLoading(true);
        setChartImageUrl('');
        setSelectedAnswer(null);
        setIsCorrect(null);
        setError(null);

        if (!apiKey) {
            setError('Please provide your API key to start the practice session.');
            setIsLoading(false);
            return;
        }

        try {
            const answerLesson = getRandomElement(allVisualLessons);
            setCorrectAnswer(answerLesson);

            const distractors = allVisualLessons
                .filter(l => l.key !== answerLesson.key)
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);

            setOptions(shuffleArray([...distractors, answerLesson]));

            // FIX: The 'Lesson' type does not have a 'chartPrompt' property.
            // The chart prompt should be extracted from the lesson's 'content' string.
            // A regex is used to find a [CHART:...] block, with a fallback to generate a prompt from the lesson title.
            const chartPromptRegex = /\[CHART:\s*(.*?)\]/s;
            const match = answerLesson.content.match(chartPromptRegex);
            const chartPrompt = match ? match[1] : `A dark-theme forex chart that clearly demonstrates the concept of "${answerLesson.title}".`;
            const imageUrl = await generateChartImage(apiKey, chartPrompt, `pattern-recog-${answerLesson.key}`);
            setChartImageUrl(imageUrl);

        } catch (error) {
            console.error("Failed to load new pattern:", error);
            setError('Could not load a new pattern. Please check your API key and try again.');
        } finally {
            setIsLoading(false);
        }
    }, [apiKey]);

    useEffect(() => {
        loadNewPattern();
    }, [loadNewPattern]);

    const handleAnswer = (lessonKey: string) => {
        if (selectedAnswer) return;

        setSelectedAnswer(lessonKey);
        const correct = lessonKey === correctAnswer?.key;
        setIsCorrect(correct);
        setScore(prev => ({
            correct: prev.correct + (correct ? 1 : 0),
            total: prev.total + 1,
        }));
        if (correct) {
            logCorrectPattern();
            const newCount = getCompletionCount('correctPatterns') + 1;
            if (newCount >= SHARP_EYE_GOAL) {
                unlockBadge('sharp-eye');
            }
        }
    };

    const getButtonClass = (lessonKey: string) => {
        if (!selectedAnswer) {
            return 'bg-[--color-dark-matter] hover:bg-slate-600';
        }
        if (lessonKey === correctAnswer?.key) {
            return 'bg-green-500/80 ring-2 ring-green-400';
        }
        if (lessonKey === selectedAnswer && !isCorrect) {
            return 'bg-red-500/80';
        }
        return 'bg-[--color-dark-matter] opacity-50';
    };
    
    const correctPatternsCount = getCompletionCount('correctPatterns');
    
    if (error) {
        return (
            <div className="text-center p-8 bg-[--color-dark-matter]/50 rounded-lg">
                <h2 className="text-2xl font-bold text-red-400">Error</h2>
                <p className="text-[--color-ghost-white]/80 mt-2">{error}</p>
                 <button onClick={openKeyModal} className="mt-4 px-5 py-2.5 bg-cyan-500 text-gray-900 font-semibold rounded-lg shadow-md hover:bg-cyan-400">
                    Set API Key
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-extrabold text-[--color-ghost-white] mb-2 tracking-tight">Pattern Recognition</h1>
            <p className="text-[--color-muted-grey] mb-6">Identify the key technical analysis pattern on the chart.</p>

            <ChartDisplay 
                imageUrl={chartImageUrl}
                isLoading={isLoading}
                loadingText="AI is drawing the next challenge..."
                containerClassName="w-full aspect-video bg-[--color-dark-matter]/50 rounded-lg border border-[--color-border] flex items-center justify-center p-4 mb-6"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {options.map(lesson => (
                    <button
                        key={lesson.key}
                        onClick={() => handleAnswer(lesson.key)}
                        disabled={!!selectedAnswer || isLoading}
                        className={`w-full text-center p-4 rounded-lg font-semibold text-[--color-ghost-white] transition-all duration-300 ${getButtonClass(lesson.key)} disabled:cursor-not-allowed`}
                    >
                        {lesson.title}
                    </button>
                ))}
            </div>

            {selectedAnswer && (
                <div className="mt-6 flex flex-col items-center animate-[fade-in_0.5s]">
                    <p className={`text-2xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {isCorrect ? 'Correct!' : 'Not quite.'}
                    </p>
                    {!isCorrect && <p className="text-[--color-ghost-white]/80 mt-1">The correct pattern was: <strong>{correctAnswer?.title}</strong></p>}
                    
                    <button onClick={loadNewPattern} className="mt-4 inline-flex items-center px-6 py-3 bg-cyan-500 text-gray-900 font-semibold rounded-lg shadow-md hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-all duration-200">
                        Next Pattern
                        <ArrowRightIcon className="w-5 h-5 ml-2" />
                    </button>
                </div>
            )}

            <div className="mt-8 pt-4 border-t border-[--color-border] flex justify-center items-center space-x-8">
                <p className="text-xl text-[--color-ghost-white]/80">Session Score: <span className="font-bold text-cyan-400">{score.correct} / {score.total}</span></p>
                <p className="text-xl text-[--color-ghost-white]/80">"Sharp Eye" Progress: <span className="font-bold text-[--color-focus-gold]">{correctPatternsCount} / {SHARP_EYE_GOAL}</span></p>
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
             `}</style>
        </div>
    );
};