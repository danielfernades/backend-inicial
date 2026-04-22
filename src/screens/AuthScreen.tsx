import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { Screen } from '../App';
import { Wand2, Lock, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { LanguageSelector } from '../components/LanguageSelector';

interface AuthScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function AuthScreen({ onNavigate }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t, language } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Client-side prevention for multiple registrations
    if (!isLogin && localStorage.getItem('has_registered')) {
      setError('Você já realizou um cadastro neste dispositivo.');
      setLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      
      // Simple fingerprinting
      const fingerprint = btoa([
        window.navigator.userAgent,
        window.screen.width,
        window.screen.height,
        window.navigator.language,
        new Date().getTimezoneOffset()
      ].join('|'));

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fingerprint }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (!isLogin) {
        localStorage.setItem('has_registered', 'true');
      }

      login(data.token, data.user);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cc-bg p-4">
      <div className="w-full max-w-[1920px] mx-auto flex justify-between items-center p-4">
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-mono text-sm uppercase">{t('back')}</span>
        </button>
        <LanguageSelector />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md bg-cc-surface border border-cc-surface-hover rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-cc-orange/20 rounded-2xl flex items-center justify-center">
              <Wand2 size={32} className="text-cc-orange" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bebas text-white text-center mb-2">
            {isLogin ? t('authWelcomeBack') : t('authCreateAccount')}
          </h2>
          <p className="text-gray-400 text-center mb-8 text-sm">
            {isLogin ? t('authEnterDetails') : t('authJoinNextGen')}
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm mb-6 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">{t('authEmailAddress')}</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-cc-bg border border-cc-surface-hover rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-cc-orange transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">{t('authPassword')}</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-cc-bg border border-cc-surface-hover rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-cc-orange transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cc-orange hover:bg-cc-orange-hover text-white font-bebas text-xl py-3 rounded-lg flex items-center justify-center gap-2 transition-colors mt-6 disabled:opacity-50"
            >
              {loading ? t('loading') : (isLogin ? t('authSignIn') : t('authCreateAccount'))}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <div className="h-px bg-cc-surface-hover flex-1"></div>
            <span className="text-xs font-mono text-gray-500 px-4 uppercase">{t('authOrContinueWith')}</span>
            <div className="h-px bg-cc-surface-hover flex-1"></div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <button className="bg-cc-bg border border-cc-surface-hover hover:border-gray-500 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              <span className="text-sm font-medium">Google</span>
            </button>
            <button className="bg-cc-bg border border-cc-surface-hover hover:border-gray-500 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.43 9.8 8.2 11.38.6.11.82-.26.82-.58v-2.16c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23.96-.27 1.98-.41 3-.41s2.04.14 3 .41c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.31 24 12c0-6.63-5.37-12-12-12z"/></svg>
              <span className="text-sm font-medium">GitHub</span>
            </button>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {isLogin ? t('authNoAccount') : t('authAlreadyHaveAccount')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
