
import { GoogleGenAI, Type } from "@google/genai";

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
    
    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
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