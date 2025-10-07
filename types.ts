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

export type AppView = 'lesson' | 'pattern' | 'timed' | 'canvas' | 'simulator' | 'saved' | 'achievements' | 'trading_plan' | 'mentor' | 'quiz' | 'market_pulse' | 'news_feed' | 'market_analyzer';

export interface MultipleChoiceQuestion {
    question: string;
    options: string[];
    correctAnswer: string; // The text of the correct option
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  // FIX: React was not imported, causing an error on the line below.
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