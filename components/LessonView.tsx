
import React, { useState } from 'react';
import { Lesson } from '../types';
import { ChartDisplay } from './ChartDisplay';
import { LoadingSpinner } from './LoadingSpinner';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { generateChartImage, generateLessonContent } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon';

interface LessonViewProps {
  lesson: Lesson;
  content: string;
  chartImageUrl: string;
  onVisualize: () => void;
  isLoadingContent: boolean;
  isLoadingChart: boolean;
  onStartQuiz: (lesson: Lesson) => void;
  error: string | null;
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
                <ul key={`ul-${elements.length}`} className="list-disc space-y-2 my-5 pl-6">
                    {listItems}
                </ul>
            );
            listItems = [];
        }
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        const isListItem = /^\d+\.\s/.test(trimmedLine) || trimmedLine.startsWith('* ');

        if (isListItem) {
            const content = trimmedLine.replace(/^\d+\.\s|^\* \s?/, '').trim();
            listItems.push(<li key={index}>{renderInlineMarkdown(content)}</li>);
            return; // Continue to next line
        }
        
        // If we encounter a non-list item, flush any existing list
        flushListItems();

        if (trimmedLine.startsWith('### ')) {
            const content = trimmedLine.substring(4);
            elements.push(<h3 key={index} className="text-xl font-semibold text-white mt-6 mb-3">{renderInlineMarkdown(content)}</h3>);
        } else if (trimmedLine.startsWith('## ')) {
            const content = trimmedLine.substring(3);
            elements.push(<h2 key={index} className="text-2xl font-bold text-white mt-8 mb-4 border-b border-gray-700 pb-2">{renderInlineMarkdown(content)}</h2>);
        } else if (trimmedLine.startsWith('# ')) {
            const content = trimmedLine.substring(2);
             elements.push(<h1 key={index} className="text-3xl font-extrabold text-white mt-10 mb-5 border-b-2 border-cyan-500 pb-3">{renderInlineMarkdown(content)}</h1>);
        } else {
            elements.push(<p key={index} className="mb-5 leading-relaxed">{renderInlineMarkdown(line)}</p>);
        }
    });

    flushListItems(); // Flush any remaining list items at the end

    return <>{elements}</>;
};

const CandlestickPatternExplorer: React.FC = () => {
    const [explorerChartUrl, setExplorerChartUrl] = useState('');
    const [explorerExplanation, setExplorerExplanation] = useState('');
    const [isExplorerLoading, setIsExplorerLoading] = useState(false);
    const [activePattern, setActivePattern] = useState<string | null>(null);
    const [explorerError, setExplorerError] = useState<string | null>(null);

    const patterns = ['Bullish Engulfing', 'Bearish Engulfing', 'Hammer', 'Doji', 'Morning Star', 'Evening Star'];

    const handlePatternSelect = async (patternName: string) => {
        setActivePattern(patternName);
        setIsExplorerLoading(true);
        setExplorerChartUrl('');
        setExplorerExplanation('');
        setExplorerError(null);
        try {
            const chartPrompt = `A dark-themed forex candlestick chart showing a clear, highlighted example of a "${patternName}" pattern. The context of the prior trend should be visible (e.g., a downtrend for a bullish reversal pattern).`;
            const explanationPrompt = `You are a trading mentor. Explain the "${patternName}" candlestick pattern in 2-3 concise sentences. Describe what it looks like, where it typically occurs, and what it signifies for traders. Use markdown for **bold** emphasis.`;

            const [imageUrl, explanation] = await Promise.all([
                generateChartImage(chartPrompt),
                generateLessonContent(explanationPrompt)
            ]);

            setExplorerChartUrl(imageUrl);
            setExplorerExplanation(explanation);
        } catch (e) {
            console.error(e);
            setExplorerError('Failed to generate pattern analysis. The AI may be busy, please try again.');
        } finally {
            setIsExplorerLoading(false);
        }
    };

    return (
        <div className="mt-10 border-t border-cyan-500/20 pt-8">
            <div className="flex items-start mb-6">
                <SparklesIcon className="w-8 h-8 text-cyan-400 mr-3 mt-1 flex-shrink-0" />
                <div>
                    <h3 className="text-xl font-bold text-white">Interactive Pattern Explorer</h3>
                    <p className="text-gray-400 text-sm">Click a pattern to generate a chart and an AI-powered explanation.</p>
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
                            ? 'bg-cyan-500 text-gray-900' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:bg-gray-800'
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
                    containerClassName="w-full aspect-video bg-gray-800/50 rounded-lg border border-gray-700 flex items-center justify-center p-2"
                />
                <div className="min-h-[10rem] text-gray-300">
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


export const LessonView: React.FC<LessonViewProps> = ({
  lesson,
  content,
  chartImageUrl,
  onVisualize,
  isLoadingContent,
  isLoadingChart,
  onStartQuiz,
  error,
}) => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">{lesson.title}</h1>
      <div className="prose prose-invert prose-lg max-w-none text-gray-300">
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

      {!isLoadingContent && (
        <div className="mt-10 border-t border-gray-700 pt-8">
            <div className="flex items-start">
                <QuestionMarkCircleIcon className="w-8 h-8 text-cyan-400 mr-3 mt-1 flex-shrink-0" />
                <div>
                    <h3 className="text-lg font-bold text-white">Test Your Knowledge</h3>
                    <p className="text-gray-400 text-sm mb-4">Take a quick, AI-generated quiz to see how well you understood this lesson.</p>
                     <button
                        onClick={() => onStartQuiz(lesson)}
                        disabled={isLoadingContent}
                        className="px-5 py-2.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold rounded-lg shadow-md hover:bg-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                        Take a Quiz
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="mt-8 border-t border-gray-700 pt-8">
        <div className="flex items-center justify-between">
            <div className="flex items-start">
                <LightBulbIcon className="w-8 h-8 text-yellow-300 mr-3 mt-1 flex-shrink-0" />
                <div>
                    <h3 className="text-lg font-bold text-white">Visualize the Concept</h3>
                    <p className="text-gray-400 text-sm">Click the button to ask the AI to generate a chart illustrating this lesson's main topic.</p>
                </div>
            </div>
            <button
            onClick={onVisualize}
            disabled={isLoadingChart || isLoadingContent}
            className="px-5 py-2.5 bg-cyan-500 text-gray-900 font-semibold rounded-lg shadow-md hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200"
            >
            {isLoadingChart ? 'Generating...' : 'Generate Chart'}
            </button>
        </div>
        <ChartDisplay imageUrl={chartImageUrl} isLoading={isLoadingChart} />
      </div>

      {lesson.key === 'l1-candlestick-anatomy' && !isLoadingContent && <CandlestickPatternExplorer />}

    </div>
  );
};