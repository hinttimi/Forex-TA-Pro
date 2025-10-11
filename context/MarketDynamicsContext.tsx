import React, { createContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { useApiKey } from '../hooks/useApiKey';
import { 
    generateMarketDynamicsData
} from '../services/geminiService';
import { 
    CurrencyStrengthData, 
    VolatilityData, 
    MarketSentimentData,
    TopMoverData
} from '../types';

interface MarketDynamicsData {
    strength: CurrencyStrengthData | null;
    volatility: VolatilityData[];
    topMovers: TopMoverData[];
    sentiment: MarketSentimentData | null;
}

interface MarketDynamicsLoadingState {
    strength: boolean;
    volatility: boolean;
    topMovers: boolean;
    sentiment: boolean;
}

interface MarketDynamicsErrorState {
    strength: string | null;
    volatility: string | null;
    topMovers: string | null;
    sentiment: string | null;
}

interface MarketDynamicsContextType {
    data: MarketDynamicsData;
    loading: MarketDynamicsLoadingState;
    errors: MarketDynamicsErrorState;
    refreshAll: () => void;
}

export const MarketDynamicsContext = createContext<MarketDynamicsContextType | undefined>(undefined);

const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

export const MarketDynamicsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { apiKey } = useApiKey();
    
    const [data, setData] = useState<MarketDynamicsData>({
        strength: null,
        volatility: [],
        topMovers: [],
        sentiment: null,
    });
    
    const [loading, setLoading] = useState<MarketDynamicsLoadingState>({
        strength: false,
        volatility: false,
        topMovers: false,
        sentiment: false,
    });

    const [errors, setErrors] = useState<MarketDynamicsErrorState>({
        strength: null,
        volatility: null,
        topMovers: null,
        sentiment: null,
    });

    const fetchAllData = useCallback(async () => {
        if (!apiKey) {
            return;
        }

        setLoading({ strength: true, volatility: true, topMovers: true, sentiment: true });
        setErrors({ strength: null, volatility: null, topMovers: null, sentiment: null });

        try {
            const result = await generateMarketDynamicsData(apiKey);
            setData({
                strength: result.strength,
                volatility: result.volatility,
                topMovers: result.topMovers,
                sentiment: result.sentiment,
            });
        } catch (e) {
            console.error("Failed to fetch market dynamics data:", e);
            const errorMsg = e instanceof Error ? e.message : "Failed to load market data.";
            setErrors({
                strength: errorMsg,
                volatility: errorMsg,
                topMovers: errorMsg,
                sentiment: errorMsg,
            });
        } finally {
            setLoading({ strength: false, volatility: false, topMovers: false, sentiment: false });
        }
    }, [apiKey]);
    
    // Initial fetch when API key is available
    useEffect(() => {
        // Only fetch if no data exists yet, to avoid re-fetching on every app re-render
        if (apiKey && !data.strength && data.volatility.length === 0 && data.topMovers.length === 0 && !data.sentiment) {
            fetchAllData();
        }
    }, [apiKey, data, fetchAllData]);

    // Auto-refresh interval
    useEffect(() => {
        if (!apiKey) return;
        const intervalId = setInterval(fetchAllData, REFRESH_INTERVAL);
        return () => clearInterval(intervalId);
    }, [apiKey, fetchAllData]);
    
    const value = useMemo(() => ({
        data,
        loading,
        errors,
        refreshAll: fetchAllData
    }), [data, loading, errors, fetchAllData]);

    return (
        <MarketDynamicsContext.Provider value={value}>
            {children}
        </MarketDynamicsContext.Provider>
    );
};