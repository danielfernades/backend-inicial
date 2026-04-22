import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, FastForward, Rewind, ZoomIn, ZoomOut, Scissors, Trash2, Wand2, User, Check, Search, Filter, Volume2, Maximize, Settings, RotateCw, X, Sparkles, Download, Type, Eye, EyeOff } from 'lucide-react';
import { Screen, ProjectData, Cut, Subtitle, SubtitleStyle, TextOverlay } from '../App';
import { cn, formatTime } from '../lib/utils';
import { GoogleGenAI } from '@google/genai';
import { useLanguage } from '../lib/LanguageContext';

interface EditorProps {
  onNavigate: (screen: Screen) => void;
  project: ProjectData;
  setProject: React.Dispatch<React.SetStateAction<ProjectData>>;
}

export function Editor({ onNavigate, project, setProject }: EditorProps) {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [activeTab, setActiveTab] = useState<'cuts' | 'subtitles' | 'text'>('cuts');
  const [showSubtitleStyles, setShowSubtitleStyles] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [cutFilter, setCutFilter] = useState<string>('All');
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // Sync video time with state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Auto-skip cut sections (where active is false)
      const currentCut = project.cuts.find(c => c.start <= video.currentTime && c.end > video.currentTime);
      if (currentCut && !currentCut.active) {
        video.currentTime = currentCut.end;
      }

      // Auto-scroll timeline if zoomed
      if (timelineContainerRef.current && timelineRef.current) {
        const container = timelineContainerRef.current;
        const timelineWidth = timelineRef.current.clientWidth;
        const playheadX = (video.currentTime / (project.duration || 600)) * timelineWidth;
        
        // If playhead is outside the visible area, scroll to center it
        if (playheadX < container.scrollLeft || playheadX > container.scrollLeft + container.clientWidth) {
          container.scrollLeft = Math.max(0, playheadX - container.clientWidth / 2);
        }
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [project.cuts]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !videoRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * project.duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleCut = (id: string) => {
    setProject(p => ({
      ...p,
      cuts: p.cuts.map(c => c.id === id ? { ...c, active: !c.active } : c)
    }));
  };

  const updateSubtitle = (id: string, text: string) => {
    setProject(p => ({
      ...p,
      subtitles: p.subtitles.map(s => s.id === id ? { ...s, text } : s)
    }));
  };

  const updateSubtitleStyle = (key: keyof SubtitleStyle, value: string | number) => {
    setProject(p => {
      const currentStyle = p.subtitleStyle || {
        fontFamily: 'Inter, sans-serif',
        fontSize: 24,
        textColor: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        outlineShadow: '0 2px 10px rgba(0,0,0,0.8)',
        preset: 'standard',
        animation: 'none'
      };

      let newStyle = { ...currentStyle, [key]: value };

      // Apply presets
      if (key === 'preset') {
        if (value === 'neon') {
          newStyle.textColor = '#fff';
          newStyle.backgroundColor = 'transparent';
          newStyle.outlineShadow = '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #ff00de, 0 0 30px #ff00de, 0 0 40px #ff00de';
          newStyle.fontFamily = 'Bebas Neue, sans-serif';
        } else if (value === 'elegant') {
          newStyle.textColor = '#f3f4f6';
          newStyle.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          newStyle.outlineShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
          newStyle.fontFamily = 'serif';
        } else if (value === 'standard') {
          newStyle.textColor = '#ffffff';
          newStyle.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          newStyle.outlineShadow = '0 2px 10px rgba(0,0,0,0.8)';
          newStyle.fontFamily = 'Inter, sans-serif';
        }
      }

      return {
        ...p,
        subtitleStyle: newStyle
      };
    });
  };

  const handleRewriteActiveSubtitle = async () => {
    const activeSubtitle = project.subtitles.find(s => s.start <= currentTime && s.end > currentTime);
    if (!activeSubtitle) {
      alert("No subtitle is currently active at this timestamp.");
      return;
    }

    setIsRewriting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      let retries = 3;
      let delayMs = 2000;
      let success = false;
      
      while (retries > 0 && !success) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Rewrite the following subtitle to make it more engaging, natural, and concise for a video. Only return the rewritten text, nothing else.\n\nSubtitle: "${activeSubtitle.text}"`,
          });

          if (response.text) {
            updateSubtitle(activeSubtitle.id, response.text.trim());
            success = true;
          } else {
            retries--;
          }
        } catch (error: any) {
          console.error(`Failed to rewrite subtitle (Retries left: ${retries - 1}):`, error);
          retries--;
          
          if (error?.message?.includes('429') || error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
            delayMs = Math.max(delayMs, 5000);
          }
          
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
            delayMs *= 2;
          } else {
            throw error;
          }
        }
      }
    } catch (error: any) {
      console.error("Failed to rewrite subtitle:", error);
      alert(`Failed to rewrite subtitle: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsRewriting(false);
    }
  };

  const addTextOverlay = () => {
    const newId = Math.random().toString(36).substring(2, 9);
    const newOverlay: TextOverlay = {
      id: newId,
      start: currentTime,
      end: Math.min(currentTime + 5, project.duration || 600),
      text: 'New Text',
      style: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 32,
        textColor: '#ffffff',
        backgroundColor: 'transparent',
        outlineShadow: '0 2px 10px rgba(0,0,0,0.8)'
      }
    };
    setProject(p => ({
      ...p,
      textOverlays: [...(p.textOverlays || []), newOverlay]
    }));
    setActiveTab('text');
  };

  const updateTextOverlay = (id: string, updates: Partial<TextOverlay>) => {
    setProject(p => ({
      ...p,
      textOverlays: p.textOverlays.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const removeTextOverlay = (id: string) => {
    setProject(p => ({
      ...p,
      textOverlays: p.textOverlays.filter(t => t.id !== id)
    }));
  };

  const updateTextOverlayStyle = (id: string, key: keyof SubtitleStyle, value: string | number) => {
    setProject(p => ({
      ...p,
      textOverlays: p.textOverlays.map(t => {
        if (t.id === id) {
          let newStyle = { ...t.style, [key]: value };
          
          // Apply presets
          if (key === 'preset') {
            if (value === 'neon') {
              newStyle.textColor = '#fff';
              newStyle.backgroundColor = 'transparent';
              newStyle.outlineShadow = '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #00f0ff, 0 0 30px #00f0ff, 0 0 40px #00f0ff';
              newStyle.fontFamily = 'Bebas Neue, sans-serif';
            } else if (value === 'elegant') {
              newStyle.textColor = '#f3f4f6';
              newStyle.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              newStyle.outlineShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
              newStyle.fontFamily = 'serif';
            } else if (value === 'standard') {
              newStyle.textColor = '#ffffff';
              newStyle.backgroundColor = 'rgba(0, 0, 0, 0.8)';
              newStyle.outlineShadow = '0 2px 10px rgba(0,0,0,0.8)';
              newStyle.fontFamily = 'Inter, sans-serif';
            }
          }

          return {
            ...t,
            style: newStyle
          };
        }
        return t;
      })
    }));
  };

  const getTransitionStyle = (start: number, end: number, animation?: string) => {
    if (!animation || animation === 'none') return {};
    
    const duration = 0.3; // 300ms transition
    let opacity = 1;
    let transform = 'scale(1) translateY(0)';
    
    if (currentTime < start + duration) {
      const progress = Math.max(0, (currentTime - start) / duration);
      opacity = progress;
      if (animation === 'fade') transform = `scale(1)`;
      if (animation === 'pop') transform = `scale(${0.8 + 0.2 * progress})`;
      if (animation === 'slide') transform = `translateY(${20 * (1 - progress)}px)`;
    } else if (currentTime > end - duration) {
      const progress = Math.max(0, (end - currentTime) / duration);
      opacity = progress;
      if (animation === 'fade') transform = `scale(1)`;
      if (animation === 'pop') transform = `scale(${0.8 + 0.2 * progress})`;
      if (animation === 'slide') transform = `translateY(${20 * (1 - progress)}px)`;
    }
    
    return { opacity, transform, transition: 'none' };
  };

  const handleManualCut = () => {
    if (selectionStart === null) {
      setSelectionStart(currentTime);
    } else {
      const start = Math.min(selectionStart, currentTime);
      const end = Math.max(selectionStart, currentTime);
      
      if (end - start > 0.1) { // Minimum 100ms cut
        const newCut: Cut = {
          id: `m-${Date.now().toString().slice(-4)}`,
          type: 'Corte Manual',
          start,
          end,
          active: false
        };

        setProject(p => ({
          ...p,
          cuts: [...p.cuts, newCut].sort((a, b) => a.start - b.start)
        }));
      }
      setSelectionStart(null);
    }
  };

  const duration = project.duration || 600;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Far Left Panel - Media & Tools */}
      <div className="w-16 md:w-64 border-r border-cc-surface-hover bg-cc-bg flex flex-col z-10">
        <div className="flex flex-col md:flex-row border-b border-cc-surface-hover">
          <button className="flex-1 py-4 text-xs font-bebas tracking-wide text-cc-orange border-b-2 border-cc-orange">{t('editorMedia')}</button>
          <button className="flex-1 py-4 text-xs font-bebas tracking-wide text-gray-500 hover:text-gray-300 hidden md:block">{t('editorEffects')}</button>
          <button className="flex-1 py-4 text-xs font-bebas tracking-wide text-gray-500 hover:text-gray-300 hidden md:block">{t('editorAudio')}</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-4">
          {/* Media Items */}
          <div className="bg-cc-surface border border-cc-surface-hover rounded-lg p-2 flex flex-col md:flex-row items-center gap-3 cursor-pointer hover:border-cc-orange transition-colors">
            <div className="w-10 h-10 md:w-16 md:h-12 bg-black rounded flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/></svg>
            </div>
            <div className="hidden md:block overflow-hidden">
              <p className="text-xs text-white truncate">{project.name || 'Main_Video.mp4'}</p>
              <p className="text-[10px] text-gray-500 font-mono">{formatTime(project.duration || 0)}</p>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center h-24 border-2 border-dashed border-cc-surface-hover rounded-lg text-gray-500 hover:border-gray-500 hover:text-white cursor-pointer transition-colors">
            <div className="text-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
              <span className="text-xs font-mono">{t('editorImportMedia')}</span>
            </div>
          </div>
        </div>

        {/* Tools */}
        <div className="p-2 md:p-4 border-t border-cc-surface-hover grid grid-cols-1 md:grid-cols-4 gap-2">
          <button className="p-2 rounded bg-cc-surface text-white hover:bg-cc-orange hover:text-white transition-colors flex items-center justify-center" title="Select Tool (V)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
          </button>
          <button className="p-2 rounded bg-cc-surface text-gray-400 hover:bg-cc-surface-hover hover:text-white transition-colors flex items-center justify-center" title="Blade Tool (C)">
            <Scissors size={16} />
          </button>
          <button className="p-2 rounded bg-cc-surface text-gray-400 hover:bg-cc-surface-hover hover:text-white transition-colors flex items-center justify-center" title="Hand Tool (H)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/><path d="M6 11V6a2 2 0 0 1 2-2v0a2 2 0 0 1 2 2v0"/></svg>
          </button>
          <button className="p-2 rounded bg-cc-surface text-gray-400 hover:bg-cc-surface-hover hover:text-white transition-colors flex items-center justify-center" title="Delete (Del)">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Left Panel - Smart Cuts List */}
      <div className="w-80 border-r border-cc-surface-hover bg-cc-bg flex flex-col">
        <div className="p-4 border-b border-cc-surface-hover flex items-center justify-between">
          <h3 className="font-bebas text-xl text-white tracking-wide">{t('editorSmartCuts')}</h3>
          <div className="flex gap-2">
            <select 
              value={cutFilter}
              onChange={(e) => setCutFilter(e.target.value)}
              className="bg-cc-surface border border-cc-surface-hover rounded text-xs text-gray-400 px-2 py-1 focus:outline-none hover:border-gray-500 transition-colors"
            >
              <option value="All">{t('editorAllTypes')}</option>
              <option value="Silence Removal">{t('editorSilenceRemoval')}</option>
              <option value="Vício de Linguagem">{t('editorFillerWord')}</option>
              <option value="Corte Manual">{t('editorManualCut')}</option>
              <option value="Repetição">{t('editorRepetition')}</option>
            </select>
            <button className="p-1.5 text-gray-400 hover:text-white hover:bg-cc-surface rounded transition-colors">
              <Search size={16} />
            </button>
          </div>
        </div>
        
        <div className="p-4 border-b border-cc-surface-hover bg-cc-surface/50">
          <div className="flex justify-between text-[10px] font-mono text-gray-500 mb-2 uppercase">
            <span>{t('editorTotalRemoved')}</span>
            <span className="text-cc-red">
              {formatTime(project.cuts.filter(c => !c.active).reduce((acc, c) => acc + (c.end - c.start), 0))}
            </span>
          </div>
          <div className="h-1.5 bg-cc-bg rounded-full overflow-hidden">
            <div className="h-full bg-cc-red w-[15%]"></div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {project.cuts
            .filter(cut => cutFilter === 'All' || cut.type === cutFilter)
            .map(cut => {
            let typeColor = "text-cc-red";
            let typeBg = "bg-cc-red/20";
            let borderColor = "border-cc-red/20";
            let inactiveBg = "bg-cc-red/5";
            
            if (cut.type === 'Vício de Linguagem') {
              typeColor = "text-yellow-500";
              typeBg = "bg-yellow-500/20";
              borderColor = "border-yellow-500/20";
              inactiveBg = "bg-yellow-500/5";
            } else if (cut.type === 'Repetição') {
              typeColor = "text-purple-500";
              typeBg = "bg-purple-500/20";
              borderColor = "border-purple-500/20";
              inactiveBg = "bg-purple-500/5";
            } else if (cut.type === 'Corte Manual') {
              typeColor = "text-blue-500";
              typeBg = "bg-blue-500/20";
              borderColor = "border-blue-500/20";
              inactiveBg = "bg-blue-500/5";
            }

            return (
            <div key={cut.id} className={cn(
              "p-3 rounded-lg border transition-all group",
              !cut.active ? `${inactiveBg} ${borderColor}` : "bg-cc-surface border-cc-surface-hover hover:border-gray-600"
            )}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-mono px-1.5 py-0.5 rounded",
                    !cut.active ? `${typeBg} ${typeColor}` : "bg-cc-surface-hover text-gray-400"
                  )}>
                    #{cut.id}
                  </span>
                  <span className="text-xs font-medium text-white">{cut.type}</span>
                </div>
                <span className="text-[10px] font-mono text-gray-500">{formatTime(cut.end - cut.start)}</span>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <div className="text-[10px] font-mono text-gray-400">
                  {formatTime(cut.start)} - {formatTime(cut.end)}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = cut.start;
                        setCurrentTime(cut.start);
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-white hover:bg-cc-surface-hover rounded" 
                    title="Play"
                  >
                    <Play size={14} />
                  </button>
                  <button 
                    onClick={() => toggleCut(cut.id)}
                    className={cn(
                      "p-1 rounded text-white",
                      !cut.active ? "bg-cc-green/20 text-cc-green hover:bg-cc-green/30" : "bg-cc-red/20 text-cc-red hover:bg-cc-red/30"
                    )}
                    title={!cut.active ? "Restore" : "Remove"}
                  >
                    {!cut.active ? <RotateCw size={14} /> : <X size={14} />}
                  </button>
                </div>
              </div>
            </div>
          )})}
        </div>
      </div>

      {/* Center - Player & Timeline */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Video Player */}
        <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden p-4">
          {project.url ? (
            <video 
              ref={videoRef}
              src={project.url} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={togglePlay}
            />
          ) : (
            <div className="w-full max-w-3xl aspect-video bg-cc-surface rounded-lg border border-cc-surface-hover flex items-center justify-center">
              <p className="text-gray-500 font-mono">{t('editorNoVideoSource')}</p>
            </div>
          )}
          
          {/* Overlay Subtitles */}
          {project.showSubtitles !== false && project.subtitles.find(s => s.start <= currentTime && s.end > currentTime) && (() => {
            const activeSub = project.subtitles.find(s => s.start <= currentTime && s.end > currentTime)!;
            const style: Partial<SubtitleStyle> = project.subtitleStyle || {};
            const transition = getTransitionStyle(activeSub.start, activeSub.end, style.animation);
            
            const activeHighlights = project.showHighlights !== false ? (project.textOverlays?.filter(t => t.isHighlight && t.start <= currentTime && t.end > currentTime) || []) : [];
            let displayText = activeSub.text;
            
            if (activeHighlights.length > 0) {
              activeHighlights.forEach(h => {
                const escapedText = h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(escapedText, 'gi');
                displayText = displayText.replace(regex, '').replace(/\s+/g, ' ').trim();
              });
            }

            if (!displayText) return null;
            
            return (
              <div className="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none">
                <div 
                  className={cn(
                    "px-6 py-3 rounded-lg text-center max-w-2xl",
                    style.preset === 'elegant' ? "backdrop-blur-md border border-white/20 shadow-2xl" : "backdrop-blur-sm border border-white/10"
                  )}
                  style={{ 
                    backgroundColor: style.backgroundColor || 'rgba(0, 0, 0, 0.8)',
                    ...transition
                  }}
                >
                  <p 
                    className="font-bold tracking-wide" 
                    style={{ 
                      fontFamily: style.fontFamily || 'Inter, sans-serif',
                      fontSize: `${style.fontSize || 24}px`,
                      color: style.textColor || '#ffffff',
                      textShadow: style.outlineShadow || '0 2px 10px rgba(0,0,0,0.8)'
                    }}
                  >
                    {activeSub.text}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Text Overlays */}
          {project.showHighlights !== false && project.textOverlays?.filter(t => t.start <= currentTime && t.end > currentTime).map(t => {
            const transition = getTransitionStyle(t.start, t.end, t.style.animation);
            return (
              <div 
                key={t.id}
                className="absolute pointer-events-none flex items-center justify-center inset-0"
              >
                <div 
                  className={cn(
                    "px-6 py-3 rounded-lg text-center max-w-2xl",
                    t.style.preset === 'elegant' ? "backdrop-blur-md border border-white/20 shadow-2xl" : ""
                  )}
                  style={{ 
                    backgroundColor: t.style.backgroundColor,
                    ...transition
                  }}
                >
                  <p 
                    className="font-bold tracking-wide" 
                    style={{ 
                      fontFamily: t.style.fontFamily,
                      fontSize: `${t.style.fontSize}px`,
                      color: t.style.textColor,
                      textShadow: t.style.outlineShadow
                    }}
                  >
                    {t.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Player Controls */}
        <div className="h-14 bg-cc-bg border-t border-b border-cc-surface-hover flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-white transition-colors"><Rewind size={20} /></button>
            <button 
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-cc-orange flex items-center justify-center text-white hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </button>
            <button className="text-gray-400 hover:text-white transition-colors"><FastForward size={20} /></button>
            
            <div className="font-mono text-sm text-white ml-4">
              {formatTime(currentTime)} <span className="text-gray-600">/ {formatTime(duration)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={handleManualCut}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono transition-colors border",
                selectionStart !== null 
                  ? "bg-cc-orange/20 border-cc-orange text-cc-orange" 
                  : "bg-cc-surface border-cc-surface-hover text-white hover:border-cc-orange hover:text-cc-orange"
              )}
            >
              <Scissors size={14} /> 
              {selectionStart !== null ? t('editorConfirmCut') : t('editorMarkCut')}
            </button>
            
            {selectionStart !== null && (
              <button 
                onClick={() => setSelectionStart(null)}
                className="text-gray-400 hover:text-white transition-colors p-1"
                title={t('editorCancel')}
              >
                <X size={16} />
              </button>
            )}

            <div className="w-px h-6 bg-cc-surface-hover mx-2"></div>

            <div className="flex items-center gap-2 text-gray-400">
              <button onClick={() => setZoom(z => Math.max(1, z - 0.5))} className="hover:text-white transition-colors"><ZoomOut size={18} /></button>
              <input 
                type="range" 
                min="1" 
                max="10" 
                step="0.5"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-24 accent-cc-orange h-1 bg-cc-surface rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
              />
              <button onClick={() => setZoom(z => Math.min(10, z + 0.5))} className="hover:text-white transition-colors"><ZoomIn size={18} /></button>
            </div>
            <div className="w-px h-6 bg-cc-surface-hover mx-2"></div>
            <button className="text-gray-400 hover:text-white transition-colors"><Volume2 size={20} /></button>
            <button className="text-gray-400 hover:text-white transition-colors"><Maximize size={20} /></button>
          </div>
        </div>

        {/* Timeline */}
        <div className="h-64 bg-cc-surface p-4 flex flex-col overflow-hidden">
          <div 
            ref={timelineContainerRef}
            className="flex-1 overflow-x-auto overflow-y-hidden relative pb-2"
          >
            <div 
              className="h-full min-w-full flex flex-col relative"
              style={{ width: `${zoom * 100}%` }}
            >
              {/* Time Ruler */}
              <div className="h-6 border-b border-cc-surface-hover relative mb-2 flex-shrink-0">
                {Array.from({length: Math.max(10, Math.ceil(10 * zoom))}).map((_, i) => {
                  const percentage = (i / Math.max(10, Math.ceil(10 * zoom))) * 100;
                  return (
                    <div key={i} className="absolute top-0 bottom-0 border-l border-gray-700 flex flex-col justify-end pb-1" style={{ left: `${percentage}%` }}>
                      <span className="text-[9px] font-mono text-gray-500 ml-1">{formatTime((percentage / 100) * duration)}</span>
                    </div>
                  );
                })}
              </div>

              <div 
                ref={timelineRef}
                className="flex-1 relative cursor-pointer"
                onClick={handleTimelineClick}
              >
            {/* Playhead */}
            <div 
              className="absolute top-0 bottom-0 w-px bg-cc-orange z-30 pointer-events-none" 
              style={{ left: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute -top-3 -translate-x-1/2 w-3 h-4 bg-cc-orange rounded-sm flex items-center justify-center">
                <div className="w-0.5 h-2 bg-black/50 rounded-full"></div>
              </div>
            </div>

            {/* Selection Overlay */}
            {selectionStart !== null && (
              <div 
                className="absolute top-0 bottom-0 bg-cc-orange/30 border-x border-cc-orange z-20 pointer-events-none"
                style={{
                  left: `${(Math.min(selectionStart, currentTime) / duration) * 100}%`,
                  width: `${(Math.abs(currentTime - selectionStart) / duration) * 100}%`
                }}
              />
            )}

            {/* Tracks Container */}
            <div className="absolute inset-0 flex flex-col gap-2 py-2">
              {/* Video Track */}
              <div className="h-12 bg-cc-bg rounded border border-cc-surface-hover relative overflow-hidden flex">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-500 z-20 bg-cc-bg/80 px-1 rounded">V1</div>
                {/* Mock Video Thumbnails */}
                {Array.from({length: 20}).map((_, i) => (
                  <div key={i} className="flex-1 border-r border-cc-surface-hover/50 bg-[url('https://images.unsplash.com/photo-1593697821252-0c9137d9fc45?q=80&w=200&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
                ))}
                
                {/* Cuts Overlay */}
                {project.cuts.map(cut => {
                  let bgColor = "bg-red-500/30";
                  let textColor = "text-red-500";
                  if (cut.type === 'Vício de Linguagem') {
                    bgColor = "bg-yellow-500/30";
                    textColor = "text-yellow-500";
                  } else if (cut.type === 'Repetição') {
                    bgColor = "bg-purple-500/30";
                    textColor = "text-purple-500";
                  } else if (cut.type === 'Corte Manual') {
                    bgColor = "bg-blue-500/30";
                    textColor = "text-blue-500";
                  }

                  return (
                    <div 
                      key={`v-${cut.id}`}
                      className={cn(
                        "absolute top-0 bottom-0 border-x border-black/50 z-10",
                        !cut.active ? `${bgColor} repeating-linear-gradient-45` : ""
                      )}
                      style={{ 
                        left: `${(cut.start / duration) * 100}%`, 
                        width: `${((cut.end - cut.start) / duration) * 100}%` 
                      }}
                    >
                      {!cut.active && <div className="absolute inset-0 flex items-center justify-center"><X size={12} className={textColor} /></div>}
                    </div>
                  );
                })}
              </div>

              {/* Audio Track */}
              <div className="h-16 bg-cc-bg rounded border border-cc-surface-hover relative overflow-hidden">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-500 z-20 bg-cc-bg/80 px-1 rounded">A1</div>
                {/* Mock Audio Waveform */}
                <div className="absolute inset-0 flex items-center gap-[1px] px-1 opacity-50">
                  {Array.from({length: 200}).map((_, i) => {
                    const height = Math.random() * 80 + 10;
                    return <div key={i} className="flex-1 bg-cc-green rounded-full" style={{ height: `${height}%` }}></div>
                  })}
                </div>
                
                {/* Cuts Overlay */}
                {project.cuts.map(cut => {
                  let bgColor = "bg-red-500/30";
                  if (cut.type === 'Vício de Linguagem') bgColor = "bg-yellow-500/30";
                  else if (cut.type === 'Repetição') bgColor = "bg-purple-500/30";
                  else if (cut.type === 'Corte Manual') bgColor = "bg-blue-500/30";

                  return (
                    <div 
                      key={`a-${cut.id}`}
                      className={cn(
                        "absolute top-0 bottom-0 border-x border-black/50 z-10",
                        !cut.active ? `${bgColor} repeating-linear-gradient-45` : ""
                      )}
                      style={{ 
                        left: `${(cut.start / duration) * 100}%`, 
                        width: `${((cut.end - cut.start) / duration) * 100}%` 
                      }}
                    />
                  );
                })}
              </div>

              {/* Subtitle Track */}
              <div className="h-8 bg-cc-bg rounded border border-cc-surface-hover relative overflow-hidden">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-500 z-20 bg-cc-bg/80 px-1 rounded">S1</div>
                
                {project.subtitles.map(sub => (
                  <div 
                    key={`s-${sub.id}`}
                    className="absolute top-1 bottom-1 bg-cc-orange/20 border border-cc-orange/50 rounded text-[8px] font-mono text-cc-orange px-1 overflow-hidden whitespace-nowrap flex items-center"
                    style={{ 
                      left: `${(sub.start / duration) * 100}%`, 
                      width: `${((sub.end - sub.start) / duration) * 100}%` 
                    }}
                  >
                    {sub.text}
                  </div>
                ))}
              </div>

              {/* Text Overlay Track */}
              <div className="h-8 bg-cc-bg rounded border border-cc-surface-hover relative overflow-hidden">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-500 z-20 bg-cc-bg/80 px-1 rounded">T1</div>
                
                {project.textOverlays?.map(t => (
                  <div 
                    key={`t-${t.id}`}
                    className="absolute top-1 bottom-1 bg-blue-500/20 border border-blue-500/50 rounded text-[8px] font-mono text-blue-400 px-1 overflow-hidden whitespace-nowrap flex items-center cursor-pointer"
                    style={{ 
                      left: `${(t.start / duration) * 100}%`, 
                      width: `${((t.end - t.start) / duration) * 100}%` 
                    }}
                    onClick={() => {
                      setActiveTab('text');
                      if (videoRef.current) {
                        videoRef.current.currentTime = t.start;
                        setCurrentTime(t.start);
                      }
                    }}
                  >
                    {t.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Subtitles */}
      <div className="w-80 border-l border-cc-surface-hover bg-cc-bg flex flex-col">
        <div className="flex border-b border-cc-surface-hover">
          <button 
            className={cn("flex-1 py-4 text-sm font-bebas tracking-wide transition-colors", activeTab === 'cuts' ? "text-cc-orange border-b-2 border-cc-orange" : "text-gray-500 hover:text-gray-300")}
            onClick={() => setActiveTab('cuts')}
          >
            {t('editorProperties')}
          </button>
          <button 
            className={cn("flex-1 py-4 text-sm font-bebas tracking-wide transition-colors", activeTab === 'subtitles' ? "text-cc-orange border-b-2 border-cc-orange" : "text-gray-500 hover:text-gray-300")}
            onClick={() => setActiveTab('subtitles')}
          >
            {t('editorCaptions')}
          </button>
          <button 
            className={cn("flex-1 py-4 text-sm font-bebas tracking-wide transition-colors", activeTab === 'text' ? "text-cc-orange border-b-2 border-cc-orange" : "text-gray-500 hover:text-gray-300")}
            onClick={() => setActiveTab('text')}
          >
            {t('editorText')}
          </button>
        </div>

        {activeTab === 'subtitles' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-cc-surface-hover flex gap-2">
              <button 
                onClick={handleRewriteActiveSubtitle}
                disabled={isRewriting}
                className="flex-1 bg-cc-surface border border-cc-surface-hover rounded py-1.5 text-xs font-mono text-white hover:border-gray-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles size={12} className={cn(isRewriting ? "text-gray-400 animate-pulse" : "text-cc-orange")} /> 
                {isRewriting ? t('editorRewriting') : t('editorAiRewrite')}
              </button>
              <button
                onClick={() => setProject(p => ({ ...p, showSubtitles: p.showSubtitles === false ? true : false }))}
                className={cn(
                  "flex-1 border rounded py-1.5 text-xs font-mono transition-colors flex items-center justify-center gap-2",
                  project.showSubtitles !== false 
                    ? "bg-cc-surface border-cc-surface-hover text-white hover:border-gray-500" 
                    : "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                )}
              >
                {project.showSubtitles !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                {project.showSubtitles !== false ? t('editorVisible') : t('editorHidden')}
              </button>
              <button 
                onClick={() => setShowSubtitleStyles(!showSubtitleStyles)}
                className={cn(
                  "flex-1 border rounded py-1.5 text-xs font-mono transition-colors flex items-center justify-center gap-2",
                  showSubtitleStyles ? "bg-cc-orange/20 border-cc-orange text-cc-orange" : "bg-cc-surface border-cc-surface-hover text-white hover:border-gray-500"
                )}
              >
                <Settings size={12} /> {t('editorStyle')}
              </button>
            </div>
            
            {showSubtitleStyles ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-gray-500 mb-2">{t('editorPreset')}</label>
                    <select 
                      value={project.subtitleStyle?.preset || 'standard'}
                      onChange={(e) => updateSubtitleStyle('preset', e.target.value)}
                      className="w-full bg-cc-surface border border-cc-surface-hover rounded p-2 text-sm text-white focus:outline-none focus:border-cc-orange"
                    >
                      <option value="standard">{t('editorStandard')}</option>
                      <option value="neon">{t('editorNeonGlow')}</option>
                      <option value="elegant">{t('editorElegantGlass')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-500 mb-2">{t('editorAnimation')}</label>
                    <select 
                      value={project.subtitleStyle?.animation || 'none'}
                      onChange={(e) => updateSubtitleStyle('animation', e.target.value)}
                      className="w-full bg-cc-surface border border-cc-surface-hover rounded p-2 text-sm text-white focus:outline-none focus:border-cc-orange"
                    >
                      <option value="none">{t('editorNone')}</option>
                      <option value="fade">{t('editorFade')}</option>
                      <option value="pop">{t('editorPopScale')}</option>
                      <option value="slide">{t('editorSlideUp')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-2">{t('editorFontFamily')}</label>
                  <select 
                    value={project.subtitleStyle?.fontFamily || 'Inter, sans-serif'}
                    onChange={(e) => updateSubtitleStyle('fontFamily', e.target.value)}
                    className="w-full bg-cc-surface border border-cc-surface-hover rounded p-2 text-sm text-white focus:outline-none focus:border-cc-orange"
                  >
                    <option value="Inter, sans-serif">Inter</option>
                    <option value="Bebas Neue, sans-serif">Bebas Neue</option>
                    <option value="monospace">Monospace</option>
                    <option value="serif">Serif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-2">{t('editorFontSize')} ({project.subtitleStyle?.fontSize || 24}px)</label>
                  <input 
                    type="range" 
                    min="12" 
                    max="72" 
                    value={project.subtitleStyle?.fontSize || 24}
                    onChange={(e) => updateSubtitleStyle('fontSize', parseInt(e.target.value))}
                    className="w-full accent-cc-orange"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-2">{t('editorTextColor')}</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={project.subtitleStyle?.textColor || '#ffffff'}
                      onChange={(e) => updateSubtitleStyle('textColor', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input 
                      type="text" 
                      value={project.subtitleStyle?.textColor || '#ffffff'}
                      onChange={(e) => updateSubtitleStyle('textColor', e.target.value)}
                      className="flex-1 bg-cc-surface border border-cc-surface-hover rounded px-2 text-sm text-white focus:outline-none focus:border-cc-orange font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-2">{t('editorBackgroundColor')}</label>
                  <input 
                    type="text" 
                    value={project.subtitleStyle?.backgroundColor || 'rgba(0, 0, 0, 0.8)'}
                    onChange={(e) => updateSubtitleStyle('backgroundColor', e.target.value)}
                    className="w-full bg-cc-surface border border-cc-surface-hover rounded p-2 text-sm text-white focus:outline-none focus:border-cc-orange font-mono"
                    placeholder="rgba(0, 0, 0, 0.8) or #000000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-2">{t('editorOutlineShadow')}</label>
                  <input 
                    type="text" 
                    value={project.subtitleStyle?.outlineShadow || '0 2px 10px rgba(0,0,0,0.8)'}
                    onChange={(e) => updateSubtitleStyle('outlineShadow', e.target.value)}
                    className="w-full bg-cc-surface border border-cc-surface-hover rounded p-2 text-sm text-white focus:outline-none focus:border-cc-orange font-mono"
                    placeholder="e.g. 2px 2px 0 #000"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {project.subtitles.map(sub => (
                  <div key={sub.id} className={cn(
                    "bg-cc-surface border rounded-lg p-3 transition-colors",
                    currentTime >= sub.start && currentTime < sub.end ? "border-cc-orange" : "border-cc-surface-hover"
                  )}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-mono text-gray-500">
                        {formatTime(sub.start)} - {formatTime(sub.end)}
                      </span>
                      <span className="text-[10px] font-mono bg-cc-bg px-1.5 py-0.5 rounded text-gray-400">#{sub.id}</span>
                    </div>
                    <textarea 
                      className="w-full bg-transparent text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-cc-orange rounded p-1"
                      rows={2}
                      value={sub.text}
                      onChange={(e) => updateSubtitle(sub.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'text' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-cc-surface-hover space-y-2">
              <div className="flex gap-2">
                <button 
                  onClick={addTextOverlay}
                  className="flex-1 bg-cc-surface border border-cc-surface-hover rounded py-2 text-sm font-mono text-white hover:border-cc-orange transition-colors flex items-center justify-center gap-2"
                >
                  <Type size={14} /> {t('editorAddTextOverlay')}
                </button>
                <button
                  onClick={() => setProject(p => ({ ...p, showHighlights: p.showHighlights === false ? true : false }))}
                  className={cn(
                    "flex-1 border rounded py-2 text-sm font-mono transition-colors flex items-center justify-center gap-2",
                    project.showHighlights !== false 
                      ? "bg-cc-surface border-cc-surface-hover text-white hover:border-gray-500" 
                      : "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                  )}
                >
                  {project.showHighlights !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                  {project.showHighlights !== false ? t('editorNeonVisible') : t('editorNeonHidden')}
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {project.textOverlays?.length === 0 && (
                <div className="text-center text-gray-500 font-mono text-sm mt-10">
                  {t('editorNoTextOverlays')}<br/>{t('editorClickAddTextOverlay')}
                </div>
              )}
              
              {project.textOverlays?.map(overlay => (
                <div key={overlay.id} className={cn(
                  "bg-cc-surface border rounded-lg p-4 transition-colors space-y-4",
                  currentTime >= overlay.start && currentTime < overlay.end ? "border-blue-500" : "border-cc-surface-hover"
                )}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono bg-cc-bg px-1.5 py-0.5 rounded text-gray-400">#{overlay.id}</span>
                    <button 
                      onClick={() => removeTextOverlay(overlay.id)}
                      className="text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div>
                    <textarea 
                      className="w-full bg-cc-bg border border-cc-surface-hover text-sm text-white resize-none focus:outline-none focus:border-blue-500 rounded p-2"
                      rows={2}
                      value={overlay.text}
                      onChange={(e) => updateTextOverlay(overlay.id, { text: e.target.value })}
                      placeholder={t('editorEnterText')}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 mb-1">{t('editorStartTime')}</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={overlay.start}
                        onChange={(e) => updateTextOverlay(overlay.id, { start: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-cc-bg border border-cc-surface-hover rounded p-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 mb-1">{t('editorEndTime')}</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={overlay.end}
                        onChange={(e) => updateTextOverlay(overlay.id, { end: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-cc-bg border border-cc-surface-hover rounded p-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-cc-surface-hover space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 mb-1">{t('editorPreset')}</label>
                        <select 
                          value={overlay.style.preset || 'standard'}
                          onChange={(e) => updateTextOverlayStyle(overlay.id, 'preset', e.target.value)}
                          className="w-full bg-cc-bg border border-cc-surface-hover rounded p-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="standard">{t('editorStandard')}</option>
                          <option value="neon">{t('editorNeonGlow')}</option>
                          <option value="elegant">{t('editorElegantGlass')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 mb-1">{t('editorAnimation')}</label>
                        <select 
                          value={overlay.style.animation || 'none'}
                          onChange={(e) => updateTextOverlayStyle(overlay.id, 'animation', e.target.value)}
                          className="w-full bg-cc-bg border border-cc-surface-hover rounded p-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="none">{t('editorNone')}</option>
                          <option value="fade">{t('editorFade')}</option>
                          <option value="pop">{t('editorPopScale')}</option>
                          <option value="slide">{t('editorSlideUp')}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 mb-1">{t('editorFontFamily')}</label>
                      <select 
                        value={overlay.style.fontFamily}
                        onChange={(e) => updateTextOverlayStyle(overlay.id, 'fontFamily', e.target.value)}
                        className="w-full bg-cc-bg border border-cc-surface-hover rounded p-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="Inter, sans-serif">Inter</option>
                        <option value="Bebas Neue, sans-serif">Bebas Neue</option>
                        <option value="monospace">Monospace</option>
                        <option value="serif">Serif</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 mb-1">{t('editorFontSize')}</label>
                      <input 
                        type="range" 
                        min="12" 
                        max="120" 
                        value={overlay.style.fontSize}
                        onChange={(e) => updateTextOverlayStyle(overlay.id, 'fontSize', parseInt(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 mb-1">{t('editorTextColor')}</label>
                        <div className="flex gap-1">
                          <input 
                            type="color" 
                            value={overlay.style.textColor}
                            onChange={(e) => updateTextOverlayStyle(overlay.id, 'textColor', e.target.value)}
                            className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                          />
                          <input 
                            type="text" 
                            value={overlay.style.textColor}
                            onChange={(e) => updateTextOverlayStyle(overlay.id, 'textColor', e.target.value)}
                            className="flex-1 bg-cc-bg border border-cc-surface-hover rounded px-1 text-[10px] text-white focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 mb-1">{t('editorBgColor')}</label>
                        <input 
                          type="text" 
                          value={overlay.style.backgroundColor}
                          onChange={(e) => updateTextOverlayStyle(overlay.id, 'backgroundColor', e.target.value)}
                          className="w-full bg-cc-bg border border-cc-surface-hover rounded p-1 text-[10px] text-white focus:outline-none focus:border-blue-500 font-mono"
                          placeholder={t('editorRgbaHex')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-xs font-mono text-gray-500 uppercase mb-3">{t('editorProjectInfo')}</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{t('editorResolution')}</span>
                  <span className="text-white font-mono">1920x1080</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{t('editorFramerate')}</span>
                  <span className="text-white font-mono">60 FPS</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{t('editorOriginalLength')}</span>
                  <span className="text-white font-mono">{formatTime(duration)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{t('editorNewLength')}</span>
                  <span className="text-cc-green font-mono">
                    {formatTime(duration - project.cuts.filter(c => !c.active).reduce((acc, c) => acc + (c.end - c.start), 0))}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-cc-surface-hover">
              <button 
                onClick={() => onNavigate('export')}
                className="w-full bg-cc-orange hover:bg-cc-orange-hover text-white font-bebas text-xl tracking-wide py-3 rounded-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download size={18} /> {t('editorExportProject')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
