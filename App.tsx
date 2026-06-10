import React, { useState, useEffect } from 'react';
import FloatingDock from './components/FloatingDock';
import TranslatorView from './components/TranslatorView';
import ConversationView from './components/ConversationView';
import AnalyticsView from './components/AnalyticsView';
import ProjectsView from './components/ProjectsView';
import FileManagerView from './components/FileManagerView';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';
import ProfileView from './components/ProfileView';
import NotificationsView from './components/NotificationsView';
import HelpView from './components/HelpView';
import LandingPage from './components/LandingPage';
import ChatbotWidget from './components/ChatbotWidget';
import CommandPalette from './components/CommandPalette';
import { HistoryItem, NotificationItem, AppPage } from './types';
import AuthPage from './components/AuthPage';


const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [page, setPage] = useState<AppPage>('translator');
  const [activeOverlay, setActiveOverlay] = useState<AppPage | null>(null);
  
  // Workspace States managed at App root for Command Palette access
  const [inputLanguage, setInputLanguage] = useState<string>('auto');
  const [targetLanguage, setTargetLanguage] = useState<string>('es');
  const [translationMode, setTranslationMode] = useState<'native' | 'industrial' | 'customer'>('industrial');
  const [clearHistoryTrigger, setClearHistoryTrigger] = useState<number>(0);
  const [inputText, setInputText] = useState<string>('');

  // Layout UI States
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantContextPrompt, setAssistantContextPrompt] = useState<string>('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string; preferences?: any } | null>(() => {
    try {
      const stored = localStorage.getItem('veltrioUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const storedUser = localStorage.getItem('veltrioUser');
      const user = storedUser ? JSON.parse(storedUser) : null;
      if (user?.preferences?.theme) {
        return user.preferences.theme;
      }
      return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Sync theme class to HTML node
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch {}
  }, [theme]);

  // Sync accent color from currentUser preferences / localStorage / theme state
  useEffect(() => {
    const applyAccent = () => {
      const activeColor = currentUser?.preferences?.accentColor || localStorage.getItem('accent_color') || 'teal';
      let hex = '#14b8a6'; // default Teal
      if (activeColor === 'custom') {
        hex = currentUser?.preferences?.customAccentColor || localStorage.getItem('custom_accent_color') || '#44b3cc';
      } else {
        const swatches = [
          { id: 'indigo', hex: '#6366f1', darkHex: '#818cf8' },
          { id: 'sky', hex: '#0ea5e9', darkHex: '#38bdf8' },
          { id: 'teal', hex: '#14b8a6', darkHex: '#2dd4bf' },
          { id: 'coral', hex: '#f97316', darkHex: '#fb923c' },
          { id: 'amber', hex: '#f59e0b', darkHex: '#fbbf24' },
          { id: 'rose', hex: '#f43f5e', darkHex: '#fb7185' },
        ];
        const swatch = swatches.find((s) => s.id === activeColor);
        if (swatch) {
          hex = theme === 'dark' && swatch.darkHex ? swatch.darkHex : swatch.hex;
        }
      }
      document.documentElement.style.setProperty('--accent', hex);
    };

    applyAccent();

    window.addEventListener('storage', applyAccent);
    window.addEventListener('accent-changed', applyAccent);
    return () => {
      window.removeEventListener('storage', applyAccent);
      window.removeEventListener('accent-changed', applyAccent);
    };
  }, [theme, currentUser]);

  // Sync history from MongoDB
  const fetchHistory = async () => {
    if (!currentUser) {
      setHistory([]);
      return;
    }
    try {
      const res = await fetch(`/api/history?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentUser, page, clearHistoryTrigger]);

  const fetchNotifications = async () => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentUser, page, activeOverlay]);

  const updatePreferences = async (newPrefs: any) => {
    if (!currentUser) return;
    try {
      const updatedPrefs = { ...currentUser.preferences, ...newPrefs };
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          preferences: updatedPrefs,
        }),
      });
      if (res.ok) {
        const updatedUser = { ...currentUser, preferences: updatedPrefs };
        setCurrentUser(updatedUser);
        localStorage.setItem('veltrioUser', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Failed to update preferences:', err);
    }
  };

  // Command palette listener (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAskAssistant = (prompt: string) => {
    setIsAssistantOpen(true);
    setAssistantContextPrompt(prompt);
  };

  const handleDeleteHistoryItem = async (id: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/history?userId=${currentUser.id}&id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchHistory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearHistory = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/history?userId=${currentUser.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setHistory([]);
        setClearHistoryTrigger((prev) => prev + 1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (currentUser) {
      updatePreferences({ theme: nextTheme });
    }
  };

  const handleLoginSuccess = (user: { id: string; name: string; email: string; preferences?: any }) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('veltrioUser', JSON.stringify(user));
    } catch {}
    if (user.preferences?.theme) {
      setTheme(user.preferences.theme);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('veltrioUser');
    } catch {}
    setPage('translator');
  };

  const handleMarkAsRead = async (id: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}&id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleDismissNotification = async (id: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}&id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  const handleCommandPaletteSelectMode = (mode: AppPage) => {
    if (['translator', 'conversation'].includes(mode)) {
      setPage(mode);
      setActiveOverlay(null);
    } else {
      setActiveOverlay(mode);
    }
    setIsCommandPaletteOpen(false);
  };

  const renderPage = () => {
    switch (page) {
      case 'conversation':
        return (
          <ConversationView
            onAskAssistant={handleAskAssistant}
            inputLanguage={inputLanguage}
            setInputLanguage={setInputLanguage}
            clearHistoryTrigger={clearHistoryTrigger}
          />
        );
      case 'translator':
      default:
        return (
          <TranslatorView
            onAskAssistant={handleAskAssistant}
            inputLanguage={inputLanguage}
            setInputLanguage={setInputLanguage}
            targetLanguage={targetLanguage}
            setTargetLanguage={setTargetLanguage}
            translationMode={translationMode}
            setTranslationMode={setTranslationMode}
            clearHistoryTrigger={clearHistoryTrigger}
          />
        );
    }
  };

  const renderOverlayContent = () => {
    if (!activeOverlay) return null;
    switch (activeOverlay) {
      case 'analytics':
        return <AnalyticsView history={history} />;
      case 'projects':
        return <ProjectsView onAskAssistant={handleAskAssistant} />;
      case 'files':
        return (
          <FileManagerView
            onAskAssistant={handleAskAssistant}
            setInputText={setInputText}
            setCurrentPage={(mode) => {
              setPage(mode);
              setActiveOverlay(null);
            }}
          />
        );
      case 'history':
        return (
          <HistoryView
            history={history}
            onClearHistory={handleClearHistory}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            setInputText={setInputText}
            setTargetLanguage={setTargetLanguage}
            setCurrentPage={(mode) => {
              setPage(mode);
              setActiveOverlay(null);
            }}
          />
        );

      case 'settings':
        return (
          <SettingsView
            theme={theme}
            toggleTheme={handleToggleTheme}
            onClearHistory={handleClearHistory}
            currentUser={currentUser}
            onUpdatePreferences={updatePreferences}
            setActiveOverlay={setActiveOverlay}
          />
        );
      case 'profile':
        return <ProfileView currentUser={currentUser} onProfileUpdate={handleLoginSuccess} onLogout={handleLogout} />;
      case 'notifications':
        return (
          <NotificationsView
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDismissNotification={handleDismissNotification}
          />
        );
      case 'help':
        return <HelpView />;
      default:
        return null;
    }
  };

  if (showLanding) {
    return (
      <LandingPage
        onStart={() => setShowLanding(false)}
        theme={theme}
        toggleTheme={handleToggleTheme}
      />
    );
  }

  if (!currentUser) {
    return (
      <AuthPage onLoginSuccess={handleLoginSuccess} />
    );
  }

  return (
    <div className="relative min-h-screen text-foreground select-none overflow-x-hidden flex font-sans transition-colors duration-500 bg-[#effbfc] dark:bg-[#122d3a]">
      {/* Immersive Floating Ambient Light Elements */}
      <div className="ambient-bg">
        <div
          className="ambient-glow bg-gradient-to-tr from-[#44b3cc]/20 via-[#2782a0]/15 to-[#2896b2]/10 animate-float-slow"
          style={{
            transform: `translate(${page === 'conversation' ? 10 : -10}%, ${
              page === 'conversation' ? 5 : -5
            }%)`,
          }}
        />
      </div>

      {/* Floating Action Zone / Floating Navigation Dock */}
      <FloatingDock
        currentPage={page}
        setCurrentPage={setPage}
        activeOverlay={activeOverlay}
        setActiveOverlay={setActiveOverlay}
        theme={theme}
        toggleTheme={handleToggleTheme}
        unreadNotificationsCount={notifications.filter((n) => !n.read).length}
        currentUser={currentUser}
        onLogout={handleLogout}
        isAssistantOpen={isAssistantOpen}
        setIsAssistantOpen={setIsAssistantOpen}
      />

      {/* Main Workspace Frame */}
      <div className="flex-grow flex flex-col min-h-screen overflow-y-auto pb-44 md:pb-32">
        <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8 flex flex-col items-center justify-start z-10">
          <div className="w-full flex-grow flex items-start justify-center">
            {renderPage()}
          </div>
        </main>
      </div>

      {/* sliding / floating AI Assistant overlay panel */}
      {isAssistantOpen && (
        <div className="fixed bottom-48 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 md:bottom-6 z-40 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <ChatbotWidget
            isInline={false}
            isOpen={isAssistantOpen}
            onClose={() => setIsAssistantOpen(false)}
            contextPrompt={assistantContextPrompt}
            clearContextPrompt={() => setAssistantContextPrompt('')}
          />
        </div>
      )}

      {/* Command Palette Overlay */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectMode={handleCommandPaletteSelectMode}
        onSelectTargetLanguage={setTargetLanguage}
        onSelectSourceLanguage={setInputLanguage}
        onSelectStyle={setTranslationMode}
        onClearHistory={handleClearHistory}
        onAskAI={handleAskAssistant}
      />

      {/* Dynamic Glass Drawer Overlay Container */}
      {activeOverlay && (
        <>
          <div
            className="drawer-backdrop animate-in fade-in duration-300"
            onClick={() => setActiveOverlay(null)}
          />
          <div className="glass-drawer drawer-open animate-in slide-in-from-right duration-500">
            <div className="p-4 md:p-5 border-b border-zinc-200/50 dark:border-white/5 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#234556] dark:text-[#effbfc] flex items-center gap-2">
                {activeOverlay === 'analytics' && '📈 Session Analytics'}
                {(activeOverlay === 'files' || activeOverlay === 'projects') && '🗂️ Project Workspace'}
                {activeOverlay === 'history' && '🕐 History Timeline'}

                {(activeOverlay === 'settings' || activeOverlay === 'profile') && '⚙️ System Control'}
                {activeOverlay === 'notifications' && '🔔 System Alerts'}
                {activeOverlay === 'help' && '❓ Documentation'}
              </h2>

              {/* Drawer tab switcher for combined pages */}
              {(activeOverlay === 'files' || activeOverlay === 'projects') && (
                <div className="flex bg-zinc-800/10 dark:bg-white/5 border border-zinc-200/40 dark:border-white/5 p-0.5 rounded-xl text-[9px] font-bold">
                  <button
                    onClick={() => setActiveOverlay('files')}
                    className={`px-2 py-1 rounded-lg uppercase tracking-wider cursor-pointer transition-all ${
                      activeOverlay === 'files' ? 'text-white shadow-sm' : 'text-zinc-555 dark:text-zinc-400'
                    }`}
                    style={activeOverlay === 'files' ? { backgroundColor: 'var(--accent)' } : undefined}
                  >
                    Files
                  </button>
                  <button
                    onClick={() => setActiveOverlay('projects')}
                    className={`px-2 py-1 rounded-lg uppercase tracking-wider cursor-pointer transition-all ${
                      activeOverlay === 'projects' ? 'text-white shadow-sm' : 'text-zinc-555 dark:text-zinc-400'
                    }`}
                    style={activeOverlay === 'projects' ? { backgroundColor: 'var(--accent)' } : undefined}
                  >
                    Projects
                  </button>
                </div>
              )}

              {(activeOverlay === 'settings' || activeOverlay === 'profile') && (
                <div className="flex bg-zinc-800/10 dark:bg-white/5 border border-zinc-200/40 dark:border-white/5 p-0.5 rounded-xl text-[9px] font-bold">
                  <button
                    onClick={() => setActiveOverlay('settings')}
                    className={`px-2 py-1 rounded-lg uppercase tracking-wider cursor-pointer transition-all ${
                      activeOverlay === 'settings' ? 'text-white shadow-sm' : 'text-zinc-555 dark:text-zinc-400'
                    }`}
                    style={activeOverlay === 'settings' ? { backgroundColor: 'var(--accent)' } : undefined}
                  >
                    Prefs
                  </button>
                  <button
                    onClick={() => setActiveOverlay('profile')}
                    className={`px-2 py-1 rounded-lg uppercase tracking-wider cursor-pointer transition-all ${
                      activeOverlay === 'profile' ? 'text-white shadow-sm' : 'text-zinc-555 dark:text-zinc-400'
                    }`}
                    style={activeOverlay === 'profile' ? { backgroundColor: 'var(--accent)' } : undefined}
                  >
                    Account
                  </button>
                </div>
              )}

              <button
                onClick={() => setActiveOverlay(null)}
                className="text-zinc-450 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-xs font-black font-mono"
              >
                ✕
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-4 pb-36 md:p-5 md:pb-5 scrollbar-thin">
              {renderOverlayContent()}
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default App;

