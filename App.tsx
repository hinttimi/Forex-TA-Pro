

import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Lesson, AppView, MarketUpdate } from './types';
import { generateMarketUpdateSnippet } from './services/geminiService';
import { LEARNING_PATHS } from './constants';
// Badge Imports
import { BadgesProvider } from './context/BadgesContext';
import { BadgeNotification } from './components/BadgeNotification';
import { useCompletion } from './hooks/useCompletion';
import { useBadges } from './hooks/useBadges';
import { MarketUpdateToast } from './components/MarketUpdateToast';
import { FeedbackModal } from './components/FeedbackModal';
import { BottomNavBar } from './components/BottomNavBar';
import { FloatingActionButton } from './components/FloatingActionButton';
import { WelcomeTour } from './components/WelcomeTour';
import { LiveSimulatorProvider } from './context/LiveSimulatorContext';
import { MentorSettingsProvider } from './context/MentorSettingsContext';
import { MarketDynamicsProvider } from './context/MarketDynamicsContext';
import { MentorSuggestionToast } from './components/MentorSuggestionToast';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthView } from './components/AuthView';
import { CompletionProvider } from './context/CompletionContext';
// @fix: Import necessary components and hooks for API key management.
import { ApiKeyProvider } from './context/ApiKeyContext';
import { useApiKey } from './hooks/useApiKey';
import { ApiKeyModal } from './components/ApiKeyModal';
import { MarketIntelProvider } from './context/MarketIntelContext';

// --- Lazy-loaded View Components ---
const LessonView = lazy(() => import('./components/LessonView').then(module => ({ default: module.LessonView })));
const PatternRecognitionView = lazy(() => import('./components/practice/PatternRecognitionView').then(module => ({ default: module.PatternRecognitionView })));
const TimedChallengeView = lazy(() => import('./components/practice/TimedChallengeView').then(module => ({ default: module.TimedChallengeView })));
const FreePracticeCanvasView = lazy(() => import('./components/practice/FreePracticeCanvasView').then(module => ({ default: module.FreePracticeCanvasView })));
const TradeSimulatorView = lazy(() => import('./components/practice/TradeSimulatorView').then(module => ({ default: module.TradeSimulatorView })));
const SavedAnalysisView = lazy(() => import('./components/practice/SavedAnalysisView').then(module => ({ default: module.SavedAnalysisView })));
const AchievementsView = lazy(() => import('./components/AchievementsView').then(module => ({ default: module.AchievementsView })));
const TradingPlanView = lazy(() => import('./components/TradingPlanView').then(module => ({ default: module.TradingPlanView })));
const AIMentorView = lazy(() => import('./components/AIMentorView').then(module => ({ default: module.AIMentorView })));
const QuizView = lazy(() => import('./components/QuizView').then(module => ({ default: module.QuizView })));
const MarketPulseView = lazy(() => import('./components/MarketPulseView').then(module => ({ default: module.MarketPulseView })));
const NewsFeedView = lazy(() => import('./components/NewsFeedView').then(module => ({ default: module.NewsFeedView })));
const WhyIsItMovingView = lazy(() => import('./components/WhyIsItMovingView').then(module => ({ default: module.WhyIsItMovingView })));
const EconomicCalendarView = lazy(() => import('./components/EconomicCalendarView').then(module => ({ default: module.EconomicCalendarView })));
const AIBacktesterView = lazy(() => import('./components/AIBacktesterView').then(module => ({ default: module.AIBacktesterView })));
const LiveChartSimulatorView = lazy(() => import('./components/practice/LiveChartSimulatorView').then(module => ({ default: module.LiveChartSimulatorView })));
const SettingsView = lazy(() => import('./components/SettingsView').then(module => ({ default: module.SettingsView })));
const DashboardView = lazy(() => import('./components/DashboardView').then(module => ({ default: module.DashboardView })));
const TradingJournalView = lazy(() => import('./components/TradingJournalView').then(module => ({ default: module.TradingJournalView })));
const MarketDynamicsDashboard = lazy(() => import('./components/MarketDynamicsDashboard').then(module => ({ default: module.MarketDynamicsDashboard })));


const allLessons = LEARNING_PATHS.flatMap(path => path.modules.flatMap(module => module.lessons));

const findLessonIndex = (lessonKey: string) => {
    return allLessons.findIndex(l => l.key === lessonKey);
};

const keyLessonsForSuggestions: Record<string, { message: string; tool: AppView; params?: any }> = {
    'uf-m2-l6': { message: "You've learned about Engulfing Patterns! Want to practice identifying them in the Pattern Recognition tool?", tool: 'pattern' },
    'uf-m3-l1': { message: "Great work on understanding uptrends! Ready to practice analyzing them in the Trade Simulator?", tool: 'simulator' },
    'uf-m3-l2': { message: "You've got downtrends down. Want to apply that knowledge in the Trade Simulator?", tool: 'simulator' },
    'uf-m4-l4': { message: "S/R Flips are a core concept. Shall we jump into the Trade Simulator to see them in action?", tool: 'simulator' },
    'uf-m6-l5': { message: "You've built your checklist! Want the AI Mentor to help you backtest a strategy based on it?", tool: 'backtester' },
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
  const [mentorSuggestion, setMentorSuggestion] = useState<{ message: string; tool: AppView; params?: any } | null>(null);

  const { currentUser } = useAuth();
  const { completedLessons, logLessonCompleted, getCompletionCount } = useCompletion();
  const { unlockBadge } = useBadges();
  // @fix: Get the API key from the context to use in API calls.
  const { apiKey } = useApiKey();
  
  const handleSelectLesson = useCallback((lesson: Lesson) => {
    // If already on lesson view and selecting a new lesson, show loading skeleton briefly
    if (currentView === 'lesson' && currentLesson?.key !== lesson.key) {
        setIsLoadingContent(true);
    }
    setCurrentView('lesson');
    setCurrentLesson(lesson);
  }, [currentView, currentLesson]);

  const handleExecuteTool = useCallback((toolName: AppView, params: any = {}) => {
    setToolExecutionParams({ toolName, params });
    setCurrentView(toolName);
  }, []);

  // When a lesson is selected, turn off the loading skeleton after a brief moment
  // to allow the UI to update and render the skeleton before showing content.
  useEffect(() => {
      if (currentLesson && isLoadingContent) {
          const timer = setTimeout(() => {
              setIsLoadingContent(false);
              logLessonCompleted(currentLesson.key);

              // Proactive Mentor Suggestion
              const suggestion = keyLessonsForSuggestions[currentLesson.key];
              if (suggestion && !mentorSuggestion) {
                  setTimeout(() => {
                      setMentorSuggestion(suggestion);
                  }, 2500); // Delay to not be too jarring
              }

          }, 100); // A small delay for the skeleton to be visible
          return () => clearTimeout(timer);
      }
  }, [currentLesson, isLoadingContent, logLessonCompleted, mentorSuggestion]);
  
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

  const handleExecuteToolFromMentor = useCallback((payload: { toolName: AppView, params: any }) => {
    handleExecuteTool(payload.toolName, payload.params);
  }, [handleExecuteTool]);

  // Effect to clear tool execution params after they have been used for a render.
  // This prevents the tool from re-triggering if the view is revisited.
  useEffect(() => {
    if (toolExecutionParams) {
        setToolExecutionParams(null);
    }
  }, [toolExecutionParams]);

  // Handle tour for first-time users
  useEffect(() => {
    const tourSeen = localStorage.getItem('forex_ta_pro_tour_seen');
    if (currentUser && !tourSeen) {
        // Delay to allow main UI to render before starting tour
        setTimeout(() => {
            setIsTourActive(true);
            // Ensure sidebar is open to highlight curriculum
            setIsSidebarOpen(true);
        }, 500);
    }
  }, [currentUser]);

  // Badge check effect for lesson completions
  useEffect(() => {
    if (completedLessons.size === 0) return;

    const firstLessonKey = LEARNING_PATHS[0].modules[0].lessons[0].key;
    if (completedLessons.has(firstLessonKey)) {
      unlockBadge('first-step');
    }
    
    const foundationPath = LEARNING_PATHS.find(p => p.isFoundation);
    if (foundationPath) {
        const foundationLessonKeys = foundationPath.modules.flatMap(m => m.lessons.map(l => l.key));
        if (foundationLessonKeys.every(key => completedLessons.has(key))) {
            unlockBadge('foundation-builder');
        }
    }
  }, [completedLessons, unlockBadge]);

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
        // @fix: Pass the API key to `generateMarketUpdateSnippet` and ensure it exists.
        if (currentUser && (currentView === 'lesson' || currentView === 'dashboard') && document.visibilityState === 'visible' && apiKey) {
            try {
                const update = await generateMarketUpdateSnippet(apiKey);
                setMarketUpdate(update);
            } catch (e) {
                console.error("Failed to fetch market update snippet:", e);
            }
        }
    }, UPDATE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [currentView, currentUser, apiKey]);
  
  // --- END OF HOOKS ---

  // Show AuthView if no user is logged in. This MUST be after all hooks.
  if (!currentUser) {
    return <AuthView />;
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
        return <AIMentorView onSetView={handleSetView} onExecuteTool={handleExecuteToolFromMentor} />;
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
        return <AIBacktesterView initialRequest={toolExecutionParams?.params} onSetView={handleSetView} />;
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
      <FeedbackModal isOpen={isFeedbackModalOpen} onClose={closeFeedbackModal} />
      {/* @fix: Render the ApiKeyModal to allow users to set/update their key. */}
      <ApiKeyModal />
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
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center">
              <LoadingSpinner />
            </div>
          }>
            <div key={currentView} className="animate-fade-in-up">
              {renderView()}
            </div>
          </Suspense>
        </main>
      </div>
       <BadgeNotification />
       <MarketUpdateToast update={marketUpdate} onClose={() => setMarketUpdate(null)} />
       <MentorSuggestionToast
            suggestion={mentorSuggestion}
            onAccept={handleExecuteTool}
            onClose={() => setMentorSuggestion(null)}
        />
       <BottomNavBar currentView={currentView} onSetView={handleSetView} onSelectLesson={handleGoToLessonFromNav} />
       {currentView !== 'mentor' && currentView !== 'dashboard' && <FloatingActionButton onSetView={handleSetView} />}
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    {/* @fix: Wrap content with ApiKeyProvider to make the API key available globally. */}
    <ApiKeyProvider>
      <CompletionProvider>
          <BadgesProvider>
              <MentorSettingsProvider>
                  <LiveSimulatorProvider>
                      <MarketDynamicsProvider>
                          <MarketIntelProvider>
                              <AppContent />
                          </MarketIntelProvider>
                      </MarketDynamicsProvider>
                  </LiveSimulatorProvider>
              </MentorSettingsProvider>
          </BadgesProvider>
      </CompletionProvider>
    </ApiKeyProvider>
  </AuthProvider>
);


export default App;