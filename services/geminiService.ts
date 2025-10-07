

import { GoogleGenAI, Type, GenerateContentResponse, GenerateImagesResponse, FunctionDeclaration } from "@google/genai";
import { NewsArticle, MarketUpdate, EconomicEvent, MultipleChoiceQuestion, StrategyParams, BacktestResults, AnalysisResult } from '../types';

// In-memory cache to avoid hitting API rate limits for repeated requests.
const contentCache = new Map<string, string>();
const imageCache = new Map<string, string>();
const quizCache = new Map<string, { question: string; options: string[]; correctAnswer: string; }>();
const quizSetCache = new Map<string, MultipleChoiceQuestion[]>();

// --- Client Management ---
const clientCache = new Map<string, GoogleGenAI>();

/**
 * Gets or creates a GoogleGenAI client for a given API key.
 * @param apiKey The user's Gemini API key.
 * @returns An instance of the GoogleGenAI client.
 */
export const getAiClient = (apiKey: string): GoogleGenAI => {
    if (!apiKey) {
        throw new Error("API Key is not provided.");
    }
    if (clientCache.has(apiKey)) {
        return clientCache.get(apiKey)!;
    }
    const newClient = new GoogleGenAI({ apiKey });
    clientCache.set(apiKey, newClient);
    return newClient;
};


// --- Helper for API call retries with exponential backoff ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async <T>(
  apiCall: () => Promise<T>,
  maxRetries = 5,
  initialDelay = 2000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      const errorMessage = String(error).toLowerCase();
      if (errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('resource_exhausted')) {
        if (attempt === maxRetries) {
          console.error("API call failed after max retries due to rate limiting.", error);
          throw new Error("The service is currently busy. Please try again later.");
        }
        const backoffTime = initialDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.warn(`Rate limit hit. Retrying in ${backoffTime.toFixed(0)}ms... (Attempt ${attempt}/${maxRetries})`);
        await delay(backoffTime);
      } else {
        console.error("API call failed with a non-retriable error.", error);
        if (errorMessage.includes('api key not valid')) {
            throw new Error('Your API key is not valid. Please check it and try again.');
        }
        throw error;
      }
    }
  }
  throw new Error('Exceeded max retries for API call.');
};


export const generateLessonContent = async (apiKey: string, prompt: string, cacheKey?: string): Promise<string> => {
  if (cacheKey && contentCache.has(cacheKey)) {
    return contentCache.get(cacheKey)!;
  }
  try {
    const ai = getAiClient(apiKey);
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    }));
    const textContent = response.text;
    if (cacheKey) {
        contentCache.set(cacheKey, textContent);
    }
    return textContent;
  } catch (error) {
    console.error("Error generating lesson content:", error);
    throw error;
  }
};

export const generateChartImage = async (apiKey: string, prompt: string, cacheKey?: string): Promise<string> => {
  if (cacheKey && imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }
  try {
    const ai = getAiClient(apiKey);
    const response = await withRetry<GenerateImagesResponse>(() => ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '16:9',
        },
    }));
    
    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;

    if (base64ImageBytes) {
        const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
        if (cacheKey) {
            imageCache.set(cacheKey, imageUrl);
        }
        return imageUrl;
    } else {
        throw new Error("No image was generated.");
    }
  } catch (error) {
    console.error("Error generating chart image:", error);
    throw error;
  }
};

export const generateTradeFeedback = async (apiKey: string, chartPrompt: string, tradeDetails: string): Promise<string> => {
    const prompt = `You are an expert trading mentor specializing in Smart Money Concepts. A student is practicing on a simulated chart that was generated with the prompt: "${chartPrompt}". The student placed the following trade: ${tradeDetails}.
Based on the visual patterns you were asked to generate, analyze the quality of this trade setup *before it plays out*. Is the entry logical relative to the Point of Interest? Is the stop loss placed in a safe location (e.g., below the swing low for a long)? Is the take profit targeting a realistic liquidity level? Provide clear, concise, and constructive feedback in markdown format. Start with a one-sentence summary (e.g., "This is a well-planned setup.") and then provide bullet points for your reasoning.`;

    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        }));
        return response.text;
    } catch (error) {
        console.error("Error generating trade feedback:", error);
        throw error;
    }
};

const quizQuestionSchema = {
    type: Type.OBJECT,
    properties: {
        question: { type: Type.STRING },
        options: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        },
        correctAnswer: { type: Type.STRING }
    },
    required: ['question', 'options', 'correctAnswer']
};

export const generateQuizQuestion = async (apiKey: string, lessonContentPrompt: string, cacheKey?: string): Promise<{ question: string; options: string[]; correctAnswer: string; }> => {
    if (cacheKey && quizCache.has(cacheKey)) {
        return quizCache.get(cacheKey)!;
    }
    try {
        const ai = getAiClient(apiKey);
        const prompt = `Based on the following concept, create one multiple-choice question to test a user's understanding. The question should be clear and concise. Provide 4 options in total (one correct, three plausible distractors). Ensure the 'correctAnswer' field exactly matches one of the strings in the 'options' array. The options should be shuffled.

Concept: "${lessonContentPrompt}"`;

        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizQuestionSchema,
            },
        }));

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        
        if (parsed.question && Array.isArray(parsed.options) && parsed.correctAnswer && parsed.options.includes(parsed.correctAnswer)) {
            if (cacheKey) {
                quizCache.set(cacheKey, parsed);
            }
            return parsed;
        } else {
            throw new Error("Generated JSON for quiz question is malformed.");
        }

    } catch (error) {
        console.error("Error generating quiz question:", error);
        throw error;
    }
};

const quizQuestionSchemaForSet = {
    type: Type.OBJECT,
    properties: {
        question: { type: Type.STRING, description: "The question text." },
        options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of 4 strings: 1 correct answer and 3 distractors."
        },
        correctAnswer: { type: Type.STRING, description: "The string of the correct answer, which must be present in the options array." }
    },
    required: ['question', 'options', 'correctAnswer']
};

const quizSetSchema = {
    type: Type.OBJECT,
    properties: {
        questions: {
            type: Type.ARRAY,
            items: quizQuestionSchemaForSet
        }
    },
    required: ['questions']
};


export const generateQuizSet = async (apiKey: string, lessonContentPrompt: string, numQuestions: number, cacheKey?: string): Promise<MultipleChoiceQuestion[]> => {
    if (cacheKey && quizSetCache.has(cacheKey)) {
        return quizSetCache.get(cacheKey)!;
    }
    try {
        const ai = getAiClient(apiKey);
        const prompt = `Based on the following concept, create a set of ${numQuestions} unique multiple-choice questions to test a user's understanding. Each question should be clear and concise. For each question, provide 4 options in total (one correct, three plausible distractors). Ensure the 'correctAnswer' field for each question exactly matches one of the strings in its 'options' array. The options for each question should be shuffled.

Concept: "${lessonContentPrompt}"`;
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizSetSchema,
            },
        }));
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            if (cacheKey) {
                quizSetCache.set(cacheKey, parsed.questions);
            }
            return parsed.questions;
        } else {
            throw new Error("Generated JSON for quiz set is malformed.");
        }
    } catch (error) {
        console.error("Error generating quiz set:", error);
        throw error;
    }
};

export const generateTimedChallengeQuizSet = async (apiKey: string, numQuestions: number): Promise<MultipleChoiceQuestion[]> => {
    try {
        const ai = getAiClient(apiKey);
        const prompt = `You are a quiz generator for an advanced Forex trading course. Create a set of ${numQuestions} unique, challenging multiple-choice questions that test a user's understanding of a wide range of topics. The questions should cover concepts like Market Structure (BOS, CHoCH), Liquidity (Buy-side, Sell-side, Sweeps), Order Blocks, Fair Value Gaps (FVG), and Premium/Discount arrays.

For each question, provide 4 options in total (one correct, three plausible distractors). Ensure the 'correctAnswer' field for each question exactly matches one of the strings in its 'options' array. The options for each question should be shuffled. Return a JSON object that adheres to the provided schema.`;
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizSetSchema,
            },
        }));
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            return parsed.questions;
        } else {
            throw new Error("Generated JSON for timed challenge quiz set is malformed.");
        }
    } catch (error) {
        console.error("Error generating timed challenge quiz set:", error);
        throw error;
    }
};

export const generateMentorResponse = async (
    apiKey: string, 
    prompt: string, 
    file?: { data: string; mimeType: string }
): Promise<{ text: string; groundingChunks: any[] }> => {
    const systemInstruction = `You are an expert forex trading mentor. Your primary expertise is in Smart Money Concepts (SMC) and Inner Circle Trader (ICT) methodologies. You can also identify classical technical analysis patterns and explain how they relate to SMC principles.

You have been upgraded with new agentic capabilities:
1.  **Real-Time Search:** You have access to Google Search. Use it for any questions about recent market news, economic data, or any topic where up-to-date information is crucial. When you use search, your answer will be grounded in the sources you find.
2.  **File Analysis:** Users can upload files (images, text, CSV, PDF). Analyze the content provided in these files in your response. For charts, identify patterns. For data files (like CSV), summarize the data or answer questions about it. For documents, analyze the text.

Provide clear, concise, and actionable feedback. Be encouraging and helpful. Use markdown for formatting.

When a visual explanation would be helpful, embed a chart generation request in your response using the format [CHART: a detailed, descriptive prompt for an image generation model].`;
    
    try {
        const ai = getAiClient(apiKey);
        
        const contents: any = { parts: [{ text: prompt }] };

        if (file) {
            contents.parts.unshift({
                inlineData: {
                    mimeType: file.mimeType,
                    data: file.data,
                },
            });
        }
        
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                tools: [{ googleSearch: {} }],
            },
        }));
        
        return {
            text: response.text,
            groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
        };

    } catch (error) {
        console.error("Error generating mentor response:", error);
        throw error;
    }
};

export const generateMarketPulse = async (apiKey: string): Promise<string> => {
    const prompt = `You are a senior forex market analyst providing a daily briefing. It is currently ${new Date().toUTCString()}. Using real-time information, provide a concise summary of the current forex market state. Structure your response in markdown format with the following four sections exactly as titled:

### Overall Market Narrative
(A brief paragraph on the dominant theme of the day, e.g., risk-on/risk-off, inflation fears, central bank speculation.)

### Currency Strength
(A bulleted list of the strongest and weakest major currencies (e.g., USD, EUR, JPY, GBP, AUD, CAD) and the immediate reasons why. Format as "* **Strong: [Currency]** - [Reason]" and "* **Weak: [Currency]** - [Reason]".)

### Key Pairs to Watch
(A bulleted list highlighting 2-3 currency pairs showing significant volatility or approaching critical technical levels. Briefly explain what to look for.)

### Upcoming Catalysts
(A bulleted list of any high-impact news events scheduled for the remainder of the current or upcoming trading session.)
`;

    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        }));
        return response.text;
    } catch (error) {
        console.error("Error generating market pulse:", error);
        throw error;
    }
};

export const getForexNews = async (apiKey: string): Promise<{ articles: NewsArticle[], groundingChunks: any[] }> => {
    const prompt = `You are a financial news aggregator. Using your search tool, find the top 5 most recent and impactful news articles related to the Forex market (major currency pairs like EUR/USD, GBP/USD, USD/JPY, etc.).
Return the result as a single, clean JSON array string. Each object in the array should have the keys: "headline", "summary", "sourceUrl", and "sourceTitle".
For the "summary", provide a concise 2-3 sentence overview.
Do not include any other text, explanations, or markdown formatting outside of the JSON string.
The entire response should be only the JSON array. Example: [{"headline": "...", "summary": "...", "sourceUrl": "...", "sourceTitle": "..."}]`;

    try {
        const ai = getAiClient(apiKey);
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        }));
        
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        let articles: NewsArticle[] = [];
        const text = response.text.trim();
        
        const startIndex = text.indexOf('[');
        const endIndex = text.lastIndexOf(']');
        
        if (startIndex !== -1 && endIndex !== -1) {
            const jsonString = text.substring(startIndex, endIndex + 1);
            try {
                articles = JSON.parse(jsonString);
            } catch (jsonError) {
                console.error("Failed to parse JSON from Gemini response:", jsonError, "Raw text:", text);
                throw new Error("The AI returned a malformed news feed. Please try again.");
            }
        } else {
             throw new Error("The AI did not return a valid news feed format. Please try again.");
        }

        return { articles, groundingChunks };

    } catch (error) {
        console.error("Error fetching forex news:", error);
        throw error;
    }
};

export const generateMarketUpdateSnippet = async (apiKey: string): Promise<MarketUpdate> => {
    const choice = Math.random() > 0.5 ? 'pulse' : 'news';

    try {
        const ai = getAiClient(apiKey);
        if (choice === 'pulse') {
            const prompt = `You are a senior forex market analyst. Provide only the "Overall Market Narrative" as a single, concise paragraph (2-3 sentences max). Do not include any titles, markdown, or other sections. The information should be based on the current time: ${new Date().toUTCString()}.`;
            const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            }));
            return {
                type: 'pulse',
                title: 'Market Pulse',
                content: response.text,
            };
        } else { // 'news'
            const prompt = `You are a financial news aggregator. Using your search tool, find the single most recent and impactful news headline related to the Forex market. Return the result as a single, clean JSON object string with keys: "headline" and "summary". The summary should be a single, concise sentence. Do not include any other text or markdown. Example: {"headline": "...", "summary": "..."}`;
            const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            }));

            let parsed: { headline: string; summary: string };
            const text = response.text.trim();
            const startIndex = text.indexOf('{');
            const endIndex = text.lastIndexOf('}');

            if (startIndex !== -1 && endIndex !== -1) {
                const jsonString = text.substring(startIndex, endIndex + 1);
                try {
                    parsed = JSON.parse(jsonString);
                } catch (jsonError) {
                    console.error("Failed to parse JSON for news snippet:", jsonError, "Raw text:", text);
                    throw new Error("AI returned malformed JSON for news snippet.");
                }
            } else {
                throw new Error("AI did not return valid JSON for news snippet.");
            }

            if (parsed.headline && parsed.summary) {
                return {
                    type: 'news',
                    title: parsed.headline,
                    content: parsed.summary,
                };
            } else {
                throw new Error("Generated JSON for news snippet is missing required fields.");
            }
        }
    } catch (error) {
        console.error("Error generating market update snippet:", error);
        throw error;
    }
};

export const analyzePriceMovement = async (apiKey: string, pair: string): Promise<{ analysis: string, sources: any[] }> => {
    const prompt = `You are a senior forex market analyst. It is currently ${new Date().toUTCString()}. Using real-time information from your search tool, provide a concise analysis of the primary catalyst for the price movement of the **${pair}** currency pair within the **last 1-2 hours**.

Structure your response in markdown format as follows:
1. **Primary Driver:** A single, bolded sentence identifying the main reason for the move (e.g., **"A higher-than-expected US CPI print is causing significant USD strength."**).
2. **Key Details:** A bulleted list providing specific details, such as the data released, key figures, or quotes from officials.
3. **Market Reaction:** A brief paragraph describing how the market is interpreting this information and the resulting price action.
4. **Outlook:** A short, one-sentence outlook on the potential next move or what to watch for.`;

    try {
        const ai = getAiClient(apiKey);
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        }));
        
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const analysis = response.text;

        return { analysis, sources };

    } catch (error) {
        console.error(`Error analyzing price movement for ${pair}:`, error);
        throw error;
    }
};

export const generatePreEventBriefing = async (apiKey: string, event: EconomicEvent): Promise<string> => {
    const prompt = `You are a senior forex market analyst. The upcoming "${event.name}" for ${event.currency} is scheduled soon. The market forecast is ${event.forecast} and the previous reading was ${event.previous}. Using your search tool for the latest context, provide a pre-event briefing in markdown format. Cover these points:
- **Market Expectations:** Briefly explain what the consensus forecast implies for the currency.
- **Potential Scenarios:** Describe the likely market reaction for both a better-than-expected (hawkish) and worse-than-expected (dovish) result.
- **Key Levels to Watch:** Mention any critical technical support/resistance levels on a major pair (e.g., EUR/USD if currency is USD or EUR) that might be tested on the release.`;
    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        }));
        return response.text;
    } catch (error) {
        console.error("Error generating pre-event briefing:", error);
        throw error;
    }
};

export const generateInstantAnalysis = async (apiKey: string, event: EconomicEvent): Promise<string> => {
    const prompt = `You are a forex market analyst providing live commentary. The "${event.name}" data for ${event.currency} has just been released.
- **Actual:** ${event.actual}
- **Forecast:** ${event.forecast}
- **Previous:** ${event.previous}
Using your search tool to find the immediate market reaction, provide an instant analysis in markdown format. Cover:
- **The Deviation:** Was the actual number a significant beat or miss compared to the forecast?
- **Immediate Market Reaction:** Describe the price action on the relevant major pair in the first few minutes post-release (e.g., "USD/JPY spiked 50 pips as the dollar strengthened aggressively.").
- **Initial Interpretation:** How is the market interpreting this data? (e.g., "This hotter-than-expected inflation print increases the likelihood of the central bank maintaining a hawkish stance.")`;
    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        }));
        return response.text;
    } catch (error) {
        console.error("Error generating instant analysis:", error);
        throw error;
    }
};

export const generatePostEventSummary = async (apiKey: string, event: EconomicEvent): Promise<string> => {
    const prompt = `You are a senior forex market analyst summarizing an economic event that occurred roughly an hour ago. The event was the "${event.name}" for ${event.currency}, with an actual reading of ${event.actual} vs a forecast of ${event.forecast}. Using your search tool to analyze the market's behavior since the release, provide a concise post-event summary in markdown format. Address:
- **Price Action Follow-Through:** Did the initial spike/drop reverse, or did the momentum continue?
- **Updated Market Sentiment:** Has the narrative or sentiment for the ${event.currency} shifted because of this data?
- **Broader Impact:** Briefly mention if the event had any notable impact on other assets like indices or commodities.`;
    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        }));
        return response.text;
    } catch (error) {
        console.error("Error generating post-event summary:", error);
        throw error;
    }
};

const parseStrategyFunctionDeclaration: FunctionDeclaration = {
    name: 'parse_strategy',
    description: 'Parses a natural language trading strategy into its core components.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            entryCriteria: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of technical conditions that must be met to enter a trade, e.g., ['Liquidity Sweep', 'Change of Character', 'Entry on FVG']."
            },
            stopLoss: {
                type: Type.STRING,
                description: "A description of the stop loss placement logic, e.g., 'Above the sweep high' or 'Below the order block low'."
            },
            takeProfit: {
                type: Type.STRING,
                description: "A description of the take profit placement logic, e.g., 'Target opposing liquidity' or 'Fixed 1:3 Risk/Reward'."
            },
        },
        required: ['entryCriteria', 'stopLoss', 'takeProfit'],
    },
};

export const parseStrategyFromText = async (apiKey: string, userText: string, pair: string, timeframe: string): Promise<StrategyParams> => {
    const prompt = `Parse the following trading strategy description into its structured components. The user is trading ${pair} on the ${timeframe} timeframe.

Strategy: "${userText}"`;

    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ functionDeclarations: [parseStrategyFunctionDeclaration] }],
            },
        }));

        const functionCall = response.functionCalls?.[0];
        if (functionCall?.name === 'parse_strategy' && functionCall.args) {
            return {
                pair,
                timeframe,
                entryCriteria: functionCall.args.entryCriteria,
                stopLoss: functionCall.args.stopLoss,
                takeProfit: functionCall.args.takeProfit,
            };
        } else {
            throw new Error("AI could not parse the strategy. Please try describing it more clearly.");
        }

    } catch (error) {
        console.error("Error parsing strategy from text:", error);
        throw error;
    }
};


const backtestResultsSchema = {
    type: Type.OBJECT,
    properties: {
        totalTrades: { type: Type.NUMBER },
        winRate: { type: Type.NUMBER },
        profitFactor: { type: Type.NUMBER },
        avgRR: { type: Type.NUMBER },
        maxDrawdown: { type: Type.NUMBER },
    },
    required: ['totalTrades', 'winRate', 'profitFactor', 'avgRR', 'maxDrawdown']
};

export const generateSimulatedBacktestResults = async (apiKey: string, strategy: StrategyParams, period: string): Promise<BacktestResults> => {
    const prompt = `You are a quantitative analyst simulating a backtest. Given the following forex trading strategy, generate a realistic, plausible set of performance metrics over the specified period.
Do not output any text other than the JSON object.

Strategy Details:
- Pair: ${strategy.pair}
- Timeframe: ${strategy.timeframe}
- Entry Logic: ${strategy.entryCriteria.join(', ')}
- Stop Loss Logic: ${strategy.stopLoss}
- Take Profit Logic: ${strategy.takeProfit}
- Backtest Period: ${period}

Consider the typical performance characteristics of Smart Money Concept strategies. They often have lower win rates but high Risk-to-Reward ratios. The results should reflect this. For example, a win rate between 35-55% would be realistic. The profit factor should be positive if the strategy is viable (e.g., 1.5 to 3.0).`;

    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: backtestResultsSchema,
            },
        }));

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        
        // Basic validation
        if (typeof parsed.winRate !== 'number' || typeof parsed.profitFactor !== 'number') {
             throw new Error("AI returned malformed data for backtest results.");
        }
        return parsed;

    } catch (error) {
        console.error("Error generating simulated backtest results:", error);
        throw error;
    }
};


export const analyzeBacktestResults = async (
    apiKey: string,
    strategyParams: StrategyParams,
    results: BacktestResults
): Promise<string> => {
    const prompt = `You are an expert trading coach and data analyst specializing in systematic strategies based on Smart Money Concepts (SMC). A student has just run a backtest with the following parameters and results. Your task is to provide a concise, insightful analysis and a highly specific, actionable suggestion for improvement.

**Strategy Parameters:**
- Pair: ${strategyParams.pair}
- Timeframe: ${strategyParams.timeframe}
- Entry Criteria: ${strategyParams.entryCriteria.join(', ')}
- Stop Loss: ${strategyParams.stopLoss}
- Take Profit: ${strategyParams.takeProfit}

**Backtest Results:**
- Total Trades: ${results.totalTrades}
- Win Rate: ${results.winRate.toFixed(1)}%
- Profit Factor: ${results.profitFactor.toFixed(2)}
- Average R:R: 1:${results.avgRR.toFixed(2)}
- Max Drawdown: ${results.maxDrawdown.toFixed(1)}%

**Your Coaching Logic (Follow this logic for your suggestions):**
- **If the Win Rate is low (e.g., < 45%)**: This suggests an issue with entry timing or setup selection. The trader might be entering too early or on low-probability signals.
    - *Suggestion idea*: Add a stronger confirmation criterion. For example, if they only use 'CHoCH', suggest adding 'Entry on Order Block' to wait for a clearer Point of Interest. Or suggest filtering trades to only occur in a higher timeframe 'Premium/Discount Zone'.
- **If the Profit Factor is low (e.g., < 1.5) despite a decent Win Rate**: This suggests the reward from winning trades is not significantly outweighing the losses.
    - *Suggestion idea*: Propose a more ambitious profit-taking strategy. If they are using 'Fixed 1:2 R:R', suggest switching to 'Target Opposing Liquidity' to allow winners to run further.
- **If both Win Rate and Profit Factor are low**: This points to a fundamental issue with the strategy's edge.
    - *Suggestion idea*: Suggest a more foundational change. For example, "Your current rules are struggling. Let's rebuild. Try a strategy focused *only* on 'Liquidity Sweep' of a major high/low, followed by a 'CHoCH', and entering on the resulting 'FVG'. This is a classic, high-probability model."
- **If performance is good but Total Trades are low**: The strategy is too restrictive.
    - *Suggestion idea*: Suggest ways to find more opportunities without sacrificing too much quality. For example, "This strategy is effective but rare. Try applying the same rules to a lower timeframe to increase trade frequency."
- **If max drawdown is high (e.g., > 15%)**: The trader is likely holding onto losing trades for too long, the stop loss placement is not optimal, or they are taking too many consecutive losses.
    - *Suggestion idea*: "Your high drawdown suggests risk is not being contained effectively. Consider tightening your stop loss by placing it just below the wick of the order block, instead of the entire swing low. Also, consider implementing a 'max daily loss' rule in your plan to prevent significant drawdowns."

**Your Analysis (in markdown format):**
1.  **Overall Assessment:** Start with a single, bolded sentence summarizing the strategy's performance.
2.  **Strengths:** In a bulleted list, identify 1-2 key strengths based on the data.
3.  **Areas for Improvement:** In a bulleted list, identify 1-2 potential weaknesses, linking them to the metrics.
4.  **Actionable Suggestion:** Based on the "Coaching Logic" above, provide ONE specific, actionable suggestion for the student to test next. Explain *why* this change could address the weakness you identified. For example, "Your win rate is low, suggesting premature entries. **Suggestion:** Add 'Entry on FVG' as a required criterion. This forces you to wait for price to rebalance after a CHoCH, which can be a stronger confirmation signal and improve your win rate."
`;

    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        }));
        return response.text;
    } catch (error) {
        console.error("Error analyzing backtest results:", error);
        throw error;
    }
};

export const analyzeLiveChart = async (
    apiKey: string, 
    prompt: string, 
    images: { data: string; mimeType: string }[]
): Promise<AnalysisResult> => {
    const systemInstruction = `You are a world-class forex trading analyst and mentor, specializing in Smart Money Concepts (SMC) combined with real-time fundamental analysis. Your analysis must be CRITICAL, ACCURATE, and FACTUAL. You will be given a user's question and one or more screenshots of a live trading chart.

Your task is to:
1.  **Technical Analysis:** Analyze the provided chart image(s) for price action patterns, market structure (BOS, CHoCH), liquidity pools (buy-side/sell-side), order blocks, fair value gaps (FVGs), premium/discount zones, and any other relevant SMC concepts.
    - **IMPORTANT:** If multiple images are provided, they likely represent different timeframes (e.g., Daily, 4H, 15M). You MUST perform a multi-timeframe analysis, starting from the highest timeframe to establish context and bias, then drilling down to the lower timeframes for the specific setup.
2.  **Fundamental Analysis:** Use your real-time Google Search capability to find any high-impact news, economic data releases, or central bank statements that could be affecting the currency pair shown in the chart. Your search must focus on catalysts within the last few hours to ensure relevance.
3.  **Synthesize:** Combine your multi-timeframe technical and fundamental findings into a single, cohesive analysis. Explain how the fundamentals may be influencing the technical picture.
4.  **Provide Actionable Feedback:** Based on your synthesis, provide one of the following in clear markdown format:
    *   **A-Grade Setup:** If a high-probability trade is present, outline a complete trade plan with a bolded **Entry**, **Stop Loss**, **Take Profit**, and the **Reasoning** behind the setup.
    *   **Things to Watch:** If no immediate setup is present, explain what you are seeing and what specific conditions or price action you would need to see to consider a trade (e.g., "I'm waiting for a sweep of the Asian lows before looking for a long entry." or "The market is consolidating ahead of CPI data; it is best to wait.").

ALWAYS cite your sources for any fundamental data you use.`;
    
    try {
        const ai = getAiClient(apiKey);
        
        const imageParts = images.map(image => ({
            inlineData: {
                mimeType: image.mimeType,
                data: image.data,
            },
        }));
        const textPart = { text: prompt };
        
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [...imageParts, textPart] },
            config: {
                systemInstruction: systemInstruction,
                tools: [{ googleSearch: {} }],
            },
        }));
        
        return {
            text: response.text,
            sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
        };

    } catch (error) {
        console.error("Error analyzing live chart:", error);
        throw error;
    }
};

const tradeEvaluationSchema = {
    type: Type.OBJECT,
    properties: {
        outcome: { 
            type: Type.STRING,
            description: "The result of the trade. Must be either 'Win' or 'Loss'."
        },
        feedback: { 
            type: Type.STRING,
            description: "Detailed, constructive feedback on the trade setup and execution in markdown format."
        }
    },
    required: ['outcome', 'feedback']
};

export const evaluateHistoricalTrade = async (
    apiKey: string,
    chartPrompt: string,
    strategy: { [key: string]: any },
    tradeDetails: string
): Promise<{ outcome: 'Win' | 'Loss'; feedback: string }> => {
    const prompt = `You are a master trading analyst acting as a trade evaluator.
A trading scenario chart was generated for a student using this prompt: "${chartPrompt}".
The student's strategy is defined as:
- Pair: ${strategy.pair}
- Timeframe: ${strategy.timeframe}
- Entry Criteria: ${strategy.entryCriteria.join(', ')}
- Stop Loss Logic: ${strategy.stopLoss}
- Take Profit Logic: ${strategy.takeProfit}

The student analyzed the chart and placed the following trade: ${tradeDetails}.

Your task is to:
1.  **Determine the Outcome:** Based on the logical price action that should have occurred in the chart you were asked to generate, decide if the student's trade would have hit the Take Profit ('Win') or the Stop Loss ('Loss').
2.  **Provide Expert Feedback:** Write a detailed critique of the student's trade.
    - Did they correctly identify the setup described in the prompt?
    - Was their entry precise, or could it have been better?
    - Was the stop loss placed in a logical and safe location according to SMC principles?
    - Was the take profit target realistic and aligned with liquidity targets?
    - Provide your feedback in markdown format. Start with a bolded one-sentence summary (e.g., "**Excellent read of the market structure, but the entry was a bit premature.**"). Then, use bullet points for detailed analysis.

Return your response as a single, clean JSON object string that adheres to the provided schema. Do not include any other text, explanations, or markdown formatting outside of the JSON string.
`;
    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: tradeEvaluationSchema,
            },
        }));
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);

        if ((parsed.outcome === 'Win' || parsed.outcome === 'Loss') && parsed.feedback) {
            return parsed;
        } else {
             throw new Error("Generated JSON for trade evaluation is malformed.");
        }

    } catch (error) {
        console.error("Error evaluating historical trade:", error);
        throw error;
    }
};