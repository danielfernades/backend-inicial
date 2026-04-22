import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Dashboard } from './screens/Dashboard';
import { UploadConfig } from './screens/UploadConfig';
import { Processing } from './screens/Processing';
import { Editor } from './screens/Editor';
import { Export } from './screens/Export';
import { Settings } from './screens/Settings';
import { Projects } from './screens/Projects';
import { AuthScreen } from './screens/AuthScreen';
import { PricingScreen } from './screens/PricingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { LanguageProvider } from './lib/LanguageContext';

export type Screen = 'dashboard' | 'upload' | 'processing' | 'editor' | 'export' | 'settings' | 'projects' | 'auth' | 'pricing' | 'home';

export interface Cut {
  id: string;
  type: 'Silence Removal' | 'AI Recommendation' | 'Manual Cut' | 'Corte Manual' | 'Vício de Linguagem' | 'Repetição';
  start: number;
  end: number;
  active: boolean;
}

export interface Subtitle {
  id: string;
  start: number;
  end: number;
  text: string;
}

export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  textColor: string;
  backgroundColor: string;
  outlineShadow: string;
  preset?: 'standard' | 'neon' | 'elegant';
  animation?: 'none' | 'fade' | 'pop' | 'slide';
}

export interface TextOverlay {
  id: string;
  start: number;
  end: number;
  text: string;
  style: SubtitleStyle;
  isHighlight?: boolean;
}

export type CutStyle = 'standard' | 'safe' | 'vlog';

export interface ProjectData {
  file: File | null;
  url: string | null;
  duration: number;
  name: string;
  cuts: Cut[];
  subtitles: Subtitle[];
  textOverlays: TextOverlay[];
  showSubtitles?: boolean;
  showHighlights?: boolean;
  subtitleStyle?: SubtitleStyle;
  settings: {
    silenceThreshold: number;
    minSilenceLen: number;
    cutStyle: CutStyle;
  };
}

function MainApp() {
  const { user, isLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [project, setProject] = useState<ProjectData>({
    file: null,
    url: null,
    duration: 0,
    name: '',
    cuts: [],
    subtitles: [],
    textOverlays: [],
    showSubtitles: true,
    showHighlights: true,
    subtitleStyle: {
      fontFamily: 'Inter, sans-serif',
      fontSize: 24,
      textColor: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      outlineShadow: '0 2px 10px rgba(0,0,0,0.8)'
    },
    settings: {
      silenceThreshold: 45,
      minSilenceLen: 0.3,
      cutStyle: 'vlog'
    }
  });

  useEffect(() => {
    if (!isLoading) {
      if (user && (currentScreen === 'home' || currentScreen === 'auth')) {
        setCurrentScreen('dashboard');
      } else if (!user && !['auth', 'pricing', 'home'].includes(currentScreen)) {
        setCurrentScreen('home');
      }
    }
  }, [user, isLoading, currentScreen]);

  // Handle Stripe redirect success
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('session_id')) {
      // Clear URL
      window.history.replaceState({}, document.title, "/");
      setCurrentScreen('dashboard');
    }
  }, []);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-cc-bg text-white font-bebas text-2xl">LOADING...</div>;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home': return <HomeScreen onNavigate={setCurrentScreen} />;
      case 'auth': return <AuthScreen onNavigate={setCurrentScreen} />;
      case 'pricing': return <PricingScreen onNavigate={setCurrentScreen} />;
      case 'dashboard': return <Dashboard onNavigate={setCurrentScreen} project={project} />;
      case 'upload': return <UploadConfig onNavigate={setCurrentScreen} project={project} setProject={setProject} />;
      case 'processing': return <Processing onNavigate={setCurrentScreen} project={project} setProject={setProject} />;
      case 'editor': return <Editor onNavigate={setCurrentScreen} project={project} setProject={setProject} />;
      case 'export': return <Export onNavigate={setCurrentScreen} project={project} />;
      case 'settings': return <Settings />;
      case 'projects': return <Projects onNavigate={setCurrentScreen} />;
      default: return <Dashboard onNavigate={setCurrentScreen} project={project} />;
    }
  };

  if (currentScreen === 'home' || currentScreen === 'auth' || currentScreen === 'pricing') {
    return renderScreen();
  }

  return (
    <div className="flex h-screen w-full bg-cc-bg scanlines overflow-hidden">
      <Sidebar currentScreen={currentScreen} onNavigate={setCurrentScreen} />
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Topbar currentScreen={currentScreen} onNavigate={setCurrentScreen} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {renderScreen()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </LanguageProvider>
  );
}
