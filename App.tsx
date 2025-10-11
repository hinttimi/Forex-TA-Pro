import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { LessonView } from './components/LessonView';
import { Header } from './components/Header';
import { Lesson, AppView, MarketUpdate } from './types';
import { generateMarketUpdateSnippet } from './services/geminiService';
import { LEARNING_PATHS } from './constants';
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
import { TradingJournalView } from './components/TradingJournalView';
import { MentorSettingsProvider } from './context/MentorSettingsContext';
import { MarketDynamicsDashboard } from './components/MarketDynamicsDashboard';
import { MarketDynamicsProvider } from './context/MarketDynamicsContext';

const allLessons = LEARNING_PATHS.flatMap(path => path.modules.flatMap(module => module.lessons));

const findLessonIndex = (lessonKey: string) => {
    return allLessons.findIndex(l => l.key === lessonKey);
};

const AppContent: React.FC = () => {
  // --- ALL HOOKS MUST BE AT THE TOP AND UNCONDITIONAL ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false);
  const [quizLesson, setQuizLesson] = useState<Lesson | null>(null);
  const [marketUpdate, setMarketUpdate] = useState<MarketUpdate | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [toolExecutionParams, setToolExecutionParams] = useState<{ toolName: AppView, params: any } | null>(null);

  const { apiKey, isKeyModalOpen, wasKeyJustSet } = useApiKey();
  const { logLessonCompleted, getCompletedLessons, getCompletionCount } = useCompletion();
  const { unlockBadge } = useBadges();
  const completedLessons = getCompletedLessons();
  
  const handleSelectLesson = useCallback((lesson: Lesson) => {
    // If already on lesson view and selecting a new lesson, show loading skeleton briefly
    if (currentView === 'lesson' && currentLesson?.key !== lesson.key) {
        setIsLoadingContent(true);
    }
    setCurrentView('lesson');
    setCurrentLesson(lesson);
  }, [currentView, currentLesson]);

  // When a lesson is selected, turn off the loading skeleton after a brief moment
  // to allow the UI to update and render the skeleton before showing content.
  useEffect(() => {
      if (currentLesson && isLoadingContent) {
          const timer = setTimeout(() => {
              setIsLoadingContent(false);
              logLessonCompleted(currentLesson.key);
          }, 100); // A small delay for the skeleton to be visible
          return () => clearTimeout(timer);
      }
  }, [currentLesson, isLoadingContent, logLessonCompleted]);
  
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

  // Badge check effect for lesson completions
  useEffect(() => {
    const completed = getCompletedLessons();
    if (completed.size === 0) return;

    const firstLessonKey = LEARNING_PATHS[0].modules[0].lessons[0].key;
    if (completed.has(firstLessonKey)) {
      unlockBadge('first-step');
    }
    
    const foundationPath = LEARNING_PATHS.find(p => p.isFoundation);
    if (foundationPath) {
        const foundationLessonKeys = foundationPath.modules.flatMap(m => m.lessons.map(l => l.key));
        if (foundationLessonKeys.every(key => completed.has(key))) {
            unlockBadge('foundation-builder');
        }
    }
  }, [getCompletedLessons, unlockBadge]);

  // Badge check for journal entries (listens for view change)
  useEffect(() => {
      const loggedTradesCount = getCompletionCount('loggedTrades');
      if (loggedTradesCount >= 1) {
          unlockBadge('journal-starter');
      }
      if (loggedTradesCount >= 10) {
          unlockBadge('consistent-logger');
      }
  }, [currentView, unlockBadge, getCompletionCount]);

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
            isLoadingContent={isLoadingContent}
            onStartQuiz={handleStartQuiz}
            onNextLesson={handleNextLesson}
            onPreviousLesson={handlePreviousLesson}
            hasNextLesson={hasNextLesson}
            hasPreviousLesson={hasPreviousLesson}
            learningPaths={LEARNING_PATHS}
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
      case 'trading_journal':
        return <TradingJournalView />;
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
        return <WhyIsItMovingView initialPair={toolExecutionParams?.params?.pair} />;
       case 'market_dynamics':
        return <MarketDynamicsDashboard />;
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
    } else if (currentView === 'trading_journal') {
        viewTitle = 'Trading Journal';
    } else if (currentView === 'market_dynamics') {
        viewTitle = 'Market Dynamics';
    } else if (currentView !== 'dashboard') {
        viewTitle = currentView.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

  return (
    <div className="relative h-screen font-sans overflow-hidden bg-[--color-obsidian-slate] text-[--color-ghost-white]">
      {isTourActive && <WelcomeTour onClose={handleTourComplete} />}
      <ApiKeyModal />
      <FeedbackModal isOpen={isFeedbackModalOpen} onClose={closeFeedbackModal} />
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" aria-hidden="true" />}
      <Sidebar
        learningPaths={LEARNING_PATHS}
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
    <ApiKeyProvider>
        <BadgesProvider>
            <MentorSettingsProvider>
                <LiveSimulatorProvider>
                    <MarketDynamicsProvider>
                        <AppContent />
                    </MarketDynamicsProvider>
                </LiveSimulatorProvider>
            </MentorSettingsProvider>
        </BadgesProvider>
    </ApiKeyProvider>
);


export default App;
