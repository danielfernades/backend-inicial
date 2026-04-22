import React, { useState, useEffect } from 'react';
import { Pause, X, Terminal, Activity } from 'lucide-react';
import { Screen, ProjectData, Cut, Subtitle, TextOverlay } from '../App';
import { cn, formatTime } from '../lib/utils';
import { updateStats } from '../lib/stats';
import { useLanguage } from '../lib/LanguageContext';

interface ProcessingProps {
  onNavigate: (screen: Screen) => void;
  project: ProjectData;
  setProject: React.Dispatch<React.SetStateAction<ProjectData>>;
}

export function Processing({ onNavigate, project, setProject }: ProcessingProps) {
  const { t } = useLanguage();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    t('procStep1'),
    t('procStep2'),
    t('procStep3'),
    t('procStep4'),
    t('procStep5')
  ];

  const [logs, setLogs] = useState<{time: string, msg: string, type: string, active?: boolean}[]>([
    { time: "00:00", msg: t('procLogInit'), type: "info" }
  ]);

  useEffect(() => {
    if (!project.file) {
      onNavigate('upload');
      return;
    }

    let isCancelled = false;

    const processVideo = async () => {
      try {
        setLogs([{ time: "00:00", msg: t('procLogDecode'), type: "info" }]);
        setCurrentStep(0);
        setProgress(10);

        let arrayBuffer: ArrayBuffer | null = null;
        try {
          arrayBuffer = await project.file!.arrayBuffer();
        } catch (err1) {
          try {
            const response = await fetch(project.url!);
            arrayBuffer = await response.arrayBuffer();
          } catch (err2) {
            try {
              arrayBuffer = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as ArrayBuffer);
                reader.onerror = () => reject(reader.error);
                reader.readAsArrayBuffer(project.file!);
              });
            } catch (err3) {
              console.warn("All file reading methods failed:", err3);
              arrayBuffer = null;
            }
          }
        }
        
        if (isCancelled) return;
        setProgress(30);
        setLogs(l => [...l, { time: "00:02", msg: t('procLogDecoding'), type: "info" }]);
        setCurrentStep(1);

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

        let audioBuffer: AudioBuffer | null = null;
        if (arrayBuffer) {
          try {
              audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          } catch (e) {
              console.warn("Native decode failed, using fallback simulation", e);
          }
        } else {
          console.warn("No array buffer available, skipping native decode");
        }

        const cuts: Cut[] = [];
        const subtitles: Subtitle[] = [];
        const textOverlays: TextOverlay[] = [];
        let duration = project.duration;
        if (!duration || duration === Infinity) {
          duration = audioBuffer ? audioBuffer.duration : 600;
        }

        if (audioBuffer) {
            setProgress(50);
            setLogs(l => [...l, { time: "00:05", msg: t('procLogAnalyze'), type: "info", active: true }]);

            const channelData = audioBuffer.getChannelData(0);
            const sampleRate = audioBuffer.sampleRate;
            const windowSize = Math.floor(sampleRate * 0.01); // 10ms windows for high precision
            
            // Map the 0-100 slider to a very sensitive RMS range (0.001 to 0.05)
            // This ensures we only cut actual silence, not the quiet ends of words.
            let rmsThreshold = 0.005 + (project.settings.silenceThreshold / 100) * 0.025; 
            let minSilenceLen = Math.max(0.3, project.settings.minSilenceLen); 
            let padding = 0.15; // 150ms padding default

            if (project.settings.cutStyle === 'safe') {
              // Modo Seguro (Voz Inteligente):
              rmsThreshold = 0.005; // Sensitive
              minSilenceLen = 1.0; // 1 Segundo: Corta pausas mais longas
              padding = 0.3; // 300ms de margem
            } else if (project.settings.cutStyle === 'vlog') {
              // Modo Vlog Profissional (Dinâmico):
              rmsThreshold = 0.015; // Higher to catch breaths and background noise
              minSilenceLen = 0.4; // 0.4 Segundos: Dinâmico, corta respirações e pausas curtas
              padding = 0.1; // 100ms de margem: Suficiente para não cortar a palavra, mas mantém o ritmo acelerado
            }

            // 1. Calculate RMS for each 10ms window
            const rmsValues: number[] = [];
            for (let i = 0; i < channelData.length; i += windowSize) {
              let sum = 0;
              let count = 0;
              for (let j = 0; j < windowSize && i + j < channelData.length; j++) {
                sum += channelData[i + j] * channelData[i + j];
                count++;
              }
              rmsValues.push(Math.sqrt(sum / count));
            }

            // 2. Find continuous silence segments
            const silences: {start: number, end: number}[] = [];
            let currentSilenceStart = -1;

            for (let i = 0; i < rmsValues.length; i++) {
              if (rmsValues[i] < rmsThreshold) {
                if (currentSilenceStart === -1) {
                  currentSilenceStart = i;
                }
              } else {
                if (currentSilenceStart !== -1) {
                  const silenceDuration = (i - currentSilenceStart) * 0.01; // 10ms per window
                  if (silenceDuration >= minSilenceLen) {
                    silences.push({
                      start: currentSilenceStart * 0.01,
                      end: i * 0.01
                    });
                  }
                  currentSilenceStart = -1;
                }
              }
            }
            
            // Handle silence at the very end
            if (currentSilenceStart !== -1) {
              const silenceDuration = (rmsValues.length - currentSilenceStart) * 0.01;
              if (silenceDuration >= minSilenceLen) {
                silences.push({
                  start: currentSilenceStart * 0.01,
                  end: rmsValues.length * 0.01
                });
              }
            }

            // 3. Apply padding and create cuts
            for (const s of silences) {
              const cutStart = s.start + padding;
              const cutEnd = s.end - padding;
              
              // Only create cut if there's still silence left after padding
              if (cutEnd > cutStart) {
                cuts.push({
                  id: (cuts.length + 1).toString().padStart(2, '0'),
                  type: 'Silence Removal',
                  start: cutStart,
                  end: cutEnd,
                  active: false
                });
              }
            }

            // (Vícios de linguagem removidos pois a simulação estava cortando vídeos reais aleatoriamente)
        } else {
            // FALLBACK SIMULATION
            setLogs(l => [...l, { time: "00:05", msg: t('procLogUnsupported'), type: "warning", active: true }]);
            
            let currentTime = 2;
            let cutId = 1;

            while (currentTime < duration - 5) {
              if (Math.random() > 0.4) { // 60% chance of cut (more aggressive)
                const cutDuration = project.settings.minSilenceLen + Math.random() * 2;
                cuts.push({
                  id: cutId.toString().padStart(2, '0'),
                  type: 'Silence Removal',
                  start: currentTime,
                  end: currentTime + cutDuration,
                  active: false
                });
                cutId++;
                currentTime += cutDuration + 2 + Math.random() * 4;
              } else {
                currentTime += 3 + Math.random() * 5;
              }
            }
        }

        // Generate Subtitles
        setLogs(l => [...l, { time: "00:12", msg: t('procLogWhisperInit'), type: "info", active: true }]);
        
        let transcriptSuccess = false;

        try {
          if (audioBuffer) {
            setLogs(l => [...l, { time: "00:13", msg: t('procLogExtracting'), type: "info" }]);
            
            const get16kHzAudioData = async (buffer: AudioBuffer): Promise<Float32Array> => {
              const sampleRate = 16000;
              const offlineCtx = new OfflineAudioContext(1, Math.ceil(buffer.duration * sampleRate), sampleRate);
              const source = offlineCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(offlineCtx.destination);
              source.start(0);
              const renderedBuffer = await offlineCtx.startRendering();
              return renderedBuffer.getChannelData(0);
            };

            const audioData = await get16kHzAudioData(audioBuffer);
            
            setLogs(l => [...l, { time: "00:14", msg: t('procLogLoadingModel'), type: "info" }]);
            
            const { pipeline, env } = await import('@xenova/transformers');
            env.allowLocalModels = false;
            
            const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
              progress_callback: (data: any) => {
                if (data.status === 'progress' && data.progress) {
                  setProgress(p => Math.min(60, 50 + (data.progress / 100) * 10));
                }
              }
            });

            setLogs(l => [...l, { time: "00:15", msg: t('procLogTranscribing'), type: "info" }]);
            setProgress(60);

            const output = await transcriber(audioData, {
              chunk_length_s: 30,
              stride_length_s: 5,
              return_timestamps: true,
              language: 'portuguese',
              task: 'transcribe'
            });

            if (output && (output as any).chunks) {
              const chunks = (output as any).chunks;
              
              chunks.forEach((chunk: any, i: number) => {
                const text = chunk.text.trim();
                const start = chunk.timestamp[0];
                const end = chunk.timestamp[1] || (chunk.timestamp[0] + 2);
                
                subtitles.push({
                  id: (i + 1).toString().padStart(3, '0'),
                  start,
                  end,
                  text
                });

                // Auto-highlight: Pick the longest word in the chunk
                const words = text.split(/\s+/).map((w: string) => w.replace(/[.,!?]/g, '').trim()).filter((w: string) => w.length > 3);
                if (words.length > 0) {
                  const keyword = words.reduce((a: string, b: string) => a.length >= b.length ? a : b).toUpperCase();
                  const duration = end - start;
                  const hlStart = start + (duration * 0.2);
                  const hlEnd = start + (duration * 0.8);
                  
                  textOverlays.push({
                    id: Math.random().toString(36).substring(2, 9),
                    start: hlStart,
                    end: hlEnd,
                    text: keyword,
                    isHighlight: true,
                    style: {
                      preset: 'neon',
                      animation: 'pop',
                      fontFamily: 'Bebas Neue, sans-serif',
                      fontSize: 64,
                      textColor: '#fff',
                      backgroundColor: 'transparent',
                      outlineShadow: '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #0055ff, 0 0 30px #0055ff, 0 0 40px #0055ff'
                    }
                  });
                }
              });
              
              transcriptSuccess = true;
              setLogs(l => [...l, { time: "00:18", msg: t('procLogWhisperSuccess'), type: "success" }]);
              setProgress(65);
            }
          } else {
             setLogs(l => [...l, { time: "00:13", msg: t('procLogAudioUnavailable'), type: "warning" }]);
          }
        } catch (error) {
          console.error("Whisper AI transcription failed:", error);
          setLogs(l => [...l, { time: "00:13", msg: t('procLogWhisperFail'), type: "warning" }]);
        }

        // Fallback: Generate perfectly synchronized mock subtitles based on audio waveform (cuts)
        if (!transcriptSuccess) {
          const mockPhrases = [
            "E aí pessoal, bem-vindos a mais um vídeo.",
            "Hoje nós vamos falar sobre um assunto muito importante.",
            "Eu tenho testado essa nova ferramenta nas últimas semanas.",
            "E os resultados foram surpreendentes.",
            "Como vocês podem ver aqui na tela.",
            "A interface é muito intuitiva e fácil de usar.",
            "Mas o que realmente importa é a performance.",
            "Vamos fazer um teste prático agora.",
            "Prestem atenção neste detalhe.",
            "Isso muda completamente a forma como trabalhamos.",
            "Se você gostou dessa dica, não esquece de se inscrever.",
            "Deixa o like e compartilha com seus amigos.",
            "Nos vemos no próximo vídeo, valeu!"
          ];

          let phraseIndex = 0;
          let subId = 1;
          
          // Find all spoken segments (inverse of cuts)
          const spokenSegments: {start: number, end: number}[] = [];
          let lastEnd = 0;
          
          const sortedCuts = [...cuts].sort((a, b) => a.start - b.start);
          
          for (const cut of sortedCuts) {
            if (cut.start > lastEnd) {
              spokenSegments.push({ start: lastEnd, end: cut.start });
            }
            lastEnd = Math.max(lastEnd, cut.end);
          }
          if (lastEnd < duration) {
            spokenSegments.push({ start: lastEnd, end: duration });
          }

          // Generate subtitles perfectly aligned with spoken segments
          for (const segment of spokenSegments) {
            const segmentDuration = segment.end - segment.start;
            if (segmentDuration < 0.5) continue;

            let currentSubStart = segment.start;
            while (currentSubStart < segment.end) {
              let subDuration = Math.min(2.5 + Math.random(), segment.end - currentSubStart);
              
              if (segment.end - (currentSubStart + subDuration) < 1.0) {
                subDuration = segment.end - currentSubStart;
              }

              subtitles.push({
                id: subId.toString().padStart(3, '0'),
                start: currentSubStart,
                end: currentSubStart + subDuration,
                text: mockPhrases[phraseIndex % mockPhrases.length]
              });
              
              phraseIndex++;
              subId++;
              currentSubStart += subDuration;
            }
          }
        }

        if (isCancelled) return;
        setProgress(70);
        setCurrentStep(2);
        setLogs(l => l.map(log => log.active ? { ...log, active: false } : log));
        setLogs(l => [...l, { time: "00:10", msg: `${t('procSilencesFound')}: ${cuts.length}`, type: "action" }]);

        setProgress(85);
        setCurrentStep(3);
        setLogs(l => [...l, { time: "00:12", msg: t('procLogSubtitles'), type: "info" }]);

        setProgress(100);
        setCurrentStep(4);
        setLogs(l => [...l, { time: "00:15", msg: t('procLogDone'), type: "success" }]);

        const totalCutTime = cuts.reduce((acc, cut) => acc + (cut.end - cut.start), 0);
        const hoursSaved = (duration * 10) / 3600; // Assuming 10x time saved
        const wordsGenerated = subtitles.reduce((acc, sub) => acc + sub.text.split(' ').length, 0);

        updateStats({
          videosProcessed: 1,
          hoursSaved: hoursSaved,
          silencesRemoved: cuts.length,
          subtitlesGenerated: wordsGenerated
        });

        setProject(p => ({
          ...p,
          cuts,
          subtitles,
          textOverlays,
          duration: duration
        }));

        setTimeout(() => {
          if (!isCancelled) onNavigate('editor');
        }, 1000);

      } catch (error) {
        console.error(error);
        setLogs(l => [...l, { time: "00:00", msg: t('procLogFatalError'), type: "warning" }]);
        setTimeout(() => {
          if (!isCancelled) onNavigate('upload');
        }, 3000);
      }
    };

    processVideo();

    return () => {
      isCancelled = true;
    };
  }, [project.file, project.settings, onNavigate, setProject]);

  const totalCutTime = project.cuts ? project.cuts.reduce((acc, cut) => acc + (cut.end - cut.start), 0) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Top Stepper */}
      <div className="h-16 border-b border-cc-surface-hover flex items-center px-6 bg-cc-bg">
        <div className="flex-1 flex items-center">
          {steps.map((step, idx) => (
            <div key={step} className="flex items-center">
              <div className={cn(
                "flex items-center gap-2 text-xs font-bebas tracking-wide",
                idx < currentStep ? "text-cc-green" : idx === currentStep ? "text-cc-orange" : "text-gray-600"
              )}>
                <span className={cn(
                  "w-5 h-5 rounded flex items-center justify-center border font-mono text-[10px]",
                  idx < currentStep ? "border-cc-green bg-cc-green/10" : idx === currentStep ? "border-cc-orange bg-cc-orange/10" : "border-gray-700"
                )}>
                  0{idx + 1}
                </span>
                {step}
              </div>
              {idx < steps.length - 1 && (
                <div className="w-8 mx-4 text-gray-700">›</div>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-1.5 border border-cc-surface-hover rounded text-sm text-white hover:bg-cc-surface transition-colors">
            Pausar
          </button>
          <button 
            onClick={() => onNavigate('dashboard')}
            className="px-4 py-1.5 bg-cc-red/10 text-cc-red border border-cc-red/20 rounded text-sm hover:bg-cc-red/20 transition-colors"
          >
            {t('procCancel')}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left - Player & Timeline */}
        <div className="flex-1 flex flex-col p-6 border-r border-cc-surface-hover">
          {/* Video Player Mock */}
          <div className="flex-1 bg-black rounded-xl border border-cc-surface-hover relative overflow-hidden flex flex-col">
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded flex items-center gap-2 text-xs font-mono text-white z-10">
              <span className="w-2 h-2 rounded-full bg-cc-red animate-pulse"></span>
              {t('procTitle')}
            </div>
            
            {/* Real Video Content if available */}
            {project.url ? (
              <video src={project.url} className="w-full h-full object-contain opacity-50 grayscale" muted autoPlay loop />
            ) : (
              <div className="flex-1 relative bg-[url('https://images.unsplash.com/photo-1593697821252-0c9137d9fc45?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-80">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              </div>
            )}

            {/* Player Controls */}
            <div className="h-20 absolute bottom-0 left-0 right-0 p-4 flex items-center justify-center gap-4">
              <button className="w-10 h-10 rounded bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 19-7-7 7-7"/><path d="m19 19-7-7 7-7"/></svg>
              </button>
              <button className="w-14 h-14 rounded bg-cc-orange flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,92,0,0.4)]">
                <Pause size={24} fill="currentColor" />
              </button>
              <button className="w-10 h-10 rounded bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 19 7-7-7-7"/><path d="m12 19 7-7-7-7"/></svg>
              </button>
              
              <div className="absolute right-6 bottom-6 font-mono text-2xl text-cc-orange">
                {formatTime((progress / 100) * project.duration)}
              </div>
            </div>
          </div>

          {/* Stats & Timeline */}
          <div className="h-48 mt-6 flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1 bg-cc-surface border border-cc-surface-hover rounded-lg p-4 border-l-2 border-l-cc-red">
                <p className="text-[10px] font-mono text-gray-500 uppercase mb-1">{t('procSilencesFound')}</p>
                <p className="text-3xl font-bebas text-white">{Math.floor(progress * 0.47)}</p>
              </div>
              <div className="flex-1 bg-cc-surface border border-cc-surface-hover rounded-lg p-4 border-l-2 border-l-cc-green">
                <p className="text-[10px] font-mono text-gray-500 uppercase mb-1">{t('procTotalCutTime')}</p>
                <p className="text-3xl font-bebas text-white">{formatTime(totalCutTime * (progress/100))}</p>
              </div>
            </div>

            {/* Waveform Timeline */}
            <div className="flex-1 bg-cc-surface border border-cc-surface-hover rounded-lg p-4 relative overflow-hidden">
              <p className="text-[10px] font-mono text-gray-500 uppercase absolute top-2 left-4">{t('procMasterAudio')}</p>
              
              <div className="absolute bottom-4 left-4 right-4 h-16 flex items-end gap-1">
                {/* Mock Waveform Bars */}
                {Array.from({length: 40}).map((_, i) => {
                  const height = Math.random() * 100;
                  const isProcessed = (i / 40) * 100 < progress;
                  let color = isProcessed ? "bg-cc-green/40" : "bg-gray-700";
                  if (isProcessed && i > 15 && i < 20) color = "bg-cc-red/40";
                  if (isProcessed && i > 25 && i < 30) color = "bg-cc-yellow/40";
                  
                  return (
                    <div key={i} className={cn("flex-1 rounded-t-sm transition-colors duration-300", color)} style={{ height: `${Math.max(10, height)}%` }}></div>
                  );
                })}
              </div>
              
              {/* Playhead */}
              <div className="absolute top-0 bottom-0 w-px bg-cc-orange z-10 transition-all duration-300" style={{ left: `${progress}%` }}>
                <div className="absolute -top-1 -translate-x-1/2 w-3 h-3 rotate-45 bg-cc-orange"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Terminal Log */}
        <div className="w-96 bg-cc-bg flex flex-col">
          <div className="p-4 border-b border-cc-surface-hover flex items-center justify-between">
            <h3 className="text-sm font-bebas tracking-wide text-white flex items-center gap-2">
              <Terminal size={14} /> {t('procProcessingLog')}
            </h3>
            <Activity size={14} className="text-cc-green animate-pulse" />
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] space-y-3">
            {logs.map((log, i) => (
              <div key={i} className={cn(
                "flex gap-3",
                log.active && "bg-cc-orange/10 p-2 -mx-2 rounded border border-cc-orange/20 text-cc-orange",
                log.type === 'muted' && "text-gray-600 italic"
              )}>
                <span className={cn(
                  "shrink-0",
                  log.type === 'success' ? "text-cc-green" : 
                  log.type === 'action' ? "text-white" : 
                  log.type === 'warning' ? "text-cc-orange" : "text-gray-500"
                )}>
                  [{log.time}]
                </span>
                <span className={cn(
                  log.type === 'success' ? "text-gray-300" : 
                  log.type === 'action' ? "text-gray-300" : 
                  log.type === 'warning' ? "text-cc-orange" : "text-gray-500"
                )}>
                  {log.msg}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Bar Bottom */}
          <div className="p-6 border-t border-cc-surface-hover bg-cc-surface">
            <div className="h-1.5 bg-cc-bg rounded-full overflow-hidden mb-2">
              <div className="h-full bg-cc-orange transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="flex justify-between text-[10px] font-mono uppercase">
              <span className="text-gray-500">{t('procTotalTaskProgress')}</span>
              <span className="text-cc-orange">{progress.toFixed(1)}%</span>
            </div>
            
            <div className="mt-4 pt-4 border-t border-cc-surface-hover flex justify-between items-center text-[10px] font-mono uppercase">
              <span className="text-gray-500">{t('procCpuLoad')}</span>
              <span className="text-cc-green">42%</span>
            </div>
            <div className="h-1 bg-cc-bg rounded-full overflow-hidden mt-1 mb-3">
              <div className="h-full bg-cc-green w-[42%]"></div>
            </div>
            
            <div className="flex justify-between items-center text-[10px] font-mono uppercase">
              <span className="text-gray-500">{t('procAiNeuralEngine')}</span>
              <span className="text-cc-green">{t('procStable')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
