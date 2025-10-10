import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateTimedChallengeQuizSet } from '../../services/geminiService';
import { MultipleChoiceQuestion } from '../../types';
import { LoadingSpinner } from '../LoadingSpinner';
import { ArrowPathIcon } from '../icons/ArrowPathIcon';
import { useBadges } from '../../hooks/useBadges';
import { useApiKey } from '../../hooks/useApiKey';

const CHALLENGE_LENGTH = 10;
const TIME_PER_QUESTION = 20; // in seconds

type ChallengeState = 'idle' | 'loading' | 'active' | 'finished' | 'error';

export const TimedChallengeView: React.FC = () => {
    const [challengeState, setChallengeState] = useState<ChallengeState>('idle');
    const [questions, setQuestions] = useState<MultipleChoiceQuestion[]>([]);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [timer, setTimer] = useState(TIME_PER_QUESTION);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const { apiKey, openKeyModal } = useApiKey();
    const { unlockBadge } = useBadges();
    const timerRef = useRef<number | null>(null);
    const answerTimeoutRef = useRef<number | null>(null);

    const loadAllQuestions = useCallback(async () => {
        setChallengeState('loading');
        if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);
        
        if (!apiKey) {
            setError('An API key is required to start the timed challenge.');
            setChallengeState('error');
            return;
        }

        try {
            const allQuestions = await generateTimedChallengeQuizSet(apiKey, CHALLENGE_LENGTH);
            if (allQuestions.length < CHALLENGE_LENGTH) {
                throw new Error(`AI generated only ${allQuestions.length} questions.`);
            }
            // Shuffle options for each question
            allQuestions.forEach(q => {
                q.options = q.options.sort(() => Math.random() - 0.5);
            });
            setQuestions(allQuestions);
            setQuestionIndex(0);
            setTimer(TIME_PER_QUESTION);
            setChallengeState('active');
        } catch (error) {
            console.error("Failed to load timed challenge questions", error);
            setError('Could not load challenge questions. Please check your API key.');
            setChallengeState('error'); 
        }
    }, [apiKey]);

    useEffect(() => {
        if (challengeState === 'active' && questions.length > 0) {
            timerRef.current = window.setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [challengeState, questions, questionIndex]);
    
    const moveToNext = useCallback(() => {
        if (questionIndex + 1 >= CHALLENGE_LENGTH) {
            setChallengeState('finished');
            if (score > 0) {
                unlockBadge('beat-the-clock');
            }
        } else {
            setQuestionIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setIsCorrect(null);
            setTimer(TIME_PER_QUESTION);
        }
    }, [questionIndex, unlockBadge, score]);

    useEffect(() => {
        if (timer === 0 && challengeState === 'active') {
            setSelectedAnswer(''); 
            setIsCorrect(false);
            if (timerRef.current) clearInterval(timerRef.current);
            answerTimeoutRef.current = window.setTimeout(moveToNext, 2000);
        }
    }, [timer, challengeState, moveToNext]);

    const handleAnswer = (answer: string) => {
        if (selectedAnswer !== null) return;

        if (timerRef.current) clearInterval(timerRef.current);
        
        const question = questions[questionIndex];
        if (!question) return;

        setSelectedAnswer(answer);
        const correct = answer === question.correctAnswer;
        setIsCorrect(correct);

        if (correct) {
            setScore(prev => prev + 1);
        }
        
        answerTimeoutRef.current = window.setTimeout(moveToNext, 2000);
    };
    
    const startChallenge = () => {
        setScore(0);
        setQuestionIndex(0);
        loadAllQuestions();
    };

    const restartChallenge = () => {
        setChallengeState('idle');
        setQuestions([]);
        setError(null);
    };

    const getButtonClass = (option: string) => {
        if (selectedAnswer === null) {
            return 'bg-[--color-dark-matter] hover:bg-slate-600';
        }
        const question = questions[questionIndex];
        if (!question) return 'bg-[--color-dark-matter] opacity-50';

        if (option === question.correctAnswer) {
            return 'bg-green-500/80 ring-2 ring-green-400';
        }
        if (option === selectedAnswer && !isCorrect) {
            return 'bg-red-500/80';
        }
        return 'bg-[--color-dark-matter] opacity-50';
    };

    if (challengeState === 'idle' || challengeState === 'error') {
        return (
            <div className="max-w-2xl mx-auto text-center">
                <h1 className="text-4xl font-extrabold text-[--color-ghost-white] mb-4 tracking-tight">Timed Challenge</h1>
                <p className="prose prose-invert prose-lg max-w-none text-[--color-ghost-white]/80 mx-auto">
                    Test your knowledge against the clock. You'll have {TIME_PER_QUESTION} seconds to answer each of the {CHALLENGE_LENGTH} questions.
                </p>
                {challengeState === 'error' && (
                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300">
                        <p>{error}</p>
                    </div>
                )}
                <button onClick={startChallenge} className="mt-8 px-8 py-4 bg-cyan-500 text-gray-900 font-bold text-xl rounded-lg shadow-md hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-all duration-200">
                    {challengeState === 'error' ? 'Try Again' : 'Start Challenge'}
                </button>
                 {challengeState === 'error' && (
                    <button onClick={openKeyModal} className="mt-4 text-sm text-cyan-400 underline hover:text-cyan-300">
                        Check API Key
                    </button>
                )}
            </div>
        );
    }

    if (challengeState === 'loading') {
        return (
             <div className="flex flex-col items-center justify-center h-full text-center">
                <LoadingSpinner />
                <p className="mt-4 text-[--color-muted-grey]">Generating your challenge questions...</p>
            </div>
        );
    }

    if (challengeState === 'finished') {
        return (
             <div className="max-w-2xl mx-auto text-center">
                <h1 className="text-4xl font-extrabold text-[--color-ghost-white] mb-4 tracking-tight">Challenge Complete!</h1>
                <div className="mt-8 p-8 bg-[--color-dark-matter]/50 border border-[--color-focus-gold]/30 rounded-lg">
                    <p className="text-2xl text-[--color-ghost-white]/80">Your final score is:</p>
                    <p className="text-6xl font-bold text-[--color-focus-gold] my-4">{score} / {CHALLENGE_LENGTH}</p>
                </div>
                <button onClick={restartChallenge} className="mt-8 inline-flex items-center px-6 py-3 bg-slate-700 text-[--color-ghost-white]/90 font-semibold rounded-lg shadow-md hover:bg-slate-600 transition-all duration-200">
                    <ArrowPathIcon className="w-5 h-5 mr-2" />
                    Try Again
                </button>
            </div>
        )
    }

    const question = questions[questionIndex];

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-[--color-ghost-white] tracking-tight">Question {questionIndex + 1} / {CHALLENGE_LENGTH}</h1>
                <div className="text-2xl font-mono font-bold px-4 py-2 bg-slate-700 rounded-lg text-cyan-400">
                    {timer}s
                </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5 mb-6">
                <div className="bg-[--color-focus-gold] h-2.5 rounded-full" style={{ width: `${(timer / TIME_PER_QUESTION) * 100}%`, transition: 'width 1s linear' }}></div>
            </div>

            {challengeState === 'active' && question && (
                <div className="animate-[fade-in_0.5s]">
                    <h2 className="text-2xl text-left text-[--color-ghost-white] mb-6 font-semibold">{question.question}</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {question.options.map((option, idx) => (
                             <button
                                key={idx}
                                onClick={() => handleAnswer(option)}
                                disabled={selectedAnswer !== null}
                                className={`w-full text-left p-4 rounded-lg font-medium text-[--color-ghost-white] transition-all duration-300 ${getButtonClass(option)} disabled:cursor-not-allowed`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>

                    {selectedAnswer !== null && (
                         <div className="mt-6 text-center">
                            <p className={`text-xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                {timer === 0 && selectedAnswer === '' ? "Time's Up!" : (isCorrect ? 'Correct!' : 'Incorrect!')}
                            </p>
                            {!isCorrect && <p className="text-[--color-ghost-white]/80 mt-1">The correct answer was: <strong>{question.correctAnswer}</strong></p>}
                        </div>
                    )}
                </div>
            )}
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
             `}</style>
        </div>
    );
};