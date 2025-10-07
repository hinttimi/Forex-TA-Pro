
import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { LessonView } from './components/LessonView';
import { Header } from './components/Header';
import { Lesson, AppView } from './types';
import { generateLessonContent, generateChartImage } from './services/geminiService';
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

const allLessons = MODULES.flatMap(module => module.lessons);

const findLessonIndex = (lessonKey: string) => {
    return allLessons.findIndex(l => l.key === lessonKey);
};

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('lesson');
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(MODULES[0].lessons[0]);
  const [lessonContent, setLessonContent] = useState<string>('');
  const [chartImageUrl, setChartImageUrl] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false);
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { logLessonCompleted, getCompletedLessons } = useCompletion();
  const { unlockBadge } = useBadges();

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
    if (completed.size > 0) {
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
  }, [lessonContent, unlockBadge, getCompletedLessons]); // Reruns when new lesson content is loaded

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
            error={error}
            onNextLesson={handleNextLesson}
            onPreviousLesson={handlePreviousLesson}
            hasNextLesson={hasNextLesson}
            hasPreviousLesson={hasPreviousLesson}
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
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <Sidebar
        modules={MODULES}
        onSelectLesson={handleSelectLesson}
        selectedLessonKey={currentLesson?.key}
        currentView={currentView}
        onSetPracticeView={handleSetView}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          {renderView()}
        </main>
      </div>
       <BadgeNotification />
    </div>
  );
};

const App: React.FC = () => (
  <BadgesProvider>
    <AppContent />
  </BadgesProvider>
);


export default App;