



import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { NewsArticle, MarketUpdate } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}
export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates educational content for a given lesson prompt.
 * @param prompt - The detailed prompt for the AI to generate content from.
 * @returns The generated text content.
 */
export const generateLessonContent = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating lesson content:", error);
    throw new Error("Failed to generate content from Gemini API.");
  }
};

/**
 * Generates a chart image based on a descriptive prompt.
 * @param prompt - The detailed prompt for the AI to generate an image from.
 * @returns A base64 encoded string for the generated image.
 */
export const generateChartImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '16:9',
        },
    });
    
    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;

    if (base64ImageBytes) {
        return `data:image/png;base64,${base64ImageBytes}`;
    } else {
        throw new Error("No image was generated.");
    }

  // FIX: Added missing curly braces for the catch block.
  } catch (error) {
    console.error("Error generating chart image:", error);
    throw new Error("Failed to generate image from Gemini API.");
  }
};

/**
 * Generates feedback for a user's simulated trade.
 * @param chartPrompt - The prompt used to generate the chart scenario.
 * @param tradeDetails - A string describing the user's trade (side, entry, SL, TP).
 * @returns The AI-generated feedback as a string.
 */
export const generateTradeFeedback = async (chartPrompt: string, tradeDetails: string): Promise<string> => {
    const prompt = `You are an expert trading mentor specializing in Smart Money Concepts. A student is practicing on a simulated chart that was generated with the prompt: "${chartPrompt}". The student placed the following trade: ${tradeDetails}.
Based on the visual patterns you were asked to generate, analyze the quality of this trade setup *before it plays out*. Is the entry logical relative to the Point of Interest? Is the stop loss placed in a safe location (e.g., below the swing low for a long)? Is the take profit targeting a realistic liquidity level? Provide clear, concise, and constructive feedback in markdown format. Start with a one-sentence summary (e.g., "This is a well-planned setup.") and then provide bullet points for your reasoning.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating trade feedback:", error);
        throw new Error("Failed to generate trade feedback from Gemini API.");
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

/**
 * Generates a multiple-choice quiz question based on lesson content.
 * @param lessonContentPrompt - The content prompt of the lesson to base the question on.
 * @returns A structured quiz question object.
 */
export const generateQuizQuestion = async (lessonContentPrompt: string): Promise<{ question: string; options: string[]; correctAnswer: string; }> => {
    try {
        const prompt = `Based on the following concept, create one multiple-choice question to test a user's understanding. The question should be clear and concise. Provide 4 options in total (one correct, three plausible distractors). Ensure the 'correctAnswer' field exactly matches one of the strings in the 'options' array. The options should be shuffled.

Concept: "${lessonContentPrompt}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizQuestionSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        
        if (parsed.question && Array.isArray(parsed.options) && parsed.correctAnswer && parsed.options.includes(parsed.correctAnswer)) {
            return parsed;
        } else {
            throw new Error("Generated JSON for quiz question is malformed.");
        }

    } catch (error) {
        console.error("Error generating quiz question:", error);
        throw new Error("Failed to generate quiz question from Gemini API.");
    }
};

/**
 * Generates a response for the AI Mentor chat, potentially including image analysis.
 * @param prompt - The user's text prompt.
 * @param base64Image - An optional base64 encoded image string.
 * @returns The AI-generated chat response.
 */
export const generateMentorResponse = async (prompt: string, base64Image?: string): Promise<string> => {
    const systemInstruction = `You are an expert forex trading mentor. Your primary expertise is in Smart Money Concepts (SMC) and Inner Circle Trader (ICT) methodologies, including liquidity, order blocks, fair value gaps (FVG), market structure (BOS, CHoCH), and premium/discount arrays.

In addition to your core SMC expertise, you are also skilled at identifying and explaining common classical technical analysis patterns. When you analyze a chart, look for:
- Head and Shoulders (and Inverse Head and Shoulders)
- Double and Triple Tops/Bottoms
- Triangles (Ascending, Descending, Symmetrical)
- Wedges (Rising and Falling)
- Flags and Pennants

When a user asks a question or provides a chart, analyze it through the lens of SMC concepts first, but also point out any classical patterns you see. Explain how these patterns relate to SMC principles. For example, you might explain a Head and Shoulders pattern as a visual representation of a liquidity sweep on the left shoulder and a market structure shift (CHoCH) at the neckline.

Provide clear, concise, and actionable feedback. Be encouraging and helpful. Use markdown for formatting.

When a visual explanation would be helpful, embed a chart generation request in your response using the format [CHART: a detailed, descriptive prompt for an image generation model]. For example: "A head and shoulders pattern looks like this [CHART: A dark-themed forex chart showing a clear head and shoulders top pattern after an uptrend, with the neckline clearly visible.]".`;
    
    try {
        const parts: any[] = [{ text: prompt }];

        if (base64Image) {
            // Strip the data URL prefix
            const match = base64Image.match(/^data:(image\/\w+);base64,(.*)$/);
            if (match) {
                const mimeType = match[1];
                const data = match[2];
                parts.unshift({
                    inlineData: {
                        mimeType,
                        data,
                    },
                });
            } else {
                console.error("Invalid base64 image format");
            }
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: {
                systemInstruction: systemInstruction,
            },
        });
        
        return response.text;
    } catch (error) {
        console.error("Error generating mentor response:", error);
        throw new Error("Failed to get response from AI Mentor.");
    }
};

/**
 * Generates a real-time forex market summary.
 * @returns The AI-generated market briefing as a markdown string.
 */
export const generateMarketPulse = async (): Promise<string> => {
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
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating market pulse:", error);
        throw new Error("Failed to generate market pulse from Gemini API.");
    }
};

/**
 * Fetches real-time forex news using Google Search grounding.
 * @returns An object containing a list of news articles and grounding metadata.
 */
export const getForexNews = async (): Promise<{ articles: NewsArticle[], groundingChunks: any[] }> => {
    const prompt = `You are a financial news aggregator. Using your search tool, find the top 5 most recent and impactful news articles related to the Forex market (major currency pairs like EUR/USD, GBP/USD, USD/JPY, etc.).
Return the result as a single, clean JSON array string. Each object in the array should have the keys: "headline", "summary", "sourceUrl", and "sourceTitle".
For the "summary", provide a concise 2-3 sentence overview.
Do not include any other text, explanations, or markdown formatting outside of the JSON string.
The entire response should be only the JSON array. Example: [{"headline": "...", "summary": "...", "sourceUrl": "...", "sourceTitle": "..."}]`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        });
        
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
        throw new Error("Failed to fetch news from Gemini API.");
    }
};

/**
 * Generates a random, concise market update snippet (either news or pulse).
 * @returns A structured market update object.
 */
export const generateMarketUpdateSnippet = async (): Promise<MarketUpdate> => {
    const choice = Math.random() > 0.5 ? 'pulse' : 'news';

    try {
        if (choice === 'pulse') {
            const prompt = `You are a senior forex market analyst. Provide only the "Overall Market Narrative" as a single, concise paragraph (2-3 sentences max). Do not include any titles, markdown, or other sections. The information should be based on the current time: ${new Date().toUTCString()}.`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            return {
                type: 'pulse',
                title: 'Market Pulse',
                content: response.text,
            };
        } else { // 'news'
            const prompt = `You are a financial news aggregator. Using your search tool, find the single most recent and impactful news headline related to the Forex market. Return the result as a single, clean JSON object string with keys: "headline" and "summary". The summary should be a single, concise sentence. Do not include any other text or markdown. Example: {"headline": "...", "summary": "..."}`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            });

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
        throw new Error("Failed to generate market update snippet from Gemini API.");
    }
};

/**
 * Analyzes the recent price movement for a given currency pair using Google Search.
 * @param pair The currency pair to analyze (e.g., "EUR/USD").
 * @returns An object containing the AI's analysis and the source URLs.
 */
export const analyzePriceMovement = async (pair: string): Promise<{ analysis: string, sources: any[] }> => {
    const prompt = `You are a senior forex market analyst. It is currently ${new Date().toUTCString()}. Using real-time information from your search tool, provide a concise analysis of the primary catalyst for the price movement of the **${pair}** currency pair within the **last 1-2 hours**.

Structure your response in markdown format as follows:
1. **Primary Driver:** A single, bolded sentence identifying the main reason for the move (e.g., **"A higher-than-expected US CPI print is causing significant USD strength."**).
2. **Key Details:** A bulleted list providing specific details, such as the data released, key figures, or quotes from officials.
3. **Market Reaction:** A brief paragraph describing how the market is interpreting this information and the resulting price action.
4. **Outlook:** A short, one-sentence outlook on the potential next move or what to watch for.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        });
        
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const analysis = response.text;

        return { analysis, sources };

    } catch (error) {
        console.error(`Error analyzing price movement for ${pair}:`, error);
        throw new Error("Failed to analyze price movement from Gemini API.");
    }
};