import React from 'react';
import { LoadingSpinner } from '../LoadingSpinner';
import { ArrowPathIcon } from '../icons/ArrowPathIcon';
import { useMarketDynamics } from '../../hooks/useMarketDynamics';
import { useApiKey } from '../../hooks/useApiKey';

const getCellColor = (value: number) => {
    if (value >= 0.7) return 'bg-green-500/80';
    if (value >= 0.4) return 'bg-green-600/60';
    if (value <= -0.7) return 'bg-red-500/80';
    if (value <= -0.4) return 'bg-red-600/60';
    return 'bg-slate-700/50';
};

export const CorrelationMatrix: React.FC = () => {
    const { data, loading, errors, refreshAll } = useMarketDynamics();
    const { openKeyModal } = useApiKey();

    const matrixData = data.correlation;
    const pairs = matrixData ? Object.keys(matrixData) : [];

    const renderContent = () => {
        if (loading.correlation) {
            return <div className="flex justify-center items-center h-full min-h-[16rem]"><LoadingSpinner /></div>;
        }
        if (errors.correlation) {
            return (
                 <div className="flex flex-col justify-center items-center h-full min-h-[16rem] text-center">
                    <p className="text-sm text-red-400">{errors.correlation}</p>
                    <button onClick={openKeyModal} className="mt-2 text-xs text-cyan-400 underline">Check API Key</button>
                </div>
            );
        }
        if (matrixData) {
            return (
                 <div className="overflow-x-auto">
                    <table className="w-full text-center text-xs">
                        <thead>
                            <tr>
                                <th className="p-1 sticky left-0 bg-slate-800 z-10"></th>
                                {pairs.map(p => <th key={p} className="p-1 text-slate-400 font-normal whitespace-nowrap">{p}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {pairs.map((rowPair, rowIndex) => (
                                <tr key={rowPair}>
                                    <th className="p-1 text-slate-400 font-normal sticky left-0 bg-slate-800 z-10 whitespace-nowrap">{rowPair}</th>
                                    {pairs.map((colPair, colIndex) => {
                                        if (colIndex < rowIndex) {
                                            return <td key={colPair} className="p-1"><div className="w-full rounded h-8 bg-slate-800/50"></div></td>; // Empty cell for lower triangle
                                        }
                                        const value = matrixData[rowPair]?.[colPair] ?? matrixData[colPair]?.[rowPair] ?? 0;
                                        return (
                                            <td key={colPair} className="p-1">
                                                <div className={`w-full rounded h-8 flex items-center justify-center font-mono ${getCellColor(value)} ${Math.abs(value) > 0.4 ? 'text-white' : 'text-slate-400'}`}>
                                                    {value.toFixed(2)}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
        return null;
    }

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 h-full">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold text-white">Correlation Matrix</h3>
                <button onClick={refreshAll} disabled={loading.correlation} className="p-1 text-slate-400 hover:text-white disabled:text-slate-600">
                    <ArrowPathIcon className={`w-4 h-4 ${loading.correlation ? 'animate-spin' : ''}`} />
                </button>
            </div>
            {renderContent()}
        </div>
    );
};