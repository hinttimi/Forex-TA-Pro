import { Module } from './types';

export const MODULES: Module[] = [
  {
    title: 'Level 1: Foundation',
    lessons: [
       {
        key: 'l1-forex-basics',
        title: 'Forex Basics & Participants',
        contentPrompt: `You are an expert forex trading mentor. Explain what the Forex market is to a complete beginner. Use markdown for **bold** emphasis.

1.  **What is Forex?**: Describe it as a global, decentralized marketplace for exchanging national currencies. Explain that it's the largest financial market in the world.
2.  **Why Currencies Move**: Briefly explain that currency values fluctuate based on factors like interest rates, economic health, and geopolitical events.
3.  **The Participants**: Describe who the major participants are and why they trade.

    *   **Central Banks**: Explain their role in managing their country's currency and setting monetary policy.
    *   **Major Banks (Interbank Market)**: Describe this as the core of the forex market where large banks trade with each other.
    *   **Institutional Investors & Corporations**: Mention hedge funds, investment managers, and multinational corporations who trade for speculation or for business needs (e.g., hedging against currency risk).
    *   **Retail Traders**: Explain this is where individual traders participate.

[CHART: A simple, clean infographic for a dark theme, illustrating the hierarchy of the forex market. At the top, show a "Central Bank" icon, then a "Major Banks (Interbank Market)" icon, followed by "Hedge Funds & Corporations" icon, and at the bottom, a "Retail Traders" icon. Use arrows to show the flow of volume downwards.]`,
        chartPrompt: 'A simple, clean infographic for a dark theme, illustrating the hierarchy of the forex market. At the top, show "Central Banks," then "Major Banks (Interbank Market)," then "Hedge Funds & Corporations," and at the bottom, "Retail Traders." Use simple icons for each.',
      },
      {
        key: 'l1-candlestick-anatomy',
        title: 'Candlestick Anatomy',
        contentPrompt: `You are an expert forex trading mentor. Explain Japanese candlesticks to a complete beginner. Use markdown for **bold** emphasis.

### The Anatomy of a Candle
First, describe the basic components of a single candlestick. Explain that it represents price movement over a specific time period (e.g., 5 minutes, 1 hour). The main parts are:
*   **The Body**: Represents the range between the opening and closing price.
*   **The Wicks (or Shadows)**: Show the highest and lowest prices reached during the period.

A **bullish** candle (usually green) forms when the closing price is higher than the opening price. A **bearish** candle (usually red) forms when the closing price is lower than the opening price.

[CHART: A clear, educational image showing two Japanese candlesticks side-by-side on a dark background. One is a green bullish candle, the other a red bearish candle. Label the "Open", "High", "Low", and "Close" for each, as well as the "Body" and "Wick" (or "Shadow"). The style should be minimalist and professional.]

### The Story of a Candle
Explain that each candle tells a story of the battle between buyers ("bulls") and sellers ("bears"). A long green body shows buyers were in strong control. A long red body shows sellers were in control. Long wicks indicate significant volatility and indecision.

### Introduction to Key Patterns
Explain that single or small groups of candles can form patterns that hint at future price moves. Here are a few essential patterns to start with:

*   **Doji**: This candle has a very small body, with the open and close prices being nearly the same. It signals **indecision** in the market and can indicate a potential reversal.
[CHART: A dark-themed chart showing a clear Doji candle at the top of an uptrend, with an arrow pointing to it and the label "Doji: Indecision".]

*   **Hammer**: A bullish reversal pattern that forms after a decline. It has a short body, little to no upper wick, and a long lower wick (at least twice the size of the body). It shows that sellers pushed the price down, but buyers stepped in aggressively to push it back up.
[CHART: A dark-themed chart showing a clear Hammer candle at the bottom of a downtrend, with an arrow pointing to it and the label "Hammer: Bullish Reversal Signal".]

*   **Bullish Engulfing**: A powerful two-candle reversal pattern. It consists of a small bearish candle followed by a larger bullish candle whose body completely "engulfs" the body of the previous bearish candle. It signals a strong shift in momentum to the upside.
[CHART: A dark-themed chart showing a Bullish Engulfing pattern at the end of a downtrend. Highlight the two candles involved.]

*   **Bearish Engulfing**: The opposite of the bullish engulfing. A small bullish candle is followed by a larger bearish candle that completely engulfs the prior candle's body. It signals a strong shift in momentum to the downside.
[CHART: A dark-themed chart showing a Bearish Engulfing pattern at the end of an uptrend. Highlight the two candles involved.]`,
        chartPrompt: 'A clear, educational image showing two Japanese candlesticks side-by-side on a dark background. One is a green bullish candle, the other a red bearish candle. Label the "Open", "High", "Low", and "Close" for each, as well as the "Body" and "Wick" (or "Shadow"). The style should be minimalist and professional for the main lesson.',
      },
      {
        key: 'l1-support-resistance',
        title: 'Basic Support & Resistance',
        contentPrompt: `You are an expert forex trading mentor. Explain the concepts of Support and Resistance to a beginner. Use markdown for **bold** emphasis.

### What are Support and Resistance?
Think of **Support** as a price "floor" and **Resistance** as a price "ceiling".
*   **Support** is a price level where a downtrend can be expected to pause due to a concentration of demand or buying interest. As the price drops towards support, it becomes cheaper, and buyers are more inclined to buy, which can push the price back up.
*   **Resistance** is a price level where an uptrend can be expected to pause due to a concentration of supply or selling interest. As the price rises towards resistance, sellers are more inclined to sell, which can push the price back down.

### How are They Formed?
These levels are formed by previous swing highs and swing lows on the chart. The more times the price has respected a level, the stronger that level is considered to be.

[CHART: A clean, dark-themed candlestick chart showing price bouncing off a clear horizontal "Support" level multiple times. The support level is drawn as a horizontal line connecting several previous lows. Also, show price getting rejected from a clear horizontal "Resistance" level multiple times, with a line connecting previous highs.]

### The Role Swap
A key concept is the "role reversal." When a resistance level is broken, it can become a new support level. Conversely, when a support level is broken, it can become a new resistance level.

[CHART: A dark-themed candlestick chart showing price breaking through a resistance level. Then, show price coming back down to retest that same level, which now acts as support, before continuing to move higher. Label the "Resistance," "Breakout," and "New Support".]`,
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
        contentPrompt: `You are an expert forex trading mentor. Explain market structure in detail. Use markdown for **bold** emphasis.

### The Foundation of Trend
Market structure is the sequence of highs and lows that price action creates. It's the most fundamental way to determine the market's current direction, or trend.

### Bullish Structure (Uptrend)
An uptrend is characterized by price making a series of **Higher Highs (HH)** and **Higher Lows (HL)**.
The sequence is as follows:
1.  Price creates a low.
2.  It pushes up to create a high (the first HH).
3.  It pulls back, creating a low that is *higher* than the previous low (the first HL).
4.  It then pushes up again, breaking above the previous high to create a *new* Higher High.
This HH-HL pattern confirms that buyers are in control. The trend remains bullish as long as this pattern continues.

[CHART: A clean, dark-themed line chart illustrating a clear uptrend. Use arrows to show the direction. Clearly label at least two "Higher High" (HH) points and two "Higher Low" (HL) points in sequence.]

### Bearish Structure (Downtrend)
A downtrend is the opposite, characterized by a series of **Lower Lows (LL)** and **Lower Highs (LH)**.
The sequence is:
1.  Price creates a high.
2.  It pushes down to create a low (the first LL).
3.  It pulls back, creating a high that is *lower* than the previous high (the first LH).
4.  It then pushes down again, breaking below the previous low to create a *new* Lower Low.
This LL-LH pattern confirms that sellers are in control. The trend remains bearish as long as this pattern continues.

[CHART: A clean, dark-themed line chart illustrating a clear downtrend. Use arrows to show the direction. Clearly label at least two "Lower Low" (LL) points and two "Lower High" (LH) points in sequence.]`,
        chartPrompt: 'A clean, dark-themed line chart illustrating a clear uptrend with labels for "Higher High" (HH) and "Higher Low" (HL). Next to it, show a clear downtrend with labels for "Lower Low" (LL) and "Lower High" (LH). Use arrows to show the direction of the trend.',
      },
      {
        key: 'l2-bos',
        title: 'Break of Structure (BOS)',
        contentPrompt: `You are a professional trading mentor specializing in Smart Money Concepts. Explain what a **Break of Structure (BOS)** is. Use markdown for emphasis.

### Confirming the Trend
A **Break of Structure (BOS)** is a key event in price action that signals a **continuation** of the current trend. It's the moment the market shows its hand and confirms its intention to keep moving in the same direction.

*   **In an Uptrend**: A BOS occurs when price breaks **above** a previous **Higher High (HH)**. This creates a new HH and confirms that the bullish trend is still intact.
*   **In a Downtrend**: A BOS occurs when price breaks **below** a previous **Lower Low (LL)**. This creates a new LL and confirms that the bearish trend is still intact.

Looking for a BOS helps traders align themselves with the dominant market flow.

[CHART: A dark-themed forex candlestick chart showing an uptrend. Clearly label a "Higher High". Then show price pushing up and closing a candle body clearly above that high. Label this event as "BOS" (Break of Structure) with an arrow showing the continuation.]
[CHART: A second dark-themed forex candlestick chart showing a downtrend. Clearly label a "Lower Low". Then show price pushing down and closing a candle body clearly below that low. Label this event as "BOS" (Break of Structure) with an arrow showing the continuation.]`,
        chartPrompt: 'A dark-themed forex candlestick chart showing an uptrend. Clearly label a "Higher High". Then show price breaking above that high and label the candle that breaks it as "BOS" (Break of Structure). Do a similar illustration for a downtrend breaking a "Lower Low".',
      },
       {
        key: 'l2-choch',
        title: 'Change of Character (CHoCH)',
        contentPrompt: `You are a professional trading mentor specializing in Smart Money Concepts. Explain what a **Change of Character (CHoCH)** is and contrast it with a BOS. Use markdown for emphasis.

### The First Sign of a Reversal
While a BOS signals trend *continuation*, a **Change of Character (CHoCH)** is the *first significant sign* of a potential trend **reversal**. It indicates that the market's internal structure is starting to shift.

*   **From Uptrend to Downtrend**: In a clear uptrend, the market is making Higher Highs and Higher Lows. A CHoCH occurs when price **fails to make a new Higher High** and instead breaks **below the most recent Higher Low (HL)**. This is the first signal that sellers may be taking control.

[CHART: A dark-themed forex candlestick chart showing a clear uptrend with several Higher Highs and Higher Lows labeled. Then, show the price failing to break the last HH and instead breaking decisively below the last labeled Higher Low. Label this break clearly as "CHoCH" (Change of Character) with an arrow indicating a potential new downtrend.]

*   **From Downtrend to Uptrend**: In a clear downtrend, the market is making Lower Lows and Lower Highs. A CHoCH occurs when price **fails to make a new Lower Low** and instead breaks **above the most recent Lower High (LH)**. This is the first clue that buyers may be stepping in.

[CHART: A dark-themed forex candlestick chart showing a clear downtrend with several Lower Lows and Lower Highs labeled. Then, show the price failing to break the last LL and instead breaking decisively above the last labeled Lower High. Label this break clearly as "CHoCH" (Change of Character) with an arrow indicating a potential new uptrend.]

A CHoCH is not a guarantee of a reversal, but it's a critical warning that the previous trend is losing momentum and that traders should become cautious or start looking for opportunities in the new direction.`,
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
        contentPrompt: `You are a professional trading mentor specializing in Smart Money Concepts. Explain what **liquidity** is in forex trading in simple terms. Use markdown for emphasis.

### The Fuel of the Market
In the context of trading, **liquidity** refers to the ability to buy or sell an asset without causing a significant change in its price. For practical purposes, you can think of liquidity as **pools of pending orders** resting in the market.

The most common types of orders that create liquidity are:
*   **Stop-Loss Orders**: These are orders placed by traders to exit a losing trade at a specific price.
*   **Buy-Stop and Sell-Stop Orders**: These are orders placed by breakout traders to enter a trade when price breaks a certain level.

### Why is it Important for "Smart Money"?
"Smart Money" refers to large institutional players like banks and hedge funds. They trade with enormous position sizes that cannot be filled instantly without moving the market against them.

To fill their large orders, they need to find a large number of opposing orders. These pools of stop-loss and breakout orders provide the massive liquidity they need. Therefore, smart money will often engineer price moves towards these liquidity zones to fill their positions before starting the real market move. Understanding where liquidity is resting is key to anticipating where the market might go next.

[CHART: An abstract, dark-themed diagram. On one side, show a large "Institution" icon with a text bubble saying "Need to Buy 1 Billion EUR". On the other side, show many small "Retail Trader" icons with stop-loss orders (sell orders) placed just above a resistance level. Draw a large arrow from the Institution to the retail stop-losses, labeled "Targeting Liquidity to Fill Orders".]`,
        chartPrompt: 'An abstract, dark-themed diagram. On one side, show a large "Institution" icon with a big order book. On the other, show many small "Retail Trader" icons with stop-loss orders. Draw arrows showing the institution needing to absorb the retail orders to execute their trade.',
      },
       {
        key: 'l3-liquidity-pools',
        title: 'Buy-side & Sell-side Pools',
        contentPrompt: `You are a professional trading mentor specializing in Smart Money Concepts. Explain **buy-side liquidity** and **sell-side liquidity**. Use markdown for emphasis.

### Where is the Liquidity?
Liquidity pools are not random; they form at obvious technical levels where many traders are likely to place their orders.

### Buy-Side Liquidity
**Buy-side liquidity** rests **above old highs** or key resistance levels. It is made up of:
1.  **Stop-Losses** from traders who are in short (sell) positions. Their stop-loss is a buy order.
2.  **Buy-Stop Orders** from breakout traders who want to buy as soon as the price breaks above the high.

Smart money may push the price above an old high to trigger all these buy orders, allowing them to sell their own large positions into that buying frenzy.

[CHART: A dark-themed forex candlestick chart showing a clear resistance level with several highs touching it. Use a cluster of dollar sign icons ($) above this level and label it "Buy-Side Liquidity (Stop Losses & Buy Stops)".]

### Sell-Side Liquidity
**Sell-side liquidity** rests **below old lows** or key support levels. It is made up of:
1.  **Stop-Losses** from traders who are in long (buy) positions. Their stop-loss is a sell order.
2.  **Sell-Stop Orders** from breakout traders who want to sell as soon as the price breaks below the low.

Smart money may push the price below an old low to trigger these sell orders, allowing them to fill their own large buy positions at a better price.

[CHART: A dark-themed forex candlestick chart showing a clear support level with several lows touching it. Use a cluster of dollar sign icons ($) below this level and label it "Sell-Side Liquidity (Stop Losses & Sell Stops)".]`,
        chartPrompt: 'A dark-themed forex candlestick chart showing a clear price range. Use a dollar sign icon ($) to label the "Buy-side Liquidity" resting above a cluster of previous highs (resistance) and "Sell-side Liquidity" resting below a cluster of previous lows (support).',
      },
      {
        key: 'l3-liquidity-sweeps',
        title: 'Liquidity Sweeps (Stop Hunts)',
        contentPrompt: `You are a professional trading mentor specializing in Smart Money Concepts. Explain a **liquidity sweep** or "stop hunt". Use markdown for emphasis.

### The Smart Money Signature Move
A **liquidity sweep**, also known as a "stop hunt" or "Judas swing," is a classic smart money tactic. It is a sharp, rapid price move that spikes just past a key high or low, only to quickly reverse.

The purpose of this move is to:
1.  **Trigger Stop-Losses**: Hit the cluster of stop-loss orders resting just beyond the level.
2.  **Induce Breakout Traders**: Trick breakout traders into thinking a new trend is starting, making them enter in the wrong direction.
3.  **Fill Institutional Orders**: The surge in orders from the first two groups provides the liquidity for smart money to enter their large positions *against* the crowd.

After the liquidity has been "swept," the market often reverses aggressively, leaving the trapped traders behind. Recognizing a liquidity sweep can provide a powerful entry signal for trading in the direction of the smart money.

[CHART: A dark-themed forex candlestick chart. Show a clear previous high. Illustrate price moving up, with a single candle wick piercing just above that high, and then the candle body closing back below the high. Label the wick above the high as "Liquidity Sweep" or "Stop Hunt". Use an arrow to show the aggressive reversal that follows.]
[CHART: A dark-themed forex candlestick chart. Show a clear previous low. Illustrate a single candle with a long lower wick that pierces just below that low, and then closes back above the low. Label this "Sell-Side Liquidity Sweep" and show the subsequent bullish reversal.]`,
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
        contentPrompt: `You are a professional trading mentor specializing in Smart Money Concepts. Explain what an **Order Block** is. Use markdown for emphasis.

### The Footprint of Smart Money
An **Order Block (OB)** is a specific candlestick that represents a significant area of institutional buying or selling. It is often seen as the "last footprint" of smart money before a large, impulsive move in the market.

Essentially, an Order Block is the **last opposing candle before a strong move that breaks market structure (BOS)**.

*   A **Bullish Order Block** is the last **down candle** (bearish) before a strong upward move that causes a BOS.
*   A **Bearish Order Block** is the last **up candle** (bullish) before a strong downward move that causes a BOS.

The theory is that smart money used this candle to accumulate their position before launching the price in the intended direction. This leaves behind a trail of unfilled orders at that price level. The market will often return to this Order Block in the future to mitigate these orders, providing a high-probability area to enter a trade.

[CHART: A dark-themed chart showing a strong upward move that breaks a previous high (a BOS). Highlight the last red down-candle right before that explosive move and label it "Bullish Order Block".]
[CHART: A dark-themed chart showing a strong downward move that breaks a previous low (a BOS). Highlight the last green up-candle right before that explosive move and label it "Bearish Order Block".]`,
        chartPrompt: 'A dark-themed chart showing a strong upward move that breaks structure (a BOS). Highlight the last down-candle right before that explosive move and label it "Bullish Order Block".',
      },
       {
        key: 'l4-bullish-bearish-ob',
        title: 'Bullish vs Bearish Order Blocks',
        contentPrompt: `You are a professional trading mentor specializing in Smart Money Concepts. Clearly define and illustrate Bullish and Bearish Order Blocks. Use markdown for emphasis.

### Bullish Order Blocks (Demand Zone)
A **Bullish Order Block** is the **last down-candle** (red/bearish) before a strong, impulsive **up-move** that results in a Break of Structure (BOS).

*   **Identification**: Look for a downtrend or consolidation, find the last red candle, and then confirm that the following move up is powerful and breaks a recent high.
*   **Significance**: This area represents a point where large institutions bought heavily, absorbing all selling pressure before driving the price higher. It is considered a **demand zone**. Traders will look to enter **long (buy)** positions when the price returns to test this level.

[CHART: A close-up, dark-themed chart highlighting a "Bullish Order Block". Show a red candle, followed by several large green candles that break a nearby high (labeled BOS). Draw a rectangle around the body of the red candle and extend it to the right, labeling it "Demand Zone / Bullish OB".]

### Bearish Order Blocks (Supply Zone)
A **Bearish Order Block** is the **last up-candle** (green/bullish) before a strong, impulsive **down-move** that results in a Break of Structure (BOS).

*   **Identification**: Look for an uptrend or consolidation, find the last green candle, and then confirm that the following move down is powerful and breaks a recent low.
*   **Significance**: This area represents a point where institutions sold heavily, absorbing all buying pressure before driving the price lower. It is considered a **supply zone**. Traders will look to enter **short (sell)** positions when the price returns to test this level.

[CHART: A close-up, dark-themed chart highlighting a "Bearish Order Block". Show a green candle, followed by several large red candles that break a nearby low (labeled BOS). Draw a rectangle around the body of the green candle and extend it to the right, labeling it "Supply Zone / Bearish OB".]`,
        chartPrompt: 'Two mini-charts on a dark background. The first highlights a "Bearish Order Block" - the last up-candle before a strong downward move that causes a BOS. The second highlights a "Bullish Order Block" - the last down-candle before a strong upward move that causes a BOS.',
      },
      {
        key: 'l4-ob-mitigation',
        title: 'Order Block Mitigation',
        contentPrompt: `You are a professional trading mentor specializing in Smart Money Concepts. Explain the concept of **mitigation** and how it provides entry opportunities. Use markdown for emphasis.

### Returning to the Scene
**Mitigation** is the process of price returning to a previously created Order Block. The term implies that institutions are returning to this level to "mitigate" their initial position—either to close out parts of their original trade, to clear any remaining orders, or to add to their position before continuing the move.

For retail traders, this is the golden opportunity.

When price retraces back to an unmitigated (meaning, not yet revisited) Order Block, it provides a high-probability **Point of Interest (POI)** to enter a trade in the direction of the original impulsive move.

### The Entry Model
1.  Identify a valid Order Block (the last opposing candle before a BOS).
2.  Wait for price to pull back and trade into the zone of the Order Block.
3.  Look for a reaction as price touches the OB (e.g., a sharp rejection, or a lower timeframe confirmation pattern).
4.  Enter the trade with a stop loss placed just on the other side of the Order Block zone.

This process allows you to join the institutional flow with a defined risk.

[CHART: A dark-themed forex candlestick chart. First, show a "Bearish Order Block" being formed (last up-candle before a down-move BOS). Draw a rectangle around this OB and extend it to the right. Then, show price action moving away and later returning to this rectangular zone. Highlight the candle that touches the zone and is aggressively rejected downwards. Label this touch point as "Mitigation Entry".]
[CHART: A second dark-themed chart showing the same concept for a "Bullish Order Block". Price returns to the Bullish OB zone, touches it, and then reverses strongly to the upside. Label the entry point.]`,
        chartPrompt: 'A dark-themed forex candlestick chart. Highlight a "Bearish Order Block" and draw a rectangle around it, extending it to the right. Then show price returning to this zone later, touching the rectangle, and getting aggressively rejected downwards. Label the touch point as "Mitigation Entry".',
      },
    ]
  },
  {
    title: 'Level 5: The Professional Framework',
    lessons: [
       {
        key: 'l5-premium-discount',
        title: 'Premium vs. Discount',
        contentPrompt: `You are an expert ICT trading mentor. Explain the concept of **Premium vs. Discount** pricing and how to use the Fibonacci tool to identify it. Use markdown for emphasis.

### The Logic of Buying Low and Selling High
The core of any successful business, including trading, is to **buy low and sell high**. The concepts of Premium and Discount provide a systematic framework for doing just that.

Within any given trading range (from a significant low to a significant high, or vice versa), we can divide the price into two zones:
*   **Premium**: The upper 50% of the range. This is an expensive or "premium" area. We should only be looking for **sell (short)** setups in this zone.
*   **Discount**: The lower 50% of the range. This is a cheap or "discounted" area. We should only be looking for **buy (long)** setups in this zone.

The 50% level is known as **Equilibrium**.

### Using the Fibonacci Tool
The Fibonacci tool is the perfect way to measure these zones.
1.  **For a bullish range (looking for longs)**: Draw the Fibonacci tool from the **swing low to the swing high**. The area below the 0.5 level is the Discount zone.
2.  **For a bearish range (looking for shorts)**: Draw the Fibonacci tool from the **swing high to the swing low**. The area above the 0.5 level is the Premium zone.

By waiting for price to enter a Discount zone before buying, or a Premium zone before selling, you dramatically increase the probability of your trades and ensure you are always trading at a logical price.

[CHART: A dark-themed candlestick chart showing a clear swing from a low to a high. A Fibonacci tool is drawn on this range, from the low to the high. The area above the 0.5 level is shaded red and clearly labeled "Premium (Sell Zone)". The area below the 0.5 level is shaded green and clearly labeled "Discount (Buy Zone)". Show price pulling back into the Discount zone and finding support.]
[CHART: A second dark-themed candlestick chart showing a clear swing from a high to a low. A Fibonacci tool is drawn on this range. The area above the 0.5 level is shaded red and labeled "Premium (Sell Zone)". Show price pulling back into the Premium zone and finding resistance.]`,
        chartPrompt: 'A dark-themed candlestick chart showing a clear swing from a low to a high. A Fibonacci tool is drawn on this range. The area above the 0.5 level is shaded red and labeled "Premium (Sell Zone)". The area below the 0.5 level is shaded green and labeled "Discount (Buy Zone)".',
      },
       {
        key: 'l5-refining-pois',
        title: 'Refining Points of Interest (POIs)',
        contentPrompt: `You are a professional trading mentor specializing in Smart Money Concepts. Explain how to identify a **high-probability Point of Interest (POI)** using a checklist. Use markdown for emphasis.

### Not All POIs Are Created Equal
As you analyze charts, you will see many Order Blocks and other potential POIs. The key to consistency is learning to filter out the weak ones and focus only on the high-probability setups.

Here is a checklist to qualify a POI:

1.  **Did it cause a Break of Structure (BOS)?**
    The most important factor. A POI is only valid if the impulsive move originating from it was strong enough to break market structure. This proves the institutional intent at that level.

2.  **Did it cause a Liquidity Sweep?**
    A POI becomes much stronger if the candle that forms the POI (e.g., the Order Block) also swept liquidity from a nearby high or low. This indicates a "stop hunt" occurred, adding fuel to the subsequent move.

3.  **Is it Unmitigated?**
    Has price already returned to this POI? If so, it is "mitigated," and most of the institutional orders have likely been filled. The highest probability POIs are fresh and unmitigated.

4.  **Is it in a Premium/Discount Zone?**
    Does the POI align with the overall market logic? If you are looking to buy, is your Bullish Order Block located in a **Discount** zone of the larger trading range? If you're looking to sell, is your Bearish Order Block in a **Premium** zone?

A POI that checks all these boxes is considered an "A-Grade" setup.

[CHART: A complex, dark-themed candlestick chart showing an uptrend. Price creates a minor high, then pulls back slightly to form a small Bullish Order Block. This pullback does not sweep any lows. Price then continues up, creating a BOS. Later, price pulls back again, this time sweeping below a clear previous low before forming a *second*, more powerful Bullish Order Block. Label the first one "Weak POI (No Liquidity Sweep)" and the second one "Strong POI (Swept Liquidity + in Discount)". Show price ignoring the first POI and reacting strongly to the second one.]`,
        chartPrompt: 'A complex, dark-themed candlestick chart. Show an uptrend. Price creates a minor high, then pulls back, creating a small "inducement" order block. Price then sweeps the low of that pullback, creating a *second*, more powerful "Bullish Order Block". Label the first one "Weak POI (Inducement)" and the second one "Strong POI (Swept Liquidity)". Show price ignoring the first and reacting strongly to the second.',
      },
    ]
  },
    {
    title: 'Level 6: Fair Value Gaps',
    lessons: [
       {
        key: 'l6-fvg',
        title: 'Identifying Fair Value Gaps',
        contentPrompt: `You are a professional trading mentor specializing in Smart Money Concepts. Explain what a **Fair Value Gap (FVG)** is. Use markdown for emphasis.

### Gaps in the Market
A **Fair Value Gap (FVG)**, also known as an **imbalance**, is a three-candle pattern that highlights an inefficiency or an imbalance in buying and selling pressure. It occurs when price moves very quickly and aggressively in one direction, leaving a "gap" in the market.

### How to Identify an FVG
An FVG is identified by looking at a sequence of three consecutive candles:
*   For a **bullish FVG**: Look for the gap between the **high of the first candle** and the **low of the third candle**. If there is space between them, that space is the FVG. This is created by a large, strong middle (second) candle.
*   For a **bearish FVG**: Look for the gap between the **low of the first candle** and the **high of the third candle**.

These gaps represent areas where price was delivered inefficiently. The market has a natural tendency to revisit these areas to "rebalance" the price action. Because of this, FVGs act like a **magnet for price** and can be used as high-probability targets or entry points.

[CHART: A dark-themed forex candlestick chart showing a large, impulsive green candle (the second candle). Draw a rectangle highlighting the empty space between the top of the wick of the first candle and the bottom of the wick of the third candle. Label this area clearly as "Fair Value Gap (FVG)" or "Bullish Imbalance".]
[CHART: A second dark-themed chart showing a large, impulsive red candle. Draw a rectangle highlighting the empty space between the bottom of the wick of the first candle and the top of the wick of the third candle. Label this "Bearish Imbalance".]`,
        chartPrompt: 'A dark-themed forex candlestick chart showing a large, impulsive green candle. Highlight the gap between the wick of the candle before it and the wick of the candle after it. Label this area clearly as "Fair Value Gap" or "FVG".',
      },
       {
        key: 'l6-fvg-retest',
        title: 'FVG Retest Strategy',
        contentPrompt: `You are a professional trading mentor specializing in Smart Money Concepts. Explain how Fair Value Gaps (FVGs) are used for entries. Use markdown for emphasis.

### Using Inefficiency for Entries
Since FVGs act as a magnet for price, they provide excellent Points of Interest (POIs) for trade entries. The logic is that after an aggressive move creates an FVG, the market will often pull back to "fill" or "rebalance" this gap before continuing in its original direction.

This retracement offers a high-probability entry point.

### The FVG Entry Model
1.  **Identify an Impulsive Move**: Look for a strong price leg that breaks market structure (BOS) and leaves behind a clear FVG.
2.  **Wait for the Retracement**: Do not chase the price. Be patient and wait for price to pull back and trade *into* the FVG zone.
3.  **Enter within the FVG**: An entry can be taken as soon as price touches the FVG. More conservative traders might wait for price to reach the 50% mark (the "consequent encroachment") of the FVG.
4.  **Set Your Stop**: Place your stop loss on the other side of the FVG, often aligned with the swing point that started the impulsive move.

This strategy allows you to join a strong trend on a pullback to a logical and well-defined level. Combining an FVG with other confluences, like a Premium/Discount zone or an Order Block, creates a very high-probability setup.

[CHART: A dark-themed forex candlestick chart showing a "Fair Value Gap" being created by a strong upward move that causes a BOS. Draw a rectangle around the FVG. Use a dotted arrow to show how price later retraces back down to trade into the FVG. Highlight the entry candle as it touches the top of the FVG and reverses. Label the "Entry Point" and show the stop loss placed below the low of the move.]
[CHART: A second dark-themed chart showing the same entry model for a bearish FVG. Price creates a bearish FVG on a down-move, retraces up into it, and then continues down.]`,
        chartPrompt: 'A dark-themed forex candlestick chart showing a "Fair Value Gap" being created. Use a dotted arrow to show how price later returns to trade into the FVG (but not necessarily fill it completely) before continuing its original move. Label the entry point.',
      },
    ]
  },
  {
    title: 'Level 7: Advanced Concepts',
    lessons: [
      {
        key: 'l7-ote',
        title: 'Optimal Trade Entry (OTE)',
        contentPrompt: `You are an expert ICT trading mentor. Explain the **Optimal Trade Entry (OTE)** pattern. Use markdown for emphasis.

### The Fibonacci "Sweet Spot"
The **Optimal Trade Entry (OTE)** is a specific entry pattern that uses Fibonacci retracement levels to pinpoint a high-probability entry zone. It's based on the idea that algorithmic trading models often target specific retracement levels after a major price swing.

The OTE is considered the "sweet spot" for an entry, typically found between the **62% (0.62) and 79% (0.79)** retracement levels of a price swing.

### How to Find the OTE
1.  **Identify a clear price swing**: This could be a swing from a low to a high in an uptrend, or a high to a low in a downtrend. This swing should ideally have taken out some form of liquidity.
2.  **Draw the Fibonacci Tool**:
    *   For a **long setup**, draw from the swing low to the swing high.
    *   For a **short setup**, draw from the swing high to the swing low.
3.  **Identify the OTE Zone**: The area between the 0.62 and 0.79 levels is your OTE zone.

The power of the OTE comes from combining it with other concepts. A perfect entry setup often occurs when a **Bullish Order Block** or an **FVG** is located directly inside the OTE zone of a bullish swing. This creates a powerful confluence of signals.

[CHART: A dark-themed candlestick chart showing a major swing from a low to a high. A Fibonacci retracement tool is drawn on this swing. The area between the 0.62 and 0.79 levels is highlighted with a colored box and labeled "OTE (Optimal Trade Entry)". Show that within this box, there is also a small Bullish Order Block. Illustrate price pulling back precisely into this zone before reversing strongly upwards.]`,
        chartPrompt: 'A dark-themed candlestick chart showing a major swing from a low to a high. A Fibonacci retracement tool is drawn on this swing. Highlight the area between the 0.62 and 0.79 levels and label it "OTE". Show price retracing into this zone and then reversing.',
      },
      {
        key: 'l7-inducement',
        title: 'Inducement (Smart Money Traps)',
        contentPrompt: `You are an expert ICT trading mentor. Explain the concept of **Inducement**. Use markdown for emphasis.

### The Trap Before the Real Move
**Inducement** is a smart money trap. It is a small, seemingly obvious price level that is designed to lure in, or "induce," impatient retail traders into entering the market too early.

Typically, inducement is the **first minor pullback** after a Break of Structure (BOS). Early traders see this small pullback and jump in, placing their stop-losses just below its low (in an uptrend).

Smart money knows this. They will often push the price down one more time to **sweep the liquidity** resting below that inducement low. This action serves two purposes:
1.  It stops out the early entrants.
2.  It allows smart money to fill their own buy orders at a better price.

After this liquidity sweep, the price will then move to the *true* Point of Interest (like a valid Order Block or FVG, often located just below the inducement level) before starting the real, powerful move.

By learning to spot and wait for inducement to be taken, you can avoid being the liquidity and instead trade alongside the smart money.

[CHART: A dark-themed candlestick chart showing an uptrend with a BOS. After the BOS, price makes a small, shallow pullback, creating a minor swing low. Label this low "Inducement". Show early retail traders buying here with a "BUY" icon. Then, show price dipping down just below this inducement low, sweeping the liquidity (label this "Liquidity Sweep"). Price then taps into a true "Bullish Order Block" located slightly lower down, before the real, explosive move up begins. Show the retail traders being stopped out.]`,
        chartPrompt: 'A dark-themed candlestick chart showing a downtrend. A minor pullback creates a small high. Label this "Inducement". Show price coming up, breaking this minor high (sweeping liquidity), and *then* tapping into a true "Bearish Order Block" located slightly higher, before the real move down begins.',
      },
    ]
  },
   {
    title: 'Level 8: Complete Strategy',
    lessons: [
       {
        key: 'l8-entry-model',
        title: 'The Full A-Grade Setup',
        contentPrompt: `You are an expert ICT trading mentor. Outline a complete, high-probability trade setup checklist, combining all the concepts learned so far. Use markdown for emphasis.

### The A-Grade Setup Checklist
This model provides a systematic way to identify high-probability setups by layering multiple confluences.

1.  **Higher Timeframe (HTF) Direction**:
    *   Start on a high timeframe (e.g., 4H or Daily). What is the overall market structure? Is it bullish (making HH/HL) or bearish (making LL/LH)? This determines your **bias**. You only want to look for trades that align with this HTF bias.

2.  **HTF Liquidity Grab**:
    *   Within your HTF bias, wait for price to sweep a major liquidity pool.
    *   If bullish, wait for price to sweep a significant **sell-side liquidity** pool (an old low).
    *   If bearish, wait for price to sweep a significant **buy-side liquidity** pool (an old high).

3.  **Lower Timeframe (LTF) Reversal (CHoCH)**:
    *   After the HTF liquidity grab, drop down to a lower timeframe (e.g., 15M or 5M).
    *   Wait for a clear **Change of Character (CHoCH)** on the LTF that confirms a reversal against the sweep. For example, after a bearish sweep of a high, you want to see a bearish CHoCH on the 15M chart.

4.  **Identify Entry POI**:
    *   The CHoCH will leave behind a new Point of Interest. Identify a clean **Order Block** or **Fair Value Gap (FVG)** that was created during the reversal move.

5.  **Refine Entry**:
    *   Does this POI align with a **Premium/Discount** zone of the LTF swing? Is it within the **OTE**? The more confluences, the better. Wait patiently for price to return to this POI for your entry.

[CHART: A series of two connected dark-themed charts. The first, labeled "4H Chart", shows a clear uptrend. Circle a specific recent higher low. The second chart, labeled "15M Chart (Zoomed in)", shows price first dipping below that 4H low (label this "HTF Sell-Side Liquidity Grab"). Immediately after the grab, show price aggressively moving up, causing a 15M "CHoCH". Highlight a clear "Bullish Order Block" or "FVG" that formed during the CHoCH move and label it "A-Grade Entry Zone".]`,
        chartPrompt: 'A series of two connected dark-themed charts. The first, labeled "4H Chart", shows a clear uptrend. Circle a specific higher low. The second chart, labeled "15M Chart (Zoomed in)", shows price first dipping below that 4H low (label this "Liquidity Grab"). Then, show price aggressively moving up, causing a "CHoCH". Highlight an "Order Block" that formed and label "Potential Entry Zone".',
      },
      {
        key: 'l8-risk-management',
        title: 'Risk Management & Sizing',
        contentPrompt: `You are an expert trading mentor. Explain the vital importance of **Risk Management** and the key components like the 1-2% rule, stop-loss placement, and position sizing. Use markdown for emphasis.

### The Key to Longevity
Excellent strategy will fail without proper risk management. This is the set of rules that protects your capital and keeps you in the game long enough to be profitable.

### The 1-2% Rule
This is the golden rule of trading. **Never risk more than 1-2% of your total account balance on a single trade.**
*   **Example**: If you have a $10,000 account, a 1% risk is $100. This means that if your trade hits its stop-loss, you should only lose $100.
*   This rule ensures that a string of losses will not wipe out your account, protecting you from emotional decisions and giving your strategy a chance to play out over the long term.

[CHART: A simple, dark-themed infographic. Show a pie chart representing a trading account. A tiny 1% slice is colored red and labeled "Max Risk per Trade ($100)". The remaining 99% is green and labeled "Capital Preserved ($9,900)".]

### Logical Stop-Loss Placement
A **stop-loss** is a pre-determined order that will automatically close your trade at a specific price to limit your loss. It should not be placed randomly. It must be placed at a **logical level** where your trade idea is proven invalid.
*   **For a long trade from a Bullish OB**: The stop-loss should go just below the low of the Order Block.
*   **For a short trade from a Bearish OB**: The stop-loss should go just above the high of the Order Block.

### Position Size Calculation
Once you know your risk percentage and your stop-loss distance, you can calculate your **position size**.
1.  **Determine Risk Amount**: Account Size * Risk % (e.g., $10,000 * 1% = $100).
2.  **Determine Stop-Loss Distance in Pips**: (Entry Price - Stop-Loss Price).
3.  **Calculate Position Size**: (Risk Amount) / (Stop-Loss Distance in Pips * Pip Value).
There are many free online calculators to help with this. The key is to adjust your position size for every trade so that the potential loss is always 1-2% of your account, no matter how wide or tight your stop-loss is.`,
        chartPrompt: 'A simple, dark-themed infographic. Show a pie chart representing a trading account, with a tiny 1% slice colored red and labeled "Max Risk per Trade". Next to it, show a sample trade with a clear "Entry" price, "Stop Loss" price, and "Take Profit" price, with the distance between Entry and Stop Loss labeled "Risk".',
      },
    ]
  },
  {
    title: 'Level 9: Mastery',
    lessons: [
       {
        key: 'l9-multi-timeframe',
        title: 'Multi-Timeframe Analysis',
        contentPrompt: `You are an expert trading mentor. Explain the concept of **Multi-Timeframe Analysis** using a top-down approach. Use markdown for emphasis.

### Seeing the Full Picture
The market exists across all timeframes simultaneously. A trend on the 15-minute chart might just be a small pullback on the 4-hour chart. **Multi-Timeframe Analysis (MTF)** is the process of looking at the same currency pair on different timeframes to get a complete picture and build a high-probability trade idea.

A common and effective method is the **Top-Down Approach**.

1.  **High Timeframe (HTF) - The Narrative (e.g., Daily, 4H)**:
    *   Use the HTF to establish the overall **bias** or direction. Is the market making Higher Highs and Higher Lows (bullish) or Lower Lows and Lower Highs (bearish)?
    *   Identify major HTF points of interest (Order Blocks, old highs/lows) where you expect price to react.

2.  **Medium Timeframe (MTF) - The Setup (e.g., 1H, 15M)**:
    *   Once price reaches your HTF POI, zoom into the MTF.
    *   Here, you look for your trade **setup**. This is where you would spot the Change of Character (CHoCH) that signals a reversal, and identify the resulting Order Block or FVG you want to trade from.

3.  **Low Timeframe (LTF) - The Entry (e.g., 5M, 1M)**:
    *   As price returns to your MTF POI, you can zoom in further to the LTF for a precision entry.
    *   You might look for yet another, smaller CHoCH or liquidity sweep on the 1-minute chart as price touches your 15-minute Order Block. This provides tight confirmation and allows for a very small stop-loss.

By aligning all three timeframes, you ensure that you are not only entering on a good setup but also trading in harmony with the larger market flow.

[CHART: An image showing three charts side-by-side for a dark theme, connected by arrows. The first chart, labeled "4-Hour: The Bias", shows a clear uptrend with price pulling back towards a major Bullish Order Block. The second, labeled "15-Minute: The Setup", zooms into the 4H OB and shows a bearish trend reversing with a clear CHoCH. The third, labeled "1-Minute: The Entry", zooms into the 15M POI created by the CHoCH, showing price returning and giving a final small confirmation before taking off.]`,
        chartPrompt: 'An image showing three charts side-by-side for a dark theme. Labeled "Daily", "1-Hour", and "5-Minute". The Daily chart shows a clear uptrend. The 1-Hour chart zooms in on a pullback to an order block within that uptrend. The 5-Minute chart zooms in further, showing a CHoCH at the order block for a precise entry signal.',
      },
       {
        key: 'l9-psychology',
        title: 'Trading Psychology',
        contentPrompt: `You are an expert trading mentor. Discuss the critical role of **Psychology** in trading. Cover the main emotional challenges and the mindset required for success. Use markdown for emphasis.

### The Final Boss of Trading
You can have the best strategy in the world, but if your mindset is wrong, you will not be profitable. Trading is a game of probabilities, and managing your own emotions is often the hardest part.

### The Main Enemies of a Trader
*   **Fear**: This manifests in two ways:
    *   **Fear of Losing**: Causes you to hesitate, miss good setups, or close winning trades too early.
    *   **Fear of Missing Out (FOMO)**: Causes you to chase price, enter trades late, and ignore your rules because you're afraid of missing a big move.
*   **Greed**: This causes you to over-leverage (risk too much), widen your take-profit targets illogically, or refuse to take a small loss in the hope that it will turn around. It's the enemy of discipline.
*   **Impatience/Revenge Trading**: After a loss, feeling the need to "make it back" immediately. This leads to taking unplanned, low-probability setups and often results in even bigger losses.

[CHART: An abstract, dark-themed image. On the left side, show a brain icon with chaotic, red, jagged lines running through it. Label this side "Emotional Trading" with text bubbles for "FOMO!", "It has to reverse!", "I'll get it back!". An arrow points from this brain to a chaotic, losing equity curve. On the right side, show a brain with calm, orderly, blue lines. Label this "Disciplined Trading" with text bubbles for "Follow the Plan", "Accept the Loss", "Wait for the Setup". An arrow points from this brain to a smooth, rising equity curve.]

### The Mindset of a Professional
*   **Discipline**: The ability to follow your trading plan **without deviation**, no matter how you feel.
*   **Patience**: The ability to sit and wait for your high-probability setup to form, and to do nothing when there are no good opportunities. Most of trading is waiting.
*   **Acceptance of Randomness**: Understand that any single trade can be a loser, even with a perfect setup. Your edge plays out over a large series of trades, not on the next one.
*   **Process over Outcome**: Focus on executing your strategy flawlessly on every trade. Do not judge your performance based on the outcome of one trade, but on how well you followed your process.

Mastering your psychology is a continuous journey, but it is the ultimate key to unlocking consistent profitability.`,
        chartPrompt: 'An abstract, dark-themed image. On one side, show a brain icon with chaotic lines labeled "Fear, Greed, FOMO, Impatience". An arrow points to a chart showing erratic, losing trades. On the other side, show a brain icon with calm, orderly lines labeled "Discipline, Patience, Strategy". An arrow points to a chart showing consistent, well-executed trades.',
      },
    ]
  }
];