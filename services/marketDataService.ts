// --- LocalStorage Keys for User-Provided API Keys ---
const USER_TWELVE_DATA_API_KEY = 'user_twelve_data_api_key';
const USER_OPEN_EXCHANGE_RATES_API_KEY = 'user_open_exchange_rates_api_key';
const USER_FCSAPI_API_KEY = 'user_fcsapi_api_key';

/**
 * Retrieves an API key from localStorage.
 * @param storageKey The key to look for in localStorage.
 * @returns The user's key if available, otherwise null.
 */
const getApiKey = (storageKey: string): string | null => {
    try {
        return localStorage.getItem(storageKey);
    } catch {
        // In case localStorage is disabled (e.g., private browsing)
        return null;
    }
};


// --- Standardized Data Types ---
export interface OhlcData {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
}

export interface RealtimePrice {
    price: number;
    timestamp: number;
}


// --- Provider-Specific Adapters ---
// Each function is responsible for fetching from a single provider and standardizing its response.

const getPriceFromFcsapi = async (symbol: string): Promise<RealtimePrice> => {
    const apiKey = getApiKey(USER_FCSAPI_API_KEY);
    if (!apiKey) throw new Error("FCSAPI API key is not configured.");
    
    const url = `https://fcsapi.com/api-v3/forex/latest?symbol=${symbol}&access_key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`FCSAPI API Error: ${response.status} ${response.statusText}`);
    const data = await response.json();
    
    if (data.status !== 'success' || !data.response || data.response.length === 0) {
        throw new Error(`FCSAPI API Error: ${data.msg || 'Invalid response structure'}`);
    }

    const priceData = data.response[0];
    const price = parseFloat(priceData.close);
    if (isNaN(price)) {
        throw new Error("Invalid price data from FCSAPI.");
    }

    // FCSAPI timestamp is in seconds, convert to milliseconds
    return { price, timestamp: parseInt(priceData.last_update) * 1000 };
};

const getPriceFromOpenExchangeRates = async (symbol: string): Promise<RealtimePrice> => {
    const apiKey = getApiKey(USER_OPEN_EXCHANGE_RATES_API_KEY);
    if (!apiKey) throw new Error("Open Exchange Rates API key is not configured.");
    if (!symbol.includes('/')) throw new Error("Invalid symbol format for Open Exchange Rates");
    const [base, quote] = symbol.split('/');

    const url = `https://openexchangerates.org/api/latest.json?app_id=${apiKey}&base=${base}&symbols=${quote}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Open Exchange Rates API Error: ${response.status} ${response.statusText}`);
    const data = await response.json();
    
    if (data.error) {
        throw new Error(`Open Exchange Rates API Error: ${data.description}`);
    }

    const price = data?.rates?.[quote];
    if (typeof price !== 'number') {
        throw new Error("Invalid price data from Open Exchange Rates.");
    }

    // OER timestamp is in seconds, convert to milliseconds
    return { price, timestamp: data.timestamp * 1000 };
};

const getPriceFromTwelveData = async (symbol: string): Promise<RealtimePrice> => {
    const apiKey = getApiKey(USER_TWELVE_DATA_API_KEY);
    if (!apiKey) throw new Error("Twelve Data API key is not configured.");
    const url = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Twelve Data API Error: ${response.status} ${response.statusText}`);
    const data = await response.json();
    if (data.code >= 400) {
        throw new Error(`Twelve Data API Error: ${data.message}`);
    }
    const price = parseFloat(data.price);
    if (isNaN(price)) throw new Error("Invalid price data format from Twelve Data.");
    return { price, timestamp: Date.now() };
};

// --- Historical Data Adapters ---

const mapTimeframeForTwelveData = (tf: string): string => {
    const mapping: { [key: string]: string } = {
        '1M': '1min', '5M': '5min', '15M': '15min', '30M': '30min', '1H': '1h', '4H': '4h', 'Daily': '1day'
    };
    return mapping[tf] || '1day';
};

const getHistoricalFromTwelveData = async (symbol: string, timeframe: string, startDate: string, endDate: string): Promise<OhlcData[]> => {
    const apiKey = getApiKey(USER_TWELVE_DATA_API_KEY);
    if (!apiKey) throw new Error("Twelve Data API key is not configured.");
    const interval = mapTimeframeForTwelveData(timeframe);
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&start_date=${startDate}&end_date=${endDate}&apikey=${apiKey}&outputsize=5000`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Twelve Data API Error: ${response.statusText}`);
    const data = await response.json();
    if (data.status === 'error') throw new Error(`Twelve Data API Error: ${data.message}`);

    return data.values.map((v: any) => ({
        timestamp: new Date(v.datetime).getTime(),
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
    })).sort((a, b) => a.timestamp - b.timestamp);
};


// --- Public Market Data Manager ---

const realtimeProviderChain = [
    { name: 'FCSAPI', fn: getPriceFromFcsapi },
    { name: 'Open Exchange Rates', fn: getPriceFromOpenExchangeRates },
    { name: 'Twelve Data', fn: getPriceFromTwelveData },
];

const historicalProviderChain = [
    { name: 'Twelve Data', fn: getHistoricalFromTwelveData },
];


export const MarketDataManager = {
    getRealtimeForexPrice: async (symbol: string): Promise<RealtimePrice> => {
        const errors: string[] = [];
        for (const provider of realtimeProviderChain) {
            try {
                return await provider.fn(symbol);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.warn(`Data provider '${provider.name}' failed for ${symbol}:`, errorMessage);
                errors.push(`${provider.name}: ${errorMessage}`);
            }
        }
        throw new Error(`All data providers failed for ${symbol}. Errors: [${errors.join(', ')}]`);
    },
    
    getHistoricalData: async (symbol: string, timeframe: string, startDate: string, endDate: string): Promise<OhlcData[]> => {
        const errors: string[] = [];
        for (const provider of historicalProviderChain) {
            try {
                const data = await provider.fn(symbol, timeframe, startDate, endDate);
                if (data.length > 0) return data;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.warn(`Historical data provider '${provider.name}' failed for ${symbol}:`, errorMessage);
                errors.push(`${provider.name}: ${errorMessage}`);
            }
        }
        throw new Error(`All historical data providers failed for ${symbol}. Errors: [${errors.join(', ')}]`);
    },
};