import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { MagnifyingGlassChartIcon } from './icons/MagnifyingGlassChartIcon';
import { db } from '../firebase';
import { doc, onSnapshot } from "firebase/firestore";

interface BriefingData {
    title: string;
    content: string;
}

// Helper to get the current week number
const getWeekNumber = (d: Date): [number, number] => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    return [d.getUTCFullYear(), weekNo];
};

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

    const cleanedText = text
        .replace(/\n\s*-\s/g, ' - ')
        .replace(/\*{2,}(.*?)\*/g, '**$1**')
        .replace(/^\s*\*\*(.*)/gm, '* **$1');

    const lines = cleanedText.split('\n').filter(line => line.trim());
    const elements: React.ReactElement[] = [];
    let currentListItems: React.ReactElement[] = [];

    const flushList = () => {
        if (currentListItems.length > 0) {
            elements.push(<ul key={`ul-${elements.length}`} className="list-disc space-y-3 my-3 pl-6">{currentListItems}</ul>);
            currentListItems = [];
        }
    };
    
    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('### ')) {
            flushList();
            elements.push(<h3 key={`h-${index}`} className="text-xl font-semibold text-white mt-6 mb-3">{trimmedLine.substring(4)}</h3>);
        } else if (trimmedLine.startsWith('* ')) {
            const content = trimmedLine.substring(2);
            currentListItems.push(<li key={`li-${index}`}>{renderInlineMarkdown(content)}</li>);
        } else {
            flushList();
            const isHeading = trimmedLine.length < 50 && !trimmedLine.endsWith('.') && !trimmedLine.endsWith(':');
            if (isHeading) {
                 elements.push(<h3 key={`h-${index}`} className="text-xl font-semibold text-white mt-6 mb-3">{trimmedLine}</h3>);
            } else {
                 elements.push(<p key={`p-${index}`} className="mb-3 leading-relaxed">{renderInlineMarkdown(trimmedLine)}</p>);
            }
        }
    });

    flushList();
    return <>{elements}</>;
};


export const WeeklyMarketBriefing: React.FC = () => {
    const [briefing, setBriefing] = useState<BriefingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [year, week] = getWeekNumber(new Date());
    const docId = `${year}-${week}`;

    useEffect(() => {
        setIsLoading(true);
        const docRef = doc(db, "weeklyContent", docId);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setBriefing(docSnap.data() as BriefingData);
            } else {
                console.log("Weekly briefing document does not exist yet.");
                setBriefing(null);
            }
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching weekly briefing:", error);
            setIsLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [docId]);
    
    return (
        <div className="p-6 bg-[--color-dark-matter] border border-[--color-border] rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                    <MagnifyingGlassChartIcon className="w-6 h-6 mr-2 text-cyan-400" />
                    Weekly Market Briefing
                </h3>
            </div>
            
            {isLoading && <div className="text-center py-10"><LoadingSpinner /><p className="mt-2 text-sm text-slate-400">Fetching this week's briefing...</p></div>}
            
            {!isLoading && !briefing && (
                <div className="text-center py-10">
                    <p className="text-sm text-slate-400">This week's briefing is not yet available.</p>
                    <p className="text-xs text-slate-500 mt-1">It is automatically published every Monday at 06:00 UTC.</p>
                </div>
            )}
            
            {briefing && !isLoading && (
                <div className="space-y-4 animate-[fade-in_0.5s]">
                    <h4 className="text-xl font-semibold text-white">{briefing.title}</h4>
                    <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                      <FormattedContent text={briefing.content} />
                    </div>
                </div>
            )}
             <style>{`@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};
