import React from 'react';
import { LoadingSpinner } from '../LoadingSpinner';
import { ArrowPathIcon } from '../icons/ArrowPathIcon';
import { useMarketDynamics } from '../../hooks/useMarketDynamics';
import { useApiKey } from '../../hooks/useApiKey';

const ArrowTrendingUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
);

const ArrowTrendingDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
    </svg>
);


export const TopMoversWidget: React.FC = () => {
    const { data, loading, errors, refreshAll } = useMarketDynamics();
    const { openKeyModal } = useApiKey();

    const movers = data.topMovers || [];
    const gainers = movers.filter(m => m.change_pct > 0).sort((a,b) => b.change_pct - a.change_pct);
    const losers = movers.filter(m => m.change_pct < 0).sort((a,b) => a.change_pct - b.change_pct);

    const renderContent = () => {
        if (loading.topMovers) {
            return <div className="flex justify-center items-center h-full min-h-[16rem]"><LoadingSpinner /></div>;
        }
        if (errors.topMovers) {
            return (
                <div className="flex flex-col justify-center items-center h-full min-h-[16rem] text-center">
                    <p className="text-sm text-[--color-warning-red]">{errors.topMovers}</p>
                    <button onClick={openKeyModal} className="mt-2 text-xs text-[--color-neural-blue] underline">Check API Key</button>
                </div>
            );
        }
        if (movers.length > 0) {
            return (
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-sm font-semibold text-[--color-signal-green] mb-2 flex items-center"><ArrowTrendingUpIcon className="w-4 h-4 mr-1.5"/> Top Gainers</h4>
                        <div className="space-y-2">
                            {gainers.map(g => (
                                <div key={g.pair} className="flex justify-between items-center text-sm bg-[--color-signal-green]/10 p-2 rounded-md">
                                    <span className="font-bold text-[--color-ghost-white]/90">{g.pair}</span>
                                    <span className="font-mono text-[--color-signal-green]">+{g.change_pct.toFixed(2)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h4 className="text-sm font-semibold text-[--color-warning-red] mb-2 flex items-center"><ArrowTrendingDownIcon className="w-4 h-4 mr-1.5"/> Top Losers</h4>
                         <div className="space-y-2">
                            {losers.map(l => (
                                <div key={l.pair} className="flex justify-between items-center text-sm bg-[--color-warning-red]/10 p-2 rounded-md">
                                    <span className="font-bold text-[--color-ghost-white]/90">{l.pair}</span>
                                    <span className="font-mono text-[--color-warning-red]">{l.change_pct.toFixed(2)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-[--color-dark-matter]/50 border border-[--color-border] rounded-lg p-4 h-full">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold text-[--color-ghost-white]">Top Movers (4H)</h3>
                <button onClick={refreshAll} disabled={loading.topMovers} className="p-1 text-[--color-muted-grey] hover:text-[--color-ghost-white] disabled:text-[--color-border]">
                    <ArrowPathIcon className={`w-4 h-4 ${loading.topMovers ? 'animate-spin' : ''}`} />
                </button>
            </div>
            {renderContent()}
        </div>
    );
};