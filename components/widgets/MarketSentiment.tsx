import React from 'react';
import { LoadingSpinner } from '../LoadingSpinner';
import { ArrowPathIcon } from '../icons/ArrowPathIcon';
import { useMarketDynamics } from '../../hooks/useMarketDynamics';
import { useApiKey } from '../../hooks/useApiKey';

// Gauge component
const SentimentGauge: React.FC<{ score: number }> = ({ score }) => {
    const rotation = -90 + (score * 18); // score 0-10 -> 0-180 degrees
    
    const color = score >= 7 ? '#22c55e' // green-500
                : score >= 4 ? '#eab308' // yellow-500
                : '#ef4444'; // red-500

    return (
        <div className="relative w-48 h-24 mx-auto">
            {/* Background Arc */}
            <svg viewBox="0 0 100 50" className="w-full h-full">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#374151" strokeWidth="8" strokeLinecap="round" />
            </svg>
            {/* Foreground Arc */}
            <svg viewBox="0 0 100 50" className="w-full h-full absolute top-0 left-0 transition-all duration-700" style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '50% 100%' }}>
                <path d="M 50 50 L 50 10" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
            </svg>

            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                 <span className="text-2xl font-bold text-white">{score.toFixed(1)}</span>
                 <div className="w-4 h-4 bg-slate-800 rounded-full border-2 border-slate-500 absolute -bottom-2 left-1/2 -translate-x-1/2"></div>
            </div>
             <div className="absolute bottom-0 left-0 text-xs text-slate-500">Risk-Off</div>
             <div className="absolute bottom-0 right-0 text-xs text-slate-500">Risk-On</div>
        </div>
    );
};


export const MarketSentiment: React.FC = () => {
    const { data, loading, errors, refreshAll } = useMarketDynamics();
    const { openKeyModal } = useApiKey();

    const sentiment = data.sentiment;
    
    const sentimentColor = sentiment?.sentiment === 'Risk On' ? 'text-green-400' 
                         : sentiment?.sentiment === 'Risk Off' ? 'text-red-400'
                         : sentiment?.sentiment === 'Neutral' ? 'text-yellow-400'
                         : 'text-slate-400';

    const renderContent = () => {
        if (loading.sentiment) {
            return <div className="flex justify-center items-center h-full min-h-[16rem]"><LoadingSpinner /></div>;
        }
        if (errors.sentiment) {
            return (
                <div className="flex flex-col justify-center items-center h-full min-h-[16rem] text-center">
                    <p className="text-sm text-red-400">{errors.sentiment}</p>
                    <button onClick={openKeyModal} className="mt-2 text-xs text-cyan-400 underline">Check API Key</button>
                </div>
            );
        }
        if (sentiment) {
            return (
                <div className="text-center flex flex-col justify-center h-full">
                    <SentimentGauge score={sentiment.score} />
                    <p className={`text-2xl font-bold mt-3 ${sentimentColor}`}>{sentiment.sentiment}</p>
                    <p className="text-sm text-slate-400 mt-2 px-2">{sentiment.reasoning}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 h-full">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold text-white">Market Sentiment</h3>
                <button onClick={refreshAll} disabled={loading.sentiment} className="p-1 text-slate-400 hover:text-white disabled:text-slate-600">
                    <ArrowPathIcon className={`w-4 h-4 ${loading.sentiment ? 'animate-spin' : ''}`} />
                </button>
            </div>
            {renderContent()}
        </div>
    );
};