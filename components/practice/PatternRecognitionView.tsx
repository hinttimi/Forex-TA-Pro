
import React, { useState, useEffect, useCallback } from 'react';
import { generateChartImage } from '../../services/geminiService';
import { MODULES } from '../../constants';
import { Lesson } from '../../types';
import { LoadingSpinner } from '../LoadingSpinner';
import { PhotoIcon } from '../icons/PhotoIcon';
import { ArrowRightIcon } from '../icons/ArrowRightIcon';

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

export const PatternRecognitionView: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [chartImageUrl, setChartImageUrl] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState<Lesson | null>(null);
    const [options, setOptions] = useState<Lesson[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [score, setScore] = useState({ correct: 0, total: 0 });

    const loadNewPattern = useCallback(async () => {
        setIsLoading(true);
        setChartImageUrl('');
        setSelectedAnswer(null);
        setIsCorrect(null);

        try {
            const answerLesson = getRandomElement(allVisualLessons);
            setCorrectAnswer(answerLesson);

            const distractors = allVisualLessons
                .filter(l => l.key !== answerLesson.key)
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);

            setOptions(shuffleArray([...distractors, answerLesson]));

            const imageUrl = await generateChartImage(answerLesson.chartPrompt);
            setChartImageUrl(imageUrl);

        } catch (error) {
            console.error("Failed to load new pattern:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

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
    };

    const getButtonClass = (lessonKey: string) => {
        if (!selectedAnswer) {
            return 'bg-gray-700 hover:bg-gray-600';
        }
        if (lessonKey === correctAnswer?.key) {
            return 'bg-green-500/80 ring-2 ring-green-400';
        }
        if (lessonKey === selectedAnswer && !isCorrect) {
            return 'bg-red-500/80';
        }
        return 'bg-gray-700 opacity-50';
    };

    return (
        <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Pattern Recognition</h1>
            <p className="text-gray-400 mb-6">Identify the key technical analysis pattern on the chart.</p>

            <div className="w-full aspect-video bg-gray-800/50 rounded-lg border border-gray-700 flex items-center justify-center p-4 mb-6">
                {isLoading && (
                    <div className="flex flex-col items-center text-gray-400">
                        <LoadingSpinner />
                        <span className="mt-2 text-sm">AI is drawing the next challenge...</span>
                    </div>
                )}
                {!isLoading && chartImageUrl && (
                    <img src={chartImageUrl} alt="Chart pattern challenge" className="max-w-full max-h-full object-contain rounded-md" />
                )}
                {!isLoading && !chartImageUrl && (
                    <div className="text-center text-gray-500">
                        <PhotoIcon className="w-16 h-16 mx-auto mb-2" />
                        <p>Chart will appear here.</p>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {options.map(lesson => (
                    <button
                        key={lesson.key}
                        onClick={() => handleAnswer(lesson.key)}
                        disabled={!!selectedAnswer || isLoading}
                        className={`w-full text-center p-4 rounded-lg font-semibold text-white transition-all duration-300 ${getButtonClass(lesson.key)} disabled:cursor-not-allowed`}
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
                    {!isCorrect && <p className="text-gray-300 mt-1">The correct pattern was: <strong>{correctAnswer?.title}</strong></p>}
                    
                    <button onClick={loadNewPattern} className="mt-4 inline-flex items-center px-6 py-3 bg-cyan-500 text-gray-900 font-semibold rounded-lg shadow-md hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-all duration-200">
                        Next Pattern
                        <ArrowRightIcon className="w-5 h-5 ml-2" />
                    </button>
                </div>
            )}

            <div className="mt-8 pt-4 border-t border-gray-700">
                <p className="text-xl text-gray-300">Score: <span className="font-bold text-cyan-400">{score.correct} / {score.total}</span></p>
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
