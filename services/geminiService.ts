
import { GoogleGenAI, Type } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

  } catch (error) {
    console.error("Error generating chart image:", error);
    throw new Error("Failed to generate image from Gemini API.");
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
