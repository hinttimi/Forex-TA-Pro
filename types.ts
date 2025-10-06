
export interface Lesson {
  key: string;
  title: string;
  contentPrompt: string;
  chartPrompt: string;
}

export interface Module {
  title: string;
  lessons: Lesson[];
}

export type AppView = 'lesson' | 'pattern' | 'timed' | 'canvas';

export interface MultipleChoiceQuestion {
    question: string;
    options: string[];
    correctAnswer: string; // The text of the correct option
}
