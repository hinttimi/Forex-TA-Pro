import {onSchedule} from "firebase-functions/v2/scheduler";
import {logger} from "firebase-functions";
import * as admin from "firebase-admin";
import {GoogleGenAI} from "@google/genai";

admin.initializeApp();

// Helper to get the current week number in UTC
const getWeekNumber = (d: Date): [number, number] => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const timeDiff = d.getTime() - yearStart.getTime();
  const dayOfYear = Math.floor(timeDiff / 86400000) + 1;
  const weekNo = Math.ceil(dayOfYear / 7);
  return [d.getUTCFullYear(), weekNo];
};

export const generateWeeklyContent = onSchedule({
  schedule: "every monday 06:00",
  timeZone: "UTC",
  secrets: ["GEMINI_API_KEY"],
}, async (event) => {
  logger.info("Starting weekly market briefing generation.");

  try {
    // 1. Initialize Gemini AI using the secret key
    const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

    // 2. Create the prompt for the AI
    const prompt = `
      Generate a "Weekly Forex Market Briefing" for the upcoming week.
      The briefing must be insightful, professional, and structured in
      markdown format. It should provide a high-level overview suitable
      for an intermediate trader.
      The briefing MUST contain the following sections exactly as titled:

      ### Key Themes for the Week
      (A paragraph identifying 2-3 major macroeconomic themes to watch.)

      ### Major Pairs to Watch
      (A bulleted list for EUR/USD, GBP/USD, and USD/JPY. For each pair,
      provide a brief technical outlook and mention key support/resistance
      levels.)

      ### High-Impact Events
      (A bulleted list of the top 3-5 most significant economic events
      scheduled for the week.)

      ### Trader's Mindset
      (A short, concluding paragraph on risk management or trading
      psychology.)
    `;

    // 3. Generate content from the model
    logger.info("Sending prompt to Gemini...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });

    const content = response.text;
    logger.info("Received content from Gemini.");

    // 4. Save the content to Firestore
    const [year, week] = getWeekNumber(new Date());
    const docId = `${year}-${week}`;
    const docRef = admin.firestore().collection("weeklyContent").doc(docId);

    await docRef.set({
      title: "Weekly Forex Market Briefing",
      content: content,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(
      `Successfully saved briefing to Firestore with ID: ${docId}`
    );
  } catch (error) {
    logger.error("Error generating weekly content:", error);
    // Re-throwing the error will mark the function execution as a failure
    throw error;
  }
});
