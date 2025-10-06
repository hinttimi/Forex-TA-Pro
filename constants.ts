import { Module } from './types';

export const MODULES: Module[] = [
  {
    title: 'Level 1: Foundation',
    lessons: [
       {
        key: 'l1-forex-basics',
        title: 'Forex Basics & Participants',
        contentPrompt: 'You are an expert forex trading mentor. Explain what the Forex market is to a complete beginner. Describe who the major participants are (central banks, institutional investors, retail traders) and why they trade. Keep it simple and use markdown for **bold** emphasis.',
        chartPrompt: 'A simple, clean infographic for a dark theme, illustrating the hierarchy of the forex market. At the top, show "Central Banks," then "Major Banks (Interbank Market)," then "Hedge Funds & Corporations," and at the bottom, "Retail Traders." Use simple icons for each.',
      },
      {
        key: 'l1-candlestick-anatomy',
        title: 'Candlestick Anatomy',
        contentPrompt: `You are an expert forex trading mentor. Explain Japanese candlesticks to a complete beginner.
1.  **Anatomy**: First, describe the body, wicks (shadows), and what bullish (green) and bearish (red) candles represent in terms of Open, High, Low, and Close prices.
2.  **The Story**: Explain that each candle tells a story of the battle between buyers and sellers within a specific time period.
3.  **Basic Patterns**: Introduce the idea that single or small groups of candles can form patterns that predict potential price moves. Briefly introduce the following key patterns as a "cheat sheet":
    *   **Doji**: Signals indecision, potential reversal.
    *   **Hammer / Hanging Man**: A long lower wick, signaling potential bullish reversal (Hammer) or bearish reversal (Hanging Man).
    *   **Engulfing (Bullish/Bearish)**: A powerful two-candle reversal pattern where the second candle completely "engulfs" the body of the first.
    *   **Morning Star / Evening Star**: A three-candle reversal pattern signaling a potential bottom (Morning) or top (Evening).
Explain that mastering these patterns is a key step to reading price action. Use markdown for **bold** emphasis.`,
        chartPrompt: 'A clear, educational image showing two Japanese candlesticks side-by-side on a dark background. One is a green bullish candle, the other a red bearish candle. Label the "Open", "High", "Low", and "Close" for each, as well as the "Body" and "Wick" (or "Shadow"). The style should be minimalist and professional for the main lesson.',
      },
      {
        key: 'l1-support-resistance',
        title: 'Basic Support & Resistance',
        contentPrompt: 'You are an expert forex trading mentor. Explain the concepts of **Support** (a price floor) and **Resistance** (a price ceiling) to a beginner. Describe how these levels are formed by previous highs and lows and their psychological importance in the market. Use markdown for emphasis.',
        chartPrompt: 'A clean, dark-themed candlestick chart showing price bouncing off a clear horizontal "Support" level multiple times. Also, show price getting rejected from a clear horizontal "Resistance" level multiple times. The levels should be clearly labeled.',
      },
    ],
  },
  {
    title: 'Level 2: Market Structure',
    lessons: [
      {
        key: 'l2-market-structure',
        title: 'Bullish & Bearish Structure',
        contentPrompt: 'You are an expert forex trading mentor. Explain market structure in an uptrend (creating **Higher Highs** and **Higher Lows**) and a downtrend (creating **Lower Lows** and **Lower Highs**). Explain that this structure is the foundation of reading the market\'s direction. Use markdown for **bold** emphasis.',
        chartPrompt: 'A clean, dark-themed line chart illustrating a clear uptrend with labels for "Higher High" (HH) and "Higher Low" (HL). Next to it, show a clear downtrend with labels for "Lower Low" (LL) and "Lower High" (LH). Use arrows to show the direction of the trend.',
      },
      {
        key: 'l2-bos',
        title: 'Break of Structure (BOS)',
        contentPrompt: 'You are a professional trading mentor specializing in Smart Money Concepts. Explain what a **Break of Structure (BOS)** is. Describe it as the moment price breaks a previous high in an uptrend, or a previous low in a downtrend, signaling a continuation of the trend. Use markdown for emphasis.',
        chartPrompt: 'A dark-themed forex candlestick chart showing an uptrend. Clearly label a "Higher High". Then show price breaking above that high and label the candle that breaks it as "BOS" (Break of Structure). Do a similar illustration for a downtrend breaking a "Lower Low".',
      },
       {
        key: 'l2-choch',
        title: 'Change of Character (CHoCH)',
        contentPrompt: 'You are a professional trading mentor specializing in Smart Money Concepts. Explain what a **Change of Character (CHoCH)** is. Contrast it with a BOS. Explain that a CHoCH is the *first* sign of a potential trend reversal, occurring when price breaks the *last* pullback level (e.g., the last Higher Low in an uptrend). Use markdown for emphasis.',
        chartPrompt: 'A dark-themed forex candlestick chart showing an uptrend with several Higher Highs and Higher Lows. Then, show the price failing to make a new Higher High and instead breaking the last Higher Low. Label this event clearly as "Change of Character" (CHoCH) with an arrow indicating a potential new downtrend.',
      },
    ],
  },
  {
    title: 'Level 3: Smart Money Liquidity',
    lessons: [
      {
        key: 'l3-what-is-liquidity',
        title: 'What is Liquidity?',
        contentPrompt: 'You are a professional trading mentor specializing in Smart Money Concepts. Explain what **liquidity** is in forex trading in simple terms. Describe it as pools of orders (especially stop-loss orders) that smart money (institutions) needs to fill their large positions. Use markdown for emphasis.',
        chartPrompt: 'An abstract, dark-themed diagram. On one side, show a large "Institution" icon with a big order book. On the other, show many small "Retail Trader" icons with stop-loss orders. Draw arrows showing the institution needing to absorb the retail orders to execute their trade.',
      },
       {
        key: 'l3-liquidity-pools',
        title: 'Buy-side & Sell-side Pools',
        contentPrompt: 'You are a professional trading mentor specializing in Smart Money Concepts. Explain **buy-side liquidity** (resting above old highs) and **sell-side liquidity** (resting below old lows). Explain that these are areas where traders place their stop-losses, creating predictable targets. Use markdown for emphasis.',
        chartPrompt: 'A dark-themed forex candlestick chart showing a clear price range. Use a dollar sign icon ($) to label the "Buy-side Liquidity" resting above a cluster of previous highs (resistance) and "Sell-side Liquidity" resting below a cluster of previous lows (support).',
      },
      {
        key: 'l3-liquidity-sweeps',
        title: 'Liquidity Sweeps (Stop Hunts)',
        contentPrompt: 'You are a professional trading mentor specializing in Smart Money Concepts. Explain a **liquidity sweep** or "stop hunt". Describe it as a rapid price move that spikes just above an old high or below an old low to trigger stop-loss orders, before aggressively reversing. Use markdown for emphasis.',
        chartPrompt: 'A dark-themed forex candlestick chart. Show a clear previous low. Illustrate a single candle with a long wick that pierces just below that low (label this "Liquidity Sweep" or "Stop Hunt") and then closes back above the low, indicating a reversal.',
      },
    ],
  },
  {
    title: 'Level 4: Order Blocks',
    lessons: [
       {
        key: 'l4-what-are-order-blocks',
        title: 'What are Order Blocks?',
        contentPrompt: 'You are a professional trading mentor specializing in Smart Money Concepts. Explain what an **Order Block** is. Describe it as the last opposing candle before a strong, impulsive move that breaks market structure. Explain its significance as a footprint of "smart money". Use markdown for emphasis.',
        chartPrompt: 'A dark-themed chart showing a strong upward move that breaks structure (a BOS). Highlight the last down-candle right before that explosive move and label it "Bullish Order Block".',
      },
       {
        key: 'l4-bullish-bearish-ob',
        title: 'Bullish vs Bearish Order Blocks',
        contentPrompt: 'You are a professional trading mentor specializing in Smart Money Concepts. Clearly define a **Bullish Order Block** (the last down candle before an up move that breaks structure) and a **Bearish Order Block** (the last up candle before a down move that breaks structure). Explain they are key points of interest for entries. Use markdown for emphasis.',
        chartPrompt: 'Two mini-charts on a dark background. The first highlights a "Bearish Order Block" - the last up-candle before a strong downward move that causes a BOS. The second highlights a "Bullish Order Block" - the last down-candle before a strong upward move that causes a BOS.',
      },
      {
        key: 'l4-ob-mitigation',
        title: 'Order Block Mitigation',
        contentPrompt: 'You are a professional trading mentor specializing in Smart Money Concepts. Explain the concept of **mitigation**. Describe how price often returns to a previously created Order Block to "mitigate" or re-balance the institutional orders at that level, providing a high-probability entry point. Use markdown for emphasis.',
        chartPrompt: 'A dark-themed forex candlestick chart. Highlight a "Bearish Order Block" and draw a rectangle around it, extending it to the right. Then show price returning to this zone later, touching the rectangle, and getting aggressively rejected downwards. Label the touch point as "Mitigation Entry".',
      },
    ]
  },
    {
    title: 'Level 5: Fair Value Gaps',
    lessons: [
       {
        key: 'l5-fvg',
        title: 'Identifying Fair Value Gaps',
        contentPrompt: 'You are a professional trading mentor specializing in Smart Money Concepts. Explain what a **Fair Value Gap (FVG)** or imbalance is. Describe it as an inefficient 3-candle pattern where there is a gap between the first candle\'s high and the third candle\'s low. Explain they act as a magnet for price. Use markdown for emphasis.',
        chartPrompt: 'A dark-themed forex candlestick chart showing a large, impulsive green candle. Highlight the gap between the wick of the candle before it and the wick of the candle after it. Label this area clearly as "Fair Value Gap" or "FVG".',
      },
       {
        key: 'l5-fvg-retest',
        title: 'FVG Retest Strategy',
        contentPrompt: 'You are a professional trading mentor specializing in Smart Money Concepts. Explain how Fair Value Gaps (FVGs) are used for entries. Describe that after an FVG is created, traders watch for price to retrace back into the gap to "rebalance" it. This retracement offers a high-probability entry point in the direction of the original impulsive move. Use markdown for emphasis.',
        chartPrompt: 'A dark-themed forex candlestick chart showing a "Fair Value Gap" being created. Use a dotted arrow to show how price later returns to trade into the FVG (but not necessarily fill it completely) before continuing its original move. Label the entry point.',
      },
    ]
  },
  {
    title: 'Level 6: Advanced Concepts',
    lessons: [
      {
        key: 'l6-ote',
        title: 'Optimal Trade Entry (OTE)',
        contentPrompt: 'You are an expert ICT trading mentor. Explain the **Optimal Trade Entry (OTE)**. Describe it as using the Fibonacci tool, drawing from the swing low to high (or vice versa). The OTE is the "sweet spot" for an entry, typically between the 62% and 79% retracement levels, often aligning with an Order Block or FVG. Use markdown for emphasis.',
        chartPrompt: 'A dark-themed candlestick chart showing a major swing from a low to a high. A Fibonacci retracement tool is drawn on this swing. Highlight the area between the 0.62 and 0.79 levels and label it "OTE". Show price retracing into this zone and then reversing.',
      },
      {
        key: 'l6-inducement',
        title: 'Inducement (Smart Money Traps)',
        contentPrompt: 'You are an expert ICT trading mentor. Explain the concept of **Inducement**. Describe it as a small, seemingly obvious pullback (like a minor support/resistance level) designed to lure in early or impatient traders (the "inducement"). Smart money then sweeps the liquidity from these early positions before moving to the true point of interest. Use markdown for emphasis.',
        chartPrompt: 'A dark-themed candlestick chart showing a downtrend. A minor pullback creates a small high. Label this "Inducement". Show price coming up, breaking this minor high (sweeping liquidity), and *then* tapping into a true "Bearish Order Block" located slightly higher, before the real move down begins.',
      },
    ]
  },
   {
    title: 'Level 7: Complete Strategy',
    lessons: [
       {
        key: 'l7-entry-model',
        title: 'The Full A-Grade Setup',
        contentPrompt: 'You are an expert ICT trading mentor. Outline a complete, high-probability trade setup checklist. 1. **Higher Timeframe Direction**: Is it bullish or bearish? 2. **Liquidity Grab**: Wait for a sweep of a key low or high. 3. **Lower Timeframe Reversal**: Look for a **Change of Character (CHoCH)** after the sweep. 4. **Entry Point**: Identify a resulting **Order Block** or **Fair Value Gap (FVG)** to enter on. Use markdown for emphasis.',
        chartPrompt: 'A series of two connected dark-themed charts. The first, labeled "4H Chart", shows a clear uptrend. Circle a specific higher low. The second chart, labeled "15M Chart (Zoomed in)", shows price first dipping below that 4H low (label this "Liquidity Grab"). Then, show price aggressively moving up, causing a "CHoCH". Highlight an "Order Block" that formed and label "Potential Entry Zone".',
      },
      {
        key: 'l7-risk-management',
        title: 'Risk Management & Sizing',
        contentPrompt: 'You are an expert trading mentor. Explain the vital importance of **Risk Management**. Cover the 1-2% rule (never risk more than 1-2% of your account on a single trade). Explain how to place a **stop-loss** logically (e.g., below the low of an Order Block) and how to calculate **position size** based on stop-loss distance and risk percentage. Use markdown for emphasis.',
        chartPrompt: 'A simple, dark-themed infographic. Show a pie chart representing a trading account, with a tiny 1% slice colored red and labeled "Max Risk per Trade". Next to it, show a sample trade with a clear "Entry" price, "Stop Loss" price, and "Take Profit" price, with the distance between Entry and Stop Loss labeled "Risk".',
      },
    ]
  },
  {
    title: 'Level 8: Mastery',
    lessons: [
       {
        key: 'l8-multi-timeframe',
        title: 'Multi-Timeframe Analysis',
        contentPrompt: 'You are an expert trading mentor. Explain the concept of **Multi-Timeframe Analysis**. Describe a top-down approach: use a **high timeframe** (e.g., Daily, 4H) to establish the overall trend and key levels, a **medium timeframe** (e.g., 1H, 15M) to find your setup and point of interest, and a **low timeframe** (e.g., 5M, 1M) to pinpoint the exact entry. Use markdown for emphasis.',
        chartPrompt: 'An image showing three charts side-by-side for a dark theme. Labeled "Daily", "1-Hour", and "5-Minute". The Daily chart shows a clear uptrend. The 1-Hour chart zooms in on a pullback to an order block within that uptrend. The 5-Minute chart zooms in further, showing a CHoCH at the order block for a precise entry signal.',
      },
       {
        key: 'l8-psychology',
        title: 'Trading Psychology',
        contentPrompt: 'You are an expert trading mentor. Discuss the critical role of **Psychology** in trading. Cover the main enemies of a trader: **Fear** (of losing, of missing out/FOMO), **Greed** (taking oversized positions, not taking profit), and the need for **Patience** and **Discipline** to follow your trading plan without deviation. Use markdown for emphasis.',
        chartPrompt: 'An abstract, dark-themed image. On one side, show a brain icon with chaotic lines labeled "Fear, Greed, FOMO, Impatience". An arrow points to a chart showing erratic, losing trades. On the other side, show a brain icon with calm, orderly lines labeled "Discipline, Patience, Strategy". An arrow points to a chart showing consistent, well-executed trades.',
      },
    ]
  }
];