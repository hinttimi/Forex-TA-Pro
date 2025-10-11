import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Lesson, LearningPath, OhlcData } from '../types';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { generateChartDataForLesson, generateLessonSummary, generateMultimediaSummary } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon';
import { useApiKey } from '../hooks/useApiKey';
import { LessonCurriculumSidebar } from './LessonCurriculumSidebar';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { LessonSkeleton } from './LessonSkeleton';
import { ChartSkeleton } from './ChartSkeleton';
import { InteractiveChart } from './InteractiveChart';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';

interface LessonViewProps {
  lesson: Lesson;
  isLoadingContent: boolean; // This is for the initial brief skeleton
  onStartQuiz: (lesson: Lesson) => void;
  onNextLesson: () => void;
  onPreviousLesson: () => void;
  hasNextLesson: boolean;
  hasPreviousLesson: boolean;
  learningPaths: LearningPath[];
  onSelectLesson: (lesson: Lesson) => void;
  completedLessons: Set<string>;
}

interface MultimediaSummary {
    script: string;
    images: string[];
}

// Helper function to render inline markdown like **bold**
const renderInlineMarkdown = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const regex = /\*\*(.*?)\*\*/g;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
        // Text before the match
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }
        // The bolded text
        parts.push(<strong key={`strong-${key++}`} className="font-bold text-cyan-400">{match[1]}</strong>);
        lastIndex = regex.lastIndex;
    }

    // Any remaining text
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return <>{parts}</>;
};

// This component renders a text segment, handling paragraphs, lists, and headings.
const TextSegment: React.FC<{ text: string }> = ({ text }) => {
    // Split into blocks by one or more empty lines
    const blocks = text.split(/\n\s*\n/).filter(block => block.trim() !== '');

    return (
        <>
            {blocks.map((block, blockIndex) => {
                const trimmedBlock = block.trim();
                const isList = /^\s*(\*|\-|\d+\.)\s/.test(trimmedBlock);

                if (isList) {
                    const lines = block.split('\n');
                    const listType = /^\s*\d+\./.test(trimmedBlock) ? 'ol' : 'ul';
                    const listItems = lines.map((line, lineIndex) => {
                        // This handles indented list items visually but not structurally (as nested lists)
                        const indentLevel = (line.match(/^\s*/) || [''])[0].length;
                        const content = line.replace(/^\s*(\*|\-|\d+\.)\s/, '').trim();
                        if (!content) return null;
                        return <li key={lineIndex} style={{ marginLeft: `${Math.floor(indentLevel/2) * 1.5}em` }}>{renderInlineMarkdown(content)}</li>;
                    }).filter(Boolean); // Remove nulls from empty lines
                    
                    if (listType === 'ul') {
                        return <ul key={blockIndex} className="list-disc space-y-2 my-6 pl-6">{listItems}</ul>;
                    } else {
                        return <ol key={blockIndex} className="list-decimal space-y-2 my-6 pl-6">{listItems}</ul>;
                    }
                }

                // Handle headings
                if (trimmedBlock.startsWith('#### ')) return <h4 key={blockIndex} className="text-lg font-semibold text-cyan-400 mt-6 mb-2">{renderInlineMarkdown(trimmedBlock.substring(5))}</h4>;
                if (trimmedBlock.startsWith('### ')) return <h3 key={blockIndex} className="text-xl font-semibold text-white mt-8 mb-3">{renderInlineMarkdown(trimmedBlock.substring(4))}</h3>;
                if (trimmedBlock.startsWith('## ')) return <h2 key={blockIndex} className="text-2xl font-bold text-white mt-10 mb-4 border-b border-slate-700 pb-2">{renderInlineMarkdown(trimmedBlock.substring(3))}</h2>;
                if (trimmedBlock.startsWith('# ')) return <h1 key={blockIndex} className="text-3xl font-extrabold text-white mt-12 mb-5 border-b-2 border-cyan-500 pb-3">{renderInlineMarkdown(trimmedBlock.substring(2))}</h1>;
                if (trimmedBlock === '---') return <hr key={blockIndex} className="my-8 border-slate-700" />;
                
                // If it's none of the above, it's a paragraph block.
                return <p key={blockIndex} className="mb-6 leading-relaxed">{renderInlineMarkdown(block)}</p>;
            })}
        </>
    );
};

// This component will handle fetching and displaying a single interactive chart.
const EmbeddedChart: React.FC<{ prompt: string; lessonKey: string }> = ({ prompt, lessonKey }) => {
    const [chartData, setChartData] = useState<OhlcData[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { apiKey } = useApiKey();

    useEffect(() => {
        const generateData = async () => {
            if (!apiKey) {
                setError('API key not set.'); 
                setIsLoading(false); 
                return;
            }
            setIsLoading(true); 
            setError(null);
            try {
                const cacheKey = `lesson-chart-data-${lessonKey}-${prompt.slice(0, 30).replace(/\s/g, '')}`;
                const data = await generateChartDataForLesson(apiKey, prompt, cacheKey);
                setChartData(data);
            } catch (e) {
                console.error("Failed to generate embedded chart data:", e);
                setError('Failed to load chart data.');
            } finally {
                setIsLoading(false);
            }
        };
        generateData();
    }, [prompt, apiKey, lessonKey]);

    return (
        <div className="my-8 w-full aspect-video bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center shadow-sm">
            {isLoading && <ChartSkeleton loadingText="AI is generating chart data..." />}
            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
            {chartData && <InteractiveChart data={chartData} />}
        </div>
    );
};

interface DynamicLessonContentProps {
    text: string;
    lessonKey: string;
}

// This component parses the full lesson content for [CHART:...] placeholders
// and renders either text segments or embedded charts.
const DynamicLessonContent: React.FC<DynamicLessonContentProps> = ({ text, lessonKey }) => {
    const chartPromptRegex = /\[CHART:\s*(.*?)\]/gs;
    const parts = text.split(chartPromptRegex);

    return (
        <div className="prose prose-invert max-w-none text-slate-300">
            {parts.map((part, index) => {
                // Even-indexed parts are text, odd-indexed parts are chart prompts.
                if (index % 2 === 0) {
                    return <TextSegment key={`text-${index}`} text={part} />;
                } else {
                    return (
                        <EmbeddedChart 
                            key={`chart-${index}`} 
                            prompt={part} 
                            lessonKey={lessonKey} 
                        />
                    );
                }
            })}
        </div>
    );
};


export const LessonView: React.FC<LessonViewProps> = (props) => {
    const {
        lesson,
        isLoadingContent: isInitialLoading,
        onStartQuiz,
        onNextLesson,
        onPreviousLesson,
        hasNextLesson,
        hasPreviousLesson,
        learningPaths,
        onSelectLesson,
        completedLessons,
    } = props;
    
    const [keyTakeaways, setKeyTakeaways] = useState('');
    const [isLoadingTakeaways, setIsLoadingTakeaways] = useState(false);
    const { apiKey } = useApiKey();
    
    // Multimedia summary state
    const [multimediaSummary, setMultimediaSummary] = useState<MultimediaSummary | null>(null);
    const [isGeneratingMultimedia, setIsGeneratingMultimedia] = useState(false);
    const [multimediaError, setMultimediaError] = useState<string | null>(null);
    const [generationStatus, setGenerationStatus] = useState('');
    const [playbackState, setPlaybackState] = useState<'paused' | 'playing'>('paused');
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Swipe navigation state
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const minSwipeDistance = 60;

    // Cleanup speech synthesis on unmount or when lesson changes
    useEffect(() => {
        return () => {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
        };
    }, [lesson.key]);

    // Reset state when lesson changes
    useEffect(() => {
        setKeyTakeaways('');
        setMultimediaSummary(null);
        setMultimediaError(null);
        setIsGeneratingMultimedia(false);
        setGenerationStatus('');
        setPlaybackState('paused');
        setCurrentSceneIndex(0);
    }, [lesson.key]);

    const handleGenerateTakeaways = useCallback(async () => {
        if (!apiKey || !lesson.content) return;
        setIsLoadingTakeaways(true);
        try {
            const summary = await generateLessonSummary(apiKey, lesson.content);
            setKeyTakeaways(summary);
        } catch (e) {
            console.error("Failed to generate key takeaways", e);
            setKeyTakeaways("Sorry, could not generate a summary at this time.");
        } finally {
            setIsLoadingTakeaways(false);
        }
    }, [apiKey, lesson.content]);

    const handleGenerateMultimedia = useCallback(async () => {
        if (!apiKey || !lesson.content) return;
        setIsGeneratingMultimedia(true);
        setMultimediaError(null);
        setMultimediaSummary(null);
        setCurrentSceneIndex(0);
        setPlaybackState('paused');

        try {
            const result = await generateMultimediaSummary(apiKey, lesson.content, setGenerationStatus);
            setMultimediaSummary(result);
        } catch(e) {
            console.error("Failed to generate multimedia summary", e);
            setMultimediaError("Sorry, could not generate a multimedia summary at this time.");
        } finally {
            setIsGeneratingMultimedia(false);
            setGenerationStatus('');
        }
    }, [apiKey, lesson.content]);

    const handlePlayback = () => {
        if (!multimediaSummary) return;

        if (playbackState === 'playing') { // Pause
            window.speechSynthesis.pause();
            setPlaybackState('paused');
        } else { // Play or Resume
            setPlaybackState('playing');
            if (window.speechSynthesis.paused && utteranceRef.current) {
                window.speechSynthesis.resume();
            } else {
                // Start new playback
                setCurrentSceneIndex(0);
                const utterance = new SpeechSynthesisUtterance(multimediaSummary.script);
                utteranceRef.current = utterance;
                
                const wordBoundaries: {charIndex: number, word: string}[] = [];
                const words = multimediaSummary.script.split(/\s+/);
                let charCount = 0;
                words.forEach(word => {
                    wordBoundaries.push({ charIndex: charCount, word });
                    charCount += word.length + 1;
                });
                
                const totalDuration = multimediaSummary.images.length * 5; // Simple estimate
                const wordsPerImage = Math.ceil(words.length / multimediaSummary.images.length);

                utterance.onboundary = (event) => {
                    if (event.name === 'word') {
                        const currentWordIndex = wordBoundaries.findIndex(b => b.charIndex >= event.charIndex);
                        const imageIndex = Math.floor(currentWordIndex / wordsPerImage);
                        if (imageIndex < multimediaSummary.images.length) {
                             setCurrentSceneIndex(imageIndex);
                        }
                    }
                };

                utterance.onend = () => {
                    setPlaybackState('paused');
                    setCurrentSceneIndex(0);
                };
                
                window.speechSynthesis.speak(utterance);
            }
        }
    };
    
    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && hasNextLesson) onNextLesson();
        if (isRightSwipe && hasPreviousLesson) onPreviousLesson();

        setTouchStart(null);
        setTouchEnd(null);
    };
  
    if (isInitialLoading) {
        return (
             <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">
                <div className="flex-1 min-w-0">
                    <div className="max-w-4xl">
                        <LessonSkeleton />
                    </div>
                </div>
                 <div className="w-full lg:w-80 lg:max-w-xs flex-shrink-0">
                    {/* Simplified skeleton for sidebar */}
                    <div className="sticky top-28 space-y-6 animate-pulse">
                        <div className="h-48 bg-slate-800 rounded-xl"></div>
                        <div className="h-96 bg-slate-800 rounded-xl"></div>
                    </div>
                </div>
            </div>
        )
    }
  
    return (
        <div 
            className="flex flex-col lg:flex-row gap-8 xl:gap-12"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Main Content */}
            <div className="flex-1 min-w-0">
                <div className="max-w-4xl">
                    <h1 className="text-4xl font-extrabold text-slate-100 mb-6 tracking-tight">{lesson.title}</h1>
                    <DynamicLessonContent 
                        text={lesson.content} 
                        lessonKey={lesson.key}
                    />

                    <div className="mt-12 border-t border-slate-700 pt-8">
                         <div className="flex items-start">
                            <DocumentTextIcon className="w-8 h-8 text-cyan-400 mr-4 mt-1 flex-shrink-0" />
                            <div>
                                <h3 className="text-lg font-bold text-white">Key Takeaways</h3>
                                <p className="text-slate-400 text-sm">Get a quick, AI-powered summary of this lesson.</p>
                            </div>
                        </div>
                         {keyTakeaways ? (
                            <div className="mt-4 bg-slate-800 border border-slate-700 rounded-lg p-5 prose prose-invert prose-sm max-w-none text-slate-300">
                                <TextSegment text={keyTakeaways} />
                            </div>
                        ) : (
                            <button
                                onClick={handleGenerateTakeaways}
                                disabled={isLoadingTakeaways || !apiKey}
                                className="mt-4 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold rounded-lg hover:bg-cyan-500/20 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoadingTakeaways ? <LoadingSpinner /> : 'Generate Summary'}
                            </button>
                        )}
                         {!apiKey && <p className="text-xs text-yellow-400 mt-2">Set your API key to enable summary generation.</p>}
                    </div>
                    
                    <div className="mt-12 border-t border-slate-700 pt-8">
                        <div className="flex items-start">
                            <VideoCameraIcon className="w-8 h-8 text-cyan-400 mr-4 mt-1 flex-shrink-0" />
                            <div>
                                <h3 className="text-lg font-bold text-white">AI Multimedia Summary</h3>
                                <p className="text-slate-400 text-sm">Watch an animated summary with voiceover.</p>
                            </div>
                        </div>
                        {multimediaSummary ? (
                            <div className="mt-4 relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-slate-700">
                                <img 
                                    key={currentSceneIndex}
                                    src={multimediaSummary.images[currentSceneIndex]} 
                                    alt={`Scene ${currentSceneIndex + 1}`}
                                    className="w-full h-full object-cover animate-[fade-in_0.5s_ease-in-out]"
                                />
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-between">
                                    <button onClick={handlePlayback} className="p-2 bg-white/20 rounded-full text-white hover:bg-white/40 backdrop-blur-sm">
                                        {playbackState === 'playing' ? <PauseIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6"/>}
                                    </button>
                                    <div className="flex space-x-1.5">
                                        {multimediaSummary.images.map((_, index) => (
                                            <div key={index} className={`w-2 h-2 rounded-full transition-colors ${index === currentSceneIndex ? 'bg-white' : 'bg-white/50'}`}></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            isGeneratingMultimedia ? (
                                <div className="mt-4 flex items-center justify-center gap-3 p-4 bg-slate-800 border border-slate-700 rounded-lg h-32">
                                    <LoadingSpinner />
                                    <span className="text-sm text-slate-400">{generationStatus || 'Starting summary generation...'}</span>
                                </div>
                            ) : (
                                 <button
                                    onClick={handleGenerateMultimedia}
                                    disabled={!apiKey}
                                    className="mt-4 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold rounded-lg hover:bg-cyan-500/20 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Generate Multimedia Summary
                                </button>
                            )
                        )}
                        {multimediaError && <p className="text-xs text-red-400 mt-2">{multimediaError}</p>}
                    </div>

                     {/* Lesson Navigation */}
                    <div className="mt-12 pt-6 border-t border-slate-700 flex justify-between items-center">
                         <button
                            onClick={onPreviousLesson}
                            disabled={!hasPreviousLesson}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-200 font-semibold rounded-lg shadow-sm hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-0.5"
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
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 text-center shadow-none">
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
                    <LessonCurriculumSidebar
                        learningPaths={learningPaths}
                        selectedLessonKey={lesson.key}
                        onSelectLesson={onSelectLesson}
                        completedLessons={completedLessons}
                    />
                </div>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};
