
import React, { useState, useCallback } from 'react';
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

const allLessons = MODULES.flatMap(module => module.lessons);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('lesson');
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(MODULES[0].lessons[0]);
  const [lessonContent, setLessonContent] = useState<string>('');
  const [chartImageUrl, setChartImageUrl] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false);
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (e) {
      console.error(e);
      setError('Failed to load lesson content. Please check your API key and try again.');
    } finally {
      setIsLoadingContent(false);
    }
  }, []);
  
  const handleSetPracticeView = (view: AppView) => {
    if (view !== 'lesson') {
        setCurrentView(view);
        setCurrentLesson(null);
    }
  };

  const handleVisualize = useCallback(async () => {
    if (!currentLesson) return;
    setChartImageUrl('');
    setError(null);
    setIsLoadingChart(true);
    try {
      const imageUrl = await generateChartImage(currentLesson.chartPrompt);
      setChartImageUrl(imageUrl);
    } catch (e) {
      console.error(e);
      setError('Failed to generate chart. The AI might be busy, please try again in a moment.');
    } finally {
      setIsLoadingChart(false);
    }
  }, [currentLesson]);
  
  // Load initial lesson on mount
  React.useEffect(() => {
    if (currentLesson) {
        handleSelectLesson(currentLesson);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentLessonIndex = currentLesson ? allLessons.findIndex(l => l.key === currentLesson.key) : -1;
  const hasPreviousLesson = currentLessonIndex > 0;
  const hasNextLesson = currentLessonIndex >= 0 && currentLessonIndex < allLessons.length - 1;

  const handlePreviousLesson = useCallback(() => {
    if (hasPreviousLesson) {
      handleSelectLesson(allLessons[currentLessonIndex - 1]);
    }
  }, [currentLessonIndex, hasPreviousLesson, handleSelectLesson]);

  const handleNextLesson = useCallback(() => {
    if (hasNextLesson) {
      handleSelectLesson(allLessons[currentLessonIndex + 1]);
    }
  }, [currentLessonIndex, hasNextLesson, handleSelectLesson]);

  const renderMainContent = () => {
    switch(currentView) {
      case 'pattern':
        return <PatternRecognitionView />;
      case 'timed':
        return <TimedChallengeView />;
      case 'canvas':
        return <FreePracticeCanvasView />;
      case 'simulator':
        return <TradeSimulatorView />;
      case 'lesson':
      default:
        return currentLesson ? (
            <LessonView
              lesson={currentLesson}
              content={lessonContent}
              chartImageUrl={chartImageUrl}
              onVisualize={handleVisualize}
              isLoadingContent={isLoadingContent}
              isLoadingChart={isLoadingChart}
              error={error}
              onPreviousLesson={handlePreviousLesson}
              onNextLesson={handleNextLesson}
              hasPreviousLesson={hasPreviousLesson}
              hasNextLesson={hasNextLesson}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-2xl text-gray-500">Select a lesson to begin your journey.</p>
            </div>
          );
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <Sidebar 
        modules={MODULES} 
        onSelectLesson={handleSelectLesson} 
        selectedLessonKey={currentLesson?.key}
        currentView={currentView}
        onSetPracticeView={handleSetPracticeView}
      />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
};

export default App;