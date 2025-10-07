
import React, { useState } from 'react';
import { Lesson, Module, AppView } from '../types';
import { ChartDisplay } from './ChartDisplay';
import { LoadingSpinner } from './LoadingSpinner';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { generateChartImage, generateLessonContent } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon';
import { useApiKey } from '../hooks/useApiKey';
import { LessonCurriculumSidebar } from './LessonCurriculumSidebar';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface LessonViewProps {
  lesson: Lesson;
  content: string;
  chartImageUrl: string;
  onVisualize: () => void;
  isLoadingContent: boolean;
  isLoadingChart: boolean;
  onStartQuiz: (lesson: Lesson) => void;
  error: string | null;
  onNextLesson: () => void;
  onPreviousLesson: () => void;
  hasNextLesson: boolean;
  hasPreviousLesson: boolean;
  modules: Module[];
  onSelectLesson: (lesson: Lesson) => void;
  completedLessons: Set<string>;
}

// Helper function to render inline markdown like **bold**
const renderInlineMarkdown = (text: string): React.ReactElement => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return (
        <>
            {parts.map((part, i) =>
                i % 2 === 1 ? (
                    <strong key={i} className="font-bold text-cyan-300">{part}</strong>
                ) : (
                    part
                )
            )}
        </>
    );
};

const FormattedContent: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n').filter(p => p.trim() !== '');
    
    const elements: React.ReactElement[] = [];
    let listItems: React.ReactElement[] = [];

    const flushListItems = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="list-disc space-y-3 my-5 pl-6">
                    {listItems}
                </ul>
            );
            listItems = [];
        }
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        if (trimmedLine === '---') {
            flushListItems();
            elements.push(<hr key={index} className="my-8 border-slate-700" />);
            return;
        }

        const isListItem = /^\d+\.\s/.test(trimmedLine) || trimmedLine.startsWith('* ');

        if (isListItem) {
            const content = trimmedLine.replace(/^\d+\.\s|^\* \s?/, '').trim();
            listItems.push(<li key={index}>{renderInlineMarkdown(content)}</li>);
            return;
        }
        
        flushListItems();

        if (trimmedLine.startsWith('#### ')) elements.push(<h4 key={index} className="text-lg font-semibold text-cyan-400 mt-6 mb-2">{renderInlineMarkdown(trimmedLine.substring(5))}</h4>);
        else if (trimmedLine.startsWith('### ')) elements.push(<h3 key={index} className="text-xl font-semibold text-white mt-8 mb-3">{renderInlineMarkdown(trimmedLine.substring(4))}</h3>);
        else if (trimmedLine.startsWith('## ')) elements.push(<h2 key={index} className="text-2xl font-bold text-white mt-10 mb-4 border-b border-slate-700 pb-2">{renderInlineMarkdown(trimmedLine.substring(3))}</h2>);
        else if (trimmedLine.startsWith('# ')) elements.push(<h1 key={index} className="text-3xl font-extrabold text-white mt-12 mb-5 border-b-2 border-cyan-500 pb-3">{renderInlineMarkdown(trimmedLine.substring(2))}</h1>);
        else elements.push(<p key={index} className="mb-5 leading-relaxed">{renderInlineMarkdown(line)}</p>);
    });

    flushListItems();

    return <>{elements}</>;
};

const CandlestickPatternExplorer: React.FC = () => {
    const [explorerChartUrl, setExplorerChartUrl] = useState('');
    const [explorerExplanation, setExplorerExplanation] = useState('');
    const [isExplorerLoading, setIsExplorerLoading] = useState(false);
    const [activePattern, setActivePattern] = useState<string | null>(null);
    const [explorerError, setExplorerError] = useState<string | null>(null);

    const { apiKey } = useApiKey();
    const patterns = ['Bullish Engulfing', 'Bearish Engulfing', 'Hammer', 'Doji', 'Morning Star', 'Evening Star'];

    const handlePatternSelect = async (patternName: string) => {
        if (!apiKey) {
            setExplorerError('Please set your Gemini API key to use the explorer.');
            return;
        }
        setActivePattern(patternName);
        setIsExplorerLoading(true);
        setExplorerChartUrl('');
        setExplorerExplanation('');
        setExplorerError(null);
        try {
            const chartPrompt = `A dark-themed forex candlestick chart showing a clear, highlighted example of a "${patternName}" pattern. The context of the prior trend should be visible (e.g., a downtrend for a bullish reversal pattern).`;
            const explanationPrompt = `You are a trading mentor. Explain the "${patternName}" candlestick pattern in 2-3 concise sentences. Describe what it looks like, where it typically occurs, and what it signifies for traders. Use markdown for **bold** emphasis.`;

            const [imageUrl, explanation] = await Promise.all([
                generateChartImage(apiKey, chartPrompt, `pattern-chart-${patternName}`),
                generateLessonContent(apiKey, explanationPrompt, `pattern-expl-${patternName}`)
            ]);

            setExplorerChartUrl(imageUrl);
            setExplorerExplanation(explanation);
        } catch (e) {
            console.error(e);
            setExplorerError('Failed to generate pattern analysis. Please check your API key.');
        } finally {
            setIsExplorerLoading(false);
        }
    };

    return (
        <div className="mt-12 border-t border-cyan-500/20 pt-8">
            <div className="flex items-start mb-6">
                <SparklesIcon className="w-8 h-8 text-cyan-400 mr-3 mt-1 flex-shrink-0" />
                <div>
                    <h3 className="text-xl font-bold text-white">Interactive Pattern Explorer</h3>
                    <p className="text-slate-400 text-sm">Click a pattern to generate a chart and an AI-powered explanation.</p>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
                {patterns.map(pattern => (
                    <button 
                        key={pattern} 
                        onClick={() => handlePatternSelect(pattern)}
                        disabled={isExplorerLoading}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 disabled:cursor-not-allowed ${
                            activePattern === pattern 
                            ? 'bg-cyan-500 text-slate-900' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:bg-slate-800'
                        }`}
                    >
                        {isExplorerLoading && activePattern === pattern ? 'Loading...' : pattern}
                    </button>
                ))}
            </div>
            
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                 <ChartDisplay
                    imageUrl={explorerChartUrl}
                    isLoading={isExplorerLoading}
                    loadingText={activePattern ? `AI is analyzing ${activePattern}...` : 'Generating...'}
                    containerClassName="w-full aspect-video bg-slate-800/50 rounded-lg border border-slate-700 flex items-center justify-center p-2"
                />
                <div className="min-h-[10rem] text-slate-300">
                    {explorerExplanation && !isExplorerLoading && <FormattedContent text={explorerExplanation} />}
                     {explorerError && (
                        <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg flex items-center">
                            <ExclamationTriangleIcon className="w-5 h-5 mr-3" />
                            <span>{explorerError}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export const LessonView: React.FC<LessonViewProps> = (props) => {
    const {
        lesson,
        content,
        chartImageUrl,
        onVisualize,
        isLoadingContent,
        isLoadingChart,
        onStartQuiz,
        error,
        onNextLesson,
        onPreviousLesson,
        hasNextLesson,
        hasPreviousLesson,
        modules,
        onSelectLesson,
        completedLessons,
    } = props;
  
    return (
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">
            {/* Main Content */}
            <div className="flex-1 min-w-0">
                <div className="max-w-4xl">
                    <h1 className="text-4xl font-extrabold text-slate-100 mb-4 tracking-tight">{lesson.title}</h1>
                    <div className="prose prose-invert prose-lg max-w-none text-slate-300">
                        {isLoadingContent ? (
                        <div className="flex items-center justify-center py-10">
                            <LoadingSpinner />
                        </div>
                        ) : (
                        <FormattedContent text={content} />
                        )}
                    </div>

                    {error && (
                        <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg flex items-center">
                            <ExclamationTriangleIcon className="w-5 h-5 mr-3" />
                            <span>{error}</span>
                        </div>
                    )}
                    
                    {/* Visualizer Section */}
                    <div className="mt-12 border-t border-slate-700 pt-8">
                        <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
                             <div className="flex items-start">
                                <LightBulbIcon className="w-8 h-8 text-yellow-300 mr-4 mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="text-lg font-bold text-white">Visualize the Concept</h3>
                                    <p className="text-slate-400 text-sm">Ask the AI to generate a chart illustrating this topic.</p>
                                </div>
                            </div>
                            <button
                                onClick={onVisualize}
                                disabled={isLoadingChart || isLoadingContent}
                                className="px-5 py-2.5 bg-cyan-500 text-slate-900 font-semibold rounded-lg shadow-md hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0"
                            >
                                {isLoadingChart ? 'Generating...' : 'Generate Chart'}
                            </button>
                        </div>
                        <ChartDisplay imageUrl={chartImageUrl} isLoading={isLoadingChart} />
                    </div>

                    {lesson.key === 'l1-candlestick-anatomy' && !isLoadingContent && <CandlestickPatternExplorer />}

                     {/* Lesson Navigation */}
                    <div className="mt-12 pt-6 border-t border-slate-700 flex justify-between items-center">
                         <button
                            onClick={onPreviousLesson}
                            disabled={!hasPreviousLesson}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-200 font-semibold rounded-lg shadow-sm hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-0.5"
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                            Previous
                        </button>
                        <button
                            onClick={onNextLesson}
                            disabled={!hasNextLesson}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-slate-900 font-semibold rounded-lg shadow-sm hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/20"
                        >
                            Next
                            <ChevronRightIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-full lg:w-80 lg:max-w-xs flex-shrink-0">
                <div className="sticky top-28 space-y-6">
                     {!isLoadingContent && content && (
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 text-center">
                            <QuestionMarkCircleIcon className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                            <h3 className="text-base font-bold text-white">Test Your Knowledge</h3>
                            <p className="text-slate-400 text-sm mb-4">Take a quick quiz on this lesson.</p>
                            <button
                                onClick={() => onStartQuiz(lesson)}
                                className="w-full px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold rounded-lg hover:bg-cyan-500/20 transition-colors"
                            >
                                Take Quiz
                            </button>
                        </div>
                    )}
                    <LessonCurriculumSidebar
                        modules={modules}
                        selectedLessonKey={lesson.key}
                        onSelectLesson={onSelectLesson}
                        completedLessons={completedLessons}
                    />
                </div>
            </div>
        </div>
    );
};