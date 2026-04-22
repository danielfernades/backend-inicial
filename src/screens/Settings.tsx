import { useState } from 'react';
import { User, Cpu, Type, Folder, Keyboard, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../lib/AuthContext';

export function Settings() {
  const { t } = useLanguage();
  const { user, updateProfile } = useAuth();
  
  const [name, setName] = useState(user?.name || user?.email?.split('@')[0] || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await updateProfile(name);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-5xl font-bebas text-white">{t('settingsTitle')}</h2>
        
        <div className="flex items-center gap-4">
          {saveStatus === 'success' && (
            <span className="flex items-center gap-2 text-sm text-cc-green">
              <CheckCircle size={16} />
              {t('settingsSaved')}
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle size={16} />
              {t('settingsSaveError')}
            </span>
          )}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-cc-orange hover:bg-cc-orange/90 text-black font-bebas tracking-wide px-6 py-2 rounded transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {isSaving ? '...' : t('settingsSave')}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Account */}
        <section className="bg-cc-surface border border-cc-surface-hover rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-cc-surface-hover pb-4">
            <User className="text-cc-orange" />
            <h3 className="text-xl font-bebas text-white">{t('settingsAccount')}</h3>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-cc-bg border-2 border-cc-surface-hover flex items-center justify-center text-gray-500">
              <User size={32} />
            </div>
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2">{t('settingsName')}</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-cc-bg border border-cc-surface-hover rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cc-orange" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2">{t('settingsEmail')}</label>
                  <input type="email" defaultValue={user?.email || ''} disabled className="w-full bg-cc-bg border border-cc-surface-hover rounded px-3 py-2 text-sm text-gray-400 focus:outline-none focus:border-cc-orange cursor-not-allowed" />
                </div>
              </div>
              <div className="flex items-center justify-between bg-cc-bg p-3 rounded border border-cc-surface-hover">
                <div>
                  <p className="text-sm font-medium text-white capitalize">{user?.subscription_status || 'Free'} Plan</p>
                  <p className="text-[10px] font-mono text-gray-500">{t('settingsPlanDesc')}</p>
                </div>
                <button className="text-xs font-bebas tracking-wide text-cc-orange border border-cc-orange px-3 py-1 rounded hover:bg-cc-orange/10 transition-colors">
                  {t('settingsManageSub')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* AI & Processing */}
        <section className="bg-cc-surface border border-cc-surface-hover rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-cc-surface-hover pb-4">
            <Cpu className="text-cc-orange" />
            <h3 className="text-xl font-bebas text-white">{t('settingsAiProcessing')}</h3>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2">{t('settingsTranscriptionModel')}</label>
                <select className="w-full bg-cc-bg border border-cc-surface-hover rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cc-orange appearance-none">
                  <option>{t('settingsWhisperLarge')}</option>
                  <option>{t('settingsWhisperMedium')}</option>
                  <option>{t('settingsWhisperSmall')}</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2">{t('settingsDefaultLanguage')}</label>
                <select className="w-full bg-cc-bg border border-cc-surface-hover rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cc-orange appearance-none">
                  <option>{t('settingsLangPt')}</option>
                  <option>{t('settingsLangEn')}</option>
                  <option>{t('settingsLangEs')}</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-mono text-gray-500 uppercase mb-2">
                <span>{t('settingsCutAggressiveness')}</span>
                <span className="text-cc-orange">{t('settingsBalanced')}</span>
              </div>
              <input type="range" min="0" max="100" defaultValue="50" className="w-full accent-cc-orange" />
              <div className="flex justify-between text-[10px] font-mono text-gray-600 mt-1">
                <span>{t('settingsConservative')}</span>
                <span>{t('settingsAggressive')}</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-cc-bg p-3 rounded border border-cc-surface-hover">
              <div>
                <p className="text-sm font-medium text-white">{t('settingsLearnPrefs')}</p>
                <p className="text-[10px] font-mono text-gray-500">{t('settingsLearnPrefsDesc')}</p>
              </div>
              <div className="w-10 h-5 bg-cc-green/20 rounded-full relative cursor-pointer">
                <div className="absolute top-1 right-1 w-3 h-3 bg-cc-green rounded-full"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Subtitles */}
        <section className="bg-cc-surface border border-cc-surface-hover rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-cc-surface-hover pb-4">
            <Type className="text-cc-orange" />
            <h3 className="text-xl font-bebas text-white">{t('settingsDefaultSubtitles')}</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
             <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2">{t('settingsStyle')}</label>
                <select className="w-full bg-cc-bg border border-cc-surface-hover rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cc-orange appearance-none">
                  <option>{t('settingsStyleDynamic')}</option>
                  <option>{t('settingsStyleClassic')}</option>
                  <option>{t('settingsStyleKaraoke')}</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2">{t('settingsFont')}</label>
                <select className="w-full bg-cc-bg border border-cc-surface-hover rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cc-orange appearance-none">
                  <option>Bebas Neue</option>
                  <option>Montserrat</option>
                  <option>Inter</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2">{t('settingsHighlightColor')}</label>
                <div className="flex items-center gap-2 bg-cc-bg border border-cc-surface-hover rounded px-3 py-2">
                  <div className="w-4 h-4 rounded bg-cc-green"></div>
                  <span className="text-sm text-white">#00FF88</span>
                </div>
              </div>
          </div>
        </section>
      </div>
    </div>
  );
}
