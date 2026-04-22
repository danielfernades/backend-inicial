import React from 'react';
import { Screen } from '../App';
import { useLanguage } from '../lib/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-background text-on-surface sora selection:bg-primary selection:text-on-primary overflow-x-hidden min-h-screen overflow-y-auto">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full flex justify-between items-center px-6 py-4 max-w-[1920px] mx-auto bg-[#0e0e10]/80 backdrop-blur-xl z-50 border-b border-[#ffffff]/10">
        <div className="text-2xl font-black uppercase tracking-tighter text-[#FF5C00] bebas">ZOOMCUTS_AI</div>
        <nav className="hidden md:flex items-center gap-8">
          <a className="text-[#FF5C00] font-bold border-b-2 border-[#FF5C00] pb-1 uppercase bebas tracking-tight hover:text-white transition-colors duration-150" href="#">{t('homeFeatures')}</a>
          <button onClick={() => onNavigate('pricing')} className="text-[#a1a1aa] font-medium uppercase bebas tracking-tight hover:text-white transition-colors duration-150">{t('homePricing')}</button>
          <a className="text-[#a1a1aa] font-medium uppercase bebas tracking-tight hover:text-white transition-colors duration-150" href="#">{t('homeAbout')}</a>
        </nav>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <button 
            onClick={() => onNavigate('auth')}
            className="bg-primary text-on-primary px-6 py-2 bebas text-lg tracking-wide rounded-lg scale-95 active:duration-75 hover:opacity-90 transition-all"
          >
            {t('startNow')}
          </button>
        </div>
      </header>

      <main className="pt-24">
        {/* Hero Section */}
        <section className="relative min-h-[921px] flex flex-col items-center justify-center px-6 bg-grid-blueprint">
          <div className="absolute inset-0 bg-radial-gradient from-primary/5 to-transparent pointer-events-none"></div>
          <div className="max-w-6xl w-full text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high border border-outline-variant/30 mb-8">
              <span className="w-2 h-2 bg-secondary rounded-full animate-pulse"></span>
              <span className="mono text-[10px] uppercase tracking-widest text-on-surface-variant">System Status: Optimal Engine Running</span>
            </div>
            <h1 className="bebas text-7xl md:text-9xl leading-[0.9] tracking-tight mb-6">
              {t('homeTitle1')} <span className="text-primary">{t('homeTitle2')}</span>.<br/>
              {t('homeTitle3')}
            </h1>
            <p className="sora text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              {t('homeSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
              <button 
                onClick={() => onNavigate('auth')}
                className="bg-primary text-on-primary px-10 py-4 bebas text-2xl tracking-wider rounded-lg shadow-[0_0_20px_rgba(255,144,100,0.3)] hover:shadow-[0_0_30px_rgba(255,144,100,0.5)] transition-all active:scale-95"
              >
                {t('startFree')}
              </button>
              <button className="border border-outline-variant text-on-surface px-10 py-4 bebas text-2xl tracking-wider rounded-lg hover:bg-surface-bright transition-all active:scale-95">
                {t('homeDemo')}
              </button>
            </div>

            {/* Editor Mockup */}
            <div className="relative w-full max-w-5xl mx-auto rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-2xl">
              <div className="h-8 bg-surface-container-high flex items-center px-4 gap-2 border-b border-outline-variant/20">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-error/40"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/40"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary/40"></div>
                </div>
                <div className="mx-auto mono text-[10px] text-on-tertiary tracking-widest uppercase">ZOOMCUTS_V08_PROCESSING.RAW</div>
              </div>
              <div className="aspect-video relative group">
                <img 
                  className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700" 
                  alt="Modern dark UI video editing software interface" 
                  src="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=2070&auto=format&fit=crop"
                  referrerPolicy="no-referrer"
                />
                {/* Timeline Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-surface-container-low/90 backdrop-blur-md border-t border-outline-variant/30 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="mono text-[10px] text-secondary">AUDIO_LEVELS: -12DB</span>
                    <span className="mono text-[10px] text-primary">PLAYHEAD: 00:42:12:04</span>
                  </div>
                  <div className="relative h-12 bg-black rounded border border-outline-variant/10 flex items-center overflow-hidden">
                    {/* AI Waveform Visualization */}
                    <div className="absolute inset-0 flex items-center justify-around px-4 opacity-50">
                      <div className="w-1 h-8 bg-secondary"></div>
                      <div className="w-1 h-4 bg-secondary"></div>
                      <div className="w-1 h-10 bg-secondary"></div>
                      <div className="w-1 h-2 bg-secondary/20"></div>
                      <div className="w-1 h-6 bg-secondary"></div>
                      <div className="w-1 h-12 bg-secondary"></div>
                      <div className="w-1 h-2 bg-secondary/20"></div>
                      <div className="w-1 h-9 bg-secondary"></div>
                      <div className="w-1 h-4 bg-secondary"></div>
                      <div className="w-1 h-10 bg-secondary"></div>
                    </div>
                    <div className="absolute left-1/3 top-0 bottom-0 w-0.5 bg-primary shadow-[0_0_10px_#ff9064] z-10"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* "O Que Fazemos" - Bento Grid Features */}
        <section className="py-32 px-6 max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="bebas text-5xl tracking-tight text-on-surface mb-4">{t('homeFeaturesTitle1')} <span className="text-secondary">{t('homeFeaturesTitle2')}</span></h2>
            <div className="w-24 h-1 bg-secondary"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Feature 1 */}
            <div className="md:col-span-2 bg-surface-container-low p-8 rounded-lg border border-outline-variant/10 hover:border-primary/50 transition-colors group">
              <div className="flex justify-between items-start mb-12">
                <span className="material-symbols-outlined text-primary text-4xl">cut</span>
                <span className="mono text-[10px] text-on-surface-variant">MOD_01</span>
              </div>
              <h3 className="mono text-xl font-bold mb-3 text-on-surface">{t('homeFeature1Title')}</h3>
              <p className="sora text-sm text-on-surface-variant leading-relaxed">{t('homeFeature1Desc')}</p>
            </div>
            {/* Feature 2 */}
            <div className="bg-surface-container-high p-8 rounded-lg border border-outline-variant/10 hover:border-secondary/50 transition-colors group">
              <div className="flex justify-between items-start mb-12">
                <span className="material-symbols-outlined text-secondary text-4xl">psychology</span>
                <span className="mono text-[10px] text-on-surface-variant">MOD_02</span>
              </div>
              <h3 className="mono text-lg font-bold mb-3 text-on-surface">{t('homeFeature2Title')}</h3>
              <p className="sora text-xs text-on-surface-variant leading-relaxed">{t('homeFeature2Desc')}</p>
            </div>
            {/* Feature 3 */}
            <div className="bg-surface-container-high p-8 rounded-lg border border-outline-variant/10 hover:border-secondary/50 transition-colors group">
              <div className="flex justify-between items-start mb-12">
                <span className="material-symbols-outlined text-secondary text-4xl">subtitles</span>
                <span className="mono text-[10px] text-on-surface-variant">MOD_03</span>
              </div>
              <h3 className="mono text-lg font-bold mb-3 text-on-surface">{t('homeFeature3Title')}</h3>
              <p className="sora text-xs text-on-surface-variant leading-relaxed">{t('homeFeature3Desc')}</p>
            </div>
            {/* Feature 4 */}
            <div className="md:col-span-4 bg-surface-container-lowest p-8 rounded-lg border border-primary/20 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1 bg-primary text-on-primary mono text-[10px] bebas tracking-widest">{t('homeFeature4Badge')}</div>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <span className="material-symbols-outlined text-primary text-4xl">auto_awesome_motion</span>
                  <h3 className="mono text-2xl font-bold text-on-surface">{t('homeFeature4Title')}</h3>
                </div>
                <p className="sora text-on-surface-variant leading-relaxed max-w-xl">{t('homeFeature4Desc')}</p>
              </div>
              <div className="w-full md:w-1/3 aspect-video bg-surface-container-high rounded border border-outline-variant/20 flex items-center justify-center">
                <span className="mono text-[10px] text-on-tertiary animate-pulse uppercase">AI_GENERATING_METADATA...</span>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic System Flow */}
        <section className="py-32 bg-surface-container-low border-y border-outline-variant/10">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="bebas text-5xl tracking-tight mb-20 uppercase">{t('homeFlowTitle1')} <span className="text-primary">{t('homeFlowTitle2')}</span></h2>
            <div className="relative flex flex-col md:flex-row justify-between items-center gap-12">
              {/* Progress Line */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-[2px] bg-outline-variant/20 -translate-y-1/2 z-0"></div>
              
              {/* Step 1 */}
              <div className="relative z-10 flex flex-col items-center group">
                <div className="w-16 h-16 bg-surface-container-lowest border-2 border-primary rounded-lg flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,144,100,0.2)] group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-primary">upload_file</span>
                </div>
                <span className="mono text-[10px] text-primary mb-2">STEP_01</span>
                <h4 className="mono text-lg font-bold text-on-surface">{t('homeFlowStep1')}</h4>
              </div>
              
              {/* Step 2 */}
              <div className="relative z-10 flex flex-col items-center group">
                <div className="w-16 h-16 bg-surface-container-lowest border-2 border-secondary rounded-lg flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(0,253,135,0.2)] group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-secondary">analytics</span>
                </div>
                <span className="mono text-[10px] text-secondary mb-2">STEP_02</span>
                <h4 className="mono text-lg font-bold text-on-surface">{t('homeFlowStep2')}</h4>
              </div>
              
              {/* Step 3 */}
              <div className="relative z-10 flex flex-col items-center group">
                <div className="w-16 h-16 bg-surface-container-lowest border-2 border-on-surface/40 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-on-surface">rate_review</span>
                </div>
                <span className="mono text-[10px] text-on-surface-variant mb-2">STEP_03</span>
                <h4 className="mono text-lg font-bold text-on-surface">{t('homeFlowStep3')}</h4>
              </div>
              
              {/* Step 4 */}
              <div className="relative z-10 flex flex-col items-center group">
                <div className="w-16 h-16 bg-secondary text-on-secondary rounded-lg flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,253,135,0.4)] group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">download</span>
                </div>
                <span className="mono text-[10px] text-secondary mb-2">STEP_04</span>
                <h4 className="mono text-lg font-bold text-on-surface">{t('homeFlowStep4')}</h4>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof / Metrics */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-high p-8 border-l-4 border-primary">
                <div className="bebas text-6xl text-primary mb-2">24H</div>
                <div className="mono text-xs uppercase tracking-tighter text-on-surface-variant">{t('homeMetricsSaved')}</div>
              </div>
              <div className="bg-surface-container-high p-8 border-l-4 border-secondary">
                <div className="bebas text-6xl text-secondary mb-2">1.2K</div>
                <div className="mono text-xs uppercase tracking-tighter text-on-surface-variant">{t('homeMetricsCuts')}</div>
              </div>
              <div className="bg-surface-container-high p-8 border-l-4 border-on-surface/20">
                <div className="bebas text-6xl text-on-surface mb-2">99%</div>
                <div className="mono text-xs uppercase tracking-tighter text-on-surface-variant">{t('homeMetricsAccuracy')}</div>
              </div>
              <div className="bg-surface-container-high p-8 border-l-4 border-on-surface/20">
                <div className="bebas text-6xl text-on-surface mb-2">500+</div>
                <div className="mono text-xs uppercase tracking-tighter text-on-surface-variant">{t('homeMetricsChannels')}</div>
              </div>
            </div>
            <div className="space-y-6">
              <h2 className="bebas text-6xl leading-[0.95] text-on-surface">{t('homeMetricsTitle1')}<br/>{t('homeMetricsTitle2')}</h2>
              <p className="sora text-on-surface-variant text-lg leading-relaxed">
                {t('homeMetricsDesc')}
              </p>
              <div className="pt-4">
                <button 
                  onClick={() => onNavigate('auth')}
                  className="bg-secondary text-on-secondary px-8 py-3 bebas text-xl tracking-wider rounded-lg hover:opacity-90 active:scale-95 transition-all"
                >
                  {t('homeMetricsCTA')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section className="py-24 bg-surface-container-lowest border-y border-outline-variant/10 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
            <h2 className="bebas text-4xl tracking-tight text-on-surface mb-4">{t('homeIntegrationsTitle1')} <span className="text-primary">{t('homeIntegrationsTitle2')}</span></h2>
            <p className="sora text-on-surface-variant max-w-2xl mx-auto">{t('homeIntegrationsDesc')}</p>
          </div>
          
          {/* Infinite Scroll Marquee */}
          <div className="relative w-full flex overflow-x-hidden">
            <div className="animate-marquee whitespace-nowrap flex items-center gap-16 py-4">
              {/* Duplicate items for infinite effect */}
              {[...Array(2)].map((_, i) => (
                <React.Fragment key={i}>
                  <div className="flex items-center gap-4 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
                    <span className="material-symbols-outlined text-4xl">play_circle</span>
                    <span className="bebas text-2xl tracking-wider">YOUTUBE</span>
                  </div>
                  <div className="flex items-center gap-4 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
                    <span className="material-symbols-outlined text-4xl">smartphone</span>
                    <span className="bebas text-2xl tracking-wider">TIKTOK</span>
                  </div>
                  <div className="flex items-center gap-4 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
                    <span className="material-symbols-outlined text-4xl">photo_camera</span>
                    <span className="bebas text-2xl tracking-wider">INSTAGRAM</span>
                  </div>
                  <div className="flex items-center gap-4 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
                    <span className="material-symbols-outlined text-4xl">movie</span>
                    <span className="bebas text-2xl tracking-wider">PREMIERE PRO (XML)</span>
                  </div>
                  <div className="flex items-center gap-4 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
                    <span className="material-symbols-outlined text-4xl">video_camera_back</span>
                    <span className="bebas text-2xl tracking-wider">DAVINCI RESOLVE</span>
                  </div>
                  <div className="flex items-center gap-4 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
                    <span className="material-symbols-outlined text-4xl">cut</span>
                    <span className="bebas text-2xl tracking-wider">FINAL CUT PRO</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-32 px-6 max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="bebas text-5xl tracking-tight text-on-surface mb-4">{t('homeTestimonialsTitle1')} <span className="text-secondary">{t('homeTestimonialsTitle2')}</span> {t('homeTestimonialsTitle3')}</h2>
            <div className="w-24 h-1 bg-secondary mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-high p-8 rounded-lg border border-outline-variant/10 relative">
              <span className="material-symbols-outlined absolute top-6 right-6 text-primary/20 text-6xl">format_quote</span>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant">person</span>
                </div>
                <div>
                  <h4 className="font-bold text-on-surface">Lucas M.</h4>
                  <p className="mono text-[10px] text-primary">Tech Vlogger • 500k Subs</p>
                </div>
              </div>
              <p className="sora text-sm text-on-surface-variant leading-relaxed">{t('homeTestimonial1')}</p>
            </div>
            
            <div className="bg-surface-container-high p-8 rounded-lg border border-outline-variant/10 relative">
              <span className="material-symbols-outlined absolute top-6 right-6 text-secondary/20 text-6xl">format_quote</span>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant">person</span>
                </div>
                <div>
                  <h4 className="font-bold text-on-surface">Sarah K.</h4>
                  <p className="mono text-[10px] text-secondary">Podcast Host</p>
                </div>
              </div>
              <p className="sora text-sm text-on-surface-variant leading-relaxed">{t('homeTestimonial2')}</p>
            </div>
            
            <div className="bg-surface-container-high p-8 rounded-lg border border-outline-variant/10 relative">
              <span className="material-symbols-outlined absolute top-6 right-6 text-primary/20 text-6xl">format_quote</span>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant">person</span>
                </div>
                <div>
                  <h4 className="font-bold text-on-surface">Thiago R.</h4>
                  <p className="mono text-[10px] text-primary">Educador Financeiro</p>
                </div>
              </div>
              <p className="sora text-sm text-on-surface-variant leading-relaxed">{t('homeTestimonial3')}</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-32 px-6 bg-surface-container-low border-t border-outline-variant/10">
          <div className="max-w-4xl mx-auto">
            <div className="mb-16 text-center">
              <h2 className="bebas text-5xl tracking-tight text-on-surface mb-4">{t('homeFaqTitle1')} <span className="text-primary">{t('homeFaqTitle2')}</span></h2>
              <p className="sora text-on-surface-variant">{t('homeFaqDesc')}</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-surface-container-high p-6 rounded-lg border border-outline-variant/10">
                <h3 className="mono text-lg font-bold text-on-surface mb-2 flex items-center justify-between">
                  {t('homeFaqQ1')}
                  <span className="material-symbols-outlined text-primary">add</span>
                </h3>
                <p className="sora text-sm text-on-surface-variant">{t('homeFaqA1')}</p>
              </div>
              
              <div className="bg-surface-container-high p-6 rounded-lg border border-outline-variant/10">
                <h3 className="mono text-lg font-bold text-on-surface mb-2 flex items-center justify-between">
                  {t('homeFaqQ2')}
                  <span className="material-symbols-outlined text-primary">add</span>
                </h3>
                <p className="sora text-sm text-on-surface-variant">{t('homeFaqA2')}</p>
              </div>
              
              <div className="bg-surface-container-high p-6 rounded-lg border border-outline-variant/10">
                <h3 className="mono text-lg font-bold text-on-surface mb-2 flex items-center justify-between">
                  {t('homeFaqQ3')}
                  <span className="material-symbols-outlined text-primary">add</span>
                </h3>
                <p className="sora text-sm text-on-surface-variant">{t('homeFaqA3')}</p>
              </div>
              
              <div className="bg-surface-container-high p-6 rounded-lg border border-outline-variant/10">
                <h3 className="mono text-lg font-bold text-on-surface mb-2 flex items-center justify-between">
                  {t('homeFaqQ4')}
                  <span className="material-symbols-outlined text-primary">add</span>
                </h3>
                <p className="sora text-sm text-on-surface-variant">{t('homeFaqA4')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section on Home */}
        <section className="py-32 px-6 max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="bebas text-5xl tracking-tight text-on-surface mb-4">{t('homePricingTitle1')} <span className="text-secondary">{t('homePricingTitle2')}</span></h2>
            <div className="w-24 h-1 bg-secondary mx-auto mb-6"></div>
            <p className="sora text-on-surface-variant max-w-2xl mx-auto">{t('homePricingDesc')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="bg-surface-container-low p-8 rounded-xl border border-outline-variant/10 flex flex-col">
              <h3 className="font-bebas text-2xl text-white mb-2">STARTER</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bebas text-white">$0</span>
                <span className="text-sm text-gray-500 font-mono">{t('pricingMonth')}</span>
              </div>
              <p className="text-sm text-gray-400 mb-8 flex-1">{t('homePricingFreeDesc')}</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-300"><span className="material-symbols-outlined text-cc-green text-sm">check</span> {t('homePricingFreeFeat1')}</li>
                <li className="flex items-center gap-3 text-sm text-gray-300"><span className="material-symbols-outlined text-cc-green text-sm">check</span> {t('homePricingFreeFeat2')}</li>
                <li className="flex items-center gap-3 text-sm text-gray-300"><span className="material-symbols-outlined text-cc-green text-sm">check</span> {t('homePricingFreeFeat3')}</li>
                <li className="flex items-center gap-3 text-sm text-gray-500"><span className="material-symbols-outlined text-sm">close</span> {t('homePricingFreeFeat4')}</li>
              </ul>
              <button onClick={() => onNavigate('auth')} className="w-full py-3 rounded bg-surface-container-high text-white font-bebas tracking-wider hover:bg-surface-container-highest transition-colors">{t('homePricingFreeBtn')}</button>
            </div>

            {/* Pro Tier */}
            <div className="bg-surface-container-high p-8 rounded-xl border-2 border-cc-orange flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-cc-orange/10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cc-orange text-white px-4 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest">{t('homePricingProBadge')}</div>
              <h3 className="font-bebas text-2xl text-cc-orange mb-2">CREATOR PRO</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bebas text-white">$19</span>
                <span className="text-sm text-gray-500 font-mono">{t('pricingMonth')}</span>
              </div>
              <p className="text-sm text-gray-400 mb-8 flex-1">{t('homePricingProDesc')}</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-300"><span className="material-symbols-outlined text-cc-orange text-sm">check</span> {t('homePricingProFeat1')}</li>
                <li className="flex items-center gap-3 text-sm text-gray-300"><span className="material-symbols-outlined text-cc-orange text-sm">check</span> {t('homePricingProFeat2')}</li>
                <li className="flex items-center gap-3 text-sm text-gray-300"><span className="material-symbols-outlined text-cc-orange text-sm">check</span> {t('homePricingProFeat3')}</li>
                <li className="flex items-center gap-3 text-sm text-gray-300"><span className="material-symbols-outlined text-cc-orange text-sm">check</span> {t('homePricingProFeat4')}</li>
                <li className="flex items-center gap-3 text-sm text-gray-300"><span className="material-symbols-outlined text-cc-orange text-sm">check</span> {t('homePricingProFeat5')}</li>
              </ul>
              <button onClick={() => onNavigate('pricing')} className="w-full py-3 rounded bg-cc-orange text-white font-bebas tracking-wider hover:bg-cc-orange-hover transition-colors">{t('homePricingProBtn')}</button>
            </div>

            {/* Studio Tier */}
            <div className="bg-surface-container-low p-8 rounded-xl border border-outline-variant/10 flex flex-col">
              <h3 className="font-bebas text-2xl text-white mb-2">STUDIO</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bebas text-white">$49</span>
                <span className="text-sm text-gray-500 font-mono">{t('pricingMonth')}</span>
              </div>
              <p className="text-sm text-gray-400 mb-8 flex-1">{t('homePricingStudioDesc')}</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-300"><span className="material-symbols-outlined text-cc-green text-sm">check</span> {t('homePricingStudioFeat1')}</li>
                <li className="flex items-center gap-3 text-sm text-gray-300"><span className="material-symbols-outlined text-cc-green text-sm">check</span> {t('homePricingStudioFeat2')}</li>
                <li className="flex items-center gap-3 text-sm text-gray-300"><span className="material-symbols-outlined text-cc-green text-sm">check</span> {t('homePricingStudioFeat3')}</li>
                <li className="flex items-center gap-3 text-sm text-gray-300"><span className="material-symbols-outlined text-cc-green text-sm">check</span> {t('homePricingStudioFeat4')}</li>
              </ul>
              <button onClick={() => onNavigate('pricing')} className="w-full py-3 rounded bg-surface-container-high text-white font-bebas tracking-wider hover:bg-surface-container-highest transition-colors">{t('homePricingStudioBtn')}</button>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-6">
          <div className="max-w-5xl mx-auto bg-primary p-1 rounded-lg">
            <div className="bg-black p-12 md:p-20 text-center rounded-lg relative overflow-hidden">
              {/* Blueprint detail in background */}
              <div className="absolute inset-0 bg-grid-blueprint opacity-20 pointer-events-none"></div>
              <h2 className="bebas text-6xl md:text-8xl text-white mb-8 relative z-10">{t('homeCtaTitle1')} <span className="text-primary">{t('homeCtaTitle2')}</span></h2>
              <p className="sora text-on-surface-variant max-w-xl mx-auto mb-12 relative z-10">{t('homeCtaDesc')}</p>
              <button 
                onClick={() => onNavigate('auth')}
                className="relative z-10 bg-primary text-on-primary px-12 py-5 bebas text-3xl tracking-widest rounded-lg shadow-[0_0_40px_rgba(255,144,100,0.4)] hover:scale-105 transition-all"
              >
                {t('homeCtaBtn')}
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-8 flex flex-col md:flex-row justify-between items-center gap-6 bg-[#000000] border-t border-[#ffffff]/5">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="text-lg font-black text-white bebas tracking-tighter uppercase">ZOOMCUTS_AI</div>
          <div className="mono text-[10px] uppercase tracking-widest text-[#52525b]">© 2024 ZOOMCUTS_AI. KINETIC BLUEPRINT EST.</div>
        </div>
        <nav className="flex gap-8">
          <a className="mono text-[10px] uppercase tracking-widest text-[#52525b] hover:text-[#FF5C00] transition-all duration-200" href="#">{t('footerTerms')}</a>
          <a className="mono text-[10px] uppercase tracking-widest text-[#52525b] hover:text-[#FF5C00] transition-all duration-200" href="#">{t('footerPrivacy')}</a>
          <a className="mono text-[10px] uppercase tracking-widest text-[#52525b] hover:text-[#FF5C00] transition-all duration-200" href="#">{t('footerApi')}</a>
          <a className="mono text-[10px] uppercase tracking-widest text-[#52525b] hover:text-[#FF5C00] transition-all duration-200" href="#">{t('footerStatus')}</a>
          <a className="mono text-[10px] uppercase tracking-widest text-[#52525b] hover:text-[#FF5C00] transition-all duration-200" href="#">{t('footerSupport')}</a>
        </nav>
        <div className="flex gap-4">
          <span className="material-symbols-outlined text-[#52525b] cursor-pointer hover:text-white">share</span>
          <span className="material-symbols-outlined text-[#52525b] cursor-pointer hover:text-white">terminal</span>
        </div>
      </footer>
    </div>
  );
}
