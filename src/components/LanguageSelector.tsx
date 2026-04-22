import React from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { Globe } from 'lucide-react';

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 bg-surface-container-high border border-outline-variant/30 rounded-full px-3 py-1.5">
      <Globe size={14} className="text-on-surface-variant" />
      <button 
        onClick={() => setLanguage('pt')}
        className={`text-xs font-bebas tracking-wider ${language === 'pt' ? 'text-primary' : 'text-on-surface-variant hover:text-white'}`}
      >
        PT
      </button>
      <span className="text-outline-variant text-xs">|</span>
      <button 
        onClick={() => setLanguage('en')}
        className={`text-xs font-bebas tracking-wider ${language === 'en' ? 'text-primary' : 'text-on-surface-variant hover:text-white'}`}
      >
        EN
      </button>
    </div>
  );
}
