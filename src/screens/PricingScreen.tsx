import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { Screen } from '../App';
import { Check, Zap, ArrowLeft } from 'lucide-react';
import { LanguageSelector } from '../components/LanguageSelector';

interface PricingScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function PricingScreen({ onNavigate }: PricingScreenProps) {
  const { token, user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async () => {
    if (!token) {
      onNavigate('auth');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cc-bg p-8">
      <div className="flex justify-between items-center mb-12">
        <button 
          onClick={() => onNavigate(user ? 'dashboard' : 'home')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-mono text-sm uppercase">{t('back')}</span>
        </button>
        <LanguageSelector />
      </div>

      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-5xl font-bebas text-white mb-4">{t('pricingTitle')}</h2>
        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
          {t('pricingSubtitle')}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-8 inline-block">
            {error}
          </div>
        )}

        <div className="bg-cc-surface border-2 border-cc-orange rounded-3xl p-8 max-w-md mx-auto relative shadow-2xl shadow-cc-orange/10">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cc-orange text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
            <Zap size={14} /> {t('pricingMostPopular')}
          </div>
          
          <h3 className="text-3xl font-bebas text-white mb-2">{t('pricingProPlan')}</h3>
          <div className="flex items-baseline justify-center gap-1 mb-8">
            <span className="text-5xl font-bold text-white">$19</span>
            <span className="text-gray-400">{t('pricingMonth')}</span>
          </div>

          <ul className="space-y-4 text-left mb-8">
            {[
              t('pricingFeat1'),
              t('pricingFeat2'),
              t('pricingFeat3'),
              t('pricingFeat4'),
              t('pricingFeat5'),
              t('pricingFeat6')
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-300">
                <div className="w-5 h-5 rounded-full bg-cc-green/20 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-cc-green" />
                </div>
                {feature}
              </li>
            ))}
          </ul>

          <button
            onClick={handleSubscribe}
            disabled={loading || user?.subscription_status === 'active'}
            className="w-full bg-cc-orange hover:bg-cc-orange-hover text-white font-bebas text-2xl py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
          >
            {loading ? t('pricingProcessing') : 
             user?.subscription_status === 'active' ? t('pricingCurrentPlan') : 
             t('pricingSubscribe')}
          </button>
        </div>
      </div>
    </div>
  );
}
