import React, { useState, useEffect, useMemo, useRef } from 'react';

interface ProfileViewProps {
  currentUser: { id: string; name: string; email: string; preferences?: any } | null;
  onProfileUpdate: (user: { id: string; name: string; email: string; preferences?: any }) => void;
  onLogout?: () => void;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneDialCode?: string;
  phone?: string;
  dobDay?: string;
  dobMonth?: string;
  dobYear?: string;
  gender?: string;
  pronouns?: string;
  country: string;
  state?: string;
  city?: string;
  timezone: string;
  occupation?: string;
  organization?: string;
  website?: string;
  bio?: string;
  language: string;
  accentColor: string;
  accountCreated: string;
  lastLogin: string;
  accountType: 'Free' | 'Pro' | 'Team' | 'Enterprise';
}

const COUNTRIES_DB = [
  {
    code: 'US',
    name: 'United States',
    dialCode: '+1',
    flag: '🇺🇸',
    states: [
      { code: 'NY', name: 'New York', cities: ['New York City', 'Albany', 'Buffalo'] },
      { code: 'CA', name: 'California', cities: ['Los Angeles', 'San Francisco', 'San Diego'] }
    ]
  },
  {
    code: 'IN',
    name: 'India',
    dialCode: '+91',
    flag: '🇮🇳',
    states: [
      { code: 'MH', name: 'Maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur'] },
      { code: 'KA', name: 'Karnataka', cities: ['Bengaluru', 'Mysore', 'Hubli'] }
    ]
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    dialCode: '+44',
    flag: '🇬🇧',
    states: [
      { code: 'ENG', name: 'England', cities: ['London', 'Manchester', 'Birmingham'] },
      { code: 'SCO', name: 'Scotland', cities: ['Edinburgh', 'Glasgow', 'Aberdeen'] }
    ]
  }
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
  { code: 'America/New_York', label: 'America/New York (EST)' },
  { code: 'Europe/London', label: 'Europe/London (GMT)' },
  { code: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { code: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { code: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
  { code: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
];

const OPTIONAL_FIELDS = [
  { key: 'phone', label: 'Phone Number', section: 'personal' },
  { key: 'dateOfBirth', label: 'Date of Birth', section: 'personal' },
  { key: 'gender', label: 'Gender', section: 'personal' },
  { key: 'pronouns', label: 'Pronouns', section: 'personal' },
  { key: 'state', label: 'State', section: 'location' },
  { key: 'city', label: 'City', section: 'location' },
  { key: 'occupation', label: 'Occupation', section: 'professional' },
  { key: 'organization', label: 'Organization', section: 'professional' },
  { key: 'website', label: 'Website', section: 'professional' },
  { key: 'bio', label: 'Bio', section: 'professional' },
];

const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, onProfileUpdate, onLogout }) => {
  // Profile Photo state
  const [profilePhoto, setProfilePhoto] = useState<string | null>(() => {
    return localStorage.getItem('profile_icon');
  });
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form state
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem('user_profile');
      if (stored) return JSON.parse(stored);
    } catch {}

    const first = currentUser?.name.split(' ')[0] || '';
    const last = currentUser?.name.split(' ').slice(1).join(' ') || '';
    return {
      firstName: first,
      lastName: last,
      username: `@${currentUser?.name.toLowerCase().replace(/\s+/g, '_') || 'operator'}`,
      email: currentUser?.email || '',
      country: 'US',
      phoneDialCode: '+1',
      timezone: 'America/New_York',
      language: 'en-US',
      accentColor: localStorage.getItem('accent_color') || 'teal',
      accountCreated: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      accountType: 'Pro',
    };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalProfile, setOriginalProfile] = useState<UserProfile>(profile);

  // Accordion collapsing state
  const [accordion, setAccordion] = useState<{ [key: string]: boolean }>({
    personal: true,
    location: false,
    professional: false,
    preferences: false,
    account: false,
  });

  // Highlight and focus refs / handlers
  const toggleAccordion = (section: string) => {
    setAccordion((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const focusAndHighlightField = (fieldId: string, sectionKey: string) => {
    setIsEditing(true);
    setAccordion((prev) => ({ ...prev, [sectionKey]: true }));
    setTimeout(() => {
      const inputEl = document.getElementById(`input-${fieldId}`);
      if (inputEl) {
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inputEl.focus();
        inputEl.classList.add('highlight-ring-flash');
        setTimeout(() => {
          inputEl.classList.remove('highlight-ring-flash');
        }, 2500);
      }
    }, 150);
  };

  // Image Upload Flow
  const handlePencilClick = () => {
    if (!profilePhoto) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmPhoto = () => {
    if (previewPhoto) {
      localStorage.setItem('profile_icon', previewPhoto);
      setProfilePhoto(previewPhoto);
      setPreviewPhoto(null);
    }
  };

  const handleCancelPhoto = () => {
    setPreviewPhoto(null);
  };

  // Form value handlers
  const handleFieldChange = (key: keyof UserProfile, val: any) => {
    setProfile((prev) => ({ ...prev, [key]: val }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    if (!profile.firstName || !profile.lastName || !profile.email) {
      alert('Please fill out all required fields.');
      return;
    }
    localStorage.setItem('user_profile', JSON.stringify(profile));
    setOriginalProfile(profile);
    setHasUnsavedChanges(false);
    setIsEditing(false);

    // Sync back to main application currentUser
    onProfileUpdate({
      id: currentUser?.id || 'temp',
      name: `${profile.firstName} ${profile.lastName}`,
      email: profile.email,
      preferences: {
        ...(currentUser?.preferences || {}),
        accentColor: profile.accentColor,
        locale: profile.language,
        timezone: profile.timezone,
      }
    });
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setHasUnsavedChanges(false);
    setIsEditing(false);
  };

  // Locale syncing to Preferences Accent Color changes
  useEffect(() => {
    const syncAccent = () => {
      const currentAccent = localStorage.getItem('accent_color') || 'teal';
      setProfile((prev) => ({ ...prev, accentColor: currentAccent }));
    };
    window.addEventListener('accent-changed', syncAccent);
    return () => window.removeEventListener('accent-changed', syncAccent);
  }, []);

  // Location Cascading dropdown details
  const activeCountryData = useMemo(() => {
    return COUNTRIES_DB.find((c) => c.code === profile.country);
  }, [profile.country]);

  const activeStateData = useMemo(() => {
    return activeCountryData?.states.find((s) => s.code === profile.state);
  }, [activeCountryData, profile.state]);

  const handleCountryChange = (code: string) => {
    const countryObj = COUNTRIES_DB.find((c) => c.code === code);
    setProfile((prev) => ({
      ...prev,
      country: code,
      state: countryObj?.states[0]?.code || '',
      city: countryObj?.states[0]?.cities[0] || '',
      phoneDialCode: countryObj?.dialCode || '+1'
    }));
    setHasUnsavedChanges(true);
  };

  const handleStateChange = (code: string) => {
    const stateObj = activeCountryData?.states.find((s) => s.code === code);
    setProfile((prev) => ({
      ...prev,
      state: code,
      city: stateObj?.cities[0] || ''
    }));
    setHasUnsavedChanges(true);
  };

  // Completeness percentages
  const completenessDetails = useMemo(() => {
    let filled = 0;
    const missing: typeof OPTIONAL_FIELDS = [];

    OPTIONAL_FIELDS.forEach((f) => {
      let isFilled = false;
      if (f.key === 'dateOfBirth') {
        isFilled = !!(profile.dobDay && profile.dobMonth && profile.dobYear);
      } else {
        isFilled = !!profile[f.key as keyof UserProfile];
      }

      if (isFilled) {
        filled += 1;
      } else {
        missing.push(f);
      }
    });

    const percent = Math.round((filled / OPTIONAL_FIELDS.length) * 100);
    return { percent, missing };
  }, [profile]);

  return (
    <div className="w-full max-w-5xl px-4 py-8 space-y-8 animate-fade-in font-sans pb-36">
      {/* Component internal CSS orbital keyframe styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes orbit-pencil {
          from {
            transform: rotate(120deg) translateX(40px) rotate(-120deg);
          }
          to {
            transform: rotate(480deg) translateX(40px) rotate(-480deg);
          }
        }
        .animate-pencil-orbit {
          animation: orbit-pencil 8s linear infinite;
        }
        .highlight-ring-flash {
          animation: input-ring-flash 2.5s ease-in-out;
        }
        @keyframes input-ring-flash {
          0%, 100% {
            box-shadow: 0 0 0 0 transparent;
            border-color: var(--color-border);
          }
          50% {
            box-shadow: 0 0 0 4px var(--accent);
            border-color: var(--accent);
          }
        }
      `}} />

      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="flex items-center justify-between px-4 py-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl text-xs font-semibold animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <span>⚠️ You have unsaved changes in your profile form ledger.</span>
          </div>
          <button
            onClick={() => setHasUnsavedChanges(false)}
            className="text-amber-500/70 hover:text-amber-500 transition-colors p-1 cursor-pointer font-bold font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border/50 pb-4">
        <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider text-foreground">
          User Account Center
        </h1>
        <p className="text-xs text-muted">
          Configure local operator profiles, cascades, and completeness metrics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Columns - Identity Avatar and Forms */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 space-y-6">
            
            {/* TOP CARD: Identity Avatar orbital view */}
            <div className="flex flex-col sm:flex-row items-center gap-8 pb-6 border-b border-border/30">
              
              {/* Animated Avatar circle container */}
              <div className="relative w-20 h-20 shrink-0 select-none">
                {previewPhoto ? (
                  /* Circular crop preview window */
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#14b8a6] relative shadow-lg">
                    <img src={previewPhoto} className="w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-1.5 z-10">
                      <button
                        onClick={handleConfirmPhoto}
                        className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px] cursor-pointer hover:scale-110 transition-transform"
                        title="Confirm Photo"
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleCancelPhoto}
                        className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-[10px] cursor-pointer hover:scale-110 transition-transform"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Render normal avatar */
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg text-white text-3xl font-black shrink-0 uppercase relative border border-border/30 overflow-hidden"
                    style={{
                      backgroundColor: 'var(--accent)',
                    }}
                  >
                    {profilePhoto ? (
                      <img src={profilePhoto} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                      `${profile.firstName?.slice(0, 1) || 'O'}${profile.lastName?.slice(0, 1) || 'P'}`
                    )}
                  </div>
                )}

                {/* Orbiting Pencil Icon / Lock Icon */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!profilePhoto && !previewPhoto && (
                  <button
                    onClick={handlePencilClick}
                    className="w-7 h-7 rounded-full bg-zinc-800/90 dark:bg-white/95 text-zinc-850 shadow-md flex items-center justify-center text-xs cursor-pointer border border-border/40 hover:scale-115 transition-transform absolute top-50 left-50 -mt-3.5 -ml-3.5 animate-pencil-orbit"
                    title="Upload Profile Photo"
                  >
                    ✏️
                  </button>
                )}

                {profilePhoto && (
                  <div
                    className="w-6 h-6 rounded-full bg-zinc-850 text-white shadow-md flex items-center justify-center text-[10px] border border-border/30 absolute top-50 left-50 -mt-3 -ml-3"
                    style={{
                      transform: 'rotate(120deg) translateX(40px) rotate(-120deg)',
                    }}
                    title="Photo Locked"
                  >
                    🔒
                  </div>
                )}
              </div>

              {/* Text display identity */}
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-base font-extrabold text-foreground leading-tight">
                  {profile.firstName} {profile.lastName}
                </h3>
                <p className="text-xs text-muted">{profile.username}</p>
                <div className="text-[9px] uppercase tracking-wider font-mono text-[#10b981] font-bold mt-1.5 flex items-center gap-1.5 justify-center sm:justify-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
                  System Operator Role
                </div>
              </div>
            </div>

            {/* Accordion profile forms sections */}
            <div className="space-y-4 pt-2">
              
              {/* SECTION ①: Personal Info */}
              <div className="border border-border/30 rounded-2xl overflow-hidden bg-zinc-850/[0.01]">
                <button
                  type="button"
                  onClick={() => toggleAccordion('personal')}
                  className="w-full px-5 py-4 flex items-center justify-between text-xs font-black uppercase tracking-wider text-foreground hover:bg-zinc-800/5 dark:hover:bg-white/[0.01] transition-colors border-b border-border/20"
                >
                  <span>① Personal Information</span>
                  <span>{accordion.personal ? '▲' : '▼'}</span>
                </button>

                {accordion.personal && (
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-extrabold text-muted">
                          First Name {isEditing && <span className="text-red-500">*</span>}
                        </label>
                        {isEditing ? (
                          <input
                            id="input-firstName"
                            type="text"
                            value={profile.firstName}
                            onChange={(e) => handleFieldChange('firstName', e.target.value)}
                            className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs text-foreground bg-card border border-border"
                          />
                        ) : (
                          <div className="text-xs font-medium text-foreground py-1 border-b border-transparent">
                            {profile.firstName || '—'}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-extrabold text-muted">
                          Last Name {isEditing && <span className="text-red-500">*</span>}
                        </label>
                        {isEditing ? (
                          <input
                            id="input-lastName"
                            type="text"
                            value={profile.lastName}
                            onChange={(e) => handleFieldChange('lastName', e.target.value)}
                            className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs text-foreground bg-card border border-border"
                          />
                        ) : (
                          <div className="text-xs font-medium text-foreground py-1 border-b border-transparent">
                            {profile.lastName || '—'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-extrabold text-muted">
                          Username Handle {isEditing && <span className="text-red-500">*</span>}
                        </label>
                        {isEditing ? (
                          <input
                            id="input-username"
                            type="text"
                            value={profile.username}
                            onChange={(e) => handleFieldChange('username', e.target.value)}
                            className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs text-foreground bg-card border border-border"
                          />
                        ) : (
                          <div className="text-xs font-medium text-foreground py-1 border-b border-transparent">
                            {profile.username || '—'}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-extrabold text-muted">
                          Email Address {isEditing && <span className="text-red-500">*</span>}
                        </label>
                        {isEditing ? (
                          <input
                            id="input-email"
                            type="email"
                            value={profile.email}
                            onChange={(e) => handleFieldChange('email', e.target.value)}
                            className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs text-foreground bg-card border border-border"
                          />
                        ) : (
                          <div className="text-xs font-medium text-foreground py-1 border-b border-transparent flex items-center gap-2">
                            <span>{profile.email}</span>
                            <span className="text-[9px] font-bold text-emerald-500 border border-emerald-500/20 bg-emerald-500/5 px-1.5 py-0.5 rounded-full select-none">
                              ✓ Verified
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Optional Fields in Personal Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-extrabold text-muted">
                          Phone Contact
                        </label>
                        {isEditing ? (
                          <div className="flex gap-2">
                            <select
                              value={profile.phoneDialCode}
                              onChange={(e) => handleFieldChange('phoneDialCode', e.target.value)}
                              className="glass-input px-2.5 py-2 rounded-xl text-xs bg-card text-foreground border border-border select-none"
                            >
                              {COUNTRIES_DB.map((c) => (
                                <option key={c.code} value={c.dialCode}>
                                  {c.flag} {c.dialCode}
                                </option>
                              ))}
                            </select>
                            <input
                              id="input-phone"
                              type="tel"
                              value={profile.phone || ''}
                              onChange={(e) => handleFieldChange('phone', e.target.value)}
                              className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs text-foreground bg-card border border-border"
                              placeholder="e.g. 555-0199"
                            />
                          </div>
                        ) : profile.phone ? (
                          <div className="text-xs font-medium text-foreground py-1 border-b border-transparent">
                            {profile.phoneDialCode} {profile.phone}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => focusAndHighlightField('phone', 'personal')}
                            className="text-xs font-bold text-left block cursor-pointer transition-transform hover:translate-x-1"
                            style={{ color: 'var(--accent)' }}
                          >
                            Add your Phone Number →
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-extrabold text-muted">
                          Date of Birth
                        </label>
                        {isEditing ? (
                          <div className="grid grid-cols-3 gap-2">
                            {/* Day select dropdown */}
                            <select
                              value={profile.dobDay || ''}
                              onChange={(e) => handleFieldChange('dobDay', e.target.value)}
                              className="glass-input px-2.5 py-2 rounded-xl text-xs bg-card text-foreground border border-border"
                            >
                              <option value="">Day</option>
                              {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>
                            {/* Month select dropdown */}
                            <select
                              value={profile.dobMonth || ''}
                              onChange={(e) => handleFieldChange('dobMonth', e.target.value)}
                              className="glass-input px-2.5 py-2 rounded-xl text-xs bg-card text-foreground border border-border"
                            >
                              <option value="">Month</option>
                              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => (
                                <option key={m} value={String(idx + 1).padStart(2, '0')}>
                                  {m}
                                </option>
                              ))}
                            </select>
                            {/* Year select dropdown */}
                            <select
                              value={profile.dobYear || ''}
                              onChange={(e) => handleFieldChange('dobYear', e.target.value)}
                              className="glass-input px-2.5 py-2 rounded-xl text-xs bg-card text-foreground border border-border"
                            >
                              <option value="">Year</option>
                              {Array.from({ length: 90 }, (_, i) => String(2026 - i)).map((y) => (
                                <option key={y} value={y}>
                                  {y}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : profile.dobDay && profile.dobMonth && profile.dobYear ? (
                          <div className="text-xs font-medium text-foreground py-1 border-b border-transparent">
                            {profile.dobDay}/{profile.dobMonth}/{profile.dobYear}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => focusAndHighlightField('dobDay', 'personal')}
                            className="text-xs font-bold text-left block cursor-pointer transition-transform hover:translate-x-1"
                            style={{ color: 'var(--accent)' }}
                          >
                            Add your Date of Birth →
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-extrabold text-muted">
                          Gender Option
                        </label>
                        {isEditing ? (
                          <select
                            id="input-gender"
                            value={profile.gender || ''}
                            onChange={(e) => handleFieldChange('gender', e.target.value)}
                            className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs bg-card text-foreground border border-border"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Non-binary">Non-binary</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                          </select>
                        ) : profile.gender ? (
                          <div className="text-xs font-medium text-foreground py-1 border-b border-transparent">
                            {profile.gender}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => focusAndHighlightField('gender', 'personal')}
                            className="text-xs font-bold text-left block cursor-pointer transition-transform hover:translate-x-1"
                            style={{ color: 'var(--accent)' }}
                          >
                            Add your Gender →
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-extrabold text-muted">
                          Pronouns
                        </label>
                        {isEditing ? (
                          <input
                            id="input-pronouns"
                            type="text"
                            value={profile.pronouns || ''}
                            onChange={(e) => handleFieldChange('pronouns', e.target.value)}
                            className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs text-foreground bg-card border border-border"
                            placeholder="e.g. they/them"
                          />
                        ) : profile.pronouns ? (
                          <div className="text-xs font-medium text-foreground py-1 border-b border-transparent">
                            {profile.pronouns}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => focusAndHighlightField('pronouns', 'personal')}
                            className="text-xs font-bold text-left block cursor-pointer transition-transform hover:translate-x-1"
                            style={{ color: 'var(--accent)' }}
                          >
                            Add your Pronouns →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION ②: Location cascades */}
              <div className="border border-border/30 rounded-2xl overflow-hidden bg-zinc-850/[0.01]">
                <button
                  type="button"
                  onClick={() => toggleAccordion('location')}
                  className="w-full px-5 py-4 flex items-center justify-between text-xs font-black uppercase tracking-wider text-foreground hover:bg-zinc-800/5 dark:hover:bg-white/[0.01] transition-colors border-b border-border/20"
                >
                  <span>② Location Parameters</span>
                  <span>{accordion.location ? '▲' : '▼'}</span>
                </button>

                {accordion.location && (
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-extrabold text-muted">
                          Country Selection
                        </label>
                        {isEditing ? (
                          <select
                            value={profile.country}
                            onChange={(e) => handleCountryChange(e.target.value)}
                            className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs bg-card text-foreground border border-border"
                          >
                            {COUNTRIES_DB.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.flag} {c.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-xs font-medium text-foreground py-1 border-b border-transparent">
                            {activeCountryData?.flag} {activeCountryData?.name}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-extrabold text-muted">
                          State Region
                        </label>
                        {isEditing ? (
                          <select
                            id="input-state"
                            value={profile.state || ''}
                            onChange={(e) => handleStateChange(e.target.value)}
                            className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs bg-card text-foreground border border-border"
                          >
                            <option value="">Select State</option>
                            {activeCountryData?.states.map((s) => (
                              <option key={s.code} value={s.code}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        ) : profile.state ? (
                          <div className="text-xs font-medium text-foreground py-1 border-b border-transparent">
                            {activeStateData?.name || profile.state}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => focusAndHighlightField('state', 'location')}
                            className="text-xs font-bold text-left block cursor-pointer transition-transform hover:translate-x-1"
                            style={{ color: 'var(--accent)' }}
                          >
                            Add your State →
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-extrabold text-muted">
                          City
                        </label>
                        {isEditing ? (
                          <select
                            id="input-city"
                            value={profile.city || ''}
                            onChange={(e) => handleFieldChange('city', e.target.value)}
                            className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs bg-card text-foreground border border-border"
                          >
                            <option value="">Select City</option>
                            {activeStateData?.cities.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        ) : profile.city ? (
                          <div className="text-xs font-medium text-foreground py-1 border-b border-transparent">
                            {profile.city}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => focusAndHighlightField('city', 'location')}
                            className="text-xs font-bold text-left block cursor-pointer transition-transform hover:translate-x-1"
                            style={{ color: 'var(--accent)' }}
                          >
                            Add your City →
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-extrabold text-muted">
                          Timezone Preset
                        </label>
                        {isEditing ? (
                          <select
                            value={profile.timezone}
                            onChange={(e) => handleFieldChange('timezone', e.target.value)}
                            className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs bg-card text-foreground border border-border"
                          >
                            {TIMEZONES.map((tz) => (
                              <option key={tz.code} value={tz.code}>
                                {tz.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-xs font-medium text-foreground py-1 border-b border-transparent">
                            {TIMEZONES.find((t) => t.code === profile.timezone)?.label || profile.timezone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION ③: Professional Details */}
              <div className="border border-border/30 rounded-2xl overflow-hidden bg-zinc-850/[0.01]">
                <button
                  type="button"
                  onClick={() => toggleAccordion('professional')}
                  className="w-full px-5 py-4 flex items-center justify-between text-xs font-black uppercase tracking-wider text-foreground hover:bg-zinc-800/5 dark:hover:bg-white/[0.01] transition-colors border-b border-border/20"
                >
                  <span>③ Professional Profile</span>
                  <span>{accordion.professional ? '▲' : '▼'}</span>
                </button>

                {accordion.professional && (
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-extrabold text-muted">
                          Occupation Role
                        </label>
                        {isEditing ? (
                          <input
                            id="input-occupation"
                            type="text"
                            value={profile.occupation || ''}
                            onChange={(e) => handleFieldChange('occupation', e.target.value)}
                            className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs text-foreground bg-card border border-border"
                            placeholder="e.g. Lead Translator"
                          />
                        ) : profile.occupation ? (
                          <div className="text-xs font-medium text-foreground py-1 border-b border-transparent">
                            {profile.occupation}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => focusAndHighlightField('occupation', 'professional')}
                            className="text-xs font-bold text-left block cursor-pointer transition-transform hover:translate-x-1"
                            style={{ color: 'var(--accent)' }}
                          >
                            Add your Occupation →
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-extrabold text-muted">
                          Organization
                        </label>
                        {isEditing ? (
                          <input
                            id="input-organization"
                            type="text"
                            value={profile.organization || ''}
                            onChange={(e) => handleFieldChange('organization', e.target.value)}
                            className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs text-foreground bg-card border border-border"
                            placeholder="e.g. Veltrio Inc"
                          />
                        ) : profile.organization ? (
                          <div className="text-xs font-medium text-foreground py-1 border-b border-transparent">
                            {profile.organization}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => focusAndHighlightField('organization', 'professional')}
                            className="text-xs font-bold text-left block cursor-pointer transition-transform hover:translate-x-1"
                            style={{ color: 'var(--accent)' }}
                          >
                            Add your Organization →
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest font-extrabold text-muted">
                        Personal Website URL
                      </label>
                      {isEditing ? (
                        <input
                          id="input-website"
                          type="url"
                          value={profile.website || ''}
                          onChange={(e) => handleFieldChange('website', e.target.value)}
                          className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs text-foreground bg-card border border-border"
                          placeholder="e.g. https://operator.io"
                        />
                      ) : profile.website ? (
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold block transition-transform hover:translate-x-1"
                          style={{ color: 'var(--accent)' }}
                        >
                          {profile.website} ↗
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => focusAndHighlightField('website', 'professional')}
                          className="text-xs font-bold text-left block cursor-pointer transition-transform hover:translate-x-1"
                          style={{ color: 'var(--accent)' }}
                        >
                          Add your Website →
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] uppercase tracking-widest font-extrabold text-muted">
                        <label>Bio Summary</label>
                        {isEditing && (
                          <span
                            className={
                              (profile.bio?.length || 0) > 160 ? 'text-red-500' : 'text-zinc-550'
                            }
                          >
                            {profile.bio?.length || 0} / 160
                          </span>
                        )}
                      </div>
                      {isEditing ? (
                        <textarea
                          id="input-bio"
                          value={profile.bio || ''}
                          maxLength={160}
                          onChange={(e) => handleFieldChange('bio', e.target.value)}
                          rows={3}
                          className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs text-foreground bg-card border border-border resize-none"
                          placeholder="Tell us about your operations..."
                        />
                      ) : profile.bio ? (
                        <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed italic">
                          "{profile.bio}"
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => focusAndHighlightField('bio', 'professional')}
                          className="text-xs font-bold text-left block cursor-pointer transition-transform hover:translate-x-1"
                          style={{ color: 'var(--accent)' }}
                        >
                          Add your Bio →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION ④: Preferences (Language & Accent Color) */}
              <div className="border border-border/30 rounded-2xl overflow-hidden bg-zinc-850/[0.01]">
                <button
                  type="button"
                  onClick={() => toggleAccordion('preferences')}
                  className="w-full px-5 py-4 flex items-center justify-between text-xs font-black uppercase tracking-wider text-foreground hover:bg-zinc-800/5 dark:hover:bg-white/[0.01] transition-colors border-b border-border/20"
                >
                  <span>④ Interface Preferences</span>
                  <span>{accordion.preferences ? '▲' : '▼'}</span>
                </button>

                {accordion.preferences && (
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-extrabold text-muted">
                          Language Code
                        </label>
                        {isEditing ? (
                          <select
                            value={profile.language}
                            onChange={(e) => handleFieldChange('language', e.target.value)}
                            className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs bg-card text-foreground border border-border"
                          >
                            {LOCALES.map((l) => (
                              <option key={l.code} value={l.code}>
                                {l.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-xs font-medium text-foreground py-1 border-b border-transparent">
                            {LOCALES.find((l) => l.code === profile.language)?.label || profile.language}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-extrabold text-muted">
                          Accent Tone Swatch
                        </label>
                        <div className="text-xs font-extrabold py-2 flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full inline-block border border-zinc-200/20"
                            style={{ backgroundColor: 'var(--accent)' }}
                          />
                          <span className="uppercase text-[10px] tracking-wider text-muted font-black">
                            {profile.accentColor} (Synced with Settings)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION ⑤: Read-only Account Info */}
              <div className="border border-border/30 rounded-2xl overflow-hidden bg-zinc-850/[0.01]">
                <button
                  type="button"
                  onClick={() => toggleAccordion('account')}
                  className="w-full px-5 py-4 flex items-center justify-between text-xs font-black uppercase tracking-wider text-foreground hover:bg-zinc-800/5 dark:hover:bg-white/[0.01] transition-colors border-b border-border/20"
                >
                  <span>⑤ Read-only Account Stats</span>
                  <span>{accordion.account ? '▲' : '▼'}</span>
                </button>

                {accordion.account && (
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <span className="text-[8px] uppercase tracking-wider font-extrabold text-muted block">
                          Account Registered
                        </span>
                        <span className="text-xs font-bold text-foreground font-mono">
                          {new Date(profile.accountCreated).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] uppercase tracking-wider font-extrabold text-muted block">
                          Last Operator Login
                        </span>
                        <span className="text-xs font-bold text-foreground font-mono">
                          {new Date(profile.lastLogin).toLocaleString()}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] uppercase tracking-wider font-extrabold text-muted block">
                          System Plan Class
                        </span>
                        <span className="text-xs font-black text-foreground uppercase tracking-widest text-[#44b3cc]" style={{ color: 'var(--accent)' }}>
                          {profile.accountType} License
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex justify-end pt-5 border-t border-border/30 gap-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white transition-all hover:scale-[1.02] cursor-pointer shadow-md"
                    style={{
                      backgroundColor: 'var(--accent)',
                    }}
                  >
                    Save changes
                  </button>
                </>
              ) : (
                <>
                  {onLogout && (
                    <button
                      type="button"
                      onClick={onLogout}
                      className="px-5 py-2.5 bg-red-600/10 border border-red-500/25 hover:bg-red-650/15 text-red-500 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      Sign Out
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-5 py-2.5 bg-zinc-800/10 border border-border/40 hover:bg-zinc-800/15 text-foreground rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    Edit profile
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Completion indicator & Incomplete helper lists */}
        <div className="space-y-6">
          <div className="glass-panel p-6 space-y-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground border-b border-border/30 pb-3">
              Completeness Ledger
            </h3>

            {/* Completeness bar */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-muted">
                <span>Profile variables</span>
                <span style={{ color: 'var(--accent)' }}>
                  {completenessDetails.percent}% Complete
                </span>
              </div>
              <div className="w-full h-3 bg-zinc-800/15 dark:bg-white/5 rounded-full overflow-hidden border border-border/10 p-0.5">
                <div
                  className="h-full rounded-full transition-all duration-750"
                  style={{
                    width: `${completenessDetails.percent}%`,
                    backgroundColor: 'var(--accent)',
                  }}
                />
              </div>
            </div>

            {/* Incomplete fields helper */}
            {completenessDetails.missing.length > 0 ? (
              <div className="space-y-3 pt-2">
                <span className="text-[8px] uppercase tracking-widest font-black text-muted block">
                  Incomplete Optional Variables ({completenessDetails.missing.length})
                </span>
                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                  {completenessDetails.missing.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => focusAndHighlightField(item.key, item.section)}
                      className="w-full text-left p-2 rounded-xl bg-zinc-800/5 dark:bg-white/[0.01] hover:bg-zinc-800/10 dark:hover:bg-white/[0.02] border border-border/20 hover:border-primary/20 text-[10px] font-bold transition-all flex justify-between items-center cursor-pointer text-muted hover:text-foreground"
                    >
                      <span>{item.label}</span>
                      <span style={{ color: 'var(--accent)' }}>Add +</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 rounded-xl text-[10px] font-bold text-center select-none leading-relaxed">
                🎉 Congratulations! Your operations profile ledger is 100% complete!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
