import { useState, useEffect } from 'react';
import { Screen } from '../App';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../lib/AuthContext';
import { Search, Filter, Clock, MoreVertical, Play } from 'lucide-react';

interface ProjectsProps {
  onNavigate: (screen: Screen) => void;
}

interface Project {
  id: number;
  name: string;
  duration: string;
  status: string;
  created_at: string;
}

export function Projects({ onNavigate }: ProjectsProps) {
  const { t, language } = useLanguage();
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  useEffect(() => {
    fetchProjects();
  }, [token]);

  const fetchProjects = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return a.name.localeCompare(b.name);
      }
    });

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bebas text-white mb-2">{t('navProjects')}</h1>
          <p className="text-gray-400">{t('projManage')}</p>
        </div>
        <button 
          onClick={() => onNavigate('upload')}
          className="bg-cc-orange hover:bg-cc-orange/90 text-white font-bebas tracking-wide px-6 py-2 rounded transition-colors"
        >
          {t('projNew')}
        </button>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder={t('projSearch')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-cc-surface border border-cc-surface-hover rounded-md py-2 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cc-orange transition-colors"
          />
        </div>
        
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
            className="appearance-none bg-cc-surface border border-cc-surface-hover rounded-md py-2 pl-10 pr-8 text-sm text-white focus:outline-none focus:border-cc-orange transition-colors cursor-pointer"
          >
            <option value="date">{t('projNewest')}</option>
            <option value="name">{t('projNameAZ')}</option>
          </select>
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">
          {t('projLoading')}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-cc-surface border border-cc-surface-hover rounded-xl">
          <p className="text-gray-400 mb-4">
            {searchQuery 
              ? t('projNotFound')
              : t('projEmpty')}
          </p>
          {!searchQuery && (
            <button 
              onClick={() => onNavigate('upload')}
              className="text-cc-orange hover:text-white transition-colors"
            >
              {t('projCreateFirst')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <div key={project.id} className="bg-cc-surface border border-cc-surface-hover rounded-xl overflow-hidden group hover:border-cc-orange transition-colors">
              <div className="aspect-video bg-cc-bg relative flex items-center justify-center">
                <Play size={32} className="text-gray-600 group-hover:text-cc-orange transition-colors" />
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-mono text-white">
                  {project.duration}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-medium truncate pr-4">{project.name}</h3>
                  <button className="text-gray-500 hover:text-white transition-colors">
                    <MoreVertical size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(project.created_at).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US')}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full ${
                    project.status === 'COMPLETED' || project.status === 'CONCLUÍDO' 
                      ? 'bg-cc-green/20 text-cc-green' 
                      : 'bg-gray-800 text-gray-400'
                  }`}>
                    {project.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
