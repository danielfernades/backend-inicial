import React, { useState, useRef, useEffect } from 'react';
import { Download, CheckCircle2, Play, Youtube, Instagram, Smartphone, Loader2, XCircle } from 'lucide-react';
import { Screen, ProjectData } from '../App';
import { cn, formatTime } from '../lib/utils';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../lib/AuthContext';

interface ExportProps {
  onNavigate: (screen: Screen) => void;
  project: ProjectData;
}

export function Export({ onNavigate, project }: ExportProps) {
  const { t } = useLanguage();
  const { user, incrementExportCount } = useAuth();
  const duration = project.duration || 0;
  const cutTime = project.cuts ? project.cuts.filter(c => !c.active).reduce((acc, c) => acc + (c.end - c.start), 0) : 0;
  const newDuration = duration - cutTime;
  const savingsPercent = duration > 0 ? Math.round((cutTime / duration) * 100) : 0;

  const [isExporting, setIsExporting] = useState(false);
  const isExportingRef = useRef(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState("");
  const [exportFps, setExportFps] = useState<30 | 60>(30);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isExportingRef.current = false;
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  const handleCancel = () => {
    isExportingRef.current = false;
    setIsExporting(false);
    setExportStatus(t('exportCanceled'));
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
  };

  const handleExport = async () => {
    if (!project.file || !project.url) return;
    
    setIsExporting(true);
    isExportingRef.current = true;
    setExportProgress(0);
    setExportStatus(t('exportPreparing'));

    let canvas: HTMLCanvasElement | null = document.createElement('canvas');
    let video: HTMLVideoElement | null = document.createElement('video');
    let recorder: MediaRecorder | null = null;
    let audioCtx: AudioContext | null = null;
    let fallbackInterval: any = null;

    const cleanup = () => {
      if (video) { video.pause(); video.removeAttribute('src'); video.load(); video.remove(); video = null; }
      if (canvas) { canvas.remove(); canvas = null; }
      if (audioCtx && audioCtx.state !== 'closed') { audioCtx.close(); audioCtx = null; }
      if (recorder && recorder.state !== 'inactive') { recorder.stop(); }
      if (fallbackInterval) { clearInterval(fallbackInterval); }
    };

    cleanupRef.current = cleanup;

    try {
      video.crossOrigin = "anonymous";
      video.playsInline = true;
      video.muted = false; // Must be unmuted to capture audio
      video.style.position = 'absolute';
      video.style.opacity = '0';
      video.style.pointerEvents = 'none';
      document.body.appendChild(video);

      video.src = project.url;

      await new Promise(resolve => { video!.onloadedmetadata = resolve; });

      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d', { alpha: false });

      // Ensure video can play
      try {
        await video.play();
      } catch (e) {
        console.error("Autoplay prevented:", e);
        video.muted = true;
        await video.play();
        setExportStatus(t('exportAudioMuted'));
      }

      let audioTrack: MediaStreamTrack | undefined;
      
      // Always use Web Audio API to apply noise reduction and voice enhancement
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioDest = audioCtx.createMediaStreamDestination();
      const source = audioCtx.createMediaElementSource(video);
      
      // --- Audio Enhancement Chain ---
      // 1. Highpass filter: Removes low-frequency rumble, wind, and hum (below 90Hz)
      const highpass = audioCtx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 90; 

      // 2. High-shelf filter: Adds clarity and presence to the voice
      const highShelf = audioCtx.createBiquadFilter();
      highShelf.type = 'highshelf';
      highShelf.frequency.value = 3000;
      highShelf.gain.value = 3; 

      // 3. Dynamics Compressor: Evens out volume and acts slightly like a noise gate
      const compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 3.5;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;

      // Connect the chain
      source.connect(highpass);
      highpass.connect(highShelf);
      highShelf.connect(compressor);
      compressor.connect(audioDest);
      
      audioTrack = audioDest.stream.getAudioTracks()[0];

      const canvasStream = canvas.captureStream(exportFps);
      const tracks = [...canvasStream.getVideoTracks()];
      if (audioTrack) tracks.push(audioTrack);

      const combinedStream = new MediaStream(tracks);

      const isMp4Supported = MediaRecorder.isTypeSupported('video/mp4');
      const isH264Supported = MediaRecorder.isTypeSupported('video/webm;codecs=h264');
      
      let mimeType = 'video/webm';
      let isDirectMp4 = false;
      
      if (isMp4Supported) {
        mimeType = 'video/mp4';
        isDirectMp4 = true;
      } else if (isH264Supported) {
        mimeType = 'video/webm;codecs=h264';
      }

      const options: MediaRecorderOptions = {
        mimeType,
        videoBitsPerSecond: 5000000, // 5 Mbps is plenty for 1080p webm/mp4 from canvas
        audioBitsPerSecond: 128000
      };

      recorder = new MediaRecorder(combinedStream, options);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = async () => {
        if (!isExportingRef.current) {
          cleanup();
          return;
        }

        setExportStatus(t('exportProcessingFinal'));
        const recordedBlob = new Blob(chunks, { type: mimeType });

        const url = URL.createObjectURL(recordedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vlog_editado_${project.name || 'video'}.${isDirectMp4 ? 'mp4' : 'webm'}`;
        a.click();
        
        setIsExporting(false);
        isExportingRef.current = false;
        setExportProgress(100);
        setExportStatus(`${t('exportSuccess')} (${isDirectMp4 ? 'MP4' : 'WebM'})!`);
        cleanup();
        
        // Increment export count after successful export
        if (user) {
          incrementExportCount();
          // Save project to DB
          fetch('/api/projects', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              name: project.name || 'video',
              duration: formatTime(newDuration),
              status: 'COMPLETED'
            })
          }).catch(console.error);
        }
      };

      // Prepare segments
      const actualDuration = video.duration && video.duration !== Infinity ? video.duration : duration;
      const activeCuts = project.cuts ? project.cuts.filter(c => !c.active).sort((a, b) => a.start - b.start) : [];
      const keptSegments: {start: number, end: number}[] = [];
      let currentStart = 0;
      for (const cut of activeCuts) {
        if (cut.start > currentStart) {
          keptSegments.push({ start: currentStart, end: cut.start });
        }
        currentStart = Math.max(currentStart, cut.end);
      }
      if (currentStart < actualDuration) {
        keptSegments.push({ start: currentStart, end: actualDuration });
      }

      if (keptSegments.length === 0) throw new Error("O vídeo inteiro foi cortado.");

      let currentSegmentIndex = 0;
      let isSeeking = false;
      let totalKeptTime = keptSegments.reduce((acc, s) => acc + (s.end - s.start), 0);
      let lastTimeChangeAt = performance.now();
      let lastTime = -1;

      video.currentTime = keptSegments[0].start;

      setExportStatus(t('exportRenderingVideo'));
      recorder.start();
      
      let lastDrawTime = performance.now();
      let isDrawing = false;

      const drawFrame = () => {
        if (!isExportingRef.current || !video || !ctx || !canvas) return;
        if (isDrawing) return;
        isDrawing = true;
        
        try {
          lastDrawTime = performance.now();

          const seg = keptSegments[currentSegmentIndex];
          
          // 1. Check time & handle cuts
          if (!isSeeking && (video.currentTime >= seg.end || video.ended)) {
            isSeeking = true;
            currentSegmentIndex++;
            
            if (currentSegmentIndex >= keptSegments.length || video.ended) {
              setExportProgress(100);
              if (recorder && recorder.state !== 'inactive') recorder.stop();
              return;
            }
            
            const onSeeked = () => {
              isSeeking = false;
              video!.removeEventListener('seeked', onSeeked);
            };
            video.addEventListener('seeked', onSeeked);
            video.currentTime = keptSegments[currentSegmentIndex].start;
          }

          // Stuck detection
          if (!isSeeking && video.currentTime === lastTime && !video.paused) {
            if (performance.now() - lastTimeChangeAt > 2000) { // 2 seconds stuck
              console.warn("Video stuck, nudging...");
              video.currentTime += 0.1;
              lastTimeChangeAt = performance.now();
            }
          } else {
            if (video.currentTime !== lastTime) {
              lastTimeChangeAt = performance.now();
              lastTime = video.currentTime;
            }
          }

          // 2. Draw frame (Freeze frame on canvas while seeking to hide stutter)
          if (!isSeeking && video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const currentTime = video.currentTime;
          
          // Helper to draw styled text
          const drawStyledText = (text: string, style: any, start: number, end: number, isSubtitle: boolean) => {
            if (!text) return;
            
            ctx.save();
            
            // Animation logic
            let opacity = 1;
            let scale = 1;
            let translateY = 0;
            const duration = 0.3;
            const anim = style.animation || 'none';
            
            if (currentTime < start + duration) {
              const progress = Math.max(0, (currentTime - start) / duration);
              opacity = progress;
              if (anim === 'pop') scale = 0.8 + 0.2 * progress;
              if (anim === 'slide') translateY = 20 * (1 - progress);
            } else if (currentTime > end - duration) {
              const progress = Math.max(0, (end - currentTime) / duration);
              opacity = progress;
              if (anim === 'pop') scale = 0.8 + 0.2 * progress;
              if (anim === 'slide') translateY = 20 * (1 - progress);
            }
            
            ctx.globalAlpha = opacity;
            
            // Positioning
            const fontSize = (style.fontSize || 24) * (canvas.height / 1080) * 2.5; // Scale font size based on canvas height
            ctx.font = `bold ${fontSize}px ${style.fontFamily || 'Inter, sans-serif'}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const x = canvas.width / 2;
            let y = isSubtitle ? canvas.height * 0.85 : canvas.height / 2;
            y += translateY * (canvas.height / 1080) * 2; // Scale translation
            
            // Measure text for background
            const metrics = ctx.measureText(text);
            const paddingX = 40 * (canvas.width / 1920);
            const paddingY = 20 * (canvas.height / 1080);
            const bgWidth = metrics.width + paddingX * 2;
            const bgHeight = fontSize + paddingY * 2;
            
            ctx.translate(x, y);
            ctx.scale(scale, scale);
            
            // Draw Background
            if (style.backgroundColor && style.backgroundColor !== 'transparent') {
              ctx.fillStyle = style.backgroundColor;
              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 10 * (canvas.width / 1920));
              } else {
                ctx.rect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight);
              }
              ctx.fill();
              
              if (style.preset === 'elegant') {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 2;
                ctx.stroke();
              }
            }
            
            // Draw Text with Shadows
            ctx.fillStyle = style.textColor || '#ffffff';
            
            if (style.preset === 'neon') {
              let neonColor = '#00f0ff';
              if (style.outlineShadow && style.outlineShadow.includes('#ff00de')) neonColor = '#ff00de';
              
              // Optimized glows for better performance
              const glows = [
                { blur: 10, color: '#fff' },
                { blur: 25, color: neonColor }
              ];
              
              glows.forEach(glow => {
                ctx.shadowBlur = glow.blur;
                ctx.shadowColor = glow.color;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.fillText(text, 0, 0);
              });
            } else {
              ctx.shadowColor = 'rgba(0,0,0,0.8)';
              ctx.shadowBlur = 10;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 2;
              ctx.fillText(text, 0, 0);
            }
            
            ctx.shadowBlur = 0;
            ctx.fillText(text, 0, 0);
            
            ctx.restore();
          };
          
          // Draw Subtitles
          if (project.showSubtitles !== false) {
            const activeSub = project.subtitles?.find(s => s.start <= currentTime && s.end > currentTime);
            const activeHighlights = project.showHighlights !== false ? (project.textOverlays?.filter(t => t.isHighlight && t.start <= currentTime && t.end > currentTime) || []) : [];
            
            if (activeSub) {
              let displayText = activeSub.text;
              
              if (activeHighlights.length > 0) {
                activeHighlights.forEach(h => {
                  const escapedText = h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  const regex = new RegExp(escapedText, 'gi');
                  displayText = displayText.replace(regex, '').replace(/\s+/g, ' ').trim();
                });
              }
              
              if (displayText) {
                drawStyledText(displayText, project.subtitleStyle || {}, activeSub.start, activeSub.end, true);
              }
            }
          }
          
          // Draw Text Overlays
          if (project.showHighlights !== false) {
            project.textOverlays?.filter(t => t.start <= currentTime && t.end > currentTime).forEach(t => {
              drawStyledText(t.text, t.style, t.start, t.end, false);
            });
          }
        }

        // 3. Update progress
        let processedTime = 0;
        for (let i = 0; i < currentSegmentIndex; i++) {
          processedTime += (keptSegments[i].end - keptSegments[i].start);
        }
        if (!isSeeking) {
          processedTime += Math.max(0, video.currentTime - keptSegments[currentSegmentIndex].start);
        }
        setExportProgress(Math.min(99, Math.round((processedTime / totalKeptTime) * 100)));
        } finally {
          isDrawing = false;
        }
      };

      const loop = () => {
        if (!isExportingRef.current) return;
        drawFrame();
        requestAnimationFrame(loop);
      };

      requestAnimationFrame(loop);

      // Web Worker fallback (Prevents the 1-min to 5-min stretching bug if tab is backgrounded)
      // Browsers throttle setInterval to 1s in background tabs, but Web Workers are not throttled.
      const workerCode = `
        let interval;
        self.onmessage = function(e) {
          if (e.data.type === 'start') {
            interval = setInterval(() => self.postMessage('tick'), e.data.fps);
          } else if (e.data.type === 'stop') {
            clearInterval(interval);
          }
        };
      `;
      const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(workerBlob);
      const worker = new Worker(workerUrl);
      
      worker.onmessage = () => {
        if (!isExportingRef.current) {
          worker.postMessage({ type: 'stop' });
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          return;
        }
        if (document.hidden || performance.now() - lastDrawTime > (1000 / exportFps) * 1.5) {
          drawFrame();
        }
      };
      worker.postMessage({ type: 'start', fps: 1000 / exportFps });
      
      // Override cleanup to also terminate worker
      const originalCleanup = cleanupRef.current;
      cleanupRef.current = () => {
        if (originalCleanup) originalCleanup();
        worker.postMessage({ type: 'stop' });
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
      };

    } catch (err: any) {
      console.error("Export error:", err);
      alert(`${t('exportCriticalError')}: ${err.message || 'Erro desconhecido'}. O vídeo original será baixado.`);
      const a = document.createElement('a');
      a.href = project.url!;
      a.download = `original_${project.name || 'video'}.mp4`;
      a.click();
      setIsExporting(false);
      isExportingRef.current = false;
      setExportStatus(t('exportErrorFallback'));
      cleanup();
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto flex gap-8">
      {/* Left Column - Summary */}
      <div className="flex-1">
        <h2 className="text-5xl font-bebas text-white mb-2">{t('exportTitle')}</h2>
        <div className="flex items-center gap-2 text-sm font-mono text-gray-400 mb-8">
          <span className="w-2 h-2 rounded-full bg-cc-green"></span>
          {t('exportProject')} {project.name ? project.name.toUpperCase() : 'VLOG_URBAN_SINFONIA_FINAL.MP4'}
        </div>

        {/* Video Preview */}
        <div className="bg-black rounded-xl border border-cc-surface-hover aspect-video relative overflow-hidden mb-6 flex items-center justify-center group">
          {project.url ? (
            <video 
              ref={videoRef}
              src={project.url} 
              className={cn("w-full h-full object-contain transition-opacity", isExporting ? "opacity-100" : "opacity-60")} 
              crossOrigin="anonymous"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 font-mono">
              {t('exportNoVideo')}
            </div>
          )}
          
          {!isExporting && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-full flex items-center justify-center border border-white/20">
                <Play size={24} className="text-white ml-1" fill="currentColor" />
              </div>
            </div>
          )}
          
          {isExporting && (
            <div className="absolute top-4 left-4 bg-cc-orange text-white text-xs font-bold px-2 py-1 rounded animate-pulse flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" />
              {t('exportRendering')}
            </div>
          )}

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-cc-surface-hover">
            <div className="h-full bg-cc-orange transition-all duration-200" style={{ width: `${isExporting ? exportProgress : 100}%` }}></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-cc-surface border border-cc-surface-hover rounded-xl p-5">
            <p className="text-[10px] font-mono text-gray-500 uppercase mb-2">{t('exportOriginalDuration')}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bebas text-white">{formatTime(duration)}</span>
            </div>
          </div>
          
          <div className="bg-cc-surface border border-cc-surface-hover rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-cc-green/20 text-cc-green text-[10px] font-mono px-1.5 py-0.5 rounded">
              -{savingsPercent}%
            </div>
            <p className="text-[10px] font-mono text-gray-500 uppercase mb-2">{t('exportEditedDuration')}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bebas text-cc-green">{formatTime(newDuration)}</span>
            </div>
          </div>

          <div className="bg-cc-surface border border-cc-surface-hover rounded-xl p-5">
            <p className="text-[10px] font-mono text-gray-500 uppercase mb-3">{t('exportAiInsights')}</p>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-500">{t('exportSilencesCut')}</span>
                <span className="text-white">{project.cuts?.filter(c => !c.active).length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('exportSubtitlesGenerated')}</span>
                <span className="text-white">{project.subtitles?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Export Settings */}
      <div className="w-96 flex flex-col gap-6">
        <div className="flex justify-end mb-2">
          <div className="flex items-center gap-2 text-cc-green font-bebas text-xl tracking-wide">
            {t('exportStatusTitle')}
            <br/>
            {t('exportReadyToShip')} <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-cc-surface border border-cc-surface-hover rounded-xl p-6 flex-1">
          <h3 className="text-2xl font-bebas text-white mb-6">{t('exportSettings')}</h3>
          
          {/* Quality */}
          <div className="mb-6">
            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-3">{t('exportVideoQuality')}</label>
            <div className="space-y-2">
              <QualityOption title="Full HD 1080p" desc={t('exportRecommended')} active />
            </div>
          </div>

          {/* FPS Selector */}
          <div className="mb-6">
            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-3">{t('exportFps')}</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setExportFps(30)}
                className={cn("py-2 rounded border text-sm font-bebas tracking-wide transition-colors", exportFps === 30 ? "bg-cc-bg border-cc-orange text-white" : "bg-cc-bg border-cc-surface-hover text-gray-400 hover:border-gray-500")}
              >
                {t('exportFpsDefault')}
              </button>
              <button 
                onClick={() => setExportFps(60)}
                className={cn("py-2 rounded border text-sm font-bebas tracking-wide transition-colors", exportFps === 60 ? "bg-cc-bg border-cc-orange text-white" : "bg-cc-bg border-cc-surface-hover text-gray-400 hover:border-gray-500")}
              >
                {t('exportFpsSmooth')}
              </button>
            </div>
          </div>

          {/* Format */}
          <div className="mb-8">
            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-3">{t('exportFileFormat')}</label>
            <div className="grid grid-cols-1 gap-2">
              <button className="bg-cc-bg border border-cc-orange text-white rounded py-2 text-sm font-bebas tracking-wide">MP4 (H.264 / AAC)</button>
            </div>
          </div>

          {/* Download Button */}
          {!isExporting ? (
            user?.subscription_status !== 'active' && user?.exports_count >= 1 && user?.email !== 'thidaniel177@gmail.com' ? (
              <div className="mb-3">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-3 text-center">
                  <p className="text-red-400 font-bebas text-xl mb-1">{t('exportLimitReached')}</p>
                  <p className="text-gray-400 text-xs">{t('exportLimitDesc')}</p>
                </div>
                <button 
                  onClick={() => onNavigate('pricing')}
                  className="w-full font-bebas text-2xl tracking-wide py-4 rounded-xl flex items-center justify-center gap-3 transition-transform shadow-[0_0_20px_rgba(255,92,0,0.3)] bg-cc-orange hover:bg-cc-orange-hover text-white hover:scale-[1.02] active:scale-[0.98]"
                >
                  {t('exportSubscribeNow')}
                </button>
              </div>
            ) : (
              <button 
                onClick={handleExport}
                disabled={!project.url}
                className="w-full font-bebas text-2xl tracking-wide py-4 rounded-xl flex items-center justify-center gap-3 transition-transform shadow-[0_0_20px_rgba(255,92,0,0.3)] mb-3 bg-cc-orange hover:bg-cc-orange-hover text-white hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download size={20} /> {t('exportRenderAndDownload')}
              </button>
            )
          ) : (
            <button 
              onClick={handleCancel}
              className="w-full font-bebas text-2xl tracking-wide py-4 rounded-xl flex items-center justify-center gap-3 transition-transform shadow-[0_0_20px_rgba(255,0,0,0.3)] mb-3 bg-cc-red hover:bg-red-600 text-white hover:scale-[1.02] active:scale-[0.98]"
            >
              <XCircle size={20} /> {t('exportCancel')} ({exportProgress}%)
            </button>
          )}
          
          <p className="text-center text-[10px] font-mono text-gray-500 uppercase h-8">
            {isExporting ? (
              <span className="text-cc-orange flex items-center justify-center gap-2">
                <Loader2 size={12} className="animate-spin" /> {exportStatus}
              </span>
            ) : (
              t('exportProcessingLocal')
            )}
          </p>
        </div>

        {/* Direct Publish */}
        <div className="bg-cc-surface border border-cc-surface-hover rounded-xl p-6">
          <h4 className="text-sm font-bebas tracking-wide text-white mb-4">{t('exportPublishDirectly')}</h4>
          <div className="grid grid-cols-3 gap-3">
            <PublishButton icon={<Youtube size={20} />} label="YouTube" />
            <PublishButton icon={<Smartphone size={20} />} label="TikTok" />
            <PublishButton icon={<Instagram size={20} />} label="Instagram" />
          </div>
        </div>
      </div>
    </div>
  );
}

function QualityOption({ title, desc, active }: any) {
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
      active ? "bg-cc-bg border-cc-orange" : "bg-cc-bg border-cc-surface-hover hover:border-gray-600"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-4 h-4 rounded-full border flex items-center justify-center",
          active ? "border-cc-orange" : "border-gray-600"
        )}>
          {active && <div className="w-2 h-2 rounded-full bg-cc-orange"></div>}
        </div>
        <span className="text-sm font-bebas tracking-wide text-white">{title}</span>
      </div>
      <span className="text-[10px] font-mono text-gray-500">{desc}</span>
    </div>
  );
}

function PublishButton({ icon, label }: any) {
  return (
    <button className="flex flex-col items-center justify-center gap-2 p-3 bg-cc-bg border border-cc-surface-hover rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
      {icon}
      <span className="text-[10px] font-mono">{label}</span>
    </button>
  );
}
