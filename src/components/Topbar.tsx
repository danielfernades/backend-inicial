import { useState, useRef, useEffect } from 'react';
import { Search, Bell, HelpCircle, User, Settings, LogOut } from 'lucide-react';
import { Screen } from '../App';
import { useLanguage } from '../lib/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { useAuth } from '../lib/AuthContext';

interface TopbarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function Topbar({ currentScreen, onNavigate }: TopbarProps) {
  const { t, language } = useLanguage();
  const { logout, user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b border-cc-surface-hover bg-cc-bg/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-6 flex-1">
        <div className="flex items-center gap-4 text-sm font-medium text-gray-400">
          <button onClick={() => onNavigate('projects')} className="hover:text-white transition-colors">{t('navProjects')}</button>
          <button className="hover:text-white transition-colors">{t('navAssets')}</button>
          <button className="hover:text-white transition-colors">{t('navTemplates')}</button>
        </div>
        
        <div className="max-w-md w-full relative ml-8">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder={t('topSearch')} 
            className="w-full bg-cc-surface border border-cc-surface-hover rounded-md py-1.5 pl-9 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cc-orange transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <LanguageSelector />
        <button className="text-gray-400 hover:text-white transition-colors relative">
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-cc-orange rounded-full"></span>
        </button>
        <button className="text-gray-400 hover:text-white transition-colors">
          <HelpCircle size={18} />
        </button>
        
        <div className="h-6 w-px bg-cc-surface-hover mx-2"></div>
        
        <button className="text-sm text-gray-400 hover:text-white transition-colors">
          {t('topSaveDraft')}
        </button>
        <button 
          onClick={() => onNavigate('export')}
          className="bg-cc-green hover:bg-cc-green/90 text-cc-bg font-bebas tracking-wide px-6 py-1.5 rounded transition-colors"
        >
          {t('editorExport')}
        </button>
        
        <div className="relative" ref={profileRef}>
          <div 
            className="w-8 h-8 rounded-full bg-cc-surface border border-cc-surface-hover flex items-center justify-center ml-2 cursor-pointer hover:border-cc-orange transition-colors"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <User size={16} className="text-gray-400" />
          </div>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-cc-surface border border-cc-surface-hover rounded-md shadow-lg py-1 z-50">
              <div className="px-4 py-2 border-b border-cc-surface-hover">
                <p className="text-sm text-white truncate">{user?.name || user?.email?.split('@')[0]}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                <p className="text-xs text-cc-orange capitalize mt-1">{user?.subscription_status} Plan</p>
              </div>
              <button 
                onClick={() => {
                  onNavigate('settings');
                  setIsProfileOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-cc-bg hover:text-white flex items-center gap-2 transition-colors"
              >
                <Settings size={14} />
                {t('navSettings')}
              </button>
              <button 
                onClick={() => {
                  logout();
                  setIsProfileOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-cc-bg hover:text-red-300 flex items-center gap-2 transition-colors"
              >
                <LogOut size={14} />
                {t('navLogout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
