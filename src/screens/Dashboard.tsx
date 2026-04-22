import { Play, Clock, Scissors, Type, ArrowUpRight, MoreVertical, Upload, Wand2, Subtitles } from 'lucide-react';
import { Screen, ProjectData } from '../App';
import { formatDuration } from '../lib/utils';
import { getStats, AppStats } from '../lib/stats';
import { useEffect, useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';

interface DashboardProps {
  onNavigate: (screen: Screen) => void;
  project: ProjectData;
}

export function Dashboard({ onNavigate, project }: DashboardProps) {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<AppStats>({
    videosProcessed: 0,
    hoursSaved: 0,
    silencesRemoved: 0,
    subtitlesGenerated: 0
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);

  useEffect(() => {
    setStats(getStats());
    fetchRecentProjects();
  }, []);

  const fetchRecentProjects = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRecentProjects(data.slice(0, 3));
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toString();
  };

  const formatHours = (hours: number) => {
    if (hours < 1) {
      return Math.round(hours * 60) + 'm';
    }
    return Math.round(hours) + 'h';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="text-5xl font-bebas text-white mb-2">{t('dashCommandCenter')}</h2>
          <p className="text-gray-400">{t('dashWelcome')}</p>
        </div>
        <button 
          onClick={() => onNavigate('upload')}
          className="bg-cc-orange hover:bg-cc-orange-hover text-white px-6 py-4 rounded-lg flex items-center gap-4 transition-colors group"
        >
          <div className="bg-white/20 p-2 rounded group-hover:bg-white/30 transition-colors">
            <Upload size={20} />
          </div>
          <div className="text-left">
            <div className="font-bebas text-xl leading-none">{t('dashNewProject').toUpperCase()}</div>
            <div className="text-[10px] font-mono opacity-80 mt-1">{t('dashUploadHint')}</div>
          </div>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-12">
        <MetricCard title={t('dashVideosProcessed')} value={formatNumber(stats.videosProcessed)} icon={<Play size={48} className="opacity-10" />} />
        <MetricCard title={t('dashHoursSaved')} value={formatHours(stats.hoursSaved)} sub={t('dashTotal')} icon={<Clock size={48} className="opacity-10" />} />
        <MetricCard title={t('dashSilencesRemoved')} value={formatNumber(stats.silencesRemoved)} sub={t('dashCuts')} icon={<Scissors size={48} className="opacity-10" />} />
        <MetricCard title={t('dashSubtitlesGenerated')} value={formatNumber(stats.subtitlesGenerated)} sub={t('dashWords')} icon={<Type size={48} className="opacity-10" />} />
      </div>

      {/* Recent Projects */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bebas text-white">{t('dashRecent').toUpperCase()}</h3>
          <button onClick={() => onNavigate('projects')} className="text-xs font-mono text-gray-500 hover:text-white transition-colors uppercase">{t('dashViewAll')}</button>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {project.url && (
            <ProjectCard 
              title={project.name || t('dashCurrentProject')} 
              duration={formatDuration(project.duration)} 
              status={project.cuts.length > 0 ? t('dashCompleted') : t('dashProcessing')} 
              statusColor={project.cuts.length > 0 ? "text-cc-green" : "text-cc-orange"}
              time={t('dashJustNow')}
              onClick={() => onNavigate(project.cuts.length > 0 ? 'editor' : 'processing')}
            />
          )}
          {recentProjects.map(p => (
            <ProjectCard 
              key={p.id}
              title={p.name} 
              duration={p.duration} 
              status={p.status} 
              statusColor="text-cc-green"
              time={new Date(p.created_at).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US')}
              onClick={() => {}}
            />
          ))}
          {!project.url && recentProjects.length === 0 && (
            <ProjectCard 
              title="Interview_Dr_Smith_RAW.mp4" 
              duration="--:--" 
              status={t('dashWaiting')} 
              statusColor="text-gray-500"
              time={t('dashCreatedYesterday')}
              onClick={() => onNavigate('upload')}
            />
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-cc-surface border border-cc-surface-hover rounded-xl p-6 flex items-center justify-between group cursor-pointer hover:border-cc-orange transition-colors" onClick={() => onNavigate('upload')}>
          <div>
            <h4 className="text-2xl font-bebas text-white mb-2">{t('dashMagicTrim').toUpperCase()} AI</h4>
            <p className="text-sm text-gray-400 max-w-xs mb-6">{t('dashMagicTrimDesc')}</p>
            <span className="text-cc-orange text-sm font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
              {t('dashStartTrimming')} <ArrowUpRight size={16} />
            </span>
          </div>
          <div className="w-24 h-24 bg-cc-bg rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
            <Wand2 size={40} className="text-cc-orange" />
          </div>
        </div>
        
        <div className="bg-cc-surface border border-cc-surface-hover rounded-xl p-6 flex items-center justify-between group cursor-pointer hover:border-cc-green transition-colors" onClick={() => onNavigate('upload')}>
          <div>
            <h4 className="text-2xl font-bebas text-white mb-2">{t('dashDynamicCaptions')}</h4>
            <p className="text-sm text-gray-400 max-w-xs mb-6">{t('dashAutoSubtitlesDesc')}</p>
            <span className="text-cc-green text-sm font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
              {t('dashGenerateNow')} <ArrowUpRight size={16} />
            </span>
          </div>
          <div className="w-24 h-24 bg-cc-bg rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
            <Subtitles size={40} className="text-cc-green" />
          </div>
        </div>
      </div>

      {/* Footer Status */}
      <div className="mt-12 pt-6 border-t border-cc-surface-hover flex items-center justify-between text-[10px] font-mono text-gray-600 uppercase">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cc-green"></span> {t('dashSystemStatus')}</span>
          <span>V2.4.0-STABLE</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{t('dashGpuActive')}</span>
          <span>{t('dashCloudSync')}</span>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, sub, icon }: any) {
  return (
    <div className="bg-cc-surface border border-cc-surface-hover rounded-xl p-6 relative overflow-hidden">
      <div className="absolute -right-4 -bottom-4">{icon}</div>
      <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2">{title}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bebas text-white">{value}</span>
        {trend && <span className="text-xs text-cc-green font-mono">{trend}</span>}
        {sub && <span className="text-xs text-gray-500 font-mono">{sub}</span>}
      </div>
    </div>
  );
}

function ProjectCard({ title, duration, status, statusColor, time, onClick }: any) {
  return (
    <div 
      className="bg-cc-surface border border-cc-surface-hover rounded-xl overflow-hidden cursor-pointer hover:border-gray-600 transition-colors group"
      onClick={onClick}
    >
      <div className="h-32 bg-cc-bg relative flex items-center justify-center group-hover:bg-[#1a1a1f] transition-colors">
        <Play size={32} className="text-white opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-white">
          {duration}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-4">
          <h4 className="text-sm font-medium text-white truncate pr-4">{title}</h4>
          <button className="text-gray-500 hover:text-white"><MoreVertical size={16} /></button>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono uppercase">
          <span className={`flex items-center gap-1.5 ${statusColor}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            {status}
          </span>
          <span className="text-gray-600">{time}</span>
        </div>
      </div>
    </div>
  );
}
