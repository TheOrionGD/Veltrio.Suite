import React, { useState } from 'react';

interface AuthPageProps {
  onLoginSuccess: (user: { id: string; name: string; email: string; preferences?: any }) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('@gmail.com');
  const [password, setPassword] = useState('.in');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (isRegisterMode && !name.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const endpoint = isRegisterMode ? '/api/auth/signup' : '/api/auth/login';
      const body = isRegisterMode ? { name, email, password } : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      if (data.success && data.user) {
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Server error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#effbfc] dark:bg-[#122d3a] transition-colors duration-500 w-full">
      {/* Immersive sliding panel container */}
      <div className="w-full max-w-4xl bg-[#effbfc] dark:bg-[#234556] border border-zinc-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px] animate-scale-in">

        {/* Left pane: Welcome visual board */}
        <div className="md:w-1/2 bg-[#d7f2f6] dark:bg-[#1b3644] p-8 md:p-12 flex flex-col justify-between items-center text-center relative overflow-hidden">
          {/* Subtle light background orb */}
          <div className="absolute -inset-10 bg-[radial-gradient(circle_at_center,rgba(68,179,204,0.1),transparent_70%)] pointer-events-none" />

          <div className="relative z-10 w-full flex justify-between items-center text-left">
            <span className="text-[10px] font-black tracking-widest text-purple dark:text-accent uppercase">Veltrio Core</span>
            <span className="text-[10px] font-mono text-zinc-500">v0.1.2</span>
          </div>

          <div className="my-8 space-y-6 relative z-10 flex flex-col items-center">
            <h2 className="text-2xl font-black uppercase text-[#234556] dark:text-white tracking-wide">
              {isRegisterMode ? 'Join us!' : 'Welcome!'}
            </h2>

            {/* The smiling logo visual */}
            <div className="flex items-center justify-center gap-4 py-2">
              <span className="text-5xl font-black font-sans text-[#234556] dark:text-white">w.</span>
              <div className="w-24 h-24 rounded-full border-4 border-primary/30 dark:border-accent/30 flex items-center justify-center bg-transparent relative">
                {/* Smiley face emoji */}
                <span className="text-5xl animate-bounce">😊</span>
              </div>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
              Step inside the most advanced real-time dynamic translation and acoustic parser workspace center.
            </p>
          </div>

          <div className="relative z-10 text-xs text-zinc-500">
            {isRegisterMode ? 'Already a member?' : 'Not a member yet?'}
            <button
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError('');
              }}
              className="ml-1.5 font-black text-primary dark:text-accent hover:underline cursor-pointer"
            >
              {isRegisterMode ? 'Log in now' : 'Register now'}
            </button>
          </div>
        </div>

        {/* Right pane: Auth forms */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-[#234556]">
          <h2 className="text-xl font-black text-[#234556] dark:text-white uppercase tracking-wider mb-6">
            {isRegisterMode ? 'Sign up' : 'Log in'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <div className="space-y-1">
                <label className="text-[8px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Operator Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs text-zinc-850 dark:text-zinc-100 bg-zinc-800/5 dark:bg-white/5 border border-zinc-200 dark:border-white/10"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[8px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="refero.john.doe@gmail.com"
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs text-zinc-850 dark:text-zinc-100 bg-zinc-800/5 dark:bg-white/5 border border-zinc-200 dark:border-white/10"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[8px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Secret Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••"
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs text-zinc-850 dark:text-zinc-100 bg-zinc-800/5 dark:bg-white/5 border border-zinc-200 dark:border-white/10"
              />
            </div>

            {error && (
              <p className="text-[10px] font-bold text-red-500 bg-red-950/10 p-2.5 border border-red-500/20 rounded-xl">
                ⚠️ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-accent hover:bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md hover-scale cursor-pointer disabled:opacity-50 mt-4"
            >
              {isLoading ? 'Processing credentials...' : isRegisterMode ? 'Register now' : 'Log in now'}
            </button>
          </form>

          {/* Social login mockups */}
          <div className="mt-8 border-t border-zinc-200/50 dark:border-white/5 pt-6 space-y-4">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block text-center">Or sign in with</span>
            <div className="grid grid-cols-3 gap-3">
              {['Google', 'Facebook', 'Twitter'].map((prov) => (
                <button
                  key={prov}
                  type="button"
                  onClick={() => alert(`Mock Oauth auth using ${prov} pipeline.`)}
                  className="py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-800/5 dark:bg-white/5 hover:bg-zinc-800/10 dark:hover:bg-white/10 text-[10px] text-zinc-650 dark:text-zinc-300 font-bold transition-all hover-scale cursor-pointer text-center"
                >
                  {prov}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;
