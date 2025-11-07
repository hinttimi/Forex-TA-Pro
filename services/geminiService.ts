





import { GoogleGenAI, Type, GenerateContentResponse, GenerateImagesResponse, Modality, FunctionDeclaration } from "@google/genai";
import { NewsArticle, MarketUpdate, EconomicEvent, MultipleChoiceQuestion, StrategyParams, BacktestResults, AnalysisResult, AppView, OhlcData, CurrencyStrengthData, VolatilityData, MarketSentimentData, TopMoverData, DailyMission, TradeLog, UploadedFile } from '../types';
import { MENTOR_PERSONAS } from "../constants/mentorSettings";
import { LEARNING_PATHS } from "../constants";

// --- Client Management ---
/**
 * Creates a new GoogleGenAI client for a given API key.
 * A new client is created for each call to ensure no state is shared.
 * @param apiKey The user's Gemini API key.
 * @returns An instance of the GoogleGenAI client.
 */
export const getAiClient = (apiKey: string): GoogleGenAI => {
    if (!apiKey) {
        throw new Error("API Key is not provided.");
    }
    // Always create a new client to ensure no session state or caching issues.
    return new GoogleGenAI({ apiKey });
};

/**
 * Tries to find and parse a JSON object or array from a string that might contain other text.
 * @param text The string to parse.
 * @returns The parsed JSON object or null if no valid JSON is found.
 */
const robustJsonParse = (text: string): any => {
    // Try to find JSON block enclosed in ```json ... ```
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonString = match ? match[1] : text;

    try {
        return JSON.parse(jsonString.trim());
    } catch (e) {
        // Fallback for cases where JSON is just embedded without markers
        const firstBracket = jsonString.indexOf('{');
        const firstSquare = jsonString.indexOf('[');
        let start = -1;

        if (firstBracket === -1 && firstSquare === -1) return null;
        if (firstBracket === -1) start = firstSquare;
        else if (firstSquare === -1) start = firstBracket;
        else start = Math.min(firstBracket, firstSquare);
        
        const lastBracket = jsonString.lastIndexOf('}');
        const lastSquare = jsonString.lastIndexOf(']');
        const end = Math.max(lastBracket, lastSquare);

        if (start !== -1 && end !== -1) {
            try {
                const potentialJson = jsonString.substring(start, end + 1);
                return JSON.parse(potentialJson);
            } catch (e2) {
                console.error("Failed to robustly parse JSON:", e2);
                return null;
            }
        }
    }
    return null;
}

/**
 * Extracts and concatenates all text parts from a GenerateContentResponse.
 * This is used to bypass the built-in `.text` accessor which can log warnings
 * when the model response includes non-text parts (e.g., from 'thinking').
 * @param response The response object from the Gemini API.
 * @returns A single string concatenating all text parts.
 */
const getTextFromResponse = (response: GenerateContentResponse): string => {
    if (!response.candidates || response.candidates.length === 0) {
        return '';
    }
    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        return '';
    }
    return candidate.content.parts
        .filter(part => 'text' in part && typeof part.text === 'string')
        .map(part => part.text)
        .join('');
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
      const isRateLimit = errorMessage.includes('429') || errorMessage.includes('rate limit');
      const isQuotaExhausted = errorMessage.includes('quota exceeded') || errorMessage.includes('resource_exhausted');

      if (isRateLimit || isQuotaExhausted) {
        // If it's a permanent quota error, fail immediately with a specific message.
        if (isQuotaExhausted) {
            console.error("API call failed due to quota exhaustion. No retries will be attempted.", error);
            throw new Error("You have exceeded your daily API quota for this model. Please check your Google AI plan or try again tomorrow.");
        }
        
        // If it's a temporary rate limit, retry.
        if (attempt === maxRetries) {
          console.error("API call failed after max retries due to temporary rate limiting.", error);
          throw new Error("The service is currently busy due to high traffic. Please try again in a moment.");
        }
        const backoffTime = initialDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.warn(`Temporary rate limit hit. Retrying in ${backoffTime.toFixed(0)}ms... (Attempt ${attempt}/${maxRetries})`);
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

export const generateLessonSummary = async (apiKey: string, lessonContent: string): Promise<string> => {
    const prompt = `You are an expert educational writer. Summarize the following lesson content into 3-5 key bullet points. The summary should be concise and capture the most critical takeaways for a student. Use markdown for **bold** emphasis.

Lesson Content:
---
${lessonContent}
---
`;
    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        }));
        return response.text;
    } catch (error) {
        console.error("Error generating lesson summary:", error);
        throw error;
    }
};

/**
 * This function is now dedicated to the multimedia summary feature.
 * It uses the powerful 'imagen-4.0-generate-001' model for high-quality visuals.
 * @param apiKey User's API Key
 * @param prompt The image generation prompt.
 * @returns A base64 data URL for the generated image.
 */
const generateMultimediaSceneImage = async (apiKey: string, prompt: string): Promise<string> => {
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
        return `data:image/png;base64,${base64ImageBytes}`;
    } else {
        throw new Error("No image was generated by Imagen-4. The response was empty.");
    }
  } catch (error) {
    console.error("Error generating multimedia scene image:", error);
    throw error;
  }
};

/**
 * This is the primary function for generating functional charts across the app.
 * It uses 'gemini-2.5-flash-image' (nano-banana) with a blank image trick to mitigate rate limits.
 * Includes localStorage caching to prevent re-generating images on every view.
 * @param apiKey User's API Key
 * @param prompt The text prompt describing the chart to generate.
 * @param cacheKey A unique key for caching the image in localStorage.
 * @returns A base64 data URL for the generated chart image.
 */
export const generateChartImage = async (apiKey: string, prompt: string, cacheKey?: string): Promise<string> => {
  if (cacheKey) {
    try {
      const cachedImage = localStorage.getItem(cacheKey);
      if (cachedImage) {
        console.log(`Loaded chart from cache for key: ${cacheKey}`);
        return cachedImage;
      }
    } catch (e) {
      console.warn("Could not access localStorage for caching.", e);
    }
  }

  try {
    const ai = getAiClient(apiKey);
    const fullPrompt = `Completely replace the provided blank image with a new one based on this request: ${prompt}. The chart should fill the entire 16:9 image canvas. Do not add any extra padding, margins, or borders. The style should be a dark-themed, clear, educational forex chart. Ensure all labels and annotations are accurate and clearly visible.`;
    
    // A base64-encoded 1x1 transparent PNG. This serves as the required image input for the model.
    const blankImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: blankImageBase64, mimeType: 'image/png' } },
                { text: fullPrompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    }));
    
    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData && part.inlineData.mimeType.startsWith('image/'));

    if (imagePart && imagePart.inlineData) {
        const base64ImageBytes = imagePart.inlineData.data;
        const dataUrl = `data:image/png;base64,${base64ImageBytes}`;
        
        if (cacheKey) {
            try {
                localStorage.setItem(cacheKey, dataUrl);
                console.log(`Cached chart for key: ${cacheKey}`);
            } catch (e) {
                // This can happen if localStorage is full.
                console.error("Failed to cache generated image. LocalStorage might be full.", e);
            }
        }

        return dataUrl;
    } else {
        console.error("gemini-2.5-flash-image response did not contain an image part:", JSON.stringify(response, null, 2));
        throw new Error("The AI did not generate a chart image. The response was in an unexpected format.");
    }
  } catch (error) {
    console.error("Error generating chart image with gemini-2.5-flash-image:", error);
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

const executeToolFunctionDeclaration: FunctionDeclaration = {
  name: 'executeTool',
  description: 'Navigates the user to a specific tool within the application or performs a specific analysis for them. Use this whenever a user asks to go to a tool, practice a concept, or run an analysis that maps to a tool\'s capability.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      toolName: {
        type: Type.STRING,
        description: 'The name of the tool/view to navigate to.',
        enum: ['dashboard', 'live_simulator', 'backtester', 'market_dynamics', 'market_pulse', 'news_feed', 'market_analyzer', 'economic_calendar', 'trading_journal', 'trading_plan', 'achievements', 'settings']
      },
      params: {
        type: Type.OBJECT,
        description: 'An optional object of parameters for the tool. For "backtester", this can include "pair", "timeframe", and "strategyDescription". For "market_analyzer", this can include "pair".',
        properties: {
            pair: { type: Type.STRING },
            timeframe: { type: Type.STRING },
            strategyDescription: { type: Type.STRING },
        }
      }
    },
    required: ['toolName']
  },
};


export const generateMentorResponse = async (
    apiKey: string, 
    prompt: string, 
    completedLessonTitles: string[],
    personaId: string
): Promise<{ text: string; functionCalls: any[] | undefined; groundingChunks: any[]; }> => {
    
    const selectedPersona = MENTOR_PERSONAS.find(p => p.id === personaId) || MENTOR_PERSONAS[0];

    const curriculumOverview = LEARNING_PATHS.map(path => 
        `### ${path.title} ${path.isFoundation ? '(Foundation)' : ''}\n${path.description}\n` +
        path.modules.map(module => 
            `**${module.title}**\n${module.lessons.map(lesson => `- ${lesson.title}`).join('\n')}`
        ).join('\n')
    ).join('\n\n');

    const completedLessonsText = completedLessonTitles.length > 0
        ? `The user has already completed the following lessons: ${completedLessonTitles.join(', ')}.`
        : "The user is a beginner and has not completed any lessons yet.";

    const toolManifest = `
### Your Capabilities & In-App Tools
You are an AI assistant deeply integrated within the "Forex TA Pro" learning application. Your capabilities are centered around education and executing actions within the app.

1.  **In-App Actions (via Function Calling):** You can directly help the user by executing tools. If a user's request clearly maps to a tool's function, you MUST call the \`executeTool\` function. This is your primary way of helping with real-time market questions. Do not try to answer them yourself; use the tool.
    - User: "Take me to the simulator" -> Call \`executeTool({ toolName: 'live_simulator' })\`.
    - User: "Why is EUR/USD moving right now?" -> Call \`executeTool({ toolName: 'market_analyzer', params: { pair: 'EUR/USD' } })\`.
    - User: "What are the biggest market-moving news events this week?" -> Call \`executeTool({ toolName: 'economic_calendar' })\`.
    - User: "Backtest a 15M EUR/USD strategy for me" -> Call \`executeTool({ toolName: 'backtester', params: { pair: 'EUR/USD', timeframe: '15M', strategyDescription: '...' } })\`.
    - Always respond with a brief conversational text before the tool call, like "Of course, opening the Market Analyzer for you now."

2.  **Chart Generation:** You can generate new charts to explain concepts using the format \`[CHART: a detailed prompt...]\`.

You do not have direct access to real-time market data. When asked a question about current events or why a pair is moving, you must use the appropriate tool (like 'market_analyzer', 'news_feed', or 'economic_calendar') to help the user find the answer.
`;

    const systemInstruction = `${selectedPersona.systemInstruction}

---
## Application & User Context
You are an agentic AI assistant inside the "Forex TA Pro" app. Your core expertise is in Smart Money Concepts, but you are knowledgeable in all methodologies taught in the app. Adapt your teaching style based on the user's progress and questions.

${toolManifest}

### App Curriculum Overview
This is the full curriculum available in the app. You should be familiar with all these topics.
${curriculumOverview}

### User Progress
${completedLessonsText}
- **Prioritize your primary expertise (SMC)** for general questions, but if the user asks about a specific topic from another path (e.g., "Elliott Wave" or "Wyckoff"), you must switch your context and answer as an expert on that topic.
- Use the user's progress to tailor your explanations. If they ask about a concept they haven't learned, you can introduce it simply and mention which learning path covers it in detail (e.g., "That's a concept from the Wyckoff Method path. In short, it means...").
---
`;

    try {
        const ai = getAiClient(apiKey);
        
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                tools: [{ functionDeclarations: [executeToolFunctionDeclaration] }],
                thinkingConfig: { thinkingBudget: 32768 }
            },
        }));

        return {
            text: getTextFromResponse(response),
            functionCalls: response.functionCalls,
            groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
        };
        
    } catch (error) {
        console.error("Error generating mentor response:", error);
        throw error;
    }
};

export const generateSpeech = async (apiKey: string, text: string, voiceName: string): Promise<string> => {
    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName },
                    },
                },
            },
        }));

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            return base64Audio;
        } else {
            throw new Error("AI did not return audio data for the TTS request.");
        }
    } catch (error) {
        console.error("Error generating speech:", error);
        throw error;
    }
};

const dailyMissionSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A short, engaging title for the mission." },
        description: { type: Type.STRING, description: "A clear, one-sentence description of the task for the user." },
        tool: {
            type: Type.STRING,
            description: "The specific tool in the app the user should use.",
            enum: ['live_simulator', 'backtester']
        },
        completion_criteria: {
            type: Type.STRING,
            description: "The key that corresponds to the completion event for this tool.",
            enum: ['backtester', 'live_simulator']
        },
    },
    required: ['title', 'description', 'tool', 'completion_criteria']
};

export const generateDailyMission = async (apiKey: string, completedLessonTitles: string[]): Promise<DailyMission> => {
    const prompt = `You are an AI trading coach for the "Forex TA Pro" app. Your task is to generate a single, actionable daily mission to help a student practice their skills.

Consider the following:
- The student has already completed these lessons: ${completedLessonTitles.join(', ') || 'None yet'}.
- The mission should be relevant to the concepts they have learned. If they are a beginner, give a simple task. If they have learned advanced concepts, give a more complex task.
- The mission must require the user to use one of the available practice tools.

Available practice tools and their corresponding completion criteria:
- 'live_simulator': A live, moving chart. (completion_criteria: 'live_simulator')
- 'backtester': The AI Strategy Lab. (completion_criteria: 'backtester')

Generate a mission and return it as a single JSON object adhering to the schema. The task should be specific and clear.`;

    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: dailyMissionSchema,
            },
        }));

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);

        if (parsed.title && parsed.description && parsed.tool && parsed.completion_criteria) {
            return parsed;
        } else {
            throw new Error("Generated JSON for daily mission is malformed.");
        }

    } catch (error) {
        console.error("Error generating daily mission:", error);
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
            config: {
                tools: [{googleSearch: {}}],
            }
        }));
        return response.text;
    } catch (error) {
        console.error("Error generating market pulse:", error);
        throw error;
    }
};

export const getForexNews = async (apiKey: string): Promise<{ articles: NewsArticle[], groundingChunks: any[] }> => {
    const prompt = `Using your search tool, find the top 5 most recent and impactful news articles related to the Forex market (major currency pairs like EUR/USD, GBP/USD, USD/JPY, etc.).
Your response MUST be a single, valid JSON object inside a \`\`\`json block. Do not include any text outside of the JSON block.
The JSON object must have a single key "articles", which is an array of objects.
For each article object, include these exact keys: "headline", "summary", "sourceUrl", and "sourceTitle".
The value for "summary" must be a concise 2-3 sentence overview.
Ensure all string values in the JSON are properly escaped, especially any containing double quotes.`;

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
        const parsed = robustJsonParse(response.text);

        if (!parsed || !parsed.articles || !Array.isArray(parsed.articles)) {
            throw new Error("The AI did not return a valid JSON array for the news feed.");
        }

        return { articles: parsed.articles, groundingChunks };

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
                 config: {
                    tools: [{googleSearch: {}}],
                }
            }));
            return {
                type: 'pulse',
                title: 'Market Pulse',
                content: response.text,
            };
        } else { // 'news'
            const prompt = `Using your search tool, find the single most recent and impactful news headline related to the Forex market.
Your response MUST be a single, valid JSON object inside a \`\`\`json block. Do not include any text outside of the JSON block.
The object must have two keys: "headline" and "summary".
The "summary" must be a single, concise sentence.
Ensure all string values are properly escaped, especially any containing double quotes.`;
            const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            }));

            const parsed = robustJsonParse(response.text);

            if (parsed && parsed.headline && parsed.summary) {
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

export const generateMarketDynamicsData = async (apiKey: string): Promise<{
    strength: CurrencyStrengthData;
    volatility: VolatilityData[];
    topMovers: TopMoverData[];
    sentiment: MarketSentimentData;
}> => {
    const prompt = `Using your real-time search tool, provide a complete analysis of the current forex market dynamics. Current time: ${new Date().toUTCString()}.
Your response MUST be a single, valid JSON object inside a \`\`\`json block. Do not include any text outside of the JSON block.
The JSON object must contain the following keys: "strengths", "volatilityData", "movers", and "sentiment".
- "strengths": An array of objects for the 8 major currencies (USD, EUR, JPY, GBP, AUD, CAD, CHF, NZD), each with "currency" (string) and "strength" (number, from 0 to 10).
- "volatilityData": An array of 5 objects for the most volatile major forex pairs, each with "pair" (string) and "volatility" (number, score from 1-10).
- "movers": An array of 6 objects for the top 3 gaining and top 3 losing major forex pairs over the last 4 hours, each with "pair" (string) and "change_pct" (number). Sort from top gainer to top loser.
- "sentiment": An object with "sentiment" (string: 'Risk On', 'Risk Off', 'Neutral', 'Mixed'), "score" (number: 0-10), and "reasoning" (string).
Ensure all string values are properly escaped, especially any containing double quotes.`;

    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        }));

        const parsed = robustJsonParse(response.text);

        if (!parsed || !parsed.strengths || !parsed.volatilityData || !parsed.movers || !parsed.sentiment) {
            throw new Error("AI returned malformed market dynamics data.");
        }
        
        const strengthData: CurrencyStrengthData = {};
        for (const item of parsed.strengths) {
            if (item.currency && typeof item.strength === 'number') {
                strengthData[item.currency] = item.strength;
            }
        }
        
        if (Object.keys(strengthData).length === 0) {
             throw new Error("AI returned empty currency strength data.");
        }
        
        return {
            strength: strengthData,
            volatility: parsed.volatilityData,
            topMovers: parsed.movers,
            sentiment: parsed.sentiment,
        };

    } catch (error) {
        console.error("Error generating combined market dynamics data:", error);
        throw new Error(`The AI failed to provide a complete market dynamics overview. Please try again.`);
    }
};


export const generateMarketNarrative = async (apiKey: string, marketDataJson: string): Promise<string> => {
    const prompt = `You are a senior forex market analyst. Based on the following real-time market data, provide a concise, high-level narrative of what is happening in the market. Explain which currencies are strong or weak and why, identify any highly volatile pairs, and point out significant correlations that might be driving price action.

Market Data:
---
${marketDataJson}
---
`;
    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        }));
        return response.text;
    } catch (error) {
        console.error("Error generating market narrative:", error);
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
    const prompt = `The user is trading ${pair} on the ${timeframe} timeframe. Here is their strategy: "${userText}"`;

    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "You are a specialized system for parsing trading strategies. When given a user's strategy, you MUST use the 'parse_strategy' tool to extract its components. Your sole purpose is to call the provided tool. Do not respond with conversational text or any other content.",
                tools: [{ functionDeclarations: [parseStrategyFunctionDeclaration] }],
            },
        }));

        const functionCall = response.functionCalls?.[0];
        if (functionCall?.name === 'parse_strategy' && functionCall.args && Array.isArray(functionCall.args.entryCriteria) && functionCall.args.stopLoss && functionCall.args.takeProfit) {
            return {
                pair,
                timeframe,
                entryCriteria: functionCall.args.entryCriteria,
                stopLoss: functionCall.args.stopLoss,
                takeProfit: functionCall.args.takeProfit,
            };
        } else {
            console.error("Failed to get a valid 'parse_strategy' tool call. Model may have returned text instead. Response:", JSON.stringify(response, null, 2));
            throw new Error("AI could not parse the strategy. Please try describing it more clearly.");
        }

    } catch (error) {
        console.error("Error parsing strategy from text:", error);
        // The withRetry helper already throws user-friendly messages for rate limits, etc.
        // We only want to re-throw our specific parsing error if it happens.
        if (error instanceof Error && error.message.startsWith("AI could not parse")) {
             throw error;
        }
        // For other errors from the SDK or network, we can pass them along.
        throw error;
    }
};

const ohlcDataSchema = {
    type: Type.OBJECT,
    properties: {
        timestamp: { type: Type.NUMBER, description: "The millisecond timestamp for the candle, must be sequential." },
        open: { type: Type.NUMBER },
        high: { type: Type.NUMBER },
        low: { type: Type.NUMBER },
        close: { type: Type.NUMBER },
    },
    required: ['timestamp', 'open', 'high', 'low', 'close'],
};

const ohlcDataArraySchema = {
    type: Type.OBJECT,
    properties: {
        data: {
            type: Type.ARRAY,
            items: ohlcDataSchema,
            description: "An array of up to 500 candlestick data points."
        }
    },
    required: ['data']
};

export const getHistoricalDataWithSearch = async (apiKey: string, pair: string, timeframe: string, startDate: string, endDate: string): Promise<OhlcData[]> => {
    const prompt = `You are a financial data API. Use your search tool to find historical OHLC (Open, High, Low, Close) data for the forex pair ${pair} on the ${timeframe} timeframe, between ${startDate} and ${endDate}.
Search reliable financial data sources like Google Finance, Yahoo Finance, or others.
Return approximately 300-500 data points.
The timestamps must be in milliseconds and sequential.
You MUST return the data as a single JSON object that strictly adheres to the provided schema. Do not include any other text or explanations in your response.`;

    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: ohlcDataArraySchema,
            },
        }));
        
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);

        if (parsed.data && Array.isArray(parsed.data)) {
            // Sort to be safe, as AI might not always return it perfectly sorted
            return parsed.data.sort((a: OhlcData, b: OhlcData) => a.timestamp - b.timestamp);
        } else {
            throw new Error("AI returned malformed data for historical OHLC.");
        }

    } catch (error) {
        console.error("Error getting historical data with search:", error);
        throw new Error(`Failed to fetch historical data for ${pair}. The AI search may have failed or no data was found for the specified period.`);
    }
};

// @fix: Added generateSimulatedOhlcData function to act as a fallback when no market data API keys are available.
export const generateSimulatedOhlcData = async (apiKey: string, strategy: StrategyParams): Promise<OhlcData[]> => {
    const prompt = `You are a financial data simulator. Based on the following trading strategy for ${strategy.pair} on the ${strategy.timeframe} timeframe, generate a JSON array of 300 to 500 realistic OHLC candlestick data points that includes at least a few valid trade setups according to the strategy rules. The timestamps must be sequential.

Strategy:
- Entry Criteria: ${strategy.entryCriteria.join(', ')}
- Stop Loss: ${strategy.stopLoss}
- Take Profit: ${strategy.takeProfit}

Return ONLY the JSON object containing the data array. Do not include any other text or explanations.`;

    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: ohlcDataArraySchema,
            },
        }));
        
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);

        if (parsed.data && Array.isArray(parsed.data)) {
            // Sort to be safe, as AI might not always return it perfectly sorted
            return parsed.data.sort((a: OhlcData, b: OhlcData) => a.timestamp - b.timestamp);
        } else {
            throw new Error("AI returned malformed data for simulated OHLC.");
        }

    } catch (error) {
        console.error("Error generating simulated OHLC data:", error);
        throw new Error(`Failed to generate simulated data. The AI may have been unable to create a valid scenario for the described strategy.`);
    }
};

const backtestTradeLogSchema = {
    type: Type.OBJECT,
    properties: {
        entryTimestamp: { type: Type.NUMBER, description: "The millisecond timestamp of the trade entry." },
        exitTimestamp: { type: Type.NUMBER, description: "The millisecond timestamp of the trade exit." },
        entryPrice: { type: Type.NUMBER },
        exitPrice: { type: Type.NUMBER },
        outcome: { type: Type.STRING, enum: ['Win', 'Loss'] },
    },
    required: ['entryTimestamp', 'exitTimestamp', 'entryPrice', 'exitPrice', 'outcome'],
};

const backtestResultsSchema = {
    type: Type.OBJECT,
    properties: {
        totalTrades: { type: Type.NUMBER },
        winRate: { type: Type.NUMBER },
        profitFactor: { type: Type.NUMBER },
        avgRR: { type: Type.NUMBER },
        maxDrawdown: { type: Type.NUMBER },
        tradeLog: {
            type: Type.ARRAY,
            items: backtestTradeLogSchema,
        }
    },
    required: ['totalTrades', 'winRate', 'profitFactor', 'avgRR', 'maxDrawdown', 'tradeLog']
};

export const runBacktestOnHistoricalData = async (apiKey: string, strategy: StrategyParams, ohlcData: OhlcData[]): Promise<BacktestResults> => {
    const dataSubset = ohlcData.slice(-500);

    const prompt = `You are a quantitative analyst and a sophisticated backtesting engine specializing in Smart Money Concepts (SMC).
    Your task is to analyze a provided dataset of historical OHLC data and execute trades based on a user-defined strategy.

    Strategy Details:
    - Pair: ${strategy.pair}
    - Timeframe: ${strategy.timeframe}
    - Entry Logic: ${strategy.entryCriteria.join(', ')}
    - Stop Loss Logic: ${strategy.stopLoss}
    - Take Profit Logic: ${strategy.takeProfit}

    Historical OHLC Data (JSON format):
    ${JSON.stringify(dataSubset)}

    Instructions:
    1.  Analyze the OHLC data candle-by-candle.
    2.  Identify every point where the user's Entry Logic is met.
    3.  For each valid entry, determine the outcome: would the trade have hit the Stop Loss or the Take Profit first? Use the provided logic to determine these levels. Assume subsequent candles determine the outcome.
    4.  Log every trade you take in the 'tradeLog' array.
    5.  After analyzing all data, calculate the final performance metrics: totalTrades, winRate (percentage), profitFactor, avgRR (average risk-to-reward ratio of winning trades), and maxDrawdown (percentage).
    6.  Return the final results as a single JSON object that conforms to the schema. The 'tradeLog' must not be empty if trades were found.`;
    
    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: backtestResultsSchema,
                thinkingConfig: { thinkingBudget: 32768 }
            },
        }));

        const jsonText = getTextFromResponse(response).trim();
        const parsed = JSON.parse(jsonText);

        if (parsed.totalTrades !== undefined && parsed.winRate !== undefined) {
            return parsed;
        } else {
            throw new Error("AI returned malformed backtest results.");
        }

    } catch (error) {
        console.error("Error running backtest:", error);
        throw error;
    }
};

export const analyzeBacktestResults = async (apiKey: string, strategy: StrategyParams, results: BacktestResults): Promise<string> => {
    const prompt = `You are an expert trading coach. A student has just backtested the following strategy and received the results below. Provide concise, actionable feedback.

    Strategy Tested:
    - Logic: ${strategy.entryCriteria.join(', ')}
    - Stop Loss: ${strategy.stopLoss}
    - Take Profit: ${strategy.takeProfit}

    Backtest Results:
    - Total Trades: ${results.totalTrades}
    - Win Rate: ${results.winRate.toFixed(1)}%
    - Profit Factor: ${results.profitFactor.toFixed(2)}
    - Average R:R of Wins: 1:${results.avgRR.toFixed(2)}
    - Max Drawdown: ${results.maxDrawdown.toFixed(1)}%

    Your feedback should be structured in markdown with two sections:
    1.  **### Performance Summary:** A brief, one-paragraph summary of the results. Is the strategy profitable? Is it robust?
    2.  **### Suggestions for Improvement:** Provide 2-3 specific, actionable bullet points on how the student could potentially improve these results. For example, suggest filtering for higher timeframe alignment, being more selective with POIs, or adjusting the risk-to-reward targets.`;

    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 }
            }
        }));
        return getTextFromResponse(response);
    } catch (error) {
        console.error("Error analyzing backtest results:", error);
        throw error;
    }
};

export const analyzeLiveChart = async (apiKey: string, userPrompt: string, files: { data: string; mimeType: string }[]): Promise<AnalysisResult> => {
    const systemInstruction = `You are an expert forex trading mentor specializing in Smart Money Concepts (SMC) and ICT methodologies. Analyze the user-uploaded chart image(s) and their optional text prompt. Your goal is to provide a comprehensive trade analysis.

Your analysis MUST include:
1.  **Context:** Use your real-time search tool to find the current market narrative for the currency pair mentioned or shown. Is there recent news or data driving price?
2.  **Technical Analysis:** Identify key SMC concepts on the chart: market structure (BOS/CHoCH), **liquidity pools**, **order blocks**, **Fair Value Gaps (FVGs)**, and premium/discount zones. Be specific about their locations.
3.  **Critique of User's Analysis:**
    - If the user has provided their own analysis in the text prompt, critique it constructively.
    - **Crucially, examine the chart image for any user-drawn shapes, lines, or annotations.** If you find any, provide a detailed critique. Are their trendlines valid? Is their identified 'Order Block' correctly placed? Is their proposed entry logical? Be specific and educational in your feedback.
4.  **Trade Idea (if applicable):** If a valid setup exists (or if the user's setup can be improved), formulate a clear trade idea with an entry, stop loss, and take profit level. Explain your reasoning based on the technicals and market context.

Structure your response clearly in markdown. Use **bold** for key terms.`;

    try {
        const ai = getAiClient(apiKey);
        const parts: any[] = files.map(file => ({
            inlineData: {
                mimeType: file.mimeType,
                data: file.data,
            },
        }));

        if (userPrompt) {
            parts.push({ text: userPrompt });
        } else {
            parts.push({ text: "Analyze this chart for potential SMC trade setups. What do you see?" });
        }

        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts },
            config: {
                systemInstruction: systemInstruction,
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingBudget: 32768 }
            },
        }));

        return {
            text: getTextFromResponse(response),
            sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
        };

    } catch (error) {
        console.error("Error analyzing live chart:", error);
        throw error;
    }
};

// FIX: Add the missing analyzeGeneralImage function to resolve the import error in ImageAnalyzerView.
export const analyzeGeneralImage = async (apiKey: string, userPrompt: string, file: UploadedFile): Promise<string> => {
    try {
        const ai = getAiClient(apiKey);
        
        const parts: any[] = [{
            inlineData: {
                mimeType: file.mimeType,
                data: file.data,
            },
        }];

        if (userPrompt) {
            parts.push({ text: userPrompt });
        } else {
            parts.push({ text: "Describe this image in detail." });
        }

        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts },
        }));

        return getTextFromResponse(response);

    } catch (error) {
        console.error("Error analyzing general image:", error);
        throw error;
    }
};

export const getRealtimePriceWithSearch = async (apiKey: string, pair: string): Promise<number> => {
    const prompt = `Using your search tool, what is the current real-time price of the forex pair ${pair}? Respond with only the numerical price, nothing else. For example: 1.07123`;
    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        }));
        const price = parseFloat(response.text.replace(/,/g, ''));
        if (isNaN(price)) {
            throw new Error(`AI returned a non-numeric price: "${response.text}"`);
        }
        return price;
    } catch (error) {
        console.error(`Error fetching real-time price for ${pair} with Gemini:`, error);
        throw error;
    }
};

export const analyzeTradeJournal = async (apiKey: string, trades: TradeLog[]): Promise<string> => {
    const prompt = `You are an expert trading coach analyzing a student's trading journal. Based on the following trades, identify their biggest strengths, weaknesses, and any recurring patterns (good or bad). Provide specific, actionable advice for improvement. Pay close attention to patterns in pairs, setups, outcomes, and emotional states.

Trade Data (JSON):
---
${JSON.stringify(trades, null, 2)}
---

Structure your response in markdown format with these sections:
### Overall Performance Summary
### Key Strengths
### Areas for Improvement
### Actionable Steps`;
    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 }
            }
        }));
        return getTextFromResponse(response);
    } catch (error) {
        console.error("Error analyzing trade journal:", error);
        throw error;
    }
};

export const generateChartDataForLesson = async (apiKey: string, prompt: string, cacheKey?: string): Promise<OhlcData[]> => {
    const fullPrompt = `You are a financial data simulator. Based on the following educational concept, generate a JSON array of 100 to 150 realistic OHLC candlestick data points that clearly and simply illustrate the concept for a student. The timestamps must be sequential.

Concept: "${prompt}"

Return ONLY the JSON object containing the data array.`;
    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: ohlcDataArraySchema,
            },
        }));
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        if (parsed.data && Array.isArray(parsed.data)) {
            return parsed.data;
        } else {
            throw new Error("AI returned malformed OHLC data for lesson chart.");
        }
    } catch (error) {
        console.error("Error generating lesson chart data:", error);
        throw error;
    }
};

const multimediaSummarySchema = {
    type: Type.OBJECT,
    properties: {
        script: { 
            type: Type.STRING,
            description: "A concise, spoken-word voiceover script explaining the lesson content. Should be around 150-200 words."
        },
        storyboard: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    prompt: { 
                        type: Type.STRING,
                        description: "A detailed prompt for an image generation model to create a visual for this scene. The prompt should describe a dark-themed, educational, 16:9 infographic or chart."
                    },
                    duration: { 
                        type: Type.NUMBER,
                        description: "The estimated number of seconds this image should be displayed to match the script's pacing."
                    }
                },
                required: ['prompt', 'duration']
            },
            description: "An array of 5 to 7 scenes."
        }
    },
    required: ['script', 'storyboard']
};

export const generateMultimediaSummary = async (
    apiKey: string,
    lessonContent: string,
    onStatusUpdate: (status: string) => void
): Promise<{ script: string; images: string[]; storyboard: {prompt: string, duration: number}[] }> => {
    const ai = getAiClient(apiKey);

    try {
        onStatusUpdate('Generating script and storyboard...');
        const directorPrompt = `You are an expert educational content director. Your task is to take the following lesson and create a multimedia presentation. You must return a single JSON object with two keys: "script" and "storyboard".

1.  **script**: Write a concise, engaging voiceover script that summarizes the lesson in about 150-200 words.
2.  **storyboard**: Create an array of 5-7 "scenes". For each scene, provide a detailed "prompt" for an image generation AI to create a visual aid (infographic or chart), and a "duration" in seconds for how long that image should be displayed.

The visual style for all image prompts should be: 'dark-themed, educational, 16:9, visually clear, infographic style'.

Lesson Content:
---
${lessonContent}
---`;

        const directorResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: directorPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: multimediaSummarySchema,
            },
        }));

        const jsonText = directorResponse.text.trim();
        const parsed = JSON.parse(jsonText);

        if (!parsed.script || !Array.isArray(parsed.storyboard) || parsed.storyboard.length === 0) {
            throw new Error("AI director returned malformed script/storyboard data.");
        }

        const { script, storyboard } = parsed;

        onStatusUpdate('Generating scene visuals...');
        
        const imagePromises = storyboard.map((scene: any, index: number) => {
            onStatusUpdate(`Generating scene ${index + 1} of ${storyboard.length}...`);
            return generateMultimediaSceneImage(apiKey, scene.prompt);
        });

        const images = await Promise.all(imagePromises);

        return { script, images, storyboard };

    } catch (error) {
        console.error("Error generating multimedia summary:", error);
        throw error;
    }
};

const tradeLogParseSchema = {
    type: Type.OBJECT,
    properties: {
        pair: { 
            type: Type.STRING,
            description: "The currency pair discussed, e.g., 'EUR/USD' or 'GBP/JPY'."
        },
        direction: { 
            type: Type.STRING,
            enum: ['Buy', 'Sell'],
            description: "The direction of the trade idea, either 'Buy' or 'Sell'."
        },
        setup: { 
            type: Type.STRING,
            description: "A concise, one-sentence summary of the reason for the trade, e.g., 'Entry on FVG after a 15M change of character'."
        },
    },
};

export const parseTradeLogFromAnalysis = async (apiKey: string, analysisText: string): Promise<Partial<TradeLog>> => {
    const prompt = `You are a system that extracts structured data from a forex trade analysis. Based on the following text, extract the currency pair, the trade direction (Buy or Sell), and a concise summary of the trade setup.
    
    The analysis might describe a hypothetical trade idea. If any of these details are not clearly mentioned in the text, omit the corresponding key from your JSON response. For example, if the direction isn't clear, do not include the "direction" key.

    Analysis Text:
    ---
    ${analysisText}
    ---
    
    Return ONLY the JSON object.`;

    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: tradeLogParseSchema,
            },
        }));

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        return parsed as Partial<TradeLog>;

    } catch (error) {
        console.error("Error parsing trade log from analysis:", error);
        throw new Error("AI could not extract trade details from the analysis. Please log it manually.");
    }
};