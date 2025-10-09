import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { LessonView } from './components/LessonView';
import { Header } from './components/Header';
import { Lesson, AppView, MarketUpdate } from './types';
import { generateLessonContent, generateMarketUpdateSnippet } from './services/geminiService';
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
import { OnboardingWizard } from './components/OnboardingWizard';
import { BottomNavBar } from './components/BottomNavBar';
import { FloatingActionButton } from './components/FloatingActionButton';
import { WelcomeTour } from './components/WelcomeTour';
import { LiveSimulatorProvider } from './context/LiveSimulatorContext';
import { ThemeProvider } from './context/ThemeContext';

const allLessons = MODULES.flatMap(module => module.lessons);

const findLessonIndex = (lessonKey: string) => {
    return allLessons.findIndex(l => l.key === lessonKey);
};

const AppContent: React.FC = () => {
  // --- ALL HOOKS MUST BE AT THE TOP AND UNCONDITIONAL ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [lessonContent, setLessonContent] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [quizLesson, setQuizLesson] = useState<Lesson | null>(null);
  const [marketUpdate, setMarketUpdate] = useState<MarketUpdate | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [lessonToLoadKey, setLessonToLoadKey] = useState<string | null>(null);
  const [toolExecutionParams, setToolExecutionParams] = useState<{ toolName: AppView, params: any } | null>(null);

  const getLessonPrompt = (lesson: Lesson): string => {
    // This new prompt instructs the text-generation AI to create a new, detailed image prompt.
    return `You are an expert forex trading mentor creating a lesson. The user will provide content with placeholders like [CHART: a general description of a chart].

Your task is to rewrite the lesson content for the user. When you encounter a [CHART: ...] placeholder, you MUST replace it with a new, highly detailed, and specific prompt for an image generation AI. This new prompt must be enclosed in [AI_CHART_PROMPT: ...].

This new AI_CHART_PROMPT must:
1.  Be extremely descriptive and directly correspond to the text you have just written before it.
2.  Specify the chart type (e.g., candlestick, line), theme (always dark theme), specific patterns, labels, arrows, and any elements needed to perfectly illustrate the concept.
3.  For example, if you just explained a Bullish Engulfing pattern, the AI_CHART_PROMPT should explicitly describe a small red candle followed by a large green candle that engulfs it at the bottom of a downtrend.

After creating and inserting the [AI_CHART_PROMPT: ...], continue writing the rest of the lesson.

Here is the lesson content you need to process:
---
${lesson.contentPrompt}
---`;
  };

  const debouncedLessonKey = useDebounce(lessonToLoadKey, 500);

  const { apiKey, isKeyModalOpen, wasKeyJustSet, setApiKey } = useApiKey();
  const { logLessonCompleted, getCompletedLessons } = useCompletion();
  const { unlockBadge } = useBadges();
  const completedLessons = getCompletedLessons();
  
  const handleSelectLesson = useCallback((lesson: Lesson) => {
    setCurrentView('lesson');
    setCurrentLesson(lesson);
    setError(null);

    // Always trigger a new load to ensure no stale data.
    setLessonContent('');
    setIsLoadingContent(true);
    setLessonToLoadKey(lesson.key);
  }, []);
  
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
  
  const handleGoToLessonFromNav = useCallback(() => {
    if (currentLesson && currentView === 'lesson') return;

    if (currentLesson) {
        setCurrentView('lesson');
    } else {
        const nextLesson = allLessons.find(lesson => !completedLessons.has(lesson.key)) || allLessons[0];
        handleSelectLesson(nextLesson);
    }
  }, [currentLesson, currentView, completedLessons, handleSelectLesson]);

  const handleExecuteTool = useCallback((payload: { toolName: AppView, params: any }) => {
    setToolExecutionParams(payload);
    setCurrentView(payload.toolName);
  }, []);

  // Effect to clear tool execution params after they have been used for a render.
  // This prevents the tool from re-triggering if the view is revisited.
  useEffect(() => {
    if (toolExecutionParams) {
        setToolExecutionParams(null);
    }
  }, [toolExecutionParams]);

  // Handle tour for first-time users
  useEffect(() => {
    if (wasKeyJustSet) {
        const tourSeen = localStorage.getItem('forex_ta_pro_tour_seen');
        if (!tourSeen) {
            // Delay to allow main UI to render before starting tour
            setTimeout(() => {
                setIsTourActive(true);
                // Ensure sidebar is open to highlight curriculum
                setIsSidebarOpen(true);
            }, 500);
        }
    }
  }, [wasKeyJustSet]);

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
        const finalPrompt = getLessonPrompt(lesson);
        const content = await generateLessonContent(apiKey, finalPrompt, `lesson-content-${lesson.key}`);
        setLessonContent(content);
        logLessonCompleted(lesson.key);
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : 'Failed to load lesson content. Please check your API key and try again.';
        setError(errorMessage);
        if (errorMessage.includes('not valid')) {
            setApiKey(null);
        }
      } finally {
        if (currentLesson?.key === key) {
            setIsLoadingContent(false);
        }
      }
    };
    
    if (debouncedLessonKey) {
      loadContent(debouncedLessonKey);
    }
  }, [debouncedLessonKey, currentLesson?.key, logLessonCompleted, apiKey, setApiKey]);

  // Effect for preloading next lessons
  useEffect(() => {
    const preloadLessons = async () => {
      if (!currentLesson || !apiKey) return;

      const currentIndex = findLessonIndex(currentLesson.key);
      if (currentIndex === -1) return;

      const lessonsToPreload = [
        allLessons[currentIndex + 1],
        allLessons[currentIndex + 2],
      ].filter(Boolean); // Filter out undefined if we're at the end of the list

      for (const lesson of lessonsToPreload) {
        try {
          // This is a fire-and-forget call to populate the cache.
          // We don't need to handle the returned content here.
          const finalPrompt = getLessonPrompt(lesson);
          await generateLessonContent(apiKey, finalPrompt, `lesson-content-${lesson.key}`);
        } catch (e) {
          // Preloading failures should not be user-facing.
          // We log them to the console for debugging purposes.
          console.error(`Failed to preload lesson ${lesson.key}:`, e);
        }
      }
    };

    // Delay preloading slightly to ensure the main content load is prioritized.
    const timer = setTimeout(preloadLessons, 1500);
    return () => clearTimeout(timer);
  }, [currentLesson, apiKey]);

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
  
  // --- END OF HOOKS ---

  // Show onboarding wizard if no API key is set. This MUST be after all hooks.
  if (!apiKey && !isKeyModalOpen) {
    return <OnboardingWizard />;
  }
  
  const handleTourComplete = () => {
    setIsTourActive(false);
    localStorage.setItem('forex_ta_pro_tour_seen', 'true');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleSetView = (view: AppView) => {
    setCurrentView(view);
    setError(null);
  }

  const handleStartQuiz = (lesson: Lesson) => {
    setQuizLesson(lesson);
    setCurrentView('quiz');
  };
  
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
            isLoadingContent={isLoadingContent}
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
        return <SavedAnalysisView onSetView={handleSetView} />;
      case 'achievements':
        return <AchievementsView />;
      case 'trading_plan':
        return <TradingPlanView />;
      case 'mentor':
        return <AIMentorView onSetView={handleSetView} onExecuteTool={handleExecuteTool} />;
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
        return <AIBacktesterView initialRequest={toolExecutionParams?.params} />;
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
    <div className="relative h-screen font-sans overflow-hidden bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-200">
      {isTourActive && <WelcomeTour onClose={handleTourComplete} />}
      <ApiKeyModal />
      <FeedbackModal isOpen={isFeedbackModalOpen} onClose={closeFeedbackModal} />
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm z-30 md:hidden" aria-hidden="true" />}
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
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 pb-20 md:pb-10">
          <div key={currentView} className="animate-fade-in-up">
            {renderView()}
          </div>
        </main>
      </div>
       <BadgeNotification />
       <MarketUpdateToast update={marketUpdate} onClose={() => setMarketUpdate(null)} />
       <BottomNavBar currentView={currentView} onSetView={handleSetView} onSelectLesson={handleGoToLessonFromNav} />
       {currentView !== 'mentor' && currentView !== 'dashboard' && <FloatingActionButton onSetView={handleSetView} />}
    </div>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <ApiKeyProvider>
      <BadgesProvider>
          <LiveSimulatorProvider>
              <AppContent />
          </LiveSimulatorProvider>
      </BadgesProvider>
    </ApiKeyProvider>
  </ThemeProvider>
);


export default App;