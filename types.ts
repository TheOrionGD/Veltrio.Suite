
export enum SentimentLabel {
  Positive = 'Positive',
  Negative = 'Negative',
  Neutral = 'Neutral',
}

export interface SentimentResult {
  sentiment: SentimentLabel;
  explanation: string;
  intensity: number;          // 0.0 to 1.0 scale
  emotionalInsights: string[]; // e.g. ["Excited", "Anxious", "Calm"]
  tone: string;               // e.g. "Professional", "Informal"
  confidence: number;         // Sentiment AI confidence score
}

export interface Language {
  code: string;
  name: string;
}

export interface TranslationResult {
  translatedText: string;
  detectedLanguageName?: string;
  detectedLanguageCode?: string;
  languageConfidence?: number;  // 0.0 to 1.0 scale
  qualityScore?: number;        // Translation quality score (0.0 to 1.0)
  clarityScore?: number;        // Readability/Clarity score (0.0 to 1.0)
}

export interface HistoryItem {
  id: string;
  inputText: string;
  translatedText: string;
  sentiment: SentimentResult;
  targetLanguage: string;
  targetLanguageName: string;
  timestamp: number;
  languageConfidence?: number;
  qualityScore?: number;
  clarityScore?: number;
  detectedLanguageName?: string;
}

export type AppPage =
  | 'dashboard'
  | 'translator'
  | 'conversation'
  | 'analytics'
  | 'projects'
  | 'files'
  | 'history'
  | 'settings'
  | 'profile'
  | 'notifications'
  | 'help';

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  sessionsCount: number;
  tags: string[];
}

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: number;
  content: string;
  translatedContent?: string;
  status: 'idle' | 'translating' | 'completed' | 'failed';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'alert';
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  apiKey?: string;
  logo: string;
}


