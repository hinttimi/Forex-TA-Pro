import React from 'react';
import { LoadingSpinner } from '../LoadingSpinner';
import { ArrowPathIcon } from '../icons/ArrowPathIcon';
import { useMarketDynamics } from '../../hooks/useMarketDynamics';
import { useApiKey } from '../../hooks/useApiKey';

export const VolatilityMonitor: React.FC = () => {
    const { data, loading, errors, refreshAll } = useMarketDynamics();
    const { openKeyModal } = useApiKey();

    const sortedData = data.volatility ? [...data.volatility].sort((a, b) => b.volatility - a.volatility) : [];

    const getBarColor = (value: number) => {
        if (value >= 8) return 'bg-red-500';
        if (value >= 6) return 'bg-orange-500';
        if (value >= 4) return 'bg-yellow-500';
        return 'bg-sky-500';
    };

    const renderContent = () => {
        if (loading.volatility) {
            return <div className="flex justify-center items-center h-full min-h-[16rem]"><LoadingSpinner /></div>;
        }
        if (errors.volatility) {
            return (
                 <div className="flex flex-col justify-center items-center h-full min-h-[16rem] text-center">
                    <p className="text-sm text-red-400">{errors.volatility}</p>
                    <button onClick={openKeyModal} className="mt-2 text-xs text-cyan-400 underline">Check API Key</button>
                </div>
            );
        }
        if (data.volatility.length > 0) {
            return (
                <div className="space-y-3">
                    {sortedData.map(({ pair, volatility }) => (
                         <div key={pair} className="flex items-center gap-2 text-sm">
                            <span className="w-20 font-bold text-slate-300">{pair}</span>
                            <div className="flex-1 bg-slate-700 rounded-full h-5">
                                <div className={`h-5 rounded-full ${getBarColor(volatility)} transition-all duration-500 flex items-center justify-center text-xs font-bold text-white/80`} style={{ width: `${volatility * 10}%` }}>
                                    {volatility.toFixed(1)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };


    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 h-full">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold text-white">Volatility Monitor</h3>
                 <button onClick={refreshAll} disabled={loading.volatility} className="p-1 text-slate-400 hover:text-white disabled:text-slate-600"><ArrowPathIcon className={`w-4 h-4 ${loading.volatility ? 'animate-spin' : ''}`} /></button>
            </div>
            {renderContent()}
        </div>
    );
};