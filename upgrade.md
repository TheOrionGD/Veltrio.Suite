# Upgrade Plan for Veltrio Enterprise Suite

This document lists proposed new features, pages, actions, and workflow enhancements for the Veltrio Enterprise Suite application.

## New Pages

- Dashboard page with usage summary, recent sessions, and analytics.
- Settings page for personalization, theme, language, and account preferences.
- Profile page with user details, saved preferences, and API key management.
- Analytics page for translation volume, conversation metrics, sentiment trends, and top languages.
- Projects page for organizing translation and conversation workflows into named workspaces.
- File manager page for uploading, previewing, and managing import/export files.
- History page for browsing, searching, and replaying past translation/conversation sessions.
- Help & documentation page with guided tutorials, keyboard shortcuts, and FAQ.
- Notifications page for system alerts, update notices, and assistant recommendations.
- Integrations page for connecting to external APIs, cloud storage, and voice services.

## New Features

- Multi-tab workspace support to switch between translator, conversation, analytics, and project views.
- User authentication and account management with login/register flow.
- Persistent user preference storage across devices.
- Real-time collaboration for shared sessions and co-editing translations.
- File import/export for .txt, .docx, .pdf, .csv, and subtitle formats.
- Batch translation mode for processing multiple documents at once.
- Custom prompt templates and reusable assistant workflows.
- Context-aware AI assistance in every page with dynamic prompts.
- Voice recording, speech-to-text, and text-to-speech playback.
- Live multilingual audio translation for meetings: auto-detect speaker language, translate in real time, and deliver output in the recipient's selected language.
- Session bookmarking and quick-jump shortcuts.
- Theme presets plus accent/color customization.
- Dark/light mode plus high-contrast accessibility mode.
- Smart language detection and auto-suggested target languages.
- Advanced translation styles for technical, legal, marketing, and casual tone.
- Sentiment scoring dashboard with history and trend visualization.
- Real-time translation preview and edit-in-place results.
- Offline-first caching for recent sessions and generated translations.
- Undo/redo support for text editing and translation changes.
- Export results to clipboard, JSON, PDF, or CSV.
- Dark mode animation and ambient workspace effects with motion controls.

## New Actions

- Start new project / open existing project.
- Switch workspace mode between Translator, Conversation, Analytics, and Dashboard.
- Save translation session to history or project folder.
- Clear history, archive sessions, or delete specific entries.
- Copy translation result to clipboard.
- Share translation or conversation summaries via link or file.
- Export session data and analytics reports.
- Import source files and automatically generate translation tasks.
- Trigger assistant with custom prompts from any page.
- Open command palette with new quick actions like "New Project", "Open Settings", "Export Report".
- Toggle voice input and output for conversation mode.
- Flag content for review, mark as finalized, or request a rewrite.
- Apply translation quality checks and style validation.
- Compare original text with translated text in side-by-side view.
- Filter session history by date, language, sentiment, and project.
- Enable scheduled translations or recurring translation jobs.
- Connect to external services such as Google Drive, Dropbox, Slack, Teams, and CRM.
- Enable notifications for translation completion or assistant updates.

## Upgrade Goals and Priorities

- Improve user productivity by adding structured pages and a unified workspace.
- Increase application value with analytics, organization, and user account workflows.
- Expand input/output capabilities with file handling, voice, and export actions.
- Strengthen the AI assistant by making it context-aware, reusable, and accessible from all pages.
- Enhance usability with themes, accessibility options, keyboard shortcuts, and history management.

### Color theme
- | Semantic Token   | Jelly Bean Shade |
| ---------------- | ---------------- |
| Primary          | 500              |
| Primary Light    | 400              |
| Primary Dark     | 700              |
| Secondary        | 300              |
| Secondary Light  | 100–200          |
| Secondary Dark   | 600              |
| Light Background | 50               |
| Dark Background  | 950              |
| Light Text       | 900              |
| Dark Text        | 50               |


const theme = {
  light: {
    // Brand
    primary: '#2896b2',       // 500
    primaryHover: '#2782a0',  // 600
    primaryActive: '#24637a', // 700

    secondary: '#7fd0e1',     // 300
    secondaryHover: '#44b3cc',// 400

    // Backgrounds
    background: '#effbfc',    // 50
    surface: '#ffffff',
    card: '#d7f2f6',          // 100

    // Borders
    border: '#b4e4ed',        // 200
    cardBorder: '#b4e4ed',    // 200

    // Text
    textPrimary: '#234556',   // 900
    textSecondary: '#255265', // 800
    textMuted: '#2782a0',     // 600
    textOnPrimary: '#ffffff',

    // States
    success: '#2896b2',
    link: '#2896b2',
    shadow: 'rgba(35,69,86,0.08)',
  },

  dark: {
    // Brand
    primary: '#44b3cc',       // 400
    primaryHover: '#7fd0e1',  // 300
    primaryActive: '#2896b2', // 500

    secondary: '#2782a0',     // 600
    secondaryHover: '#24637a',// 700

    // Backgrounds
    background: '#122d3a',    // 950
    surface: '#234556',       // 900
    card: '#255265',          // 800

    // Borders
    border: '#24637a',        // 700
    cardBorder: '#2782a0',    // 600

    // Text
    textPrimary: '#effbfc',   // 50
    textSecondary: '#d7f2f6', // 100
    textMuted: '#b4e4ed',     // 200
    textOnPrimary: '#ffffff',

    // States
    success: '#44b3cc',
    link: '#7fd0e1',
    shadow: 'rgba(0,0,0,0.35)',
  },
};