import { Module, LearningPath } from './types';
import { foundationPath } from './constants/learning-paths/foundation';

// The full course content is now organized into Learning Paths.
export const LEARNING_PATHS: LearningPath[] = [
  foundationPath,
  {
    id: 'wyckoff',
    title: 'Wyckoff Method',
    description: 'Master market cycles and institutional accumulation/distribution for cycle-based trading.',
    isFoundation: false,
    modules: [
        {
            title: 'Wyckoff 1: Core Laws & Cycles',
            lessons: [
                { key: 'wy-m1-l1', title: "Law of Supply and Demand", content: "Generate a lesson on Wyckoff's first law, the Law of Supply and Demand, explaining how it governs all price movements. [CHART: An abstract diagram showing a seesaw. On one side, a large 'Demand' block pushes the price up. On the other, a large 'Supply' block pushes it down.]" },
                { key: 'wy-m1-l2', title: "Law of Cause and Effect", content: "Generate a lesson on Wyckoff's second law, Cause and Effect, explaining how the time spent in a trading range (the cause) determines the extent of the subsequent trend (the effect). [CHART: A chart showing a long trading range (labeled 'Cause') followed by a large, extended trend move (labeled 'Effect'). A second chart shows a short range followed by a short trend.]" },
                { key: 'wy-m1-l3', title: "Law of Effort vs. Result", content: "Generate a lesson on Wyckoff's third law, Effort vs. Result, focusing on how to spot divergences between volume (effort) and price action (result) to anticipate reversals. [CHART: A chart showing an uptrend where price makes a new high, but the corresponding volume bar is significantly lower than the previous high's volume. Label this 'Effort vs. Result Divergence'.]" },
                { key: 'wy-m1-l4', title: 'The Four Market Cycles', content: "Generate a lesson introducing the four Wyckoff market cycles: Accumulation, Markup, Distribution, and Markdown. [CHART: A smooth, sinusoidal wave chart illustrating the four market cycles in sequence. Each phase (Accumulation, Markup, Distribution, Markdown) should be clearly labeled.]" },
            ]
        },
        {
            title: 'Wyckoff 2: The Four Market Cycles',
            lessons: [
                { 
                    key: 'wy-m2-l1', 
                    title: "Accumulation Phase", 
                    content: "Generate a lesson on the Accumulation phase of the Wyckoff cycle. Explain that this is where 'smart money' (institutions) begin to buy assets from the public after a significant downtrend. Describe it as a period of sideways price action that builds a 'cause' for a future uptrend. Mention key events like the Selling Climax and the Spring. [CHART: A candlestick chart showing the end of a downtrend transitioning into a wide trading range. Clearly label the range 'Accumulation'. Mark key points like 'Selling Climax (SC)' at the initial low and a 'Spring' where price dips below the range and quickly recovers.]" 
                },
                { 
                    key: 'wy-m2-l2', 
                    title: "Markup Phase", 
                    content: "Generate a lesson on the Markup phase of the Wyckoff cycle. Describe this as the resulting uptrend that follows the Accumulation phase. Explain how price breaks out of the trading range and begins to make a series of higher highs and higher lows. Emphasize that this is where the public begins to join the trend. [CHART: A candlestick chart that continues from an Accumulation range. Show price breaking out of the top of the range (labeled 'Sign of Strength - SOS') and then starting a clear, sustained uptrend with higher highs and higher lows.]" 
                },
                { 
                    key: 'wy-m2-l3', 
                    title: "Distribution Phase", 
                    content: "Generate a lesson on the Distribution phase of the Wyckoff cycle. Explain that this is the opposite of Accumulation, where smart money begins to sell their holdings to the public at high prices after a long uptrend. Describe it as a sideways range that builds a cause for a future downtrend. Mention key events like the Buying Climax and the Upthrust. [CHART: A candlestick chart showing the peak of an uptrend transitioning into a wide trading range. Clearly label the range 'Distribution'. Mark key points like 'Buying Climax (BC)' at the initial high and an 'Upthrust (UT)' where price briefly pokes above the range and fails.]" 
                },
                { 
                    key: 'wy-m2-l4', 
                    title: "Markdown Phase", 
                    content: "Generate a lesson on the Markdown phase of the Wyckoff cycle. Describe this as the resulting downtrend that follows the Distribution phase. Explain how price breaks down from the trading range and begins a series of lower lows and lower highs. This is when the public often panics and sells. [CHART: A candlestick chart that continues from a Distribution range. Show price breaking down from the bottom of the range (labeled 'Sign of Weakness - SOW') and then starting a clear, sustained downtrend with lower lows and lower highs.]" 
                },
                { 
                    key: 'wy-m2-l5', 
                    title: "Cycle Transitions", 
                    content: "Generate a lesson on spotting the transitions between Wyckoff cycles early. Focus on the relationship between volume and price action. Explain that a decrease in volume on pullbacks during Markup shows strength, while an increase in volume on rallies during Distribution can signal weakness. Mention the importance of the Spring and Upthrust as final confirmation events. [CHART: A chart showing the end of a Markup phase. As price makes a final new high, the corresponding volume bar is significantly lower than the previous one, labeled 'Effort vs. Result Divergence'. This leads into a Distribution range.] [CHART: A second chart showing the transition from an Accumulation range to Markup. The 'Spring' event is shown with a sharp increase in volume as price recovers back into the range, labeled 'High Volume on Spring Recovery - A Bullish Sign'.]" 
                },
            ]
        }
    ]
  },
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