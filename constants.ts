
import { Language, AppPage, Integration } from './types';

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Mandarin' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'vi', name: 'Vietnamese' },
];

export interface NavItem {
  id: AppPage;
  label: string;
  icon: string;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', description: 'Overview and usage stats' },
  { id: 'translator', label: 'Written Link', icon: '📝', description: 'Text translation & feedback' },
  { id: 'conversation', label: 'Voice Link', icon: '🎙️', description: 'Real-time speech chat' },
  { id: 'analytics', label: 'Analytics', icon: '📊', description: 'Volume and sentiment charts' },
  { id: 'projects', label: 'Projects', icon: '📁', description: 'Workspaces & translation files' },
  { id: 'files', label: 'File Manager', icon: '🗂️', description: 'Upload & export files' },
  { id: 'history', label: 'History & Timeline', icon: '🕐', description: 'Past session logs' },
  { id: 'settings', label: 'Settings', icon: '⚙️', description: 'Preferences and design themes' },
  { id: 'profile', label: 'Profile', icon: '👤', description: 'Account & API configurations' },
  { id: 'notifications', label: 'Notifications', icon: '🔔', description: 'Copilot alerts & system health' },
  { id: 'help', label: 'Help & Docs', icon: '❓', description: 'Guides and keyboard shortcuts' },
];


