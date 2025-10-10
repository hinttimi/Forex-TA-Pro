import { Module, LearningPath } from './types';

// The full course content is now organized into Learning Paths.
export const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'foundation',
    title: 'Universal Foundation',
    description: 'The mandatory prerequisite course covering the essential language of technical analysis.',
    isFoundation: true,
    modules: [
        {
            title: 'Foundation 1: The Trading Chart',
            lessons: [
              { 
                key: 'uf-m1-l1', 
                title: 'What is a Price Chart?', 
                content: `### Your Window into the Market's Mind

Welcome to the first step of your trading journey. Before we dive into complex strategies, we must learn to read the language of the market. The most fundamental tool for this is the **price chart**.

Think of a price chart as a battlefield map, recording the ongoing conflict between two forces: the **buyers (Bulls)**, who want to push the price higher, and the **sellers (Bears)**, who want to push it lower. Every line, every bar, and every candle is a footprint left behind from this battle. Our job as technical analysts is to interpret these footprints to understand who is winning and where the battle might go next.

A chart plots one simple thing: **price** against **time**. Let's break down its two core components.

#### 1. The Vertical Axis (Y-Axis): The "What" - Price

The vertical axis on the right side of your chart always represents **price**.

-   As you move **up** the chart, the price is increasing.
-   As you move **down** the chart, the price is decreasing.

But what does this price mean? For a currency pair like **EUR/USD**, the price (e.g., 1.0750) tells you how many US Dollars (the **quote currency**) it takes to buy one Euro (the **base currency**).

-   **If EUR/USD is rising**, it means the Euro is getting stronger, or the US Dollar is getting weaker (or both!). It takes more dollars to buy one Euro.
-   **If EUR/USD is falling**, it means the Euro is weakening, or the US Dollar is strengthening.

This axis is the scoreboard of the battle. It tells you the value of the asset at every single moment.

[CHART: A clean, educational infographic on a dark background showing a blank chart grid. Clearly label the vertical axis as 'Price (e.g., EUR/USD)' and the horizontal axis as 'Time'. Use a green arrow pointing up the price axis labeled 'Price Increasing (EUR Getting Stronger)' and a red arrow pointing down labeled 'Price Decreasing (EUR Getting Weaker)'. Use a blue arrow pointing right along the time axis labeled 'Time Moving Forward'.]

#### 2. The Horizontal Axis (X-Axis): The "When" - Time

The horizontal axis at the bottom of your chart represents **time**.

-   The chart always moves from **left to right**, from the past to the present.
-   The data on the far left is the oldest (historical price), and the data on the far right is the most recent.

This axis can be divided into different units, known as **timeframes**. You might look at a chart where each data point represents 1 minute, 1 hour, 1 day, or even 1 week. Think of timeframes like different zoom levels on a map:

-   **Higher Timeframes (e.g., Daily, Weekly):** These are like looking at a country from space. You see the major mountain ranges and rivers (the long-term trends) but miss the small towns.
-   **Lower Timeframes (e.g., 15-Minute, 1-Minute):** These are like a street-level view. You see every small turn and alleyway (the short-term fluctuations) but can easily lose sight of the bigger picture.

Mastering the use of different timeframes is a critical skill we'll develop later.

### The Story of the Chart

By combining price and time, a chart becomes a powerful historical document. It doesn't just show random lines; it tells a story of market psychology. By looking at a chart, you can begin to answer critical questions:

*   **Who is in control?** Are buyers or sellers dominating the market?
*   **How volatile is the market?** Are the price swings wild and unpredictable, or calm and orderly?
*   **Are there "memory" areas?** Are there specific price levels where the market has reacted strongly in the past? These are the clues that form the basis of support and resistance.

### A Professional's Secret

Beginners see a price chart as a squiggly line. Professionals see it as a **record of decisions**. Every rise is a collective decision by traders to buy, fueled by greed or opportunity. Every fall is a collective decision to sell, fueled by fear or profit-taking. Your goal is to stop seeing lines and start seeing the story of human emotion and decision-making on a massive scale.

Mastering these two simple axes is the most important step you will ever take. Every advanced concept, from "Order Blocks" to "Liquidity Sweeps," is built on this simple foundation of price and time.`
              },
              { 
                key: 'uf-m1-l2', 
                title: 'The Three Main Chart Types', 
                content: `### Different Ways to Tell the Same Story

Now that we understand the canvas of price and time, let's look at how the story of that battle between buyers and sellers is actually drawn. There are three primary ways to visualize price movement, each offering a different level of detail. Think of them as different ways to tell a story: a simple summary, a detailed outline, or the full, unabridged novel.

#### 1. The Line Chart: The Simplest Narrative

The simplest and most familiar chart type is the **line chart**. It's created by connecting a series of data points with a line. In trading, those data points are almost always the **closing price** for each period.

- **What it shows:** The general trend and flow of the market over time.
- **Analogy:** A line chart is like reading the back cover of a book. It gives you the main plot points and the overall direction of the story without any of the nuanced details, dialogue, or character struggles within each chapter.
- **Best Use:** Identifying long-term trends and major support and resistance levels without the "noise" of intra-period price swings.

#### 2. The Bar Chart (OHLC): Adding Key Details

The bar chart provides significantly more information. For each time period, it displays four key pieces of data, known as **OHLC**:

-   **O**pen: The price at the beginning of the period.
-   **H**igh: The highest price reached during the period.
-   **L**ow: The lowest price reached during the period.
-   **C**lose: The price at the end of the period.

Each period is represented by a vertical line, with a small horizontal tick on the left for the open price and a small horizontal tick on the right for the close price.

- **What it shows:** The full trading range of the period, plus the opening and closing prices.
- **Analogy:** A bar chart is like a detailed, chapter-by-chapter summary of the book. You know where each chapter started and ended, and the highest and lowest points of the drama within it, but you still have to look closely to understand the emotional tone.

[CHART: A clean, educational infographic on a dark background showing three mini-charts side-by-side, all displaying the same simple up-and-down price movement. Clearly label them '1. Line Chart (Closing Prices)', '2. Bar Chart (OHLC)', and '3. Candlestick Chart (OHLC with Body)'. Use arrows on the Bar and Candlestick charts to point out the Open, High, Low, and Close.]

#### 3. The Candlestick Chart: The Visual Masterpiece

The candlestick chart displays the exact same OHLC data as a bar chart, but in a far more intuitive and visually powerful way.

- The wide part of the candle is called the **"real body."** It represents the range between the open and close price.
- The thin lines above and below the body are the **"wicks"** or **"shadows,"** representing the high and low.
- The **color** of the body instantly tells you if the price closed higher than it opened (bullish, usually green) or lower than it opened (bearish, usually red).

- **What it shows:** The full OHLC data, with an immediate visual representation of momentum and direction.
- **Analogy:** The candlestick chart is the full, unabridged novel, complete with emotional cues. The color and size of the body tell you the tone of the chapter—was it a triumphant victory for the heroes (a big green candle) or a crushing defeat (a big red candle)?

We will focus almost exclusively on candlestick charts because they provide the most information in the most easily digestible format.

### A Professional's Secret

While 95% of analysis is done on candlestick charts, professionals still use line charts for one specific purpose: **identifying the true, underlying structure of the market.** By plotting only the closing prices on a high timeframe (like Daily or Weekly), a trader can cut through the "noise" of volatile wicks and see the most important price levels where the market has definitively closed. This provides a cleaner, more objective view of the long-term trend. `
              },
              { 
                key: 'uf-m1-l3', 
                title: 'Why Candlesticks Reign Supreme', 
                content: `### Reading the Psychology of the Market

If a price chart is a story, then candlesticks are the words that give it emotion, drama, and intent. While a bar chart gives you the facts (Open, High, Low, Close), a candlestick chart tells you the *story* of the battle within that period. This is why they are the preferred tool of nearly every professional price action trader.

Learning to read candlesticks is like learning to read the facial expressions and body language of the market. Let's explore why they are so powerful.

#### 1. The Power of Color: Instantaneous Insight

The most immediate advantage of a candlestick chart is its use of color.

-   A **green (bullish) candle** forms when the closing price is *higher* than the opening price.
-   A **red (bearish) candle** forms when the closing price is *lower* than the opening price.

This simple visual cue is incredibly powerful. At a single glance, you can see who won the battle for that period: the buyers or the sellers. A sea of green candles tells a story of overwhelming buying pressure, while a block of red candles shows dominant selling. This instant feedback is something a bar chart simply cannot provide.

#### 2. The Story of the Body: Gauging Momentum

The "real body" of the candle (the thick part) tells you about the force and conviction behind the price move.

-   **A long body** signifies a decisive victory. A long green body shows that buyers were in control from start to finish. A long red body shows that sellers dominated. It's a sign of strong **momentum**.
-   **A short body** signifies indecision or a weak push. It shows that despite the highs and lows, the price closed very near to where it opened. This represents a stalemate in the battle.

[CHART: A visually compelling, dark-theme chart split down the middle. On the left side, show complex price action using bar charts, labeled 'Bar Chart: Factual but Unintuitive'. On the right side, show the exact same price action using candlestick charts, labeled 'Candlestick Chart: Visual & Emotional Story'. Use glowing highlights on the candlestick side to emphasize a long green candle ('Strong Momentum') and a candle with a long upper wick ('Selling Pressure').]

#### 3. Wicks Tell Tales of Rejection

The wicks (or shadows) are the footprints of the battles that were fought but lost. They show us where the price *tried* to go but was ultimately rejected.

-   **A long upper wick** on a candle tells you that buyers tried to push the price much higher, but sellers overwhelmed them and forced the price back down before the period closed. It's a sign of **selling pressure**.
-   **A long lower wick** tells the opposite story. Sellers tried to force the price down, but buyers stepped in with strength, pushing the price back up. It's a sign of **buying pressure**.

By combining the story of the body with the story of the wicks, you get a complete psychological profile of each trading session. A small body with long wicks on both sides, for example, paints a clear picture of intense conflict and massive indecision.

### A Professional's Secret

Beginners often get lost trying to memorize dozens of named candlestick patterns like "Three White Soldiers" or "Dark Cloud Cover." Professionals don't memorize patterns; they **read the story**. Instead of asking "What is this pattern called?", they ask "What does this candle tell me about the fight between buyers and sellers?".

A long red candle with no lower wick tells a story of absolute seller dominance. A candle with a tiny body and a huge lower wick tells a story of sellers trying to take control but being powerfully rejected by a flood of buyers. Learn to read the story of each candle, and you will understand the market's intentions without needing to memorize a single pattern name.` 
              },
              { 
                key: 'uf-m1-l4', 
                title: 'Demystifying Timeframes', 
                content: `### The Art of Zooming In and Out

Every trading decision you make will be influenced by your chosen **timeframe**. Think of a trading chart as a map. You can't navigate a city using a map of the entire country, and you can't plan a cross-country trip using a street map of a single neighborhood. A trader must become skilled at using the right map for the right job.

#### 1. What Exactly is a Timeframe?

A timeframe simply defines the period of time that each individual candle or bar on your chart represents.

- On a **Daily (D1)** timeframe, each candle represents one full day of trading activity (Open, High, Low, Close).
- On a **1-Hour (H1)** timeframe, each candle represents 60 minutes of trading.
- On a **5-Minute (M5)** timeframe, each candle represents 5 minutes.

The same overall price movement exists on all timeframes, but the level of detail you see changes dramatically.

#### 2. The Hierarchy: Higher vs. Lower Timeframes

Timeframes are generally grouped into a hierarchy, and understanding their relationship is crucial for successful analysis.

-   **Higher Timeframes (HTF):** Weekly (W1), Daily (D1), 4-Hour (H4). These are your "macro" views. They are used to identify the **overall trend, bias, and major structural levels.** They show the big picture but are too slow for precise trade entries.
    
-   **Lower Timeframes (LTF):** 1-Hour (H1), 15-Minute (M15), 5-Minute (M5), 1-Minute (M1). These are your "micro" views. They are used for **timing your entries and exits with precision.** Trading on these timeframes alone is like navigating in a fog; you can easily lose sight of the bigger market direction.

**Analogy:** Imagine planning a military campaign. The **General** uses the **Higher Timeframes** (a map of the whole country) to decide the overall strategy: "We are advancing north." The **Sergeant** on the ground uses the **Lower Timeframes** (a street-level map) to execute that strategy: "We will take cover behind this building and advance to the next street corner." The Sergeant's actions are always in service of the General's plan.

[CHART: A clean, educational infographic on a dark background. On the left, show a single, large, bullish (green) Daily candlestick. Clearly label its Open, High, Low, and Close. An arrow points from this candle to the right side of the image. On the right, show a series of 24 smaller 1-Hour candlesticks that represent the price action within that single day. Use annotations to show that the Open of the first H1 candle matches the Daily Open, the Close of the last H1 candle matches the Daily Close, and the highest and lowest points of the H1 sequence match the High and Low of the Daily candle. Label the left 'The Daily Candle (The Story)' and the right 'The 24 Hourly Candles (The Details)'.]

#### 3. The Fractal Nature of the Market

The most mind-bending and powerful concept related to timeframes is that markets are **fractal**. This means the patterns and structures you see on a high timeframe repeat on lower timeframes.

A downtrend on a Daily chart is made of smaller swings. If you zoom into one of those downward swings on an H1 chart, you will see it is itself a mini-trend, with its own series of lower lows and lower highs.

This is why the skills you learn are universal. The ability to spot a pattern on a 15-minute chart is the same skill used to spot it on a Weekly chart. The market's behavior is consistent across all scales.

### A Professional's Secret

The number one mistake beginners make with timeframes is "analysis paralysis." They flip between 10 different timeframes, get conflicting signals, and become confused.

Professionals simplify. They use a **3-timeframe system** for what's called **Top-Down Analysis**:

1.  **HTF (e.g., Daily):** "What is the overall market direction? Are we bullish or bearish?" This sets the **BIAS**.
2.  **MTF (e.g., H4 or H1):** "Where are the key price levels (zones) within that trend that I should be interested in?" This identifies the **AREA OF INTEREST**.
3.  **LTF (e.g., M15):** "Is there a specific entry signal happening at my zone right now?" This is for **EXECUTION**.

They decide their direction on the big map, find their location on the medium map, and time their entry on the small map. They *never* take a 15-minute buy signal if the Daily chart is in a clear downtrend.`
              },
              { 
                key: 'uf-m1-l5', 
                title: 'The World of Currency Pairs', 
                content: `### Trading the Global Economy

In the Forex market, you are never just buying or selling a single thing. You are always exchanging one currency for another. This is why they are always quoted in **pairs**. Understanding the structure of these pairs and their different categories is fundamental to knowing what you are trading.

#### 1. Base vs. Quote: The Core of a Pair

Every currency pair has two parts: the **Base Currency** and the **Quote Currency**. Let's use the world's most traded pair, **EUR/USD**, as our example.

**EUR / USD = 1.0750**

-   **Base Currency (EUR):** This is the first currency in the pair. It is the 'basis' for the trade. It always has a value of 1.
-   **Quote Currency (USD):** This is the second currency. Its value tells you how much of it is needed to buy one unit of the base currency.

So, a price of 1.0750 means it costs **1.0750 US Dollars** to buy **1 Euro**.

-   If the **EUR/USD chart is going UP**, it means the Euro (base) is getting stronger relative to the US Dollar (quote).
-   If the **EUR/USD chart is going DOWN**, it means the Euro (base) is getting weaker.

When you **BUY** EUR/USD, you are buying Euros and selling US Dollars. When you **SELL** EUR/USD, you are selling Euros and buying US Dollars.

#### 2. The Major Pairs: The Superhighways

The "Majors" are the most traded currency pairs in the world. They all involve the **US Dollar (USD)** on one side of the pair and are known for their extremely high liquidity.

**Analogy:** Think of these as the major interstate highways of the financial world. They have the most traffic, are the most efficient, and have the lowest "tolls" (spreads).

The seven major pairs are:
-   **EUR/USD** (Euro / US Dollar)
-   **GBP/USD** (British Pound / US Dollar) - "Cable"
-   **USD/JPY** (US Dollar / Japanese Yen) - "The Gopher"
-   **USD/CHF** (US Dollar / Swiss Franc) - "The Swissie"
-   **AUD/USD** (Australian Dollar / US Dollar) - "The Aussie"
-   **NZD/USD** (New Zealand Dollar / US Dollar) - "The Kiwi"
-   **USD/CAD** (US Dollar / Canadian Dollar) - "The Loonie"

[CHART: A sleek, dark-themed world map. Prominently highlight the regions and currency symbols for the USA (USD), Eurozone (EUR), UK (GBP), Japan (JPY), Switzerland (CHF), Australia (AUD), Canada (CAD), and New Zealand (NZD). Draw thick, brightly colored, glowing lines connecting the USD to all the other major currencies, labeling this group 'The Major Pairs (High Liquidity)'.]

#### 3. The Minor Pairs (Crosses): The National Highways

The "Minors" or "Cross-Currency Pairs" are pairs that do **not** involve the US Dollar. They consist of one major currency crossed with another.

**Analogy:** These are the national highways. They are still very busy and important but have slightly less traffic than the international superhighways.

Examples include:
-   **EUR/GBP** (Euro / British Pound)
-   **AUD/JPY** (Australian Dollar / Japanese Yen)
-   **GBP/CHF** (British Pound / Swiss Franc)

#### 4. The Exotic Pairs: The Country Roads

"Exotics" are pairs that consist of one major currency paired with the currency of an emerging or smaller economy.

**Analogy:** These are the winding, unpaved country roads. They can be scenic and offer big moves, but they are also unpredictable, have very high "tolls" (spreads), and can be illiquid, making them risky for new traders.

Examples include:
-   **USD/MXN** (US Dollar / Mexican Peso)
-   **EUR/TRY** (Euro / Turkish Lira)
-   **GBP/ZAR** (British Pound / South African Rand)

Beginners should stick exclusively to the Major pairs.

### A Professional's Secret

Professionals do not try to be a master of all pairs. They are **specialists**. Most successful retail traders focus deeply on just **1 to 3 currency pairs**. Why? Because each pair has its own unique "personality."

For example, **GBP/JPY** is known for being extremely volatile and fast-moving, while **EUR/CHF** is often much slower and tends to range more. By focusing on just a few pairs, a trader learns their specific behaviors, their typical reaction to news events, and their rhythm during different trading sessions. This specialization provides a significant edge over the trader who is randomly jumping between dozens of different markets they don't truly understand.`
              },
              { 
                key: 'uf-m1-l6', 
                title: 'Hands-On Chart Navigation', 
                // FIX: Replaced backticks ` with single quotes ' to prevent syntax errors.
                content: `### Your Cockpit: Mastering the Trading Platform

A trading platform is a trader's command center. It's where all analysis and execution happens. While platforms can seem intimidating at first with all their buttons and windows, the core functions you'll use every day are actually very simple.

This lesson is a basic orientation. The goal isn't to learn every feature, but to become comfortable with the essential controls for navigating a chart.

#### 1. The Instrument Selector: Choosing Your Market

Every platform has a place to select which asset you want to view. This is often a search bar or a "Market Watch" window. To view the chart for the Euro vs. US Dollar, you would type in its symbol: **EURUSD**.

- **Tip:** Most platforms use the currency codes without the slash. "EUR/USD" becomes "EURUSD", "GBP/JPY" becomes "GBPJPY".

#### 2. The Timeframe Selector: Changing Your View

Usually located at the top of the chart window, you will see a series of buttons for changing the timeframe. These are typically labeled:

- **M1, M5, M15, M30:** Minute timeframes.
- **H1, H4:** Hour timeframes.
- **D1:** Daily timeframe.
- **W1:** Weekly timeframe.
- **MN:** Monthly timeframe.

Clicking these buttons will instantly change your chart's perspective, with each candle representing the selected time period.

[CHART: An image of a generic, clean trading chart user interface on a dark theme. Use bright, numbered, glowing arrows and labels to point to the five key areas. 1 -> The top-left corner where a currency pair like 'EURUSD' is displayed, label it '1. Instrument Selector'. 2 -> A toolbar at the top with buttons for 'M15', 'H1', 'H4', 'D1', label it '2. Timeframe Selector'. 3 -> The main chart area, with a large transparent arrow showing a click-and-drag motion, label it '3. Scroll (Click & Drag Left/Right)'. 4 -> The price axis on the right, with a mouse scroll wheel icon, label it '4. Zoom (Scroll Mouse Wheel)'. 5 -> A simple toolbar on the far left with icons for a line, horizontal ray, etc., label it '5. Drawing Toolbar'.]

#### 3. Manipulating the Chart: Zooming and Scrolling

Getting a feel for the chart is essential. The two most common actions are:

-   **Scrolling Through Time:** Click and hold your mouse button on the main chart area and drag it to the **left**. This will move you back in time, revealing historical price data. Dragging to the right brings you back toward the most recent price.
-   **Zooming In and Out:** Use your mouse's **scroll wheel**. Scrolling up typically zooms in, showing you more detail on recent candles. Scrolling down zooms out, giving you a wider historical perspective. You can also use the zoom buttons (+/-) often found at the bottom of the chart.

Practice this! Scroll back a few years, then zoom in on a specific day. Comfort with chart navigation is key to efficient analysis.

#### 4. The Drawing Toolbar: Your Analytical Tools

Somewhere on your platform, usually on the left-hand side, is the drawing toolbar. This contains all the tools you will use to mark up your charts, such as:

-   Trendlines
-   Horizontal lines (for support and resistance)
-   Fibonacci retracement tools
-   Text notes and arrows

We will cover how to use these tools in great detail in later modules. For now, just know where to find them. Try selecting the trendline tool and drawing a simple line on your chart.

### A Professional's Secret

Every professional trader customizes their charting platform to create a clean, efficient, and distraction-free workspace. The very first things they do are:

1.  **Set a Clean Chart Theme:** They almost universally use a dark background (black or dark grey), with simple green/red or blue/red candles. They turn off any distracting grids or backgrounds. A clean chart leads to clear thinking.
2.  **Remove Clutter:** They remove any default indicators or panels they don't use. The goal is to maximize the space for what matters most: price.
3.  **Learn Hotkeys:** They learn the keyboard shortcuts for their most-used tools. Instead of clicking the trendline button every time, they might press 'Alt+T'. This dramatically speeds up the process of analyzing multiple charts and timeframes.

Your charting platform is your primary tool. Spend some time in the settings and personalize it to your liking.`
              },
            ],
          },
          {
            title: 'Foundation 2: The Language of Candlesticks',
            lessons: [
              { key: 'uf-m2-l1', title: 'Anatomy of a Candlestick', content: "Generate a detailed lesson on the anatomy of a single candlestick, explaining the meaning of the Open, High, Low, and Close (OHLC). [CHART: A clear, educational image showing two Japanese candlesticks side-by-side on a dark background. One is a green bullish candle, the other a red bearish candle. For each candle, use clear labels to point out the 'Open', 'High', 'Low', and 'Close'.]" },
              { key: 'uf-m2-l2', title: 'The Body and Wicks', content: "Generate a lesson focusing on interpreting the body and wicks (shadows) of a candlestick to decode market momentum and price rejection. [CHART: An image showing four candles: 1. Long body, short wicks (labeled 'Strong Momentum'). 2. Small body, long wicks (labeled 'Indecision/Volatility'). 3. Long upper wick (labeled 'Selling Pressure'). 4. Long lower wick (labeled 'Buying Pressure').]" },
              { key: 'uf-m2-l3', title: 'Bullish vs. Bearish Candles', content: "Generate a lesson explaining the clear difference between a bullish (close > open) and bearish (close < open) candle and what each signifies about buyer/seller control. [CHART: A simple side-by-side comparison of a green bullish candle and a red bearish candle, with arrows showing the direction of price movement from open to close for each.]" },
              { key: 'uf-m2-l4', title: 'Doji Candles', content: "Generate a lesson dedicated to the Doji candlestick pattern, explaining how it represents indecision and can signal a potential reversal or pause in a trend. [CHART: A forex chart showing a strong uptrend, followed by a clear Doji candle at the peak. An arrow points to the Doji with the text 'Indecision at the high'.]" },
              { key: 'uf-m2-l5', title: 'Hammer and Shooting Star', content: "Generate a lesson on the Hammer (bullish reversal) and Shooting Star (bearish reversal) single-candle patterns, explaining their formation and psychological meaning. [CHART: Two mini-charts. The first shows a downtrend ending in a Hammer. The second shows an uptrend ending in a Shooting Star. Both patterns should be clearly labeled.]" },
              { key: 'uf-m2-l6', title: 'Engulfing Patterns', content: "Generate a lesson on the powerful two-candle Bullish and Bearish Engulfing patterns, highlighting how they signify a strong and sudden shift in market momentum. [CHART: Two mini-charts. One showing a Bullish Engulfing pattern at a low. The other showing a Bearish Engulfing pattern at a high. The engulfing candle should be visually prominent.]" },
            ],
          },
          {
            title: 'Foundation 3: The Basics of Market Structure',
            lessons: [
               { key: 'uf-m3-l1', title: 'Defining Trends: Uptrends', content: "Generate a lesson explaining a bullish market structure, defined by a series of Higher Highs (HH) and Higher Lows (HL). [CHART: A clean line chart illustrating a clear uptrend. Use text labels to mark at least two 'Higher Highs' and two 'Higher Lows' in sequence.]" },
               { key: 'uf-m3-l2', title: 'Defining Trends: Downtrends', content: "Generate a lesson explaining a bearish market structure, defined by a series of Lower Lows (LL) and Lower Highs (LH). [CHART: A clean line chart illustrating a clear downtrend. Use text labels to mark at least two 'Lower Lows' and two 'Lower Highs' in sequence.]" },
               { key: 'uf-m3-l3', title: 'Ranging Markets', content: "Generate a lesson on identifying ranging (sideways) markets, explaining consolidation and how price moves between a defined support and resistance. [CHART: A candlestick chart showing price bouncing clearly between an upper resistance zone and a lower support zone. The zones should be drawn as rectangles.]" },
               { key: 'uf-m3-l4', title: 'Visual Guide to Drawing Trendlines', content: "Generate a practical lesson on how to draw valid trendlines to map out market structure, connecting the swing lows in an uptrend and swing highs in a downtrend. [CHART: An image showing an uptrend with a correctly drawn trendline connecting three swing lows. Also show an incorrectly drawn trendline cutting through candles, labeled 'Incorrect'.]" },
               { key: 'uf-m3-l5', title: 'Break of Structure (BOS)', content: "Generate a lesson introducing the concept of a Break of Structure (BOS), explaining how a new Higher High in an uptrend or Lower Low in a downtrend confirms trend continuation. [CHART: A candlestick chart of an uptrend. Label a 'Higher High', then show a later candle breaking and closing above it. Label this event 'Break of Structure (BOS)'.]" },
            ]
          },
          {
            title: 'Foundation 4: Support & Resistance',
            lessons: [
                { key: 'uf-m4-l1', title: 'Support as the Market\'s Floor', content: "Generate a lesson explaining the core definition and psychology of a support level, describing it as a zone of potential buying interest or demand. [CHART: A chart showing price falling to a specific level and bouncing off it multiple times. Draw a horizontal rectangle (zone) at this level and label it 'Support Zone (Demand)'.]" },
                { key: 'uf-m4-l2', title: 'Resistance as the Ceiling', content: "Generate a lesson explaining a resistance level, describing it as a price ceiling with selling interest or supply. [CHART: A chart showing price rising to a specific level and being rejected from it multiple times. Draw a horizontal rectangle (zone) and label it 'Resistance Zone (Supply)'.]" },
                { key: 'uf-m4-l3', title: 'Drawing Horizontal S&R Zones', content: "Generate a practical guide on how to draw support and resistance zones effectively, emphasizing using candle wicks and bodies and thinking in terms of zones, not thin lines. [CHART: An image showing a messy price chart area. A correctly drawn S&R zone is shown as a rectangle covering the wicks and bodies of the turning points, labeled 'Correct Zone'. A single thin line cutting through is labeled 'Incorrect Line'.]" },
                { key: 'uf-m4-l4', title: 'The Role Reversal Principle', content: "Generate a lesson on the critical concept of role reversal, where a broken resistance level becomes new support, and broken support becomes new resistance. [CHART: A chart showing a clear resistance level being broken. Price then pulls back to retest this level, which now acts as support before price moves higher. Label the 'Breakout', 'Retest', and 'New Support'.]" },
                { key: 'uf-m4-l5', title: 'Introducing Trendlines: Dynamic S&R', content: "Generate a lesson that introduces trendlines as a form of dynamic support (in an uptrend) and dynamic resistance (in a downtrend). [CHART: A chart showing a clear uptrend with a rising trendline connecting the lows, with price bouncing off it. Label the trendline 'Dynamic Support'.]" },
            ]
          },
          {
            title: 'Foundation 5: Introducing Volume',
            lessons: [
                { key: 'uf-m5-l1', title: 'What Volume Represents', content: "Generate a lesson explaining what the volume indicator represents: the amount of buying and selling commitment, and the fuel behind price moves. [CHART: An image of a candlestick chart with a volume indicator below it. An arrow connects a large green candle to a high green volume bar, labeled 'Strong Buying Commitment'.]" },
                { key: 'uf-m5-l2', title: 'Reading Volume Bars', content: "Generate a lesson on how to read volume bars, covering volume spikes (high activity), volume declines (waning interest), and average volume. [CHART: A chart with a volume indicator showing three distinct phases: 1. High volume spikes during a volatile move. 2. Low, declining volume during a correction. 3. Average volume during a steady trend.]" },
                { key: 'uf-m5-l3', title: 'Confluence of Volume and Price', content: "Generate a lesson explaining the confirmation rule: how rising volume in the direction of the trend confirms the trend's strength, while declining volume can signal weakness. [CHART: An uptrend chart where impulsive moves up are accompanied by high volume, and pullbacks occur on low volume. Use annotations to highlight this relationship.]" },
                { key: 'uf-m5-l4', title: 'High-Volume Breakouts', content: "Generate a lesson on how to use high volume to confirm a valid breakout of a support or resistance level, and how low-volume breakouts can be traps. [CHART: Two mini-charts. The first shows a resistance breakout on high volume, leading to a continued move up ('Valid Breakout'). The second shows a breakout on low volume, which quickly fails and reverses ('False Breakout/Trap').]" },
                { key: 'uf-m5-l5', title: 'Climax Volume', content: "Generate a lesson on identifying 'climax volume' - an extremely high volume spike at the end of a long trend, often signaling trend exhaustion and a potential reversal. [CHART: A chart showing a long downtrend that ends with a massive red candle on an enormous volume spike. Label this event 'Selling Climax Volume (Trend Exhaustion)'.]" },
            ]
          },
           {
            title: 'Foundation 6: Assembling Your Basic Trading Plan',
            lessons: [
                { key: 'uf-m6-l1', title: 'Top-Down Analysis', content: "Generate a step-by-step lesson on performing a basic top-down analysis, starting from a Daily chart to find the trend, and moving to a 1-Hour chart to find an area of interest. [CHART: An infographic with two connected chart images. Left: A Daily chart showing a clear uptrend. Right: A 1-Hour chart zooming in on a pullback within that uptrend, highlighting a support zone.]" },
                { key: 'uf-m6-l2', title: 'Risk Management Essentials', content: "Generate a lesson on the absolute basics of risk management, focusing on the 1-2% rule and the concept of position sizing. [CHART: A simple infographic showing a pie chart of a trading account. A tiny 1% slice is colored red and labeled 'Max Risk per Trade'. The rest is green and labeled 'Capital Preserved'.]" },
                { key: 'uf-m6-l3', title: 'Setting Stop Loss and Take Profit', content: "Generate a practical lesson with rules for setting a logical Stop Loss (e.g., below a swing low) and a basic Take Profit (e.g., at the next resistance level). [CHART: A chart showing a long trade entry. A red line is placed below the recent swing low, labeled 'Logical Stop Loss'. A green line is placed at the next swing high, labeled 'Logical Take Profit'.]" },
                { key: 'uf-m6-l4', title: 'The Trading Journal', content: "Generate a lesson explaining the critical importance of a trading journal and provide a simple template for how to log a trade (Date, Pair, Direction, Reason, Outcome). [CHART: An image of a clean, simple digital trading journal entry form with fields for 'Pair', 'Setup', 'Outcome', and 'Notes'.]" },
                { key: 'uf-m6-l5', title: 'Building Your First Checklist', content: "Generate a lesson that helps a user build their first simple trading checklist, combining the concepts from the foundation course. [CHART: A clean infographic checklist with items like: '1. Is HTF Trend Clear?', '2. Is Price at a Valid S&R Zone?', '3. Is there a Candlestick Confirmation?', '4. Is my Risk Defined?']" },
            ]
          },
    ]
  },
  {
    id: 'wyckoff',
    title: 'Wyckoff Method',
    description: 'Master market cycles and institutional accumulation/distribution for cycle-based trading.',
    isFoundation: false,
    // FIX: Changed property from 'lessons' to 'modules' to match the LearningPath type.
    modules: [
        {
            title: 'Wyckoff 1: Core Laws & Cycles',
            lessons: [
                { key: 'wy-m1-l1', title: "Law of Supply and Demand", content: "Generate a lesson on Wyckoff's first law, the Law of Supply and Demand, explaining how it governs all price movements. [CHART: An abstract diagram showing a seesaw. On one side, a large 'Demand' block pushes the price up. On the other, a large 'Supply' block pushes it down.]" },
                { key: 'wy-m1-l2', title: "Law of Cause and Effect", content: "Generate a lesson on Wyckoff's second law, Cause and Effect, explaining how the time spent in a trading range (the cause) determines the extent of the subsequent trend (the effect). [CHART: A chart showing a long trading range (labeled 'Cause') followed by a large, extended trend move (labeled 'Effect'). A second chart shows a short range followed by a short trend.]" },
                { key: 'wy-m1-l3', title: "Law of Effort vs. Result", content: "Generate a lesson on Wyckoff's third law, Effort vs. Result, focusing on how to spot divergences between volume (effort) and price action (result) to anticipate reversals. [CHART: A chart showing an uptrend where price makes a new high, but the corresponding volume bar is significantly lower than the previous high's volume. Label this 'Effort vs. Result Divergence'.]" },
                { key: 'wy-m1-l4', title: 'The Four Market Cycles', content: "Generate a lesson introducing the four Wyckoff market cycles: Accumulation, Markup, Distribution, and Markdown. [CHART: A smooth, sinusoidal wave chart illustrating the four market cycles in sequence. Each phase (Accumulation, Markup, Distribution, Markdown) should be clearly labeled.]" },
            ]
        }
    ]
  },
  // FIX: Corrected malformed object literals for all placeholder paths and ensured they use 'modules' instead of 'lessons'.
  // --- Placeholder Advanced Paths ---
  { id: 'elliott', title: 'Elliott Wave Theory', description: 'Forecast market waves for predictive trading.', isFoundation: false, modules: [] },
  { id: 'sr', title: 'Support & Resistance', description: 'Master S&R for precise level-based trading.', isFoundation: false, modules: [] },
  { id: 'fibonacci', title: 'Fibonacci Retracement', description: 'Use Fib levels for predictive price mapping.', isFoundation: false, modules: [] },
  { id: 'ma', title: 'Moving Average Strategy', description: 'Build moving average systems for trend-following.', isFoundation: false, modules: [] },
  { id: 'pa', title: 'Price Action Trading', description: 'Trade naked charts with pure price stories.', isFoundation: false, modules: [] },
  { id: 'volume', title: 'Volume Profile Analysis', description: 'Use volume profiles for data-driven S&R.', isFoundation: false, modules: [] },
  { id: 'ichimoku', title: 'Ichimoku Cloud', description: 'Master the all-in-one system for trend and signals.', isFoundation: false, modules: [] },
  { id: 'harmonic', title: 'Harmonic Patterns', description: 'Spot high-probability reversals with precision.', isFoundation: false, modules: [] },
  { id: 'smc', title: 'Smart Money Concepts', description: 'Expert order flow and institutional insights.', isFoundation: false, modules: [] },
];

// For backward compatibility with components that still use the old structure.
export const MODULES: Module[] = LEARNING_PATHS.flatMap(path => path.modules);