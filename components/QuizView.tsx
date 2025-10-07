import React, { useState, useEffect, useCallback } from 'react';
import { Lesson, MultipleChoiceQuestion } from '../types';
import { generateQuizQuestion } from '../services/geminiService';
import { useBadges } from '../hooks/useBadges';
import { LoadingSpinner } from './LoadingSpinner';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';

interface QuizViewProps {
  lesson: Lesson;
  onComplete: () => void;
}

const QUIZ_LENGTH = 5;
const PASS_THRESHOLD = 0.8; // 80%

type QuizState = 'loading' | 'active' | 'finished' | 'error';

export const QuizView: React.FC<QuizViewProps> = ({ lesson, onComplete }) => {
  const [quizState, setQuizState] = useState<QuizState>('loading');
  const [questions, setQuestions] = useState<MultipleChoiceQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const { unlockBadge } = useBadges();

  const loadQuestions = useCallback(async () => {
    setQuizState('loading');
    try {
      const questionPromises = Array(QUIZ_LENGTH).fill(null).map(() => 
        generateQuizQuestion(lesson.contentPrompt)
      );
      const generatedQuestions = await Promise.all(questionPromises);
      setQuestions(generatedQuestions);
      setQuizState('active');
    } catch (error) {
      console.error("Failed to generate quiz questions:", error);
      setQuizState('error');
    }
  }, [lesson.contentPrompt]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

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
    if (currentQuestionIndex + 1 < QUIZ_LENGTH) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else {
      setQuizState('finished');
      if (score / QUIZ_LENGTH >= PASS_THRESHOLD) {
        unlockBadge('quiz-master');
      }
    }
  };

  const getButtonClass = (option: string) => {
    if (selectedAnswer === null) {
      return 'bg-gray-700 hover:bg-gray-600';
    }
    const { correctAnswer } = questions[currentQuestionIndex];
    if (option === correctAnswer) {
      return 'bg-green-500/80 ring-2 ring-green-400';
    }
    if (option === selectedAnswer && !isCorrect) {
      return 'bg-red-500/80';
    }
    return 'bg-gray-700 opacity-50';
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
            <p className="mt-2 text-red-300">There was an issue generating questions from the AI. Please check your connection or API key and try again.</p>
        </div>
        <button onClick={onComplete} className="mt-6 px-6 py-2 bg-gray-700 text-gray-200 font-semibold rounded-lg hover:bg-gray-600">
            Back to Lesson
        </button>
      </div>
    );
  }

  if (quizState === 'finished') {
    const isPass = (score / QUIZ_LENGTH) >= PASS_THRESHOLD;
    return (
      <div className="max-w-2xl mx-auto text-center animate-[fade-in_0.5s]">
        <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Quiz Complete!</h1>
        <div className={`mt-8 p-8 bg-gray-800/50 border ${isPass ? 'border-cyan-500/30' : 'border-gray-700'} rounded-lg`}>
          <p className="text-2xl text-gray-300">Your final score is:</p>
          <p className={`text-6xl font-bold my-4 ${isPass ? 'text-cyan-400' : 'text-gray-400'}`}>{score} / {QUIZ_LENGTH}</p>
          {isPass && <p className="text-green-400 font-semibold">Great job! You've mastered this topic.</p>}
        </div>
        <button onClick={onComplete} className="mt-8 inline-flex items-center px-6 py-3 bg-cyan-500 text-gray-900 font-semibold rounded-lg shadow-md hover:bg-cyan-400">
            Return to Lesson
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">Quiz: {lesson.title}</h1>
        <div className="text-lg font-mono font-bold px-3 py-1 bg-gray-700 rounded-md text-cyan-400">
            Score: {score}
        </div>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5 mb-6">
          <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / QUIZ_LENGTH) * 100}%` }}></div>
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
                {currentQuestionIndex + 1 < QUIZ_LENGTH ? 'Next Question' : 'Finish Quiz'}
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
