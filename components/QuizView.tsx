import React, { useState, useEffect, useCallback } from 'react';
import { Lesson, MultipleChoiceQuestion } from '../types';
import { generateQuizSet } from '../services/geminiService';
import { useBadges } from '../hooks/useBadges';
import { LoadingSpinner } from './LoadingSpinner';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { useApiKey } from '../hooks/useApiKey';
import { TrophyIcon } from './icons/TrophyIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';

interface QuizViewProps {
  lesson: Lesson;
  onComplete: () => void;
  onNextLesson: () => void;
  hasNextLesson: boolean;
}

const QUIZ_LENGTH = 5;
const PASS_THRESHOLD = 0.8; // 80%

type QuizState = 'loading' | 'active' | 'finished' | 'error';

export const QuizView: React.FC<QuizViewProps> = ({ lesson, onComplete, onNextLesson, hasNextLesson }) => {
  const [quizState, setQuizState] = useState<QuizState>('loading');
  const [questions, setQuestions] = useState<MultipleChoiceQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const { apiKey } = useApiKey();
  const { unlockBadge } = useBadges();

  const loadQuestions = useCallback(async () => {
    setQuizState('loading');
    if (!apiKey) {
        setQuizState('error');
        return;
    }
    try {
      // The lesson's 'content' string, which contains the concept, should be used to generate the quiz.
      const generatedQuestions = await generateQuizSet(apiKey, lesson.content, QUIZ_LENGTH, `quiz-set-${lesson.key}`);
      
      if (generatedQuestions.length < QUIZ_LENGTH) {
        console.warn(`AI generated only ${generatedQuestions.length}/${QUIZ_LENGTH} questions.`);
      }

      setQuestions(generatedQuestions);
      setQuizState('active');
    } catch (error) {
      console.error("Failed to generate quiz questions:", error);
      setQuizState('error');
    }
  }, [lesson.content, lesson.key, apiKey]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);
  
  const handleRetry = () => {
    setScore(0);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    loadQuestions();
  }

  const handleAnswer = (answer: string) => {
    if (selectedAnswer !== null) return;
    
    const correct = answer === questions[currentQuestionIndex].correctAnswer;
    setSelectedAnswer(answer);
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    const finalScore = isCorrect ? score + 1 : score;
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else {
      setQuizState('finished');
      if (questions.length > 0 && (finalScore / questions.length) >= PASS_THRESHOLD) {
        unlockBadge('quiz-master');
      }
    }
  };

  const getButtonClass = (option: string) => {
    if (selectedAnswer === null) {
      return 'bg-slate-700 hover:bg-slate-600';
    }
    const { correctAnswer } = questions[currentQuestionIndex];
    if (option === correctAnswer) {
      return 'bg-green-500/80 ring-2 ring-green-400';
    }
    if (option === selectedAnswer && !isCorrect) {
      return 'bg-red-500/80';
    }
    return 'bg-slate-700 opacity-50';
  };

  if (quizState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-300">Generating your quiz...</p>
      </div>
    );
  }

  if (quizState === 'error') {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-lg">
            <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-red-400" />
            <h2 className="mt-4 text-2xl font-bold text-white">Failed to Create Quiz</h2>
            <p className="mt-2 text-red-300">
                {!apiKey ? "Please set your Gemini API key to take a quiz." : "There was an issue generating questions from the AI. Please check your API key and try again."}
            </p>
        </div>
        <button onClick={onComplete} className="mt-6 px-6 py-2 bg-slate-700 text-gray-200 font-semibold rounded-lg hover:bg-slate-600">
            Back to Lesson
        </button>
      </div>
    );
  }

  if (quizState === 'finished') {
    const isPass = questions.length > 0 && (score / questions.length) >= PASS_THRESHOLD;
    return (
      <div className="max-w-2xl mx-auto text-center animate-[fade-in_0.5s]">
        {isPass ? (
            <TrophyIcon className="w-20 h-20 mx-auto text-[--color-focus-gold]" />
        ) : (
            <BookOpenIcon className="w-20 h-20 mx-auto text-cyan-400" />
        )}
        <h1 className="text-4xl font-extrabold text-white mt-4 mb-2 tracking-tight">
            {isPass ? 'Quiz Passed!' : 'Keep Practicing!'}
        </h1>
        <p className="text-gray-400">
            {isPass ? "Great job! You've mastered this topic." : "A good effort! Review the lesson to solidify your knowledge."}
        </p>
        <div className={`mt-6 p-6 bg-slate-800/50 border ${isPass ? 'border-[--color-focus-gold]/30' : 'border-slate-700'} rounded-lg`}>
          <p className="text-xl text-gray-300">Your final score is:</p>
          <p className={`text-5xl font-bold my-2 ${isPass ? 'text-[--color-focus-gold]' : 'text-slate-400'}`}>{score} / {questions.length}</p>
        </div>

        <div className="mt-8 space-y-3 sm:space-y-0 sm:flex sm:flex-row-reverse sm:justify-center sm:space-x-4 sm:space-x-reverse">
             {isPass && hasNextLesson && (
                 <button onClick={onNextLesson} className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-cyan-500 text-gray-900 font-semibold rounded-lg shadow-md hover:bg-cyan-400">
                    Next Lesson <ArrowRightIcon className="w-5 h-5 ml-2" />
                </button>
             )}
             {!isPass && (
                  <button onClick={onComplete} className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-cyan-500 text-gray-900 font-semibold rounded-lg shadow-md hover:bg-cyan-400">
                    Review Lesson <BookOpenIcon className="w-5 h-5 ml-2" />
                 </button>
             )}
            <button onClick={handleRetry} className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-slate-700 text-gray-200 font-semibold rounded-lg hover:bg-slate-600">
                Retry Quiz <ArrowPathIcon className="w-5 h-5 ml-2" />
            </button>
            {isPass && (
                 <button onClick={onComplete} className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-slate-700 text-gray-200 font-semibold rounded-lg hover:bg-slate-600">
                    Review Lesson
                 </button>
            )}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">Quiz: {lesson.title}</h1>
        <div className="text-lg font-mono font-bold px-3 py-1 bg-slate-700 rounded-md text-[--color-focus-gold]">
            Score: {score}
        </div>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2.5 mb-6">
          <div className="bg-[--color-focus-gold] h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
      </div>
      <div className="animate-[fade-in_0.5s]">
        <h2 className="text-xl text-left text-gray-200 mb-6 font-semibold">
          <span className="text-cyan-400 mr-2">Q{currentQuestionIndex + 1}:</span>
          {currentQuestion.question}
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {currentQuestion.options.map((option, idx) => (
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
          <div className="mt-6 text-center animate-[fade-in_0.5s]">
            <p className={`text-xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {isCorrect ? 'Correct!' : 'Incorrect!'}
            </p>
            {!isCorrect && <p className="text-gray-300 mt-1">The correct answer was: <strong>{currentQuestion.correctAnswer}</strong></p>}
            <button onClick={handleNextQuestion} className="mt-4 inline-flex items-center px-6 py-3 bg-cyan-500 text-gray-900 font-semibold rounded-lg shadow-md hover:bg-cyan-400">
                {currentQuestionIndex + 1 < questions.length ? 'Next Question' : 'Finish Quiz'}
                <ArrowRightIcon className="w-5 h-5 ml-2" />
            </button>
          </div>
        )}
      </div>
      <style>{`
          @keyframes fade-in {
              from { opacity: 0; }
              to { opacity: 1; }
          }
      `}</style>
    </div>
  );
};