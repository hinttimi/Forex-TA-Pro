# Refactoring Roadmap: From Learning App to Alpha Intelligence Platform

This document outlines the chronological development plan to evolve the Forex TA Pro application from a reactive educational tool into a proactive, alpha-generating intelligence platform. The goal is to build a system that continuously ingests market data, analyzes it for early signals, and presents actionable intelligence to the user.

---

### Guiding Principles

1.  **Phased Approach:** We will start with small, frontend-focused changes and progressively build towards the more complex backend and AI systems. This allows for incremental progress and continuous value delivery.
2.  **Free Data Sources:** All data ingestion will rely on free methods, primarily leveraging the Gemini API's `googleSearch` tool and, in later stages, custom backend scraping/crawling. No paid data APIs will be required.
3.  **Leverage Existing Components:** We will enhance and repurpose current views like the **Intelligence Hub**, **AI Mentor**, and **AI Strategy Lab** to serve as the primary interfaces for the new intelligence features.
4.  **Hybrid API Key Architecture:** To ensure scalability and manage costs, the platform will use a dual-key system. A private pool of "admin" keys will power the backend's continuous analysis, while each user will provide their own API key for personal, on-demand AI interactions on the frontend.

---

## Phase 1: UI & Structural Refactoring (The "Crawl" Phase)

**Goal:** Align the current app's structure and language with the new, intelligence-first vision. This phase involves only frontend changes.

#### ✅ Task 1.1: Rebrand the Dashboard to "Intelligence Hub"

-   **Status:** **Completed.**
-   **Action:** Rename `DashboardView.tsx` to `IntelligenceHubView.tsx` and update all navigation links (`Sidebar.tsx`, `BottomNavBar.tsx`) and internal references (`App.tsx`, `types.ts`, `services/geminiService.ts`).
-   **Outcome:** The "Intelligence Hub" is now established as the app's new focal point and default landing page.

#### Task 1.2: Redesign the Intelligence Hub View

-   **Action:** Modify `components/IntelligenceHubView.tsx`.
-   **Details:**
    1.  De-emphasize the "Up Next" lesson card. It should still be present but should not be the primary call to action.
    2.  Introduce a new, prominent component placeholder named `AlphaStream.tsx`. This will be the future home for the real-time narrative feed. For now, it can be a static component explaining the upcoming feature.
    3.  The "Weekly Market Briefing" component should remain, as it aligns with the goal of providing timely market intelligence.
-   **Outcome:** The user's primary focus shifts from a linear learning path to a dynamic intelligence feed, setting the stage for the next phase.

---

## Phase 2: Building the "Mouthpiece" (Frontend AI Integration)

**Goal:** Begin displaying proactive intelligence to the user. In this phase, the intelligence is generated on-demand when the user visits the Hub.

#### Task 2.1: Create the "Alpha Stream" Component

-   **Action:** Create a new file `components/AlphaStream.tsx`.
-   **Details:**
    1.  This component will be responsible for fetching and displaying emerging market narratives.
    2.  Create a new function in `services/geminiService.ts` called `generateAlphaStream()`.
    3.  This new function will use the Gemini model with `googleSearch` enabled.
        -   **Prompt:** *"Act as a market intelligence analyst. Using Google Search, identify the top 3-5 emerging narratives or sentiment shifts in the Forex market right now. For each narrative, provide a title, a brief summary, a sentiment score from -1.0 (very bearish) to +1.0 (very bullish), and list 1-2 key drivers. Return this as a valid JSON array."*
        -   A strict JSON `responseSchema` must be used to ensure a predictable output.
    4.  The `AlphaStream.tsx` component will display a loading state while fetching, and then render a "Narrative Card" for each item in the returned JSON array.
    5.  Each Narrative Card must display the title, summary, and sentiment score (visualized as a simple bar or colored text).
-   **Outcome:** The first version of the proactive intelligence feed is live on the Intelligence Hub.

#### Task 2.2: Integrate the "Backtest this Narrative" Button

-   **Action:** Add a button to each Narrative Card in `AlphaStream.tsx`.
-   **Details:**
    1.  When clicked, this button will trigger the `onSetView` function, navigating the user to the `backtester` view.
    2.  It will pass a `params` object containing a pre-filled strategy description, like: `{ strategyDescription: "Backtest a strategy that aligns with the narrative: '[Narrative Title]'. For example, if the narrative is bullish for GBP, create a long strategy for GBP/USD." }`.
    3.  The `AIBacktesterView.tsx` component will be updated to properly handle this incoming `strategyDescription` from its `initialRequest` prop.
-   **Outcome:** The discovered "alpha" from the stream is now directly connected to an actionable tool, allowing users to immediately test its validity.

#### Task 2.3: Supercharge the AI Mentor

-   **Action:** Modify the `generateMentorResponse` function in `services/geminiService.ts`.
-   **Details:**
    1.  The function will now first call `generateAlphaStream()` to get the latest market narratives *before* it generates a response to the user's prompt.
    2.  A new section will be injected into the AI Mentor's system instruction: `"## Current Market Narratives\n[LATEST_NARRATIVES]"`.
    3.  The text from the fetched narratives will replace the `[LATEST_NARRATIVES]` placeholder.
-   **Outcome:** The AI Mentor becomes contextually aware of the current market state *before* the user even asks a question, enabling it to provide much more insightful and relevant answers.

---

## Phase 3: Building the "Ears" & "Brain" (Backend Cloud Functions)

**Goal:** Transition from on-demand analysis to a continuous, 24/7 intelligence pipeline using Firebase Cloud Functions.

#### Task 3.1: Create the "Data Ingestion" Cloud Function (The "Ears")

-   **Action:** Create a new scheduled Firebase Cloud Function (`onSchedule`).
-   **Details:**
    1.  The function will be scheduled to run every 15-30 minutes.
    2.  It will use the Gemini API with `googleSearch` to find raw, unstructured market chatter.
    3.  **Prompt:** *"Find the latest 10-15 news headlines, tweets from major financial analysts (e.g., search 'tweet from @[analyst_handle] on X'), and discussions on Reddit's r/forex about major currency pairs from the last hour. Return this as a raw list of text snippets."*
    4.  The function will save these raw text snippets to a new Firestore collection (e.g., `raw_market_data`).
-   **Outcome:** The platform begins to automatically and continuously listen to the market.

#### Task 3.2: Create the "AI Analysis" Cloud Function (The "Brain")

-   **Action:** Create a new Firestore-triggered Cloud Function (`onDocumentCreated`).
-   **Details:**
    1.  This function will automatically run whenever a new document is added to the `raw_market_data` collection.
    2.  It will take the raw text snippet and use Gemini to perform two tasks:
        -   **Keyword/Topic Extraction:** ("What are the key entities, currencies, and topics in this text?")
        -   **Sentiment Analysis:** ("Score the sentiment of this text from -1.0 to +1.0 regarding [extracted currency].")
    3.  The function will save this new, structured data (snippet, topics, sentiment score, timestamp) into a new `analyzed_market_data` collection in Firestore.
-   **Outcome:** Raw data is continuously processed into structured, analyzable information.

#### Task 3.3: Create the "Narrative Clustering" Cloud Function (The "Advanced Brain")

-   **Action:** Create a new, final scheduled Cloud Function (`onSchedule`) that runs every 5-10 minutes.
-   **Details:**
    1.  The function will fetch all `analyzed_market_data` from the last hour.
    2.  It will feed this data to Gemini with a powerful prompt: *"Given this list of analyzed market data points (text snippets, topics, sentiment), group them into 3-5 distinct, emerging narratives. For each narrative, create a title, a summary, a combined sentiment score, and detect any volume spikes (how many times the topic was mentioned). Return this as a JSON object."*
    3.  The function will save this final JSON output to a single, easily accessible document in Firestore (e.g., `market_intelligence/latest_narratives`).
-   **Outcome:** The platform now fully automates the creation of high-level, actionable intelligence.

#### Task 3.4: Refactor Frontend to Use Backend Data

-   **Action:** Modify `AlphaStream.tsx`.
-   **Details:**
    1.  Instead of calling the `generateAlphaStream()` function, the component will now establish a real-time listener to the `market_intelligence/latest_narratives` Firestore document using `onSnapshot`.
-   **Outcome:** The Intelligence Hub now updates automatically and instantly whenever the backend "Brain" discovers a new narrative, completing the transition to a fully proactive platform.

---

## Phase 4: Implementing the Hybrid API Key Architecture

**Goal:** Make the application scalable and production-ready by implementing a robust API key management strategy that separates backend processing from user-specific requests.

#### Task 4.1: Mandatory Onboarding for User API Keys

-   **Action:** Modify the application's entry point (`App.tsx` and `AuthContext.tsx`).
-   **Details:**
    1.  Currently, the app prompts for an API key if it's missing. This will be converted into a mandatory, full-screen onboarding step for all new users after they sign up.
    2.  We will create a new `OnboardingWizard.tsx` component that clearly explains *why* the key is needed (to power their personal AI tools), provides a direct link to Google AI Studio, and has a single input field to save the key.
    3.  The main `App.tsx` will render this wizard instead of the main app until a key has been successfully saved to the user's Firestore profile.
-   **Outcome:** Every user has their own API key from the start, ensuring all subsequent frontend AI interactions are tied to their personal quota.

#### Task 4.2: Refactor Frontend Services to Use User-Specific Keys

-   **Action:** Update every function in `services/geminiService.ts`.
-   **Details:**
    1.  Every function that makes a call to the Gemini API (`generateLessonSummary`, `generateChartImage`, `generateMentorResponse`, etc.) currently accepts an `apiKey` as an argument.
    2.  This is already the correct pattern. We will ensure that every call to these functions throughout the app correctly pulls the user's key from our `useApiKey` hook and passes it down.
-   **Outcome:** All frontend AI usage is now correctly attributed to and paid for by the individual user, making the application's business model sustainable.

#### Task 4.3: Implement Backend Key Pooling

-   **Action:** Modify the Firebase Cloud Functions created in Phase 3.
-   **Details:**
    1.  We will store a pool of 2-3 "admin" API keys securely in Firebase's Secret Manager.
    2.  The Cloud Functions (`generateWeeklyContent`, and the new ingestion/analysis functions) will be updated to fetch this pool of keys.
    3.  A simple rotation or random selection logic will be added, so each function execution uses a different key from the pool.
    4.  Add basic error handling: if a call fails with a quota-related error, the function will automatically retry with the next key in the pool.
-   **Outcome:** The backend's continuous intelligence engine becomes more resilient to API rate limits and quota issues, ensuring consistent operation.

---

## Phase 5: Advanced Data Ingestion (Future Consideration)

**Goal:** Grant the AI agent a long-term "memory" of daily price action by scraping chart data.

#### Task 5.1: Daily Chart Data Scraping

-   **Action:** Implement a backend process (e.g., a daily scheduled Cloud Function) using a headless browser library like Puppeteer.
-   **Details:**
    1.  The function will navigate to a free charting source (e.g., Yahoo Finance).
    2.  It will take a screenshot of the daily candle for major pairs (EUR/USD, XAU/USD, etc.).
    3.  It will save these images to Firebase Storage, organized by date and pair.
-   **Outcome:** The platform builds a daily visual archive of market price action.

#### Task 5.2: AI Daily Review

-   **Action:** Create a new Cloud Function triggered by new images being saved to Firebase Storage.
-   **Details:**
    1.  The function will feed the new chart image to the Gemini Vision model (using one of the backend pool keys).
    2.  **Prompt:** *"This is the daily chart for [PAIR] on [DATE]. Describe the price action. What type of candle formed? Did it interact with any key levels? What does this imply for the next session?"*
    3.  This text-based analysis will be saved alongside the chart image in Firestore.
-   **Outcome:** The AI agent becomes perpetually "aware" of what happened in the market each day, building a long-term memory and a deeper, evolving understanding of price behavior.
