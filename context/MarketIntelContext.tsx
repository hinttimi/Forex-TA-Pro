import React, { createContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { useApiKey } from '../hooks/useApiKey';
import { generateMarketPulse, getForexNews } from '../services/geminiService';
import { NewsArticle } from '../types';

interface MarketPulseState {
    content: string | null;
    lastUpdated: Date | null;
}

interface NewsFeedState {
    articles: NewsArticle[];
    sources: any[];
    lastUpdated: Date | null;
}

interface MarketIntelLoadingState {
    pulse: boolean;
    news: boolean;
}

interface MarketIntelErrorState {
    pulse: string | null;
    news: string | null;
}

interface MarketIntelContextType {
    pulse: MarketPulseState;
    news: NewsFeedState;
    loading: MarketIntelLoadingState;
    errors: MarketIntelErrorState;
    refreshPulse: () => void;
    refreshNews: () => void;
    refreshAll: () => void;
}

export const MarketIntelContext = createContext<MarketIntelContextType | undefined>(undefined);

const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

export const MarketIntelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { apiKey } = useApiKey();

    const [pulse, setPulse] = useState<MarketPulseState>({ content: null, lastUpdated: null });
    const [news, setNews] = useState<NewsFeedState>({ articles: [], sources: [], lastUpdated: null });

    const [loading, setLoading] = useState<MarketIntelLoadingState>({ pulse: false, news: false });
    const [errors, setErrors] = useState<MarketIntelErrorState>({ pulse: null, news: null });

    const refreshPulse = useCallback(async () => {
        if (!apiKey) return;
        setLoading(prev => ({ ...prev, pulse: true }));
        setErrors(prev => ({ ...prev, pulse: null }));
        try {
            const content = await generateMarketPulse(apiKey);
            setPulse({ content, lastUpdated: new Date() });
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Failed to load market pulse.";
            setErrors(prev => ({ ...prev, pulse: msg }));
        } finally {
            setLoading(prev => ({ ...prev, pulse: false }));
        }
    }, [apiKey]);

    const refreshNews = useCallback(async () => {
        if (!apiKey) return;
        setLoading(prev => ({ ...prev, news: true }));
        setErrors(prev => ({ ...prev, news: null }));
        try {
            const { articles, groundingChunks } = await getForexNews(apiKey);
            setNews({ articles, sources: groundingChunks, lastUpdated: new Date() });
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Failed to load news feed.";
            setErrors(prev => ({ ...prev, news: msg }));
        } finally {
            setLoading(prev => ({ ...prev, news: false }));
        }
    }, [apiKey]);

    const refreshAll = useCallback(() => {
        refreshPulse();
        refreshNews();
    }, [refreshPulse, refreshNews]);

    // Initial fetch when API key is available
    useEffect(() => {
        if (apiKey && !pulse.content && news.articles.length === 0) {
            refreshAll();
        }
    }, [apiKey, pulse.content, news.articles.length, refreshAll]);

    // Auto-refresh interval
    useEffect(() => {
        if (!apiKey) return;
        const intervalId = setInterval(refreshAll, REFRESH_INTERVAL);
        return () => clearInterval(intervalId);
    }, [apiKey, refreshAll]);

    const value = useMemo(() => ({
        pulse,
        news,
        loading,
        errors,
        refreshPulse,
        refreshNews,
        refreshAll,
    }), [pulse, news, loading, errors, refreshPulse, refreshNews, refreshAll]);

    return (
        <MarketIntelContext.Provider value={value}>
            {children}
        </MarketIntelContext.Provider>
    );
};
