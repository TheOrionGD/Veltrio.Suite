import React, { useState } from 'react';
import { AppPage } from '../types';
import MobileNavWheel from './MobileNavWheel';

interface FloatingDockProps {
  currentPage: AppPage;
  setCurrentPage: (page: AppPage) => void;
  activeOverlay: AppPage | null;
  setActiveOverlay: (overlay: AppPage | null) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  unreadNotificationsCount: number;
  currentUser: { id: string; name: string; email: string; preferences?: any } | null;
  onLogout: () => void;
  isAssistantOpen: boolean;
  setIsAssistantOpen: (open: boolean) => void;
}

const FloatingDock: React.FC<FloatingDockProps> = ({
  currentPage,
  setCurrentPage,
  activeOverlay,
  setActiveOverlay,
  theme,
  toggleTheme,
  unreadNotificationsCount,
  currentUser,
  onLogout,
  isAssistantOpen,
  setIsAssistantOpen,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleNavClick = (mode: AppPage, isOverlay: boolean) => {
    if (isOverlay) {
      if (activeOverlay === mode) {
        setActiveOverlay(null);
      } else {
        setActiveOverlay(mode);
      }
    } else {
      setCurrentPage(mode);
      setActiveOverlay(null); // Close any active overlay when switching primary communication workspace
    }
  };

  // If minimized, render a tiny glowing trigger orb in the corner
  if (isMinimized) {
    return (
      <>
        <button
          onClick={() => setIsMinimized(false)}
          className="hidden md:flex fixed bottom-6 left-6 z-50 p-3 bg-gradient-to-br from-[#44b3cc] to-[#2896b2] rounded-full shadow-lg shadow-[#44b3cc]/20 hover:scale-110 cursor-pointer items-center justify-center transition-all duration-300"
          title="Restore Navigation"
        >
          <div className="pulsing-dot" />
          <span className="ml-2.5 text-[9px] font-black uppercase tracking-wider text-white pr-2.5">Menu</span>
        </button>

        <div className="block md:hidden">
          <MobileNavWheel
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            activeOverlay={activeOverlay}
            setActiveOverlay={setActiveOverlay}
            isAssistantOpen={isAssistantOpen}
            setIsAssistantOpen={setIsAssistantOpen}
            unreadNotificationsCount={unreadNotificationsCount}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex-col items-center">
      {/* User Context Quick Menu (revealed dynamically above the dock) */}
      {showUserMenu && currentUser && (
        <div className="mb-3 glass-panel p-4 flex flex-col gap-2.5 min-w-[200px] border border-zinc-200/50 dark:border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-200/50 dark:border-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#44b3cc] to-[#2896b2] text-white flex items-center justify-center text-xs font-black uppercase shrink-0">
              {currentUser.name ? currentUser.name[0] : 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-[10px] font-bold text-[#234556] dark:text-white truncate">
                {currentUser.name}
              </div>
              <div className="text-[8px] text-zinc-550 dark:text-zinc-400 truncate">
                {currentUser.email}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              handleNavClick('profile', true);
              setShowUserMenu(false);
            }}
            className="w-full text-left py-1 text-[10px] font-bold uppercase tracking-wider text-[#2782a0] dark:text-[#b4e4ed] hover:text-[#44b3cc] cursor-pointer"
          >
            👤 Profile Info
          </button>
          <button
            onClick={onLogout}
            className="w-full text-left py-1 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-400 cursor-pointer"
          >
            🚪 Sign Out
          </button>
        </div>
      )}

      {/* Main Glass Navigation Capsule */}
      <nav className="glass-pill px-6 py-2.5 flex items-center gap-4 border border-zinc-200/55 dark:border-white/15 shadow-xl hover:border-[#44b3cc]/20 transition-all duration-300">
        
        {/* SECTION 1: Primary Communication Channels */}
        <div className="flex items-center gap-1.5 pr-3.5 border-r border-zinc-200/50 dark:border-white/10">
          {/* Written Link Mode */}
          <button
            onClick={() => handleNavClick('translator', false)}
            className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 hover-scale cursor-pointer ${
              currentPage === 'translator' && !activeOverlay
                ? 'bg-gradient-to-r from-[#44b3cc]/15 to-[#2896b2]/10 text-[#2896b2] dark:text-[#44b3cc] border border-[#44b3cc]/20'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
            title="Written Link (Translator)"
          >
            <span>📝</span>
            <span className="text-[9px] uppercase tracking-wider hidden md:inline">Text</span>
          </button>

          {/* Voice Link Mode */}
          <button
            onClick={() => handleNavClick('conversation', false)}
            className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 hover-scale cursor-pointer ${
              currentPage === 'conversation' && !activeOverlay
                ? 'bg-gradient-to-r from-[#44b3cc]/15 to-[#2896b2]/10 text-[#2896b2] dark:text-[#44b3cc] border border-[#44b3cc]/20'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
            title="Voice Link (Meeting Room)"
          >
            <span>🎙️</span>
            <span className="text-[9px] uppercase tracking-wider hidden md:inline">Voice</span>
          </button>

          {/* AI Copilot Widget Toggle */}
          <button
            onClick={() => setIsAssistantOpen(!isAssistantOpen)}
            className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 hover-scale cursor-pointer ${
              isAssistantOpen
                ? 'bg-[#44b3cc] text-white shadow-md'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
            title="Toggle Aura AI Copilot"
          >
            <span>✨</span>
            <span className="text-[9px] uppercase tracking-wider hidden md:inline">Copilot</span>
          </button>
        </div>

        {/* SECTION 2: Dynamic Tools Overlay Triggers */}
        <div className="flex items-center gap-1.5">
          {/* Analytics Trigger */}
          <button
            onClick={() => handleNavClick('analytics', true)}
            className={`p-2 rounded-xl text-sm transition-all hover-scale cursor-pointer relative ${
              activeOverlay === 'analytics' ? 'text-[#44b3cc] scale-110' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200'
            }`}
            title="View Realtime Analytics"
          >
            <span>📊</span>
          </button>

          {/* Projects / Files Trigger */}
          <button
            onClick={() => handleNavClick('files', true)}
            className={`p-2 rounded-xl text-sm transition-all hover-scale cursor-pointer ${
              activeOverlay === 'files' || activeOverlay === 'projects' ? 'text-[#44b3cc] scale-110' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200'
            }`}
            title="File Manager & Project Folders"
          >
            <span>🗂️</span>
          </button>

          {/* History Drawer Trigger */}
          <button
            onClick={() => handleNavClick('history', true)}
            className={`p-2 rounded-xl text-sm transition-all hover-scale cursor-pointer ${
              activeOverlay === 'history' ? 'text-[#44b3cc] scale-110' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200'
            }`}
            title="Workspace Timeline History"
          >
            <span>🕐</span>
          </button>



          {/* System Settings Trigger */}
          <button
            onClick={() => handleNavClick('settings', true)}
            className={`p-2 rounded-xl text-sm transition-all hover-scale cursor-pointer ${
              activeOverlay === 'settings' ? 'text-[#44b3cc] scale-110' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200'
            }`}
            title="Preferences & Theme Configuration"
          >
            <span>⚙️</span>
          </button>

          {/* Notifications Trigger */}
          <button
            onClick={() => handleNavClick('notifications', true)}
            className={`p-2 rounded-xl text-sm transition-all hover-scale cursor-pointer relative ${
              activeOverlay === 'notifications' ? 'text-[#44b3cc] scale-110' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200'
            }`}
            title="System Alert Logs"
          >
            <span>🔔</span>
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#44b3cc] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#44b3cc]"></span>
              </span>
            )}
          </button>

          {/* Help Overlay Trigger */}
          <button
            onClick={() => handleNavClick('help', true)}
            className={`p-2 rounded-xl text-sm transition-all hover-scale cursor-pointer ${
              activeOverlay === 'help' ? 'text-[#44b3cc] scale-110' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200'
            }`}
            title="Keyboard Shortcuts & Help"
          >
            <span>❓</span>
          </button>
        </div>

        {/* SECTION 3: Utility Control (Theme, Profile, Minimize) */}
        <div className="flex items-center gap-1.5 pl-3.5 border-l border-zinc-200/50 dark:border-white/10">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-xs hover-scale cursor-pointer text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* User Profile Menu Trigger */}
          {currentUser && (
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-1 rounded-full border border-zinc-200/50 dark:border-white/10 hover-scale cursor-pointer"
              title="Operator Menu"
            >
              <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-br from-[#44b3cc] to-[#2896b2] text-white flex items-center justify-center text-[9px] font-black uppercase">
                {currentUser.name ? currentUser.name[0] : 'U'}
              </div>
            </button>
          )}

          {/* Collapse/Minimize Button */}
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 rounded-xl text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover-scale cursor-pointer text-xs"
            title="Minimize Navigation Menu"
          >
            ▼
          </button>
        </div>
      </nav>
      </div>

      <div className="block md:hidden">
        <MobileNavWheel
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          activeOverlay={activeOverlay}
          setActiveOverlay={setActiveOverlay}
          isAssistantOpen={isAssistantOpen}
          setIsAssistantOpen={setIsAssistantOpen}
          unreadNotificationsCount={unreadNotificationsCount}
        />
      </div>
    </>
  );
};

export default FloatingDock;
