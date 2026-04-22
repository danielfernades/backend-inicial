import os
import subprocess
import json
import re
from dataclasses import dataclass
from typing import List, Dict, Any

@dataclass
class SmoothnessConfig:
    """
    Configurações para garantir a suavidade das transições e cortes.
    """
    silence_threshold_db: int = -30
    min_silence_duration_ms: int = 400
    padding_ms: int = 100
    audio_crossfade_duration_s: float = 0.05  # 50ms fade out/in para evitar cliques (acrossfade)
    video_dissolve_duration_s: float = 0.10   # 100ms (aprox 3 frames) para blend visual
    jump_cut_threshold_ms: int = 200          # Cortes menores que isso são jump cuts secos
    target_lufs: float = -14.0                # Padrão EBU R128 para YouTube

def parse_ffmpeg_time(line: str) -> float:
    """Extrai o tempo atual em segundos do output do FFmpeg"""
    match = re.search(r"time=(\d+):(\d+):(\d+\.\d+)", line)
    if match:
        h, m, s = match.groups()
        return int(h) * 3600 + int(m) * 60 + float(s)
    return 0.0

def build_filter_complex(segments: List[Dict], config: SmoothnessConfig) -> str:
    """
    Gera a string do filter_complex do FFmpeg dinamicamente baseada nos segmentos.
    Aplica crossfade de áudio e dissolve de vídeo entre os segmentos.
    """
    if not segments or len(segments) < 2:
        return ""
        
    filters = []
    
    # Preparar inputs
    for i in range(len(segments)):
        filters.append(f"[{i}:v]trim=start={segments[i]['start']}:end={segments[i]['end']},setpts=PTS-STARTPTS[v{i}];")
        filters.append(f"[{i}:a]atrim=start={segments[i]['start']}:end={segments[i]['end']},asetpts=PTS-STARTPTS[a{i}];")
        
    # Aplicar transições
    last_v = "[v0]"
    last_a = "[a0]"
    
    for i in range(1, len(segments)):
        next_v = f"[v{i}]"
        next_a = f"[a{i}]"
        
        out_v = f"[v_out{i}]"
        out_a = f"[a_out{i}]"
        
        # Crossfade de Áudio (acrossfade) elimina o "clique" de áudio que delata o ponto de corte.
        filters.append(f"{last_a}{next_a}acrossfade=d={config.audio_crossfade_duration_s}:c1=exp:c2=exp{out_a};")
        
        # Dissolve de Vídeo (xfade/blend) dissolve visual de 3 frames que torna a emenda invisível ao olho humano.
        filters.append(f"{last_v}{next_v}xfade=transition=fade:duration={config.video_dissolve_duration_s}:offset={segments[i-1]['duration'] - config.video_dissolve_duration_s}{out_v};")
        
        last_v = out_v
        last_a = out_a
        
    return "".join(filters)

class VideoProcessor:
    def __init__(self, config: SmoothnessConfig):
        self.config = config

    def analyze_video(self, input_path: str) -> Dict[str, Any]:
        """
        ESTÁGIO 1: Extrai áudio e analisa silêncios.
        """
        import uuid
        from pydub import AudioSegment
        
        audio_path = f"/tmp/audio_16k_{uuid.uuid4().hex}.wav"
        
        # 1. Extrai áudio em WAV mono 16kHz via FFmpeg
        subprocess.run([
            "ffmpeg", "-y", "-i", input_path, 
            "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", 
            audio_path
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # 2. Analisa RMS com PyDub em janelas de 50ms
        audio = AudioSegment.from_wav(audio_path)
        duration_ms = len(audio)
        
        window_size = 50
        silence_threshold = self.config.silence_threshold_db
        min_silence_len = self.config.min_silence_duration_ms
        
        silence_map = []
        in_silence = False
        silence_start = 0
        
        for i in range(0, duration_ms, window_size):
            chunk = audio[i:i+window_size]
            # Evita erro de log(0) no dBFS
            chunk_dbfs = chunk.dBFS if chunk.rms > 0 else -float('inf')
            is_silent = chunk_dbfs < silence_threshold
            
            if is_silent and not in_silence:
                in_silence = True
                silence_start = i
            elif not is_silent and in_silence:
                in_silence = False
                silence_end = i
                if (silence_end - silence_start) >= min_silence_len:
                    silence_map.append({
                        "start_ms": silence_start, 
                        "end_ms": silence_end, 
                        "type": "silence"
                    })
                    
        if in_silence:
            silence_end = duration_ms
            if (silence_end - silence_start) >= min_silence_len:
                silence_map.append({
                    "start_ms": silence_start, 
                    "end_ms": silence_end, 
                    "type": "silence"
                })
                
        # 3. Detecta "jump cuts indesejados" (ruídos isolados curtos < 200ms)
        # e constrói a lista de segmentos que serão mantidos
        segments = []
        current_time = 0
        
        for silence in silence_map:
            start_silence = silence["start_ms"] + self.config.padding_ms
            end_silence = silence["end_ms"] - self.config.padding_ms
            
            if end_silence <= start_silence:
                continue # Ignore if padding consumes the whole silence
                
            if start_silence > current_time:
                seg_duration = start_silence - current_time
                seg_type = "jump_cut" if seg_duration < self.config.jump_cut_threshold_ms else "content"
                segments.append({
                    "start_ms": current_time,
                    "end_ms": start_silence,
                    "duration_ms": seg_duration,
                    "type": seg_type
                })
            current_time = end_silence
            
        if current_time < duration_ms:
            seg_duration = duration_ms - current_time
            seg_type = "jump_cut" if seg_duration < self.config.jump_cut_threshold_ms else "content"
            segments.append({
                "start_ms": current_time,
                "end_ms": duration_ms,
                "duration_ms": seg_duration,
                "type": seg_type
            })
            
        # Limpeza do arquivo temporário
        try:
            os.remove(audio_path)
        except OSError:
            pass
            
        # 4. Retorna JSON
        return {
            "segments": segments,
            "silence_map": silence_map,
            "duration_ms": duration_ms
        }

    def transcribe_and_align(self, audio_path: str, cut_map: List[Dict]) -> str:
        """
        ESTÁGIO 2: Transcrição com faster-whisper e geração de .ass
        """
        # from faster_whisper import WhisperModel
        # model = WhisperModel("large-v2", device="cuda", compute_type="float16")
        # segments, info = model.transcribe(audio_path, word_timestamps=True)
        
        ass_path = "/tmp/subtitles.ass"
        # Lógica de geração do ASS com tags {\k} para karaokê
        with open(ass_path, "w") as f:
            f.write("[Script Info]\nScriptType: v4.00+\n")
            # ...
        return ass_path

    def build_smooth_concat(self, segments: List[Dict], input_path: str) -> str:
        """
        ESTÁGIO 3: Concatenação suave
        """
        # Se forem muitos segmentos longos, usar concat demuxer (3A)
        # Se precisar de crossfade/dissolve, usar filter_complex gerado em build_filter_complex (3B, 3C)
        output_path = "/tmp/concat_video.mp4"
        return output_path

    def apply_finishing(self, video_path: str, subtitle_path: str) -> str:
        """
        ESTÁGIO 4: Legendas e Color Grade
        """
        output_path = "/tmp/finished_video.mp4"
        return output_path

    def export_final(self, video_path: str, audio_path: str, subtitle_path: str, output_path: str):
        """
        ESTÁGIO 5: Exportação paralela com qualidade máxima
        """
        ffmpeg_cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-i", audio_path,
            "-vf", f"ass={subtitle_path},eq=brightness=0.02:contrast=1.05:saturation=1.1:gamma=0.98,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
            "-c:v", "libx264",
            "-crf", "18",           # Qualidade visual quase sem perdas (Visualmente Lossless)
            "-preset", "slow",      # Compressão mais eficiente (menor tamanho, mesma qualidade)
            "-profile:v", "high",   # Perfil avançado do H.264
            "-level", "4.1",        # Compatibilidade com a maioria dos dispositivos
            "-c:a", "aac",
            "-b:a", "192k",         # Áudio de alta qualidade
            "-ar", "48000",         # Sample rate padrão de vídeo
            "-movflags", "+faststart", # OBRIGATÓRIO: Move o moov atom para o início (Web streaming)
            "-map", "0:v",
            "-map", "1:a",
            output_path
        ]
        
        # Executa e emite progresso
        # process = subprocess.Popen(ffmpeg_cmd, stderr=subprocess.PIPE, universal_newlines=True)
        # for line in process.stderr:
        #     if "time=" in line:
        #         current_time = parse_ffmpeg_time(line)
        #         # Emitir via WebSocket/Redis
