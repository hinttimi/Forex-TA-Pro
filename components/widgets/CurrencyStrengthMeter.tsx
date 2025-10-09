import React from 'react';
import { LoadingSpinner } from '../LoadingSpinner';
import { ArrowPathIcon } from '../icons/ArrowPathIcon';
import { useMarketDynamics } from '../../hooks/useMarketDynamics';
import { useApiKey } from '../../hooks/useApiKey';

export const CurrencyStrengthMeter: React.FC = () => {
    const { data, loading, errors, refreshAll } = useMarketDynamics();
    const { openKeyModal } = useApiKey();

    const sortedData = data.strength ? (Object.entries(data.strength) as [string, number][]).sort((a, b) => b[1] - a[1]) : [];

    const getBarColor = (value: number) => {
        if (value >= 7) return 'bg-green-400';
        if (value >= 5) return 'bg-green-600';
        if (value >= 3) return 'bg-yellow-600';
        return 'bg-red-600';
    };
    
    const renderContent = () => {
        if (loading.strength) {
            return <div className="flex justify-center items-center h-full min-h-[16rem]"><LoadingSpinner /></div>;
        }
        if (errors.strength) {
            return (
                <div className="flex flex-col justify-center items-center h-full min-h-[16rem] text-center">
                    <p className="text-sm text-red-400">{errors.strength}</p>
                    <button onClick={openKeyModal} className="mt-2 text-xs text-cyan-400 underline">Check API Key</button>
                </div>
            );
        }
        if (data.strength) {
            return (
                 <div className="space-y-3">
                    {sortedData.map(([currency, value]) => (
                        <div key={currency} className="flex items-center gap-3 text-sm">
                            <span className="w-10 font-bold text-slate-300">{currency}</span>
                            <div className="flex-1 bg-slate-700 rounded-full h-6">
                                <div 
                                    className={`h-6 rounded-full ${getBarColor(value)} transition-all duration-500`}
                                    style={{ width: value > 0 ? `${value * 10}%` : '0%' }}
                                />
                            </div>
                             <span className="w-10 text-right font-mono text-slate-300">{value.toFixed(1)}</span>
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
                <h3 className="text-base font-semibold text-white">Currency Strength</h3>
                <button onClick={refreshAll} disabled={loading.strength} className="p-1 text-slate-400 hover:text-white disabled:text-slate-600">
                    <ArrowPathIcon className={`w-4 h-4 ${loading.strength ? 'animate-spin' : ''}`} />
                </button>
            </div>
            {renderContent()}
        </div>
    );
};