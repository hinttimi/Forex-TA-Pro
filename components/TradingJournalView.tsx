import React, { useState, useEffect } from 'react';
import { TradeLog, TradeOutcome, EmotionalState } from '../types';
import { ClipboardDocumentListIcon } from './icons/ClipboardDocumentListIcon';
import { PlusIcon } from './icons/PlusIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { TrashIcon } from './icons/TrashIcon';
import { useCompletion } from '../hooks/useCompletion';

const TRADING_JOURNAL_KEY = 'tradingJournalEntries';

const MAJOR_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CAD', 'AUD/USD', 'NZD/USD', 'USD/CHF', 'XAU/USD', 'Other'];
const OUTCOMES: TradeOutcome[] = ['Win', 'Loss', 'Break-Even'];
const EMOTIONS: EmotionalState[] = ['Patient', 'Confident', 'Anxious', 'FOMO', 'Greedy', 'Hesitant', 'Revenge Trading'];

const initialTradeState: Omit<TradeLog, 'id'> = {
    date: new Date().toISOString().split('T')[0],
    pair: 'EUR/USD',
    direction: 'Buy',
    outcome: 'Win',
    rr: 2,
    setup: '',
    emotion: 'Patient',
    notes: '',
};

export const TradingJournalView: React.FC = () => {
    const [entries, setEntries] = useState<TradeLog[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTrade, setEditingTrade] = useState<Omit<TradeLog, 'id'> | TradeLog>(initialTradeState);
    const [filter, setFilter] = useState<'all' | TradeOutcome>('all');
    const { logTradeLogged } = useCompletion();

    useEffect(() => {
        try {
            const savedEntries = localStorage.getItem(TRADING_JOURNAL_KEY);
            if (savedEntries) {
                setEntries(JSON.parse(savedEntries));
            }
        } catch (error) {
            console.error('Failed to load journal entries from localStorage', error);
        }
    }, []);

    const saveEntries = (updatedEntries: TradeLog[]) => {
        setEntries(updatedEntries);
        localStorage.setItem(TRADING_JOURNAL_KEY, JSON.stringify(updatedEntries));
    };

    const handleOpenModal = (trade: TradeLog | null = null) => {
        if (trade) {
            setEditingTrade(trade);
        } else {
            setEditingTrade(initialTradeState);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSaveTrade = (e: React.FormEvent) => {
        e.preventDefault();
        if ('id' in editingTrade) { // Update existing trade
            const updatedEntries = entries.map(entry => entry.id === editingTrade.id ? editingTrade : entry);
            saveEntries(updatedEntries);
        } else { // Add new trade
            const newTrade = { ...editingTrade, id: Date.now() };
            const updatedEntries = [newTrade, ...entries];
            saveEntries(updatedEntries);
            logTradeLogged();
        }
        handleCloseModal();
    };

    const handleDeleteTrade = (id: number) => {
        if (window.confirm('Are you sure you want to delete this trade log?')) {
            const updatedEntries = entries.filter(entry => entry.id !== id);
            saveEntries(updatedEntries);
        }
    };
    
    const outcomeColorClass = (outcome: TradeOutcome) => {
        return {
            'Win': 'bg-green-500/10 text-green-400 border-green-500/20',
            'Loss': 'bg-red-500/10 text-red-400 border-red-500/20',
            'Break-Even': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        }[outcome];
    };

    const filteredEntries = filter === 'all' ? entries : entries.filter(e => e.outcome === filter);

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">Trading Journal</h1>
                    <p className="text-[--color-muted-grey] mt-1">Log your trades to analyze performance and master your psychology.</p>
                </div>
                <button onClick={() => handleOpenModal()} className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-cyan-500 text-slate-900 font-semibold rounded-lg shadow-md hover:bg-cyan-400">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Log New Trade
                </button>
            </div>

            {entries.length > 0 && (
                <div className="mb-4 flex items-center space-x-2">
                    <span className="text-sm font-medium text-[--color-muted-grey]">Filter by outcome:</span>
                    {(['all', ...OUTCOMES] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-xs font-semibold rounded-full ${filter === f ? 'bg-cyan-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                            {f}
                        </button>
                    ))}
                </div>
            )}
            
            {filteredEntries.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl">
                    <ClipboardDocumentListIcon className="w-16 h-16 mx-auto text-slate-500 mb-4" />
                    <h2 className="text-2xl font-bold text-white">Your Journal is Empty</h2>
                    <p className="text-slate-400 mt-2 max-w-md mx-auto">Click "Log New Trade" to add your first entry and start tracking your journey.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredEntries.map(entry => (
                        <div key={entry.id} className="bg-slate-800/70 border border-slate-700 rounded-lg p-4 animate-[fade-in_0.3s]">
                           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <span className={`px-3 py-1 rounded-full text-sm font-bold border ${outcomeColorClass(entry.outcome)}`}>{entry.outcome}</span>
                                    <h3 className="text-xl font-bold text-white">{entry.pair} - {entry.direction}</h3>
                                    <span className="text-sm text-[--color-muted-grey]">{new Date(entry.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-3 sm:mt-0">
                                    <button onClick={() => handleOpenModal(entry)} className="text-sm font-semibold text-cyan-400 hover:underline">Edit</button>
                                    <button onClick={() => handleDeleteTrade(entry.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-full"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                           </div>
                           <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2 text-sm">
                                <p><strong className="text-gray-300">Setup:</strong> <span className="text-[--color-muted-grey]">{entry.setup}</span></p>
                                <p><strong className="text-gray-300">Emotion:</strong> <span className="text-[--color-muted-grey]">{entry.emotion}</span></p>
                                {entry.notes && <p><strong className="text-gray-300">Notes:</strong> <span className="text-[--color-muted-grey]">{entry.notes}</span></p>}
                           </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s]" onClick={handleCloseModal}>
                    <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">{'id' in editingTrade ? 'Edit' : 'Log'} Trade</h2>
                            <button onClick={handleCloseModal}><XMarkIcon className="w-6 h-6 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleSaveTrade} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                            {/* Form fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
                                    <input type="date" value={editingTrade.date} onChange={e => setEditingTrade(p => ({...p, date: e.target.value}))} required className="input-field"/>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Pair</label>
                                    <select value={editingTrade.pair} onChange={e => setEditingTrade(p => ({...p, pair: e.target.value}))} required className="input-field">
                                        {MAJOR_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Direction</label>
                                    <select value={editingTrade.direction} onChange={e => setEditingTrade(p => ({...p, direction: e.target.value as 'Buy' | 'Sell'}))} required className="input-field">
                                        <option value="Buy">Buy</option>
                                        <option value="Sell">Sell</option>
                                    </select>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Outcome</label>
                                    <select value={editingTrade.outcome} onChange={e => setEditingTrade(p => ({...p, outcome: e.target.value as TradeOutcome}))} required className="input-field">
                                        {OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Risk/Reward (R)</label>
                                    <input type="number" step="0.1" value={editingTrade.rr} onChange={e => setEditingTrade(p => ({...p, rr: parseFloat(e.target.value)}))} required className="input-field"/>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Emotion</label>
                                    <select value={editingTrade.emotion} onChange={e => setEditingTrade(p => ({...p, emotion: e.target.value as EmotionalState}))} required className="input-field">
                                        {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Setup / Reason for Entry</label>
                                <textarea value={editingTrade.setup} onChange={e => setEditingTrade(p => ({...p, setup: e.target.value}))} rows={4} required className="input-field" placeholder="e.g., 15M CHoCH after 4H liquidity sweep, entered on FVG retest..."/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Notes / Mistakes (Optional)</label>
                                <textarea value={editingTrade.notes} onChange={e => setEditingTrade(p => ({...p, notes: e.target.value}))} rows={3} className="input-field" placeholder="e.g., Entered slightly too early, stop loss was too tight..."/>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="submit" className="px-5 py-2 bg-cyan-500 text-slate-900 font-semibold rounded-lg hover:bg-cyan-400">Save Trade</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
             <style>{`
                .input-field {
                    width: 100%;
                    background-color: #1e293b;
                    border: 1px solid #334155;
                    border-radius: 0.5rem;
                    padding: 0.75rem;
                    color: #e2e8f0;
                    font-size: 0.875rem;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .input-field:focus {
                    outline: none;
                    border-color: #22d3ee;
                    box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.3);
                }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
             `}</style>
        </div>
    );
};