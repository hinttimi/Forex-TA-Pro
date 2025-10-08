

import React from 'react';

export interface Lesson {
  key: string;
  title: string;
  contentPrompt: string;
  chartPrompt: string;
}

export interface Module {
  title:string;
  lessons: Lesson[];
}

export type AppView = 'dashboard' | 'lesson' | 'pattern' | 'timed' | 'canvas' | 'simulator' | 'live_simulator' | 'saved' | 'achievements' | 'trading_plan' | 'mentor' | 'quiz' | 'market_pulse' | 'news_feed' | 'market_analyzer' | 'economic_calendar' | 'backtester' | 'settings';

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