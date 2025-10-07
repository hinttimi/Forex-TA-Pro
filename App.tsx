
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
import { EconomicCalendarView } from './components/EconomicCalendarView';
import { AIBacktesterView } from './components/AIBacktesterView';
import { LiveChartSimulatorView } from './components/practice/LiveChartSimulatorView';
import { useDebounce } from './hooks/useDebounce';
import { ApiKeyProvider } from './context/ApiKeyContext';
import { useApiKey } from './hooks/useApiKey';
import { ApiKeyModal } from './components/ApiKeyModal';
import { SettingsView } from './components/SettingsView';

const allLessons = MODULES.flatMap(module => module.lessons);

const findLessonIndex = (lessonKey: string) => {
    return allLessons.findIndex(l => l.key === lessonKey);
};

const AppContent: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>('lesson');
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [lessonContent, setLessonContent] = useState<string>('');
  const [chartImageUrl, setChartImageUrl] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false);
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [quizLesson, setQuizLesson] = useState<Lesson | null>(null);
  const [marketUpdate, setMarketUpdate] = useState<MarketUpdate | null>(null);
  
  const [lessonToLoadKey, setLessonToLoadKey] = useState<string | null>(null);
  const debouncedLessonKey = useDebounce(lessonToLoadKey, 500);

  // Component-level cache for lesson data to prevent re-loading UI
  const [lessonDataCache, setLessonDataCache] = useState<Map<string, { content: string; chartUrl?: string }>>(new Map());

  const { apiKey } = useApiKey();
  const { logLessonCompleted, getCompletedLessons } = useCompletion();
  const { unlockBadge } = useBadges();
  const completedLessons = getCompletedLessons();

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleSelectLesson = useCallback((lesson: Lesson) => {
    setCurrentView('lesson');
    setCurrentLesson(lesson);
    setError(null);

    // Check component cache first for an instant load
    if (lessonDataCache.has(lesson.key)) {
        const cachedData = lessonDataCache.get(lesson.key)!;
        setLessonContent(cachedData.content);
        setChartImageUrl(cachedData.chartUrl || '');
        setIsLoadingContent(false);
        setLessonToLoadKey(null); // Prevent re-triggering API call
    } else {
        // Otherwise, clear state and trigger a new load
        setChartImageUrl('');
        setLessonContent('');
        setIsLoadingContent(true);
        setLessonToLoadKey(lesson.key);
    }
  }, [lessonDataCache]);

  // Effect for debounced content loading
  useEffect(() => {
    const loadContent = async (key: string) => {
      if (currentLesson?.key !== key) {
        return;
      }
      if (!apiKey) {
          setError("Please set your Gemini API key to load lesson content.");
          setIsLoadingContent(false);
          return;
      }

      const lesson = allLessons.find(l => l.key === key);
      if (!lesson) {
          setIsLoadingContent(false);
          return;
      }
      
      try {
        const content = await generateLessonContent(apiKey, lesson.contentPrompt, `lesson-content-${lesson.key}`);
        setLessonContent(content);
        // Add the new content to our component-level cache
        setLessonDataCache(prevCache => {
            const newCache = new Map(prevCache);
            const existingData = newCache.get(lesson.key);
            // FIX: Replaced object spread with explicit property assignment to address type error.
            const updatedData = {
              content: content,
              chartUrl: existingData?.chartUrl,
            };
            newCache.set(lesson.key, updatedData);
            return newCache;
        });
        logLessonCompleted(lesson.key);
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : 'Failed to load lesson content. Please check your API key and try again.';
        setError(errorMessage);
      } finally {
        if (currentLesson?.key === key) {
            setIsLoadingContent(false);
        }
      }
    };
    
    if (debouncedLessonKey) {
      loadContent(debouncedLessonKey);
    }
  }, [debouncedLessonKey, currentLesson?.key, logLessonCompleted, apiKey]);


  // Badge check effect
  useEffect(() => {
    const completed = getCompletedLessons();
    const firstLessonKey = MODULES[0].lessons[0].key;

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
  }, [lessonContent, unlockBadge, getCompletedLessons, currentLesson]);

  // Effect for market update toasts
  useEffect(() => {
    const UPDATE_INTERVAL = 15 * 60 * 1000;

    const intervalId = setInterval(async () => {
        if (apiKey && currentView === 'lesson' && document.visibilityState === 'visible') {
            try {
                const update = await generateMarketUpdateSnippet(apiKey);
                setMarketUpdate(update);
            } catch (e) {
                console.error("Failed to fetch market update snippet:", e);
            }
        }
    }, UPDATE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [currentView, apiKey]);


  useEffect(() => {
    // Only trigger the initial lesson load if we have an API key
    // and if there isn't already a lesson selected. This prevents
    // re-loading the first lesson if the user changes their API key later.
    if (apiKey && !currentLesson) {
      handleSelectLesson(MODULES[0].lessons[0]);
    }
  }, [apiKey, currentLesson, handleSelectLesson]);

  const handleVisualize = useCallback(async () => {
    if (!currentLesson) return;
    if (!apiKey) {
        setError("Please set your Gemini API key to generate charts.");
        return;
    }
    setIsLoadingChart(true);
    setChartImageUrl('');
    try {
      const imageUrl = await generateChartImage(apiKey, currentLesson.chartPrompt, `lesson-chart-${currentLesson.key}`);
      setChartImageUrl(imageUrl);
      // Add the generated chart URL to our component-level cache
      setLessonDataCache(prevCache => {
          const newCache = new Map(prevCache);
          const existingData = newCache.get(currentLesson.key);
          if (existingData) { // This should always exist if content has been loaded
              // FIX: Replaced object spread with explicit property assignment to address type error.
              const updatedData = {
                content: existingData.content,
                chartUrl: imageUrl,
              };
              newCache.set(currentLesson.key, updatedData);
          }
          return newCache;
      });
    } catch (e) {
      console.error(e);
      setError('Failed to generate chart. Please try again.');
    } finally {
      setIsLoadingChart(false);
    }
  }, [currentLesson, apiKey]);

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
      case 'live_simulator':
        return <LiveChartSimulatorView />;
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
      case 'economic_calendar':
        return <EconomicCalendarView />;
      case 'backtester':
        return <AIBacktesterView />;
      case 'settings':
        return <SettingsView />;
      default:
        return null;
    }
  };

  return (
    <div className="relative h-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
      <ApiKeyModal />
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
  <ApiKeyProvider>
    <BadgesProvider>
      <AppContent />
    </BadgesProvider>
  </ApiKeyProvider>
);


export default App;
