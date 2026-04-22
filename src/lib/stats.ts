export interface AppStats {
  videosProcessed: number;
  hoursSaved: number;
  silencesRemoved: number;
  subtitlesGenerated: number;
}

const STATS_KEY = 'vlog_editor_stats';

export function getStats(): AppStats {
  const stored = localStorage.getItem(STATS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse stats", e);
    }
  }
  return {
    videosProcessed: 0,
    hoursSaved: 0,
    silencesRemoved: 0,
    subtitlesGenerated: 0
  };
}

export function updateStats(newStats: Partial<AppStats>) {
  const current = getStats();
  const updated = {
    videosProcessed: current.videosProcessed + (newStats.videosProcessed || 0),
    hoursSaved: current.hoursSaved + (newStats.hoursSaved || 0),
    silencesRemoved: current.silencesRemoved + (newStats.silencesRemoved || 0),
    subtitlesGenerated: current.subtitlesGenerated + (newStats.subtitlesGenerated || 0),
  };
  localStorage.setItem(STATS_KEY, JSON.stringify(updated));
  return updated;
}
