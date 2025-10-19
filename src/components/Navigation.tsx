import React from 'react';
import { Home, BookOpen, Target, Users, Zap, Sparkles, Coins, Crown } from 'lucide-react';

type ScreenType = 'onboarding'|'signup'|'avatar-select'|'dashboard'|'journal'|'goals'|'games'|'friends'|'journal-history';

interface NavigationProps {
  currentScreen: string;
  setCurrentScreen: (screen: ScreenType) => void;
  setShowPremium: (show: boolean) => void;
  coins: number;
  isPremium: boolean;
  headerFont: React.CSSProperties;
}

const Navigation: React.FC<NavigationProps> = ({
  currentScreen,
  setCurrentScreen,
  setShowPremium,
  coins,
  isPremium,
  headerFont
}) => (
  <nav className="bg-slate-950/90 backdrop-blur-xl border-b border-blue-800/30 px-6 py-4 flex justify-between items-center">
    <div className="flex items-center gap-4">
      <button 
        onClick={() => setCurrentScreen('dashboard')}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
      >
        <img src="/lotus.svg" alt="UBloom" className="w-8 h-8" />
        <span className="text-xl font-bold text-blue-100 tracking-widest" style={headerFont}>UBLOOM</span>
      </button>
      {isPremium ? (
        <span className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-blue-900/40 border border-blue-700 text-blue-200">
          <Crown className="w-3 h-3" /> Premium
        </span>
      ) : null}
    </div>
    <div className="flex items-center gap-3">
      <div className="text-sm text-blue-200 flex items-center gap-1" title="Your current coin balance">
        <Coins className="w-4 h-4" /> {coins}
      </div>
      <button onClick={() => { setCurrentScreen('dashboard'); setShowPremium(false); }} className={`p-3 rounded-lg ${currentScreen==='dashboard'?'bg-blue-900/30 text-blue-400':'text-slate-500 hover:text-blue-400'}`}><Home className="w-5 h-5" /></button>
      <button onClick={() => { setCurrentScreen('journal'); setShowPremium(false); }} className={`p-3 rounded-lg ${currentScreen==='journal'?'bg-blue-900/30 text-blue-400':'text-slate-500 hover:text-blue-400'}`}><BookOpen className="w-5 h-5" /></button>
      <button onClick={() => { setCurrentScreen('goals'); setShowPremium(false); }} className={`p-3 rounded-lg ${currentScreen==='goals'?'bg-blue-900/30 text-blue-400':'text-slate-500 hover:text-blue-400'}`}><Target className="w-5 h-5" /></button>
      <button onClick={() => { setCurrentScreen('games'); setShowPremium(false); }} className={`p-3 rounded-lg ${currentScreen==='games'?'bg-blue-900/30 text-blue-400':'text-slate-500 hover:text-blue-400'}`}><Zap className="w-5 h-5" /></button>
      <button onClick={() => { setCurrentScreen('friends'); setShowPremium(false); }} className={`p-3 rounded-lg ${currentScreen==='friends'?'bg-blue-900/30 text-blue-400':'text-slate-500 hover:text-blue-400'}`}><Users className="w-5 h-5" /></button>
      <button onClick={() => { setCurrentScreen('dashboard'); setShowPremium(true); }} className="p-3 rounded-lg text-slate-500 hover:text-blue-400" aria-label="Premium"><Sparkles className="w-5 h-5" /></button>
    </div>
  </nav>
);

export default Navigation;