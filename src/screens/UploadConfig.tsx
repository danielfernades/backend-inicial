import React, { useState, useRef } from 'react';
import { UploadCloud, Youtube, Instagram, Linkedin, Smartphone, Film, Mic, MonitorPlay, GraduationCap, ChevronDown, Rocket, Zap } from 'lucide-react';
import { Screen, ProjectData } from '../App';
import { cn } from '../lib/utils';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../lib/AuthContext';

interface UploadConfigProps {
  onNavigate: (screen: Screen) => void;
  project: ProjectData;
  setProject: React.Dispatch<React.SetStateAction<ProjectData>>;
}

export function UploadConfig({ onNavigate, project, setProject }: UploadConfigProps) {
  const { t, language } = useLanguage();
  const { user, incrementUploadCount } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string>('vlog');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const TEMPLATES = {
    vlog: {
      label: 'VLOG',
      icon: <Film />,
      settings: { cutStyle: 'vlog' as const, silenceThreshold: 45, minSilenceLen: 0.3 },
      subtitleStyle: { fontFamily: 'Bebas Neue, sans-serif', fontSize: 48, textColor: '#ffff00', backgroundColor: 'transparent', outlineShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }
    },
    podcast: {
      label: 'PODCAST',
      icon: <Mic />,
      settings: { cutStyle: 'safe' as const, silenceThreshold: 25, minSilenceLen: 1.5 },
      subtitleStyle: { fontFamily: 'Inter, sans-serif', fontSize: 24, textColor: '#ffffff', backgroundColor: 'transparent', outlineShadow: '0 2px 10px rgba(0,0,0,0.8)' }
    },
    tutorial: {
      label: 'TUTORIAL',
      icon: <GraduationCap />,
      settings: { cutStyle: 'standard' as const, silenceThreshold: 35, minSilenceLen: 0.8 },
      subtitleStyle: { fontFamily: 'Inter, sans-serif', fontSize: 20, textColor: '#ffffff', backgroundColor: 'rgba(0, 0, 0, 0.8)', outlineShadow: 'none' }
    },
    stream: {
      label: 'STREAM',
      icon: <MonitorPlay />,
      settings: { cutStyle: 'vlog' as const, silenceThreshold: 40, minSilenceLen: 0.5 },
      subtitleStyle: { fontFamily: 'Bebas Neue, sans-serif', fontSize: 36, textColor: '#00ffcc', backgroundColor: 'transparent', outlineShadow: '0 0 10px rgba(0,255,204,0.8)' }
    },
    lecture: {
      label: t('uploadTemplateLecture'),
      icon: <Smartphone />,
      settings: { cutStyle: 'safe' as const, silenceThreshold: 20, minSilenceLen: 2.0 },
      subtitleStyle: { fontFamily: 'serif', fontSize: 28, textColor: '#ffffff', backgroundColor: 'transparent', outlineShadow: '0 2px 4px rgba(0,0,0,0.9)' }
    }
  };

  const applyTemplate = (templateKey: string) => {
    setActiveTemplate(templateKey);
    const template = TEMPLATES[templateKey as keyof typeof TEMPLATES];
    setProject(p => ({
      ...p,
      settings: {
        ...p.settings,
        ...template.settings
      },
      subtitleStyle: {
        ...(p.subtitleStyle || {
          fontFamily: 'Inter, sans-serif',
          fontSize: 24,
          textColor: '#ffffff',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          outlineShadow: '0 2px 10px rgba(0,0,0,0.8)'
        }),
        ...template.subtitleStyle
      }
    }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (user?.subscription_status !== 'active' && user?.uploads_count >= 1 && user?.email !== 'thidaniel177@gmail.com') {
      alert(t('uploadLimitDesc'));
      onNavigate('pricing');
      return;
    }

    if (!file.type.startsWith('video/')) {
      alert(t('uploadInvalidFile'));
      return;
    }

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = url;
    video.onloadedmetadata = async () => {
      setProject(p => ({
        ...p,
        file,
        url,
        duration: video.duration,
        name: file.name,
        cuts: [],
        subtitles: []
      }));
      
      if (user) {
        await incrementUploadCount();
      }
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto flex gap-8">
      {/* Left Column - Main Config */}
      <div className="flex-1">
        <h2 className="text-5xl font-bebas text-white mb-2">{t('uploadConfigHeader')}</h2>
        <p className="text-gray-400 mb-8">{t('uploadConfigSub')}</p>

        {/* Dropzone */}
        <div 
          className={cn(
            "border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-all mb-8 relative overflow-hidden cursor-pointer",
            dragActive ? "border-cc-orange bg-cc-orange/5" : "border-cc-surface-hover bg-cc-surface hover:border-gray-600",
            project.file ? "border-cc-green bg-cc-green/5" : ""
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleChange} 
            accept="video/*" 
            className="hidden" 
          />
          <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-4", project.file ? "bg-cc-green/20 text-cc-green" : "bg-cc-surface-hover text-cc-orange")}>
            <UploadCloud size={32} />
          </div>
          <h3 className="text-2xl font-bebas text-white mb-2">
            {project.file ? t('uploadVideoLoaded') : t('uploadDropHere')}
          </h3>
          <p className="text-sm text-gray-500">
            {project.file ? project.file.name : t('uploadClickBrowse')}
          </p>
          
          {project.file && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-cc-bg/80 backdrop-blur border-t border-cc-surface-hover">
              <div className="flex justify-between text-[10px] font-mono text-gray-400 mb-2 uppercase">
                <span>{t('uploadStatus')}</span>
                <span className="text-cc-green">100%</span>
              </div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm text-white font-medium truncate pr-4">{project.file.name}</span>
                <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap">{(project.file.size / (1024*1024)).toFixed(1)} MB</span>
              </div>
              <div className="h-1 bg-cc-surface-hover rounded-full overflow-hidden">
                <div className="h-full bg-cc-green w-full"></div>
              </div>
            </div>
          )}
        </div>

        {/* Project Details */}
        <div className="bg-cc-surface border border-cc-surface-hover rounded-xl p-6 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <span className="text-[150px] font-bebas tracking-tighter">EDITION</span>
          </div>
          
          <div className="relative z-10">
            <div className="mb-6">
              <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2">{t('uploadProjectName')}</label>
              <input 
                type="text" 
                value={project.name}
                onChange={(e) => setProject(p => ({...p, name: e.target.value}))}
                placeholder={t('uploadProjectNamePlaceholder')} 
                className="w-full bg-cc-bg border border-cc-surface-hover rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cc-orange transition-colors font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-3">{t('uploadTemplates')}</label>
              <div className="grid grid-cols-5 gap-3">
                {Object.entries(TEMPLATES).map(([key, t]) => (
                  <ContentTypeCard 
                    key={key}
                    icon={t.icon} 
                    label={t.label} 
                    active={activeTemplate === key}
                    onClick={() => applyTemplate(key)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Settings */}
      <div className="w-80 flex flex-col gap-6">
        {/* Platform */}
        <div className="bg-cc-surface border border-cc-surface-hover rounded-xl p-5">
          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-4">{t('uploadPlatform')}</label>
          <div className="grid grid-cols-2 gap-3">
            <PlatformToggle icon={<Youtube size={16} />} label="YouTube" active />
            <PlatformToggle icon={<Smartphone size={16} />} label="TikTok" />
            <PlatformToggle icon={<Instagram size={16} />} label="Instagram" active />
            <PlatformToggle icon={<Linkedin size={16} />} label="LinkedIn" />
          </div>
        </div>

        {/* Language */}
        <div className="bg-cc-surface border border-cc-surface-hover rounded-xl p-5">
          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-3">{t('uploadAudioLang')}</label>
          <div className="bg-cc-bg border border-cc-surface-hover rounded-lg px-4 py-2.5 flex items-center justify-between cursor-pointer hover:border-gray-600 transition-colors">
            <div className="flex items-center gap-2 text-sm text-white">
              <span>{language === 'pt' ? '🇧🇷' : '🇺🇸'}</span> {language === 'pt' ? 'Português (Brasil)' : 'English (US)'}
            </div>
            <ChevronDown size={16} className="text-gray-500" />
          </div>
        </div>

        {/* AI Toggles */}
        <div className="bg-cc-surface border border-cc-surface-hover rounded-xl p-5 space-y-6">
          <ToggleRow 
            title={t('uploadCutSilences')} 
            sub="IA AUTOMATION" 
            active 
            hasSlider={project.settings.cutStyle === 'standard'} 
            sliderValue={`${project.settings.silenceThreshold}%`}
            onSliderChange={(val: number) => setProject(p => ({...p, settings: {...p.settings, silenceThreshold: val}}))}
          >
            <div className="mt-4 space-y-2">
              <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2">{t('uploadCutStyle')}</label>
              
              {/* Standard */}
              <div 
                className={cn(
                  "flex items-start gap-3 p-2.5 rounded border cursor-pointer transition-colors",
                  project.settings.cutStyle === 'standard' ? "bg-cc-green/10 border-cc-green" : "border-cc-surface-hover hover:border-gray-600"
                )}
                onClick={() => setProject(p => ({...p, settings: {...p.settings, cutStyle: 'standard'}}))}
              >
                <div className={cn("w-4 h-4 rounded-full mt-0.5 flex items-center justify-center border", project.settings.cutStyle === 'standard' ? "border-cc-green" : "border-gray-500")}>
                  {project.settings.cutStyle === 'standard' && <div className="w-2 h-2 rounded-full bg-cc-green"></div>}
                </div>
                <div>
                  <p className={cn("text-xs font-medium", project.settings.cutStyle === 'standard' ? "text-cc-green" : "text-white")}>{t('uploadStyleStandard')}</p>
                  <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{t('uploadStyleStandardDesc')}</p>
                </div>
              </div>

              {/* Safe */}
              <div 
                className={cn(
                  "flex items-start gap-3 p-2.5 rounded border cursor-pointer transition-colors",
                  project.settings.cutStyle === 'safe' ? "bg-cc-green/10 border-cc-green" : "border-cc-surface-hover hover:border-gray-600"
                )}
                onClick={() => setProject(p => ({...p, settings: {...p.settings, cutStyle: 'safe'}}))}
              >
                <div className={cn("w-4 h-4 rounded-full mt-0.5 flex items-center justify-center border", project.settings.cutStyle === 'safe' ? "border-cc-green" : "border-gray-500")}>
                  {project.settings.cutStyle === 'safe' && <div className="w-2 h-2 rounded-full bg-cc-green"></div>}
                </div>
                <div>
                  <p className={cn("text-xs font-medium", project.settings.cutStyle === 'safe' ? "text-cc-green" : "text-white")}>{t('uploadStyleSafe')}</p>
                  <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{t('uploadStyleSafeDesc')}</p>
                </div>
              </div>

              {/* Vlog Professional */}
              <div 
                className={cn(
                  "flex items-start gap-3 p-2.5 rounded border cursor-pointer transition-colors",
                  project.settings.cutStyle === 'vlog' ? "bg-cc-orange/10 border-cc-orange" : "border-cc-surface-hover hover:border-gray-600"
                )}
                onClick={() => setProject(p => ({...p, settings: {...p.settings, cutStyle: 'vlog'}}))}
              >
                <div className={cn("w-4 h-4 rounded-full mt-0.5 flex items-center justify-center border", project.settings.cutStyle === 'vlog' ? "border-cc-orange" : "border-gray-500")}>
                  {project.settings.cutStyle === 'vlog' && <div className="w-2 h-2 rounded-full bg-cc-orange"></div>}
                </div>
                <div>
                  <p className={cn("text-xs font-medium", project.settings.cutStyle === 'vlog' ? "text-cc-orange" : "text-white")}>{t('uploadStyleVlog')}</p>
                  <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{t('uploadStyleVlogDesc')}</p>
                </div>
              </div>

            </div>
          </ToggleRow>
          <ToggleRow 
            title={t('uploadRemoveNonsense')} 
            sub={t('uploadSentenceAnalysis')} 
            active 
          />
          <ToggleRow 
            title={language === 'pt' ? 'Legendas Automáticas' : 'Auto Subtitles'} 
            sub={t('uploadTranscriptionEngine')} 
            active 
          />
        </div>

        {/* Advanced Settings */}
        <div>
          <button 
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="w-full flex items-center justify-between text-sm font-bebas tracking-wide text-white mb-4"
          >
            {t('uploadAdvanced').toUpperCase()}
            <ChevronDown size={16} className={cn("transition-transform", advancedOpen && "rotate-180")} />
          </button>
          
          {advancedOpen && (
            <div className="bg-cc-surface border border-cc-surface-hover rounded-xl p-5 space-y-5 animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2">{t('uploadSilenceDuration')}</label>
                  <div className="bg-cc-bg border border-cc-surface-hover rounded flex items-center px-3 py-1.5">
                    <input 
                      type="number" 
                      value={project.settings.minSilenceLen * 1000} 
                      onChange={(e) => setProject(p => ({...p, settings: {...p.settings, minSilenceLen: Number(e.target.value) / 1000}}))}
                      className="bg-transparent w-full text-white text-sm focus:outline-none text-right" 
                    />
                    <span className="text-[10px] font-mono text-gray-600 ml-2">MS</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2">DB Threshold</label>
                  <div className="bg-cc-bg border border-cc-surface-hover rounded flex items-center px-3 py-1.5">
                    <input 
                      type="number" 
                      value={project.settings.silenceThreshold} 
                      onChange={(e) => setProject(p => ({...p, settings: {...p.settings, silenceThreshold: Number(e.target.value)}}))}
                      className="bg-transparent w-full text-white text-sm focus:outline-none text-right" 
                    />
                    <span className="text-[10px] font-mono text-gray-600 ml-2">%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2">{t('uploadPlaybackSpeed')}</label>
                <div className="flex gap-2">
                  {['1.0X', '1.25X', '1.5X', '2.0X'].map(speed => (
                    <button key={speed} className={cn(
                      "flex-1 py-1.5 rounded text-[10px] font-mono transition-colors",
                      speed === '1.25X' ? "bg-cc-orange/20 text-cc-orange border border-cc-orange/50" : "bg-cc-bg text-gray-400 border border-cc-surface-hover hover:border-gray-600"
                    )}>
                      {speed}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2">{t('uploadSubtitleStyle')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button className="bg-cc-bg border border-cc-orange text-cc-orange rounded py-2 text-xs font-bebas tracking-wide flex items-center justify-center gap-2">
                    <Zap size={12} /> DYNAMIC
                  </button>
                  <button className="bg-cc-bg border border-cc-surface-hover text-gray-400 rounded py-2 text-xs font-bebas tracking-wide flex items-center justify-center gap-2 hover:border-gray-600 transition-colors">
                    <Film size={12} /> NETFLIX
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Start Button */}
        <button 
          onClick={() => {
            if (!project.file) {
              alert(t('uploadPleaseUpload'));
              return;
            }
            onNavigate('processing');
          }}
          className={cn(
            "w-full font-bebas text-2xl tracking-wide py-4 rounded-xl flex items-center justify-center gap-3 transition-all mt-auto",
            project.file 
              ? "bg-cc-orange hover:bg-cc-orange-hover text-white hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(255,92,0,0.3)]" 
              : "bg-cc-surface-hover text-gray-500 cursor-not-allowed"
          )}
        >
          {t('uploadStart')} <Rocket size={20} />
        </button>
      </div>
    </div>
  );
}

function ContentTypeCard({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-4 rounded-xl transition-all",
        active 
          ? "bg-cc-bg border-2 border-cc-orange text-cc-orange" 
          : "bg-cc-bg border border-cc-surface-hover text-gray-500 hover:border-gray-600 hover:text-gray-300"
      )}
    >
      {icon}
      <span className="text-xs font-bebas tracking-wider">{label}</span>
    </button>
  );
}

function PlatformToggle({ icon, label, active }: any) {
  return (
    <button className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
      active
        ? "bg-cc-bg border border-cc-green/30 text-white"
        : "bg-cc-bg border border-cc-surface-hover text-gray-500 hover:border-gray-600"
    )}>
      <div className={cn("w-4 h-4 rounded flex items-center justify-center", active ? "bg-cc-green text-cc-bg" : "bg-cc-surface-hover")}>
        {active && <span className="text-[10px]">✓</span>}
      </div>
      {icon}
      <span className="font-medium text-xs">{label}</span>
    </button>
  );
}

function ToggleRow({ title, sub, active, hasSlider, sliderValue, onSliderChange, children }: any) {
  const { t } = useLanguage();
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-sm font-medium text-white">{title}</h4>
          <p className="text-[10px] font-mono text-gray-500 uppercase">{sub}</p>
        </div>
        <div className={cn(
          "w-10 h-5 rounded-full relative transition-colors",
          active ? "bg-cc-green/20" : "bg-cc-surface-hover"
        )}>
          <div className={cn(
            "absolute top-1 w-3 h-3 rounded-full transition-all",
            active ? "right-1 bg-cc-green" : "left-1 bg-gray-500"
          )}></div>
        </div>
      </div>
      {hasSlider && active && (
        <div className="mt-3">
          <div className="flex justify-between text-[10px] font-mono text-gray-500 mb-1">
            <span>{t('uploadSensitivity')}</span>
            <span className="text-cc-green">{sliderValue}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={parseInt(sliderValue)} 
            onChange={(e) => onSliderChange?.(parseInt(e.target.value))}
            className="w-full accent-cc-green h-1 bg-cc-bg rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
      )}
      {children}
    </div>
  );
}
