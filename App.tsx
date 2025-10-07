



import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { LessonView } from './components/LessonView';
import { Header } from './components/Header';
import { Lesson, AppView, MarketUpdate } from './types';
import { generateLessonContent, generateChartImage, generateMarketUpdateSnippet } from './services/geminiService';
import { MODULES } from './constants';
import { PatternRecognitionView } from './components/practice/PatternRecognitionView';
import { TimedChallengeView } from './components/practice/TimedChallengeView';
import { FreePracticeCanvasView } from './components/practice/FreePracticeCanvasView';
import { TradeSimulatorView } from './components/practice/TradeSimulatorView';
import { SavedAnalysisView } from './components/practice/SavedAnalysisView';
// Badge Imports
import { AchievementsView } from './components/AchievementsView';
import { BadgesProvider } from './context/BadgesContext';
import { BadgeNotification } from './components/BadgeNotification';
import { useCompletion } from './hooks/useCompletion';
import { useBadges } from './hooks/useBadges';
import { TradingPlanView } from './components/TradingPlanView';
import { AIMentorView } from './components/AIMentorView';
import { QuizView } from './components/QuizView';
import { MarketPulseView } from './components/MarketPulseView';
import { NewsFeedView } from './components/NewsFeedView';
import { MarketUpdateToast } from './components/MarketUpdateToast';
import { WhyIsItMovingView } from './components/WhyIsItMovingView';

const allLessons = MODULES.flatMap(module => module.lessons);

const findLessonIndex = (lessonKey: string) => {
    return allLessons.findIndex(l => l.key === lessonKey);
};

const AppContent: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>('lesson');
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(MODULES[0].lessons[0]);
  const [lessonContent, setLessonContent] = useState<string>('');
  const [chartImageUrl, setChartImageUrl] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false);
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [quizLesson, setQuizLesson] = useState<Lesson | null>(null);
  const [marketUpdate, setMarketUpdate] = useState<MarketUpdate | null>(null);
  
  const { logLessonCompleted, getCompletedLessons } = useCompletion();
  const { unlockBadge } = useBadges();
  const completedLessons = getCompletedLessons();

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleSelectLesson = useCallback(async (lesson: Lesson) => {
    setCurrentView('lesson');
    setCurrentLesson(lesson);
    setChartImageUrl('');
    setLessonContent('');
    setError(null);
    setIsLoadingContent(true);
    try {
      const content = await generateLessonContent(lesson.contentPrompt);
      setLessonContent(content);
      logLessonCompleted(lesson.key);
    } catch (e) {
      console.error(e);
      setError('Failed to load lesson content. Please check your API key and try again.');
    } finally {
      setIsLoadingContent(false);
    }
  }, [logLessonCompleted]);

  // Badge check effect
  useEffect(() => {
    const completed = getCompletedLessons();
    const firstLessonKey = MODULES[0].lessons[0].key;

    // Award "First Step" badge after completing the first lesson and navigating away from it.
    if (currentLesson?.key !== firstLessonKey && completed.has(firstLessonKey)) {
      unlockBadge('first-step');
    }
    
    const level1Keys = MODULES[0].lessons.map(l => l.key);
    if (level1Keys.every(key => completed.has(key))) {
        unlockBadge('foundation-builder');
    }
    
    const level2Keys = MODULES[1].lessons.map(l => l.key);
    if (level2Keys.every(key => completed.has(key))) {
        unlockBadge('structure-expert');
    }

    const level3Keys = MODULES[2].lessons.map(l => l.key);
    if (level3Keys.every(key => completed.has(key))) {
        unlockBadge('liquidity-hunter');
    }
  }, [lessonContent, unlockBadge, getCompletedLessons, currentLesson]); // Reruns when new lesson content is loaded

  // Effect for market update toasts
  useEffect(() => {
    const UPDATE_INTERVAL = 15 * 60 * 1000; // 15 minutes

    const intervalId = setInterval(async () => {
        // Only fetch updates if the user is on the lesson view and the tab is active
        if (currentView === 'lesson' && document.visibilityState === 'visible') {
            try {
                const update = await generateMarketUpdateSnippet();
                setMarketUpdate(update);
            } catch (e) {
                console.error("Failed to fetch market update snippet:", e);
                // We don't show an error to the user for this background task.
            }
        }
    }, UPDATE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [currentView]);


  useEffect(() => {
    handleSelectLesson(MODULES[0].lessons[0]);
  }, [handleSelectLesson]);

  const handleVisualize = useCallback(async () => {
    if (!currentLesson) return;
    setIsLoadingChart(true);
    setChartImageUrl('');
    try {
      const imageUrl = await generateChartImage(currentLesson.chartPrompt);
      setChartImageUrl(imageUrl);
    } catch (e) {
      console.error(e);
      setError('Failed to generate chart. Please try again.');
    } finally {
      setIsLoadingChart(false);
    }
  }, [currentLesson]);

  const handleSetView = (view: AppView) => {
    setCurrentView(view);
    setError(null);
  }

  const handleStartQuiz = (lesson: Lesson) => {
    setQuizLesson(lesson);
    setCurrentView('quiz');
  };

  const handleNextLesson = useCallback(() => {
    if (!currentLesson) return;
    const currentIndex = findLessonIndex(currentLesson.key);
    if (currentIndex !== -1 && currentIndex < allLessons.length - 1) {
      handleSelectLesson(allLessons[currentIndex + 1]);
    }
  }, [currentLesson, handleSelectLesson]);

  const handlePreviousLesson = useCallback(() => {
    if (!currentLesson) return;
    const currentIndex = findLessonIndex(currentLesson.key);
    if (currentIndex > 0) {
      handleSelectLesson(allLessons[currentIndex - 1]);
    }
  }, [currentLesson, handleSelectLesson]);
  
  const currentIndex = currentLesson ? findLessonIndex(currentLesson.key) : -1;
  const hasNextLesson = currentIndex !== -1 && currentIndex < allLessons.length - 1;
  const hasPreviousLesson = currentIndex > 0;

  const renderView = () => {
    switch (currentView) {
      case 'lesson':
        return currentLesson ? (
          <LessonView
            lesson={currentLesson}
            content={lessonContent}
            chartImageUrl={chartImageUrl}
            onVisualize={handleVisualize}
            isLoadingContent={isLoadingContent}
            isLoadingChart={isLoadingChart}
            onStartQuiz={handleStartQuiz}
            error={error}
          />
        ) : null;
      case 'pattern':
        return <PatternRecognitionView />;
      case 'timed':
        return <TimedChallengeView />;
      case 'canvas':
        return <FreePracticeCanvasView />;
      case 'simulator':
        return <TradeSimulatorView />;
      case 'saved':
        return <SavedAnalysisView />;
      case 'achievements':
        return <AchievementsView />;
      case 'trading_plan':
        return <TradingPlanView />;
      case 'mentor':
        return <AIMentorView />;
      case 'quiz':
        return quizLesson ? (
            <QuizView lesson={quizLesson} onComplete={() => setCurrentView('lesson')} />
        ) : null;
      case 'market_pulse':
        return <MarketPulseView />;
      case 'news_feed':
        return <NewsFeedView />;
      case 'market_analyzer':
        return <WhyIsItMovingView />;
      default:
        return null;
    }
  };

  return (
    <div className="relative h-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 md:hidden" aria-hidden="true" />}
      <Sidebar
        modules={MODULES}
        onSelectLesson={handleSelectLesson}
        selectedLessonKey={currentLesson?.key}
        currentView={currentView}
        onSetPracticeView={handleSetView}
        completedLessons={completedLessons}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:pl-72' : ''}`}>
        <Header 
          onToggleSidebar={toggleSidebar}
          onNextLesson={handleNextLesson}
          onPreviousLesson={handlePreviousLesson}
          hasNextLesson={hasNextLesson}
          hasPreviousLesson={hasPreviousLesson}
          currentLessonTitle={currentLesson?.title}
        />
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          {renderView()}
        </main>
      </div>
       <BadgeNotification />
       <MarketUpdateToast update={marketUpdate} onClose={() => setMarketUpdate(null)} />
    </div>
  );
};

const App: React.FC = () => (
  <BadgesProvider>
    <AppContent />
  </BadgesProvider>
);


export default App;