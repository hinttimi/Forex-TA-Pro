
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateQuizQuestion } from '../../services/geminiService';
import { MODULES } from '../../constants';
import { MultipleChoiceQuestion } from '../../types';
import { LoadingSpinner } from '../LoadingSpinner';
import { ArrowPathIcon } from '../icons/ArrowPathIcon';
import { useBadges } from '../../hooks/useBadges';

const CHALLENGE_LENGTH = 10;
const TIME_PER_QUESTION = 20; // in seconds

const allLessons = MODULES.flatMap(m => m.lessons);
const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

type ChallengeState = 'idle' | 'loading' | 'active' | 'finished';

export const TimedChallengeView: React.FC = () => {
    const [challengeState, setChallengeState] = useState<ChallengeState>('idle');
    const [question, setQuestion] = useState<MultipleChoiceQuestion | null>(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [timer, setTimer] = useState(TIME_PER_QUESTION);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    
    const { unlockBadge } = useBadges();
    const timerRef = useRef<number | null>(null);
    const answerTimeoutRef = useRef<number | null>(null);

    const loadNextQuestion = useCallback(async () => {
        setChallengeState('loading');
        setSelectedAnswer(null);
        setIsCorrect(null);
        
        if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);

        try {
            const randomLesson = getRandomElement(allLessons);
            const nextQuestion = await generateQuizQuestion(randomLesson.contentPrompt);
            nextQuestion.options = nextQuestion.options.sort(() => Math.random() - 0.5);
            setQuestion(nextQuestion);
            setTimer(TIME_PER_QUESTION);
            setChallengeState('active');
        } catch (error) {
            console.error("Failed to load quiz question", error);
            setChallengeState('idle'); 
        }
    }, []);

    useEffect(() => {
        if (challengeState === 'active') {
            timerRef.current = window.setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [challengeState]);
    
    const moveToNext = useCallback(() => {
        if (questionIndex + 1 >= CHALLENGE_LENGTH) {
            setChallengeState('finished');
            unlockBadge('beat-the-clock');
        } else {
            setQuestionIndex(prev => prev + 1);
            loadNextQuestion();
        }
    }, [questionIndex, loadNextQuestion, unlockBadge]);

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
        
        setSelectedAnswer(answer);
        const correct = answer === question?.correctAnswer;
        setIsCorrect(correct);

        if (correct) {
            setScore(prev => prev + 1);
        }
        
        answerTimeoutRef.current = window.setTimeout(moveToNext, 2000);
    };
    
    const startChallenge = () => {
        setScore(0);
        setQuestionIndex(0);
        loadNextQuestion();
    };

    const restartChallenge = () => {
        setChallengeState('idle');
        setQuestion(null);
    };

    const getButtonClass = (option: string) => {
        if (selectedAnswer === null) {
            return 'bg-gray-700 hover:bg-gray-600';
        }
        if (option === question?.correctAnswer) {
            return 'bg-green-500/80 ring-2 ring-green-400';
        }
        if (option === selectedAnswer && !isCorrect) {
            return 'bg-red-500/80';
        }
        return 'bg-gray-700 opacity-50';
    };

    if (challengeState === 'idle') {
        return (
            <div className="max-w-2xl mx-auto text-center">
                <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Timed Challenge</h1>
                <p className="prose prose-invert prose-lg max-w-none text-gray-300 mx-auto">
                    Test your knowledge against the clock. You'll have {TIME_PER_QUESTION} seconds to answer each of the {CHALLENGE_LENGTH} questions.
                </p>
                <button onClick={startChallenge} className="mt-8 px-8 py-4 bg-cyan-500 text-gray-900 font-bold text-xl rounded-lg shadow-md hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-all duration-200">
                    Start Challenge
                </button>
            </div>
        );
    }

    if (challengeState === 'finished') {
        return (
             <div className="max-w-2xl mx-auto text-center">
                <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Challenge Complete!</h1>
                <div className="mt-8 p-8 bg-gray-800/50 border border-cyan-500/30 rounded-lg">
                    <p className="text-2xl text-gray-300">Your final score is:</p>
                    <p className="text-6xl font-bold text-cyan-400 my-4">{score} / {CHALLENGE_LENGTH}</p>
                </div>
                <button onClick={restartChallenge} className="mt-8 inline-flex items-center px-6 py-3 bg-gray-700 text-gray-200 font-semibold rounded-lg shadow-md hover:bg-gray-600 transition-all duration-200">
                    <ArrowPathIcon className="w-5 h-5 mr-2" />
                    Try Again
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white tracking-tight">Question {questionIndex + 1} / {CHALLENGE_LENGTH}</h1>
                <div className="text-2xl font-mono font-bold px-4 py-2 bg-gray-700 rounded-lg text-cyan-400">
                    {timer}s
                </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mb-6">
                <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${(timer / TIME_PER_QUESTION) * 100}%`, transition: 'width 1s linear' }}></div>
            </div>

            {challengeState === 'loading' && <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>}

            {challengeState === 'active' && question && (
                <div className="animate-[fade-in_0.5s]">
                    <h2 className="text-2xl text-left text-gray-200 mb-6 font-semibold">{question.question}</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {question.options.map((option, idx) => (
                             <button
                                key={idx}
                                onClick={() => handleAnswer(option)}
                                disabled={selectedAnswer !== null}
                                className={`w-full text-left p-4 rounded-lg font-medium text-white transition-all duration-300 ${getButtonClass(option)} disabled:cursor-not-allowed`}
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
                            {!isCorrect && <p className="text-gray-300 mt-1">The correct answer was: <strong>{question.correctAnswer}</strong></p>}
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
