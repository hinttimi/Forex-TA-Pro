import React, { createContext, useState, useCallback, useMemo, ReactNode, useRef } from 'react';
import { useInterval } from '../hooks/useInterval';
import { getRealtimePriceWithSearch } from '../services/geminiService';
import { useApiKey } from '../hooks/useApiKey';
import { MarketDataManager } from '../services/marketDataService';

const MAX_DATA_POINTS = 100;

const TIMEFRAME_CONFIG = {
    '1m': { interval: 2000, volatility: 1 },
    '5m': { interval: 5000, volatility: 2.2 }, // sqrt(5)
    '15m': { interval: 8000, volatility: 3.8 }, // sqrt(15)
    '1h': { interval: 12000, volatility: 7.7 }, // sqrt(60)
};
export type Timeframe = keyof typeof TIMEFRAME_CONFIG;
export const TIMEFRAMES = Object.keys(TIMEFRAME_CONFIG) as Timeframe[];

export interface Shape {
    id: number;
    type: 'trendline' | 'horizontal';
    points: { x: number; y: number }[];
}

const INITIAL_PRICES: { [key: string]: number } = {
    'EUR/USD': 1.07350, 'GBP/USD': 1.25420, 'USD/JPY': 157.150, 'USD/CAD': 1.37200,
    'AUD/USD': 0.66500, 'NZD/USD': 0.61450, 'USD/CHF': 0.91500, 'XAU/USD': 2350.50,
};

interface LiveSimulatorContextType {
    simulationData: Record<string, number[]>;
    currentPair: string;
    isSimulating: boolean;
    isLoadingInitialPrice: boolean;
    error: string | null;
    timeframe: Timeframe;
    shapes: Shape[];
    selectPair: (pair: string) => void;
    toggleSimulation: () => void;
    resetSimulation: (pair: string) => void;
    selectTimeframe: (timeframe: Timeframe) => void;
    addShape: (shape: Shape) => void;
    clearShapes: () => void;
}

export const LiveSimulatorContext = createContext<LiveSimulatorContextType | undefined>(undefined);

export const LiveSimulatorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [simulationData, setSimulationData] = useState<Record<string, number[]>>({});
    const [currentPair, setCurrentPair] = useState<string>('EUR/USD');
    const [isSimulating, setIsSimulating] = useState<boolean>(false);
    const [isLoadingInitialPrice, setIsLoadingInitialPrice] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [timeframe, setTimeframe] = useState<Timeframe>('1m');
    const [shapes, setShapes] = useState<Record<string, Shape[]>>({});
    
    const { apiKey } = useApiKey();

    const lastPriceRef = useRef<Record<string, number>>({});
    const lastDirectionRef = useRef<Record<string, number>>({});
    
    const getShapesKey = useCallback((pair: string, tf: Timeframe) => `${pair}-${tf}`, []);

    const generateInitialData = useCallback((pair: string, startPrice: number) => {
        let history: number[] = [];
        let currentPrice = startPrice;
        for (let i = 0; i < 30; i++) {
            const isJpyOrGold = pair.includes('JPY') || pair.includes('XAU');
            const volatility = isJpyOrGold ? 0.5 : 0.0001;
            const move = (Math.random() - 0.48) * volatility;
            currentPrice += move;
            history.push(currentPrice);
        }
        lastPriceRef.current[pair] = history[history.length - 1];
        lastDirectionRef.current[pair] = 1;
        setSimulationData(prev => ({ ...prev, [pair]: history }));
    }, []);

    const selectPair = useCallback(async (pair: string) => {
        setIsSimulating(false);
        setCurrentPair(pair);
        if ((!simulationData[pair] || simulationData[pair].length === 0)) {
            setIsLoadingInitialPrice(true);
            setError(null);
            try {
                let price: number;
                try {
                    // Prioritize user-provided market data keys
                    const priceData = await MarketDataManager.getRealtimeForexPrice(pair);
                    price = priceData.price;
                    console.log(`Fetched initial price for ${pair} using a user-provided market data key.`);
                } catch (e) {
                    console.warn("Could not fetch price with user-provided keys, falling back to Gemini search.", e);
                    // Fallback to Gemini search if user keys fail or are not present
                    if (!apiKey) {
                        throw new Error(`A valid Gemini API key is required to fetch the live price and start the simulation.`);
                    }
                    price = await getRealtimePriceWithSearch(apiKey, pair);
                }
                generateInitialData(pair, price);
            } catch (e) {
                console.error(`Could not fetch real-time price for ${pair}.`, e);
                const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
                setError(`Could not fetch live price for ${pair}. ${errorMessage}`);
            } finally {
                setIsLoadingInitialPrice(false);
            }
        }
    }, [simulationData, generateInitialData, apiKey]);
    
    const selectTimeframe = useCallback((newTimeframe: Timeframe) => {
        setIsSimulating(false);
        setTimeframe(newTimeframe);
    }, []);

    const resetSimulation = useCallback((pair: string) => {
        setIsSimulating(false);
        setSimulationData(prev => ({ ...prev, [pair]: [] }));
        const shapesKey = getShapesKey(pair, timeframe);
        setShapes(prev => ({...prev, [shapesKey]: [] }));
        selectPair(pair);
    }, [selectPair, timeframe, getShapesKey]);

    const toggleSimulation = () => {
        if (error) return;
        setIsSimulating(prev => !prev);
    };

    const addShape = (shape: Shape) => {
        const key = getShapesKey(currentPair, timeframe);
        setShapes(prev => ({...prev, [key]: [...(prev[key] || []), shape] }));
    };

    const clearShapes = () => {
        const key = getShapesKey(currentPair, timeframe);
        setShapes(prev => ({ ...prev, [key]: [] }));
    };

    const simulatePriceTick = useCallback(() => {
        const pair = currentPair;
        if (!simulationData[pair]) return;

        const lastPrice = lastPriceRef.current[pair] || simulationData[pair][simulationData[pair].length - 1];
        const isJpyOrGold = pair.includes('JPY') || pair.includes('XAU');
        const baseVolatility = isJpyOrGold ? 0.05 : 0.00005;
        const timeframeVolatility = TIMEFRAME_CONFIG[timeframe].volatility;
        const volatility = baseVolatility * timeframeVolatility;
        
        const meanReversionFactor = 0.1;
        const lastDirection = lastDirectionRef.current[pair] || 1;

        const move = (Math.random() - 0.5 + (lastDirection * 0.2)) * volatility * 2;
        lastDirectionRef.current[pair] = move > 0 ? 1 : -1;
        
        const history = simulationData[pair];
        const mean = history.length > 0 ? history.reduce((a, b) => a + b, 0) / history.length : lastPrice;
        const reversion = (mean - lastPrice) * meanReversionFactor * Math.random() * volatility;
        
        let newPrice = lastPrice + move + reversion;

        if (newPrice <= 0) newPrice = lastPrice * 0.99;

        lastPriceRef.current[pair] = newPrice;
        setSimulationData(prev => ({
            ...prev,
            [pair]: [...(prev[pair] || []).slice(-MAX_DATA_POINTS + 1), newPrice]
        }));
    }, [currentPair, simulationData, timeframe]);
    
    useInterval(simulatePriceTick, isSimulating ? TIMEFRAME_CONFIG[timeframe].interval : null);
    
    const currentShapes = shapes[getShapesKey(currentPair, timeframe)] || [];

    const value = useMemo(() => ({
        simulationData,
        currentPair,
        isSimulating,
        isLoadingInitialPrice,
        error,
        timeframe,
        shapes: currentShapes,
        selectPair,
        toggleSimulation,
        resetSimulation,
        selectTimeframe,
        addShape,
        clearShapes,
    }), [simulationData, currentPair, isSimulating, isLoadingInitialPrice, error, timeframe, currentShapes, selectPair, toggleSimulation, resetSimulation, selectTimeframe]);

    return (
        <LiveSimulatorContext.Provider value={value}>
            {children}
        </LiveSimulatorContext.Provider>
    );
};