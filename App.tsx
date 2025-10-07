
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
import { FeedbackModal } from './components/FeedbackModal';
import { DashboardView } from './components/DashboardView';

const allLessons = MODULES.flatMap(module => module.lessons);

const findLessonIndex = (lessonKey: string) => {
    return allLessons.findIndex(l => l.key === lessonKey);
};

const AppContent: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [lessonContent, setLessonContent] = useState<string>('');
  const [chartImageUrl, setChartImageUrl] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false);
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [quizLesson, setQuizLesson] = useState<Lesson | null>(null);
  const [marketUpdate, setMarketUpdate] = useState<MarketUpdate | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  
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
            // FIX: Explicitly providing the type to the Map constructor to ensure correct type inference for `existingData`.
            const newCache = new Map<string, { content: string; chartUrl?: string }>(prevCache);
            const existingData = newCache.get(lesson.key);
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

  // --- Pre-fetching logic ---
  const prefetchLessons = useCallback(async (startingLessonKey: string) => {
    if (!apiKey) return;

    const PREFETCH_COUNT = 2; // How many lessons to prefetch ahead
    const currentIndex = findLessonIndex(startingLessonKey);
    if (currentIndex === -1) return;

    for (let i = 1; i <= PREFETCH_COUNT; i++) {
        const nextIndex = currentIndex + i;
        if (nextIndex < allLessons.length) {
            const lessonToPrefetch = allLessons[nextIndex];
            
            // Check if it's already cached at the component level
            if (!lessonDataCache.has(lessonToPrefetch.key)) {
                try {
                    // This call will populate the service-level cache and return the content
                    const content = await generateLessonContent(apiKey, lessonToPrefetch.contentPrompt, `lesson-content-${lessonToPrefetch.key}`);
                    
                    // Also populate the component-level cache so the UI loads instantly
                    setLessonDataCache(prevCache => {
                        // FIX: Explicitly provide generic types to the Map constructor. This prevents
                        // TypeScript from inferring `existingData` as `unknown`, which causes an error when
                        // trying to access `existingData.chartUrl`.
                        const newCache = new Map<string, { content: string; chartUrl?: string }>(prevCache);
                        // Make sure not to overwrite existing chart data if it somehow exists
                        const existingData = newCache.get(lessonToPrefetch.key);
                        newCache.set(lessonToPrefetch.key, {
                            content: content,
                            chartUrl: existingData?.chartUrl,
                        });
                        return newCache;
                    });
                } catch (e) {
                    console.error(`Failed to prefetch lesson ${lessonToPrefetch.key}:`, e);
                    // Fail silently in the background and stop prefetching for now
                    break; 
                }
            }
        }
    }
  }, [apiKey, lessonDataCache]);

  // Effect for triggering pre-fetching
  useEffect(() => {
    // Only prefetch when the current lesson is fully loaded and there's no error
    if (currentLesson && !isLoadingContent && lessonContent && !error) {
        prefetchLessons(currentLesson.key);
    }
  }, [currentLesson, isLoadingContent, lessonContent, error, prefetchLessons]);
  // --- End Pre-fetching logic ---

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
        if (apiKey && (currentView === 'lesson' || currentView === 'dashboard') && document.visibilityState === 'visible') {
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
          // FIX: Explicitly providing the type to the Map constructor to ensure correct type inference for `existingData`.
          const newCache = new Map<string, { content: string; chartUrl?: string }>(prevCache);
          const existingData = newCache.get(currentLesson.key);
          if (existingData) { // This should always exist if content has been loaded
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
  
  const openFeedbackModal = () => setIsFeedbackModalOpen(true);
  const closeFeedbackModal = () => setIsFeedbackModalOpen(false);

  const currentIndex = currentLesson ? findLessonIndex(currentLesson.key) : -1;
  const hasNextLesson = currentIndex !== -1 && currentIndex < allLessons.length - 1;
  const hasPreviousLesson = currentIndex > 0;

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onSelectLesson={handleSelectLesson} onSetView={handleSetView} />;
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
            onNextLesson={handleNextLesson}
            onPreviousLesson={handlePreviousLesson}
            hasNextLesson={hasNextLesson}
            hasPreviousLesson={hasPreviousLesson}
            modules={MODULES}
            onSelectLesson={handleSelectLesson}
            completedLessons={completedLessons}
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
            <QuizView 
                lesson={quizLesson} 
                onComplete={() => setCurrentView('lesson')}
                onNextLesson={handleNextLesson}
                hasNextLesson={hasNextLesson}
            />
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
  
  let viewTitle = 'Dashboard';
    if (currentView === 'lesson' && currentLesson) {
        viewTitle = currentLesson.title;
    } else if (currentView === 'backtester') {
        viewTitle = 'AI Strategy Lab';
    } else if (currentView !== 'dashboard') {
        viewTitle = currentView.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

  return (
    <div className="relative h-screen text-slate-200 font-sans overflow-hidden">
      <ApiKeyModal />
      <FeedbackModal isOpen={isFeedbackModalOpen} onClose={closeFeedbackModal} />
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 md:hidden" aria-hidden="true" />}
      <Sidebar
        modules={MODULES}
        onSelectLesson={handleSelectLesson}
        selectedLessonKey={currentLesson?.key}
        currentView={currentView}
        onSetView={handleSetView}
        completedLessons={completedLessons}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenFeedbackModal={openFeedbackModal}
      />
      <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:pl-80' : ''}`}>
        <Header 
          onToggleSidebar={toggleSidebar}
          viewTitle={viewTitle}
        />
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div key={currentView} className="animate-fade-in-up">
            {renderView()}
          </div>
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
