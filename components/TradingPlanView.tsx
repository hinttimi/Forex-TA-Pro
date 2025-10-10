import React, { useState, useEffect } from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

const TRADING_PLAN_KEY = 'userTradingPlan';

interface TradingPlan {
    strategy: string;
    riskManagement: string;
    marketConditions: string;
}

export const TradingPlanView: React.FC = () => {
    const [plan, setPlan] = useState<TradingPlan>({
        strategy: '',
        riskManagement: '',
        marketConditions: '',
    });
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        try {
            const savedPlan = localStorage.getItem(TRADING_PLAN_KEY);
            if (savedPlan) {
                setPlan(JSON.parse(savedPlan));
            }
        } catch (error) {
            console.error('Failed to load trading plan from localStorage', error);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPlan(prev => ({ ...prev, [name]: value }));
    };

    const handleSavePlan = () => {
        try {
            localStorage.setItem(TRADING_PLAN_KEY, JSON.stringify(plan));
            setIsSaved(true);
            const timer = setTimeout(() => setIsSaved(false), 3000);
            return () => clearTimeout(timer);
        } catch (error) {
            console.error('Failed to save trading plan to localStorage', error);
            alert('Could not save your plan. Local storage might be full or disabled.');
        }
    };

    const formFields = [
        { name: 'strategy', label: 'My Trading Strategy', placeholder: 'e.g., "I will trade SMC setups on the 15M timeframe, focusing on liquidity sweeps followed by a CHoCH. I will look for entries within unmitigated order blocks or FVGs that are in a premium/discount zone..."' },
        { name: 'riskManagement', label: 'My Risk Management Rules', placeholder: 'e.g., "1. I will risk a maximum of 1% of my account per trade. 2. I will not take more than 2 losses in a single day. 3. My minimum Risk-to-Reward ratio for any setup is 1:3..."' },
        { name: 'marketConditions', label: 'Market Conditions I Will Trade (and Avoid)', placeholder: 'e.g., "I will primarily trade the London and New York sessions. I will avoid trading during major news events like FOMC or NFP. I will only trade pairs that show clear directional bias on the 4H timeframe..."' },
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-extrabold text-[--color-ghost-white] mb-2 tracking-tight">My Trading Plan</h1>
            <p className="text-[--color-muted-grey] mb-8">A well-defined plan is the cornerstone of disciplined trading. Document your rules here to stay consistent and accountable.</p>
            
            <div className="space-y-8">
                {formFields.map(field => (
                    <div key={field.name}>
                        <label htmlFor={field.name} className="block text-lg font-semibold text-[--color-ghost-white]/90 mb-2">{field.label}</label>
                        <textarea
                            id={field.name}
                            name={field.name}
                            value={plan[field.name as keyof TradingPlan]}
                            onChange={handleInputChange}
                            placeholder={field.placeholder}
                            rows={8}
                            className="w-full p-4 bg-[--color-dark-matter]/50 border-2 border-[--color-border] rounded-lg text-[--color-ghost-white]/80 focus:ring-2 focus:ring-[--color-neural-blue] focus:border-[--color-neural-blue] transition-colors duration-200 resize-y"
                        />
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-end items-center">
                {isSaved && (
                    <div className="flex items-center text-[--color-signal-green] mr-4 animate-[fade-in_0.5s]">
                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                        <span>Plan saved successfully!</span>
                    </div>
                )}
                <button
                    onClick={handleSavePlan}
                    className="px-6 py-3 bg-[--color-neural-blue] text-[--color-obsidian-slate] font-semibold rounded-lg shadow-md hover:bg-[--color-neural-blue]/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[--color-obsidian-slate] focus:ring-[--color-neural-blue] transition-all duration-200"
                >
                    Save My Plan
                </button>
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
