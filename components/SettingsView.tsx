import React, { useState, useEffect } from 'react';

interface SettingsViewProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onClearHistory: () => void;
  currentUser: { id: string; name: string; email: string; preferences?: any } | null;
  onUpdatePreferences: (newPrefs: any) => Promise<void>;
  setActiveOverlay?: (overlay: any) => void;
}

const ACCENT_SWATCHES = [
  { id: 'indigo', label: 'Indigo', hex: '#6366f1', darkHex: '#818cf8' },
  { id: 'sky', label: 'Sky', hex: '#0ea5e9', darkHex: '#38bdf8' },
  { id: 'teal', label: 'Teal', hex: '#14b8a6', darkHex: '#2dd4bf' },
  { id: 'coral', label: 'Coral', hex: '#f97316', darkHex: '#fb923c' },
  { id: 'amber', label: 'Amber', hex: '#f59e0b', darkHex: '#fbbf24' },
  { id: 'rose', label: 'Rose', hex: '#f43f5e', darkHex: '#fb7185' },
];

const LOCALES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'es-ES', label: 'Spanish (ES)' },
  { code: 'fr-FR', label: 'French (FR)' },
  { code: 'de-DE', label: 'German (DE)' },
  { code: 'ja-JP', label: 'Japanese (JP)' },
  { code: 'zh-CN', label: 'Chinese (CN)' },
];

const TIMEZONES = [
  { code: 'UTC', label: 'UTC' },
  { code: 'America/New_York', label: 'America/New York (EST)' },
  { code: 'Europe/London', label: 'Europe/London (BST)' },
  { code: 'Europe/Paris', label: 'Europe/Paris (CEST)' },
  { code: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { code: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
  { code: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
];

const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  toggleTheme,
  currentUser,
  onUpdatePreferences,
  setActiveOverlay,
}) => {
  // Appearance state variables
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme_mode') as 'light' | 'dark' | 'system') || 'dark';
  });

  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('accent_color') || 'teal';
  });

  const [customColor, setCustomColor] = useState(() => {
    return localStorage.getItem('custom_accent_color') || '#44b3cc';
  });

  // Toggles driven by config array state
  const [notificationSettings, setNotificationSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('veltrio_notif_settings');
      return stored
        ? JSON.parse(stored)
        : [
            { id: 'copilot', label: 'Copilot Recommendations', desc: 'Get real-time workspace suggestions.', enabled: true },
            { id: 'completed', label: 'Sound Alerts', desc: 'Play brief chime when translations finish.', enabled: false },
            { id: 'system', label: 'Maintenance Alerts', desc: 'Updates on network or translation model status.', enabled: true },
          ];
    } catch {
      return [];
    }
  });

  const [privacySettings, setPrivacySettings] = useState(() => {
    try {
      const stored = localStorage.getItem('veltrio_privacy_settings');
      return stored
        ? JSON.parse(stored)
        : [
            { id: 'share', label: 'Share Anonymous Logs', desc: 'Anonymously report semantic completion logs to improve AI registers.', enabled: false },
            { id: 'history', label: 'Save Local History', desc: 'Automatically store translation timelines in MongoDB.', enabled: true },
            { id: 'discovery', label: 'Discovery Mode', desc: 'Allow other operators in your organization to view your stats.', enabled: true },
          ];
    } catch {
      return [];
    }
  });

  // Locale and Timezone State
  const [locale, setLocale] = useState(() => localStorage.getItem('veltrio_locale') || 'en-US');
  const [timezone, setTimezone] = useState(() => localStorage.getItem('veltrio_timezone') || 'America/New_York');

  // Sync settings changes to root and localStorage
  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    localStorage.setItem('theme_mode', mode);

    const root = document.documentElement;
    if (mode === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) {
        root.classList.add('dark');
        root.classList.remove('light');
        if (theme === 'light') toggleTheme();
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
        if (theme === 'dark') toggleTheme();
      }
    } else {
      if (mode === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        if (theme === 'light') toggleTheme();
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
        if (theme === 'dark') toggleTheme();
      }
    }
    onUpdatePreferences({ theme: mode });
  };

  const handleAccentSelect = (id: string) => {
    setAccentColor(id);
    localStorage.setItem('accent_color', id);

    let hex = '#14b8a6';
    const swatch = ACCENT_SWATCHES.find((s) => s.id === id);
    if (swatch) {
      hex = theme === 'dark' && swatch.darkHex ? swatch.darkHex : swatch.hex;
    }
    document.documentElement.style.setProperty('--accent', hex);
    window.dispatchEvent(new Event('accent-changed'));
    onUpdatePreferences({ accentColor: id });
  };

  const handleCustomColorChange = (hex: string) => {
    setAccentColor('custom');
    setCustomColor(hex);
    localStorage.setItem('accent_color', 'custom');
    localStorage.setItem('custom_accent_color', hex);
    document.documentElement.style.setProperty('--accent', hex);
    window.dispatchEvent(new Event('accent-changed'));
    onUpdatePreferences({ accentColor: 'custom', customAccentColor: hex });
  };

  const handleToggleNotification = (id: string) => {
    const updated = notificationSettings.map((item: any) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    setNotificationSettings(updated);
    localStorage.setItem('veltrio_notif_settings', JSON.stringify(updated));
  };

  const handleTogglePrivacy = (id: string) => {
    const updated = privacySettings.map((item: any) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    setPrivacySettings(updated);
    localStorage.setItem('veltrio_privacy_settings', JSON.stringify(updated));
  };

  const handleLocaleChange = (val: string) => {
    setLocale(val);
    localStorage.setItem('veltrio_locale', val);
    onUpdatePreferences({ locale: val });
  };

  const handleTimezoneChange = (val: string) => {
    setTimezone(val);
    localStorage.setItem('veltrio_timezone', val);
    onUpdatePreferences({ timezone: val });
  };

  // Re-apply correct swatch hex if theme toggles underneath Settings mode
  useEffect(() => {
    if (accentColor !== 'custom') {
      const swatch = ACCENT_SWATCHES.find((s) => s.id === accentColor);
      if (swatch) {
        const hex = theme === 'dark' && swatch.darkHex ? swatch.darkHex : swatch.hex;
        document.documentElement.style.setProperty('--accent', hex);
      }
    }
  }, [theme, accentColor]);

  return (
    <div className="w-full max-w-5xl px-4 py-8 space-y-8 animate-fade-in font-sans pb-36">
      <div className="border-b border-border/50 pb-4">
        <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider text-foreground">
          System Control Center
        </h1>
        <p className="text-xs text-muted">
          Adjust visual styles, localization, and notification variables
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Columns - Appearance & Main Rules */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Appearance */}
          <div className="glass-panel p-6 space-y-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground border-b border-border/30 pb-3">
              Appearance Customization
            </h2>

            {/* Theme Selectors */}
            <div className="space-y-3">
              <label className="text-[9px] uppercase tracking-widest font-extrabold text-muted">
                Design Theme Preset
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'dark', label: 'Dark Space', desc: 'Luxury deep theme' },
                  { id: 'light', label: 'Clean Light', desc: 'Bright contrast' },
                  { id: 'system', label: 'Auto System', desc: 'Sync system theme' },
                ].map((mode) => {
                  const isActive = themeMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => handleThemeChange(mode.id as any)}
                      className="p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all hover:scale-[1.02] cursor-pointer text-xs font-medium"
                      style={{
                        borderColor: isActive ? 'var(--accent)' : 'var(--color-border, rgba(255,255,255,0.1))',
                        background: isActive ? 'rgba(35, 69, 86, 0.15)' : 'transparent',
                        boxShadow: isActive ? '0 0 0 1px var(--accent)' : 'none',
                      }}
                    >
                      <span className="font-extrabold text-foreground" style={{ color: isActive ? 'var(--accent)' : undefined }}>
                        {mode.label}
                      </span>
                      <span className="text-[8px] text-muted leading-tight">{mode.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accent swatches */}
            <div className="space-y-3">
              <label className="text-[9px] uppercase tracking-widest font-extrabold text-muted">
                Accent Color Swatches
              </label>
              <div className="flex items-center gap-3.5 flex-wrap">
                {ACCENT_SWATCHES.map((swatch) => {
                  const isActive = accentColor === swatch.id;
                  return (
                    <button
                      key={swatch.id}
                      onClick={() => handleAccentSelect(swatch.id)}
                      className="w-7 h-7 rounded-full cursor-pointer transition-all hover:scale-110 flex items-center justify-center border border-zinc-200/30 dark:border-white/5 relative"
                      style={{
                        backgroundColor: swatch.hex,
                        boxShadow: isActive ? '0 0 0 3px var(--accent)' : 'none',
                      }}
                      title={swatch.label}
                    >
                      {isActive && <span className="text-white text-[10px] font-black">✓</span>}
                    </button>
                  );
                })}

                {/* Custom input swatch */}
                <div className="relative flex items-center">
                  <button
                    onClick={() => document.getElementById('custom-color-picker')?.click()}
                    className="w-7 h-7 rounded-full cursor-pointer transition-all hover:scale-110 flex items-center justify-center border border-zinc-200/30 dark:border-white/5 relative"
                    style={{
                      background: 'linear-gradient(135deg, #ff007f, #7f00ff, #007fff, #00ff7f, #ff7f00)',
                      boxShadow: accentColor === 'custom' ? '0 0 0 3px var(--accent)' : 'none',
                    }}
                    title="Custom Accent Color"
                  >
                    {accentColor === 'custom' && <span className="text-white text-[10px] font-black">✓</span>}
                  </button>
                  <input
                    id="custom-color-picker"
                    type="color"
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    className="absolute w-0 h-0 opacity-0 pointer-events-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Notifications */}
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground border-b border-border/30 pb-3">
              Notification Routes
            </h2>
            <div className="divide-y divide-border/20 space-y-4">
              {notificationSettings.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between gap-4 pt-3 first:pt-0">
                  <div>
                    <h3 className="text-xs font-bold text-foreground">{item.label}</h3>
                    <p className="text-[10px] text-muted">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => handleToggleNotification(item.id)}
                    className="w-9 h-5 rounded-full p-0.5 transition-all duration-300 cursor-pointer relative shrink-0"
                    style={{
                      backgroundColor: item.enabled ? 'var(--accent)' : 'var(--color-border, rgba(255,255,255,0.08))',
                    }}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${
                        item.enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Privacy */}
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground border-b border-border/30 pb-3">
              Privacy Settings
            </h2>
            <div className="divide-y divide-border/20 space-y-4">
              {privacySettings.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between gap-4 pt-3 first:pt-0">
                  <div>
                    <h3 className="text-xs font-bold text-foreground">{item.label}</h3>
                    <p className="text-[10px] text-muted">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => handleTogglePrivacy(item.id)}
                    className="w-9 h-5 rounded-full p-0.5 transition-all duration-300 cursor-pointer relative shrink-0"
                    style={{
                      backgroundColor: item.enabled ? 'var(--accent)' : 'var(--color-border, rgba(255,255,255,0.08))',
                    }}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${
                        item.enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Region & Account Link */}
        <div className="space-y-6">
          
          {/* Section 4: Language & Region */}
          <div className="glass-panel p-6 space-y-5">
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground border-b border-border/30 pb-3">
              Language & Region
            </h2>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-widest font-extrabold text-muted">
                  System Locale Language
                </label>
                <select
                  value={locale}
                  onChange={(e) => handleLocaleChange(e.target.value)}
                  className="glass-input w-full px-3 py-2 border border-border rounded-xl text-xs bg-card text-foreground focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                  style={{ focusRingColor: 'var(--accent)' }}
                >
                  {LOCALES.map((loc) => (
                    <option key={loc.code} value={loc.code}>
                      {loc.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-widest font-extrabold text-muted">
                  Timezone Standard
                </label>
                <select
                  value={timezone}
                  onChange={(e) => handleTimezoneChange(e.target.value)}
                  className="glass-input w-full px-3 py-2 border border-border rounded-xl text-xs bg-card text-foreground focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.code} value={tz.code}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Account shortcut link */}
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground border-b border-border/30 pb-3">
              Account Control
            </h2>
            <p className="text-[10px] text-muted leading-relaxed">
              Verify security levels, email validations, and check identity completion scores.
            </p>
            {setActiveOverlay && (
              <button
                onClick={() => setActiveOverlay('profile')}
                className="w-full text-center py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white transition-all hover:scale-[1.02] cursor-pointer shadow-sm"
                style={{
                  backgroundColor: 'var(--accent)',
                }}
              >
                Go to Account Panel →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
