import React, { createContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { useApiKey } from '../hooks/useApiKey';
import { 
    generateCurrencyStrengthData, 
    generateVolatilityData, 
    generateCorrelationData,
    generateMarketSentimentData
} from '../services/geminiService';
import { 
    CurrencyStrengthData, 
    VolatilityData, 
    CorrelationData,
    MarketSentimentData
} from '../types';

interface MarketDynamicsData {
    strength: CurrencyStrengthData | null;
    volatility: VolatilityData[];
    correlation: CorrelationData | null;
    sentiment: MarketSentimentData | null;
}

interface MarketDynamicsLoadingState {
    strength: boolean;
    volatility: boolean;
    correlation: boolean;
    sentiment: boolean;
}

interface MarketDynamicsErrorState {
    strength: string | null;
    volatility: string | null;
    correlation: string | null;
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
        correlation: null,
        sentiment: null,
    });
    
    const [loading, setLoading] = useState<MarketDynamicsLoadingState>({
        strength: false,
        volatility: false,
        correlation: false,
        sentiment: false,
    });

    const [errors, setErrors] = useState<MarketDynamicsErrorState>({
        strength: null,
        volatility: null,
        correlation: null,
        sentiment: null,
    });

    const fetchAllData = useCallback(async () => {
        if (!apiKey) {
            return;
        }

        setLoading({ strength: true, volatility: true, correlation: true, sentiment: true });
        setErrors({ strength: null, volatility: null, correlation: null, sentiment: null });

        const fetchStrength = async () => {
            try {
                const result = await generateCurrencyStrengthData(apiKey);
                setData(prev => ({ ...prev, strength: result }));
            } catch (e) {
                console.error("Failed to fetch currency strength:", e);
                setErrors(prev => ({ ...prev, strength: e instanceof Error ? e.message : "Failed to load." }));
            } finally {
                setLoading(prev => ({ ...prev, strength: false }));
            }
        };

        const fetchVolatility = async () => {
             try {
                const result = await generateVolatilityData(apiKey);
                setData(prev => ({ ...prev, volatility: result }));
            } catch (e) {
                console.error("Failed to fetch volatility:", e);
                setErrors(prev => ({ ...prev, volatility: e instanceof Error ? e.message : "Failed to load." }));
            } finally {
                setLoading(prev => ({ ...prev, volatility: false }));
            }
        };

        const fetchCorrelation = async () => {
             try {
                const result = await generateCorrelationData(apiKey);
                setData(prev => ({ ...prev, correlation: result }));
            } catch (e) {
                console.error("Failed to fetch correlation:", e);
                setErrors(prev => ({ ...prev, correlation: e instanceof Error ? e.message : "Failed to load." }));
            } finally {
                setLoading(prev => ({ ...prev, correlation: false }));
            }
        };

        const fetchSentiment = async () => {
             try {
                const result = await generateMarketSentimentData(apiKey);
                setData(prev => ({ ...prev, sentiment: result }));
            } catch (e) {
                console.error("Failed to fetch sentiment:", e);
                setErrors(prev => ({ ...prev, sentiment: e instanceof Error ? e.message : "Failed to load." }));
            } finally {
                setLoading(prev => ({ ...prev, sentiment: false }));
            }
        };

        // Run all fetches in parallel
        await Promise.all([fetchStrength(), fetchVolatility(), fetchCorrelation(), fetchSentiment()]);

    }, [apiKey]);
    
    // Initial fetch when API key is available
    useEffect(() => {
        // Only fetch if no data exists yet, to avoid re-fetching on every app re-render
        if (apiKey && !data.strength && data.volatility.length === 0 && !data.correlation && !data.sentiment) {
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