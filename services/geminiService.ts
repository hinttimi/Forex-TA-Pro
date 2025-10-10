

import { GoogleGenAI, Type, GenerateContentResponse, GenerateImagesResponse, FunctionDeclaration, Modality } from "@google/genai";
// FIX: Add missing type imports
// FIX: Corrected typo from TopMoverData to TopMoverData
import { NewsArticle, MarketUpdate, EconomicEvent, MultipleChoiceQuestion, StrategyParams, BacktestResults, AnalysisResult, AppView, OhlcData, CurrencyStrengthData, VolatilityData, MarketSentimentData, TopMoverData, DailyMission } from '../types';
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

export const generateChartImage = async (apiKey: string, prompt: string, cacheKey?: string): Promise<string> => {
  try {
    const ai = getAiClient(apiKey);
    const fullPrompt = `${prompt} Generate the chart to fill the entire image canvas. Do not add any extra padding, margins, or borders around the chart. The final image must have a 16:9 aspect ratio.`;
    
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{ text: fullPrompt }]
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    }));
    
    const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
    const base64ImageBytes = imagePart?.inlineData?.data;

    if (base64ImageBytes) {
        const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
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
  description: 'Navigates the user to a specific tool and can optionally pre-fill parameters or execute an action. Use this to make the app feel agentic and responsive to user commands.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      toolName: {
        type: Type.STRING,
        description: "The name of the tool to navigate to or execute.",
        enum: [
            'dashboard', 'simulator', 'live_simulator', 'backtester', 'pattern', 'timed', 
            'canvas', 'market_dynamics', 'market_pulse', 'news_feed', 'market_analyzer', 
            'economic_calendar', 'trading_journal', 'trading_plan', 'saved', 'achievements', 'settings'
        ]
      },
      params: {
          type: Type.OBJECT,
          description: "Optional parameters to pass to the tool. For 'backtester', include 'pair', 'timeframe', 'period', and 'strategyDescription'. For 'market_analyzer', include 'pair'.",
          properties: {
              pair: { type: Type.STRING, description: "The currency pair for the tool, e.g., 'EUR/USD'" },
              timeframe: { type: Type.STRING, description: "The timeframe for the backtester, e.g., '15M' or '1H'" },
              period: { type: Type.STRING, description: "The historical period for the backtester, e.g., 'Last 6 Months'" },
              strategyDescription: { type: Type.STRING, description: "The user's strategy in their own words for the backtester."}
          }
      }
    },
    required: ['toolName'],
  },
};

export const generateMentorResponse = async (
    apiKey: string, 
    prompt: string, 
    completedLessonTitles: string[],
    personaId: string,
    file?: { data: string; mimeType: string }
): Promise<{ text: string; image?: string; groundingChunks: any[]; functionCalls?: any[] }> => {
    
    const useImageModel = file?.mimeType.startsWith('image/');
    
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
You are not just a chatbot; you are an agent that can help the user navigate and use the "Forex TA Pro" application. You can perform the following actions:
- Answer questions about forex trading, especially Smart Money Concepts.
- Analyze charts the user uploads.
- Use Google Search to find real-time market information.
- Generate new charts to explain concepts using the format \`[CHART: a detailed prompt...]\`.
- **Navigate the user around the app** by calling the \`executeTool\` function. When a user's request clearly maps to a tool, use it.

Here is a list of tools you can navigate the user to with \`executeTool\`:
- **dashboard**: The main home screen with progress and quick links.
- **simulator**: A practice environment where users analyze a static chart with a hidden outcome, place a trade, and get feedback.
- **live_simulator**: A real-time simulated price feed for practicing analysis on a moving chart.
- **backtester**: The AI Strategy Lab. Use this when a user says "backtest a strategy for me..." and pass their strategy description, pair, timeframe, and period in the \`params\`.
- **pattern**: A flashcard-style game to practice recognizing candlestick patterns. Good for requests like "let's practice patterns".
- **timed**: A timed quiz challenge covering all topics.
- **canvas**: A free-draw canvas where users can load a chart and draw their analysis.
- **market_dynamics**: A dashboard showing live currency strength, volatility, and market sentiment.
- **market_pulse**: A detailed AI-generated daily market briefing.
- **news_feed**: A feed of the latest forex news.
- **market_analyzer**: A tool to get an instant AI analysis of why a specific currency pair is moving. Use this when a user asks "why is EUR/USD moving?". Pass the pair in the \`params\`.
- **economic_calendar**: A calendar of important economic events.
- **trading_journal**: A tool for users to log their trades.
- **trading_plan**: A section for users to define and save their trading rules.
`;

    const systemInstructionForImageModel = `You are an expert forex trading mentor specializing in Smart Money Concepts (SMC). The user has uploaded a chart and is asking a question. Your task is to provide a text answer AND an edited version of the chart that visually explains your answer.
On the returned image, you MUST draw annotations like rectangles around order blocks, arrows for market direction, and text labels for key concepts like "Liquidity Sweep" or "BOS".
Return both your text explanation and the fully annotated image.`;
    
    const systemInstructionForTextModel = `${selectedPersona.systemInstruction}

---
## Application & User Context
You are an AI assistant deeply integrated within the "Forex TA Pro" learning application. You have complete knowledge of the app's structure, content, and your own capabilities.

${toolManifest}

### App Curriculum Overview
The app contains the following learning paths and lessons:
${curriculumOverview}

### User Progress
${completedLessonsText}
- Use this knowledge to tailor your explanations.
- If a user asks about a concept they haven't learned yet (e.g., Fair Value Gaps), you can say, "That's a great question. It's covered in the 'Foundation' path. Would you like me to explain it, or would you prefer to jump to that lesson?"
- Acknowledge their progress and be encouraging.
---
`;

    const systemInstruction = useImageModel ? systemInstructionForImageModel : systemInstructionForTextModel;


    try {
        const ai = getAiClient(apiKey);
        const contents: any = { parts: [{ text: prompt }] };
        if (file) {
            contents.parts.unshift({
                inlineData: { mimeType: file.mimeType, data: file.data },
            });
        }
        
        const modelName = useImageModel ? 'gemini-2.5-flash-image' : 'gemini-2.5-flash';
        
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                ...(useImageModel 
                    ? { responseModalities: [Modality.IMAGE, Modality.TEXT] }
                    : { tools: [{ functionDeclarations: [executeToolFunctionDeclaration] }, {googleSearch: {}}] }
                ),
            },
        }));

        if (useImageModel) {
            const textPart = response.candidates?.[0]?.content?.parts.find(p => p.text);
            const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
            const base64ImageBytes = imagePart?.inlineData?.data;
            return {
                text: textPart?.text || "Here is the annotated chart.",
                image: base64ImageBytes ? `data:image/png;base64,${base64ImageBytes}` : undefined,
                groundingChunks: [],
                functionCalls: [],
            };
        } else {
             return {
                text: response.text,
                groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
                functionCalls: response.functionCalls,
            };
        }
    } catch (error) {
        console.error("Error generating mentor response:", error);
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
            enum: ['simulator', 'live_simulator', 'backtester', 'pattern', 'canvas']
        },
        completion_criteria: {
            type: Type.STRING,
            description: "The key that corresponds to the completion event for this tool.",
            enum: ['simulatorRuns', 'pattern', 'timed', 'canvas', 'backtester', 'live_simulator']
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
- 'simulator': A static chart scenario. (completion_criteria: 'simulatorRuns')
- 'live_simulator': A live, moving chart. (completion_criteria: 'live_simulator')
- 'backtester': The AI Strategy Lab. (completion_criteria: 'backtester')
- 'pattern': A pattern recognition flashcard game. (completion_criteria: 'pattern')
- 'canvas': A free-draw chart analysis tool. (completion_criteria: 'canvas')

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

const robustJsonParse = (text: string) => {
    // First, try to find a markdown code block for JSON
    const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    let jsonStringToParse;
    if (markdownMatch && markdownMatch[1]) {
        jsonStringToParse = markdownMatch[1];
    } else {
        // If no markdown, find the first '{' or '[' and the last '}' or ']'
        const firstBrace = text.indexOf('{');
        const firstBracket = text.indexOf('[');
        
        if (firstBrace === -1 && firstBracket === -1) {
            throw new Error("No valid JSON object or array found in the AI's response.");
        }

        let start = -1;
        let end = -1;

        // Determine if we're looking for an object or an array based on which comes first
        if (firstBrace !== -1 && (firstBrace < firstBracket || firstBracket === -1)) {
            start = firstBrace;
            end = text.lastIndexOf('}');
        } else {
            start = firstBracket;
            end = text.lastIndexOf(']');
        }
        
        if (end === -1 || end < start) {
            throw new Error("Malformed JSON structure found in the AI's response.");
        }
        jsonStringToParse = text.substring(start, end + 1);
    }
    return JSON.parse(jsonStringToParse);
};


export const getForexNews = async (apiKey: string): Promise<{ articles: NewsArticle[], groundingChunks: any[] }> => {
    const prompt = `You are a financial news aggregator. Using your search tool, find the top 5 most recent and impactful news articles related to the Forex market (major currency pairs like EUR/USD, GBP/USD, USD/JPY, etc.).
Return ONLY a valid JSON object with a single key "articles", which is an array of objects. Each object should have the keys: "headline", "summary", "sourceUrl", and "sourceTitle". For the "summary", provide a concise 2-3 sentence overview. Do not include any other text, explanations, or markdown formatting.`;

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
        
        const parsed: { articles: NewsArticle[] } = robustJsonParse(response.text);

        if (!parsed.articles || !Array.isArray(parsed.articles)) {
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
            const prompt = `You are a financial news aggregator. Using your search tool, find the single most recent and impactful news headline related to the Forex market. Return ONLY a valid JSON object with keys: "headline" and "summary". The summary should be a single, concise sentence. Do not include any other text, explanations, or markdown formatting.`;
            const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            }));

            const parsed = robustJsonParse(response.text);

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

export const generateCurrencyStrengthData = async (apiKey: string): Promise<CurrencyStrengthData> => {
    const prompt = `You are a forex market data provider. It is currently ${new Date().toUTCString()}. Using your real-time search tool, find the relative strength of the 8 major currencies (USD, EUR, JPY, GBP, AUD, CAD, CHF, NZD).
Return ONLY a valid JSON object containing a single key "strengths", which is an array of objects. Each object must have a "currency" (string) and a "strength" (numerical score from 0 to 10). Do not include any other text, explanations, or markdown formatting.`;

    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        }));
        
        const parsed: { strengths: Array<{ currency: string, strength: number }> } = robustJsonParse(response.text);

        if (!parsed.strengths || !Array.isArray(parsed.strengths)) {
            throw new Error("AI returned malformed currency strength data.");
        }
        
        const strengthData: CurrencyStrengthData = {};
        for (const item of parsed.strengths) {
            if (item.currency && typeof item.strength === 'number') {
                strengthData[item.currency] = item.strength;
            }
        }
        
        return strengthData;

    } catch (error) {
        console.error("Error generating currency strength data:", error);
        throw new Error(`The AI failed to provide currency strength data. Please try again.`);
    }
};

export const generateVolatilityData = async (apiKey: string): Promise<VolatilityData[]> => {
    const prompt = `You are a forex market data provider. It is currently ${new Date().toUTCString()}. Using your real-time search tool, identify the 5 most volatile major forex pairs based on recent price action.
Return ONLY a valid JSON object with a single key "volatilityData", which is an array of objects. Each object must have a 'pair' (e.g., "GBP/JPY") and a 'volatility' score (a relative number from 1-10 where 10 is most volatile). Do not include any other text, explanations, or markdown formatting.`;

    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        }));

        const parsed: { volatilityData: VolatilityData[] } = robustJsonParse(response.text);

        if (parsed.volatilityData && Array.isArray(parsed.volatilityData)) {
            return parsed.volatilityData;
        }
        throw new Error("AI returned malformed volatility data.");
    } catch (error) {
        console.error("Error generating volatility data:", error);
        throw new Error(`The AI failed to provide volatility data. Please try again.`);
    }
};

export const generateTopMoversData = async (apiKey: string): Promise<TopMoverData[]> => {
    const prompt = `You are a forex market data provider. Your sole task is to use your search tool to find the top movers in the forex market and return the data in a specific JSON format.

Current Time: ${new Date().toUTCString()}

Instructions:
1. Identify the top 3 gaining and top 3 losing major forex pairs over the last 4 hours.
2. Format the output as a single, valid JSON object.
3. The JSON object must have a single key: "movers".
4. The value of "movers" must be an array containing exactly 6 objects.
5. Each object must have two keys: "pair" (string) and "change_pct" (number).
6. "change_pct" should be positive for gainers and negative for losers.
7. Sort the array from the top gainer to the top loser.

Example of the exact output format required:
{
  "movers": [
    { "pair": "GBP/JPY", "change_pct": 0.55 },
    { "pair": "EUR/JPY", "change_pct": 0.42 },
    { "pair": "AUD/USD", "change_pct": 0.31 },
    { "pair": "USD/CHF", "change_pct": -0.25 },
    { "pair": "NZD/USD", "change_pct": -0.38 },
    { "pair": "USD/CAD", "change_pct": -0.49 }
  ]
}

Return ONLY the valid JSON object. Do not include any other text, explanations, or markdown formatting.`;

    try {
        const ai = getAiClient(apiKey);
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        }));

        const parsed: { movers: TopMoverData[] } = robustJsonParse(response.text);

        if (parsed.movers && Array.isArray(parsed.movers)) {
            return parsed.movers;
        }
        throw new Error("AI returned malformed top movers data.");
    } catch (error) {
        console.error("Error generating top movers data:", error);
        throw new Error(`The AI failed to provide top movers data. Please try again.`);
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

export const generateMarketSentimentData = async (apiKey: string): Promise<MarketSentimentData> => {
    const prompt = `You are a forex market data provider. It is currently ${new Date().toUTCString()}. Using your real-time search tool, analyze the current overall market sentiment for forex trading. Consider major indices (like S&P 500), the VIX, commodity prices (like Gold and Oil), and recent news.
Return ONLY a valid JSON object with the keys "sentiment" (string enum: 'Risk On', 'Risk Off', 'Neutral', 'Mixed'), "score" (number from 0 to 10), and "reasoning" (string). Do not include any other text, explanations, or markdown formatting.`;

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

        if (parsed.sentiment && typeof parsed.score === 'number' && parsed.reasoning) {
            return parsed;
        }
        throw new Error("AI returned malformed market sentiment data.");
    } catch (error) {
        console.error("Error generating market sentiment data:", error);
        throw new Error(`The AI failed to provide market sentiment data. Please try again.`);
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
        }
    },
    required: ['data']
};


export const generateSimulatedOhlcData = async (apiKey: string, strategy: StrategyParams): Promise<OhlcData[]> => {
    const prompt = `You are a financial data simulator. Based on the following trading strategy, generate a realistic-looking JSON array of 200 OHLC data points for the ${strategy.timeframe} timeframe. The data MUST include at least one or two clear examples of a valid trade setup according to the strategy. The timestamps must be sequential and realistic for the timeframe (e.g., increasing by 15 minutes for a 15M timeframe).

Strategy:
- Pair: ${strategy.pair}
- Entry: ${strategy.entryCriteria.join(', ')}
- Stop Loss: ${strategy.stopLoss}
- Take Profit: ${strategy.takeProfit}

Return ONLY the JSON object containing the data array.`;

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
            return parsed.data;
        } else {
            throw new Error("AI returned malformed data for simulated OHLC.");
        }
    } catch (error) {
        console.error("Error generating simulated OHLC data:", error);
        throw error;
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
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: backtestResultsSchema,
            },
        }));

        const jsonText = response.text.trim();
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
            model: 'gemini-2.5-flash',
            contents: prompt,
        }));
        return response.text;
    } catch (error) {
        console.error("Error analyzing backtest results:", error);
        throw error;
    }
};

export const analyzeLiveChart = async (apiKey: string, userPrompt: string, files: { data: string; mimeType: string }[]): Promise<AnalysisResult> => {
    const systemInstruction = `You are an expert forex trading mentor specializing in Smart Money Concepts (SMC) and ICT methodologies. Analyze the user-uploaded chart image(s) and their optional prompt. Your goal is to identify high-probability trade setups or critique the user's analysis.

Your analysis MUST include:
1.  **Context:** Use your real-time search tool to find the current market narrative for the currency pair mentioned or shown. Is there recent news or data driving price?
2.  **Technical Analysis:** Identify key SMC concepts on the chart: market structure (BOS/CHoCH), liquidity pools, order blocks, FVGs, premium/discount zones.
3.  **Trade Idea (if applicable):** If a valid setup exists, formulate a clear trade idea with an entry, stop loss, and take profit level. Explain your reasoning based on the technicals and market context.
4.  **Critique (if applicable):** If the user has provided their own analysis in the prompt, critique it constructively.

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
            model: 'gemini-2.5-flash',
            contents: { parts },
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