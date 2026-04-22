import { LayoutDashboard, PlusSquare, History, Settings, Download, Zap, User, LogOut } from 'lucide-react';
import { Screen } from '../App';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';

interface SidebarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function Sidebar({ currentScreen, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const navItems = [
    { id: 'dashboard', label: t('navDashboard'), icon: LayoutDashboard },
    { id: 'upload', label: t('dashNewProject'), icon: PlusSquare },
    { id: 'projects', label: t('navProjects'), icon: History },
    { id: 'export', label: t('editorExport'), icon: Download },
    { id: 'settings', label: t('navSettings'), icon: Settings },
  ] as const;

  return (
    <aside className="w-64 bg-cc-bg border-r border-cc-surface-hover flex flex-col h-full relative z-20">
      <div className="p-6">
        <h1 className="text-3xl text-cc-orange flex items-center gap-2">
          ZOOM<span className="text-white">CUTS</span>
          <span className="text-xs bg-cc-green/20 text-cc-green px-1.5 py-0.5 rounded font-mono ml-1">AI</span>
        </h1>
        <p className="text-[10px] text-gray-500 font-mono tracking-widest mt-1 uppercase">Vlog Editor</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id || 
            (item.id === 'upload' && currentScreen === 'processing'); // Keep new project active during processing
            
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as Screen)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium",
                isActive 
                  ? "bg-cc-surface text-cc-orange border-l-2 border-cc-orange" 
                  : "text-gray-400 hover:bg-cc-surface hover:text-gray-200 border-l-2 border-transparent"
              )}
            >
              <Icon size={18} className={cn(isActive ? "text-cc-orange" : "text-gray-500")} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        {user?.subscription_status !== 'active' && (
          <div className="bg-cc-surface rounded-xl p-4 border border-cc-surface-hover relative overflow-hidden group mb-4">
            <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
              <Zap size={48} className="text-cc-orange" />
            </div>
            <p className="text-xs text-gray-400 mb-3 relative z-10">{t('sidePowerUp')}</p>
            <button 
              onClick={() => onNavigate('pricing')}
              className="w-full bg-cc-orange hover:bg-cc-orange-hover text-white font-bebas tracking-wide py-2 rounded transition-colors relative z-10"
            >
              {t('topUpgrade')}
            </button>
          </div>
        )}
        
        <div className="flex items-center justify-between px-2 py-2 hover:bg-cc-surface rounded-lg transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-cc-surface-hover flex items-center justify-center text-gray-400">
              <User size={16} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm text-white font-medium truncate w-28">{user?.name || user?.email?.split('@')[0]}</p>
              <p className="text-[10px] text-gray-500 font-mono uppercase">
                {user?.subscription_status === 'active' ? t('sideProPlan') : t('sideFreePlan')}
              </p>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            title={t('navLogout')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
