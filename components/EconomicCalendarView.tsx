

import React, { useState } from 'react';
import { EconomicEvent } from '../types';
import { CALENDAR_EVENTS } from '../constants/calendarEvents';
import { 
    generatePreEventBriefing, 
    generateInstantAnalysis, 
    generatePostEventSummary 
} from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import { useApiKey } from '../hooks/useApiKey';

type AnalysisType = 'pre' | 'instant' | 'post';
type AnalysisContent = { [key in AnalysisType]?: string };
type LoadingState = { [key in AnalysisType]?: boolean };

const FormattedContent: React.FC<{ text: string }> = ({ text }) => {
    const renderInlineMarkdown = (text: string): React.ReactNode => {
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        const regex = /\*\*(.*?)\*\*/g;
        let match;
        let key = 0;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
            }
            parts.push(<strong key={`strong-${key++}`} className="font-bold text-cyan-300">{match[1]}</strong>);
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }

        return <>{parts}</>;
    };

    const lines = text.split('\n').filter(p => p.trim() !== '');
    const elements: React.ReactElement[] = [];
    let listItems: React.ReactElement[] = [];

    const flushListItems = () => {
        if (listItems.length > 0) {
            elements.push(<ul key={`ul-${elements.length}`} className="list-disc space-y-2 my-3 pl-5">{listItems}</ul>);
            listItems = [];
        }
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('*') || trimmedLine.startsWith('-')) {
            listItems.push(<li key={`li-${index}`}>{renderInlineMarkdown(trimmedLine.substring(1).trim())}</li>);
        } else {
            flushListItems();
            elements.push(<p key={`p-${index}`} className="mb-3 leading-relaxed">{renderInlineMarkdown(trimmedLine)}</p>);
        }
    });
    flushListItems();

    return <>{elements}</>;
};

const ImpactIndicator: React.FC<{ impact: 'High' | 'Medium' | 'Low' }> = ({ impact }) => {
    const color = {
        High: 'bg-red-500',
        Medium: 'bg-[--color-focus-gold]',
        Low: 'bg-gray-500',
    }[impact];
    return <div className={`w-2.5 h-2.5 rounded-full ${color}`} title={`${impact} Impact`}></div>;
};

export const EconomicCalendarView: React.FC = () => {
    const [events] = useState<EconomicEvent[]>(CALENDAR_EVENTS);
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
    const [analyses, setAnalyses] = useState<Record<string, AnalysisContent>>({});
    const [loadingStates, setLoadingStates] = useState<Record<string, LoadingState>>({});
    const [error, setError] = useState<string | null>(null);
    const { apiKey, openKeyModal } = useApiKey();

    const toggleEvent = (id: string) => {
        setExpandedEventId(prev => (prev === id ? null : id));
    };
    
    const handleGenerateAnalysis = async (event: EconomicEvent, type: AnalysisType) => {
        if (!apiKey) {
            setError('Please set your Gemini API key to generate analysis.');
            openKeyModal();
            return;
        }
        setLoadingStates(prev => ({ ...prev, [event.id]: { ...prev[event.id], [type]: true } }));
        setError(null);
        try {
            let result = '';
            if (type === 'pre') {
                result = await generatePreEventBriefing(apiKey, event);
            } else if (type === 'instant') {
                result = await generateInstantAnalysis(apiKey, event);
            } else if (type === 'post') {
                result = await generatePostEventSummary(apiKey, event);
            }
            setAnalyses(prev => ({ ...prev, [event.id]: { ...prev[event.id], [type]: result } }));
        } catch (e) {
            console.error(e);
            setError(`Failed to generate ${type} analysis. Please check your API key.`);
        } finally {
            setLoadingStates(prev => ({ ...prev, [event.id]: { ...prev[event.id], [type]: false } }));
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">AI Economic Calendar</h1>
            <p className="text-gray-400 mb-8">Get AI-powered insights on high-impact economic events to understand the market narrative.</p>
            
            <div className="space-y-3">
                {events.map(event => {
                    const isExpanded = expandedEventId === event.id;
                    const eventAnalyses = analyses[event.id] || {};
                    const eventLoading = loadingStates[event.id] || {};
                    
                    return (
                        <div key={event.id} className="bg-gray-800/60 border border-gray-700 rounded-lg transition-all duration-300">
                            <button onClick={() => toggleEvent(event.id)} className="w-full p-4 text-left flex items-center space-x-4">
                                <div className="w-24">
                                    <p className="font-semibold text-white">{event.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    <p className="text-xs text-gray-400">{event.time.toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                                </div>
                                <div className="w-16 font-bold text-lg text-gray-300">{event.currency}</div>
                                <div className="flex-1 text-gray-200">{event.name}</div>
                                <ImpactIndicator impact={event.impact} />
                                <div className="w-16 text-center text-sm text-gray-400">{event.forecast || '–'}</div>
                                <div className="w-16 text-center text-sm text-gray-400">{event.previous || '–'}</div>
                                <ChevronDownIcon className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isExpanded && (
                                <div className="p-5 border-t border-gray-700/50 animate-[fade-in_0.5s]">
                                    {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        {/* Pre-Event Briefing */}
                                        <div className="bg-gray-900/50 p-4 rounded-md">
                                            <h4 className="font-semibold text-white mb-2">Pre-Event Briefing</h4>
                                            {eventAnalyses.pre ? (
                                                <div className="prose prose-invert prose-sm max-w-none text-gray-300"><FormattedContent text={eventAnalyses.pre} /></div>
                                            ) : (
                                                <button onClick={() => handleGenerateAnalysis(event, 'pre')} disabled={eventLoading.pre} className="w-full text-sm py-2 bg-cyan-600/50 text-cyan-200 rounded hover:bg-cyan-600/80 disabled:bg-gray-600 disabled:cursor-not-allowed">
                                                    {eventLoading.pre ? <LoadingSpinner /> : 'Generate Briefing'}
                                                </button>
                                            )}
                                        </div>

                                        {/* Instant Analysis */}
                                        <div className="bg-gray-900/50 p-4 rounded-md">
                                            <h4 className="font-semibold text-white mb-2">Instant Analysis</h4>
                                            {event.actual ? (
                                                eventAnalyses.instant ? (
                                                     <div className="prose prose-invert prose-sm max-w-none text-gray-300"><FormattedContent text={eventAnalyses.instant} /></div>
                                                ) : (
                                                    <button onClick={() => handleGenerateAnalysis(event, 'instant')} disabled={eventLoading.instant} className="w-full text-sm py-2 bg-cyan-600/50 text-cyan-200 rounded hover:bg-cyan-600/80 disabled:bg-gray-600 disabled:cursor-not-allowed">
                                                         {eventLoading.instant ? <LoadingSpinner /> : `Analyze Release (${event.actual})`}
                                                    </button>
                                                )
                                            ) : (
                                                <p className="text-xs text-gray-500 italic">Analysis available after data release.</p>
                                            )}
                                        </div>

                                        {/* Post-Event Summary */}
                                        <div className="bg-gray-900/50 p-4 rounded-md">
                                            <h4 className="font-semibold text-white mb-2">Post-Event Summary</h4>
                                             {event.actual ? (
                                                eventAnalyses.post ? (
                                                     <div className="prose prose-invert prose-sm max-w-none text-gray-300"><FormattedContent text={eventAnalyses.post} /></div>
                                                ) : (
                                                    <button onClick={() => handleGenerateAnalysis(event, 'post')} disabled={eventLoading.post} className="w-full text-sm py-2 bg-cyan-600/50 text-cyan-200 rounded hover:bg-cyan-600/80 disabled:bg-gray-600 disabled:cursor-not-allowed">
                                                        {eventLoading.post ? <LoadingSpinner /> : 'Generate Summary'}
                                                    </button>
                                                )
                                            ) : (
                                                <p className="text-xs text-gray-500 italic">Analysis available after data release.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};