import React from 'react';

export interface Lesson {
  key: string;
  title: string;
  content: string;
}

export interface Module {
  title:string;
  lessons: Lesson[];
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  isFoundation: boolean;
  modules: Module[];
}

export type AppView = 'dashboard' | 'lesson' | 'pattern' | 'timed' | 'canvas' | 'simulator' | 'live_simulator' | 'saved' | 'achievements' | 'trading_plan' | 'mentor' | 'quiz' | 'market_pulse' | 'news_feed' | 'market_analyzer' | 'economic_calendar' | 'backtester' | 'settings' | 'trading_journal' | 'market_dynamics';

export interface DailyMission {
    title: string;
    description: string;
    tool: AppView;
    completion_criteria: 'simulatorRuns' | 'pattern' | 'timed' | 'canvas' | 'backtester' | 'live_simulator';
}

export interface MultipleChoiceQuestion {
    question: string;
    options: string[];
    correctAnswer: string; // The text of the correct option
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: React.FC<{ className?: string }>;
}

export interface NewsArticle {
  headline: string;
  summary: string;
  sourceUrl: string;
  sourceTitle: string;
}

export interface MarketUpdate {
  type: 'pulse' | 'news';
  title: string;
  content: string;
}

export interface EconomicEvent {
  id: string;
  name: string;
  currency: string;
  impact: 'High' | 'Medium' | 'Low';
  time: Date;
  forecast: string | null;
  previous: string | null;
  actual: string | null; // Will be populated for instant analysis
}

export interface StrategyParams {
  pair: string;
  timeframe: string;
  entryCriteria: string[];
  stopLoss: string;
  takeProfit: string;
}

export interface OhlcData {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
}

export interface BacktestTradeLog {
    entryTimestamp: number;
    exitTimestamp: number;
    entryPrice: number;
    exitPrice: number;
    outcome: 'Win' | 'Loss';
}

export interface BacktestResults {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  avgRR: number;
  maxDrawdown: number;
  tradeLog?: BacktestTradeLog[];
}

export interface AnalysisResult {
  text: string;
  sources: any[];
}

export type TradeOutcome = 'Win' | 'Loss' | 'Break-Even';
export type EmotionalState = 'Patient' | 'Confident' | 'Anxious' | 'FOMO' | 'Greedy' | 'Hesitant' | 'Revenge Trading';

export interface UploadedFile {
    data: string; // base64 data without the prefix
    mimeType: string;
    name: string;
}

export interface TradeLog {
    id: number;
    date: string;
    pair: string;
    direction: 'Buy' | 'Sell';
    outcome: TradeOutcome;
    rr: number;
    setup: string;
    emotion: EmotionalState;
    notes?: string;
    chartScreenshot?: UploadedFile;
    aiReview?: string;
}

export interface MentorPersona {
    id: string;
    name: string;
    description: string;
    systemInstruction: string;
}

export interface MentorVoice {
    id: string;
    name: string;
    description: string;
}

export interface CurrencyStrengthData {
    [key: string]: number; // e.g., { "USD": 8.5, "EUR": 6.2 }
}

export interface VolatilityData {
    pair: string;
    volatility: number; // A numeric score or rank
}

export interface TopMoverData {
    pair: string;
    change_pct: number; // e.g., 0.45 for +0.45%
}

export interface MarketSentimentData {
    sentiment: 'Risk On' | 'Risk Off' | 'Neutral' | 'Mixed';
    score: number; // A numeric score from 0 (extreme risk-off) to 10 (extreme risk-on)
    reasoning: string;
}

export interface UserProfile {
    email: string;
    username: string;
    createdAt: any; // Firestore timestamp
}
