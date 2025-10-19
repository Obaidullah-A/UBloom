import React from 'react';
import { X } from 'lucide-react';
import Navigation from './Navigation';

interface AIReflection {
  insight: string;
  growth_category: 'Resilience' | 'Self-Discipline' | 'Emotional Regulation' | 'Motivation' | 'Relationships';
  growth_path: string;
  reflection_prompt: string;
}

type ScreenType = 'onboarding'|'signup'|'avatar-select'|'dashboard'|'journal'|'goals'|'games'|'friends'|'journal-history';

interface JournalProps {
  journalText: string;
  setJournalText: (text: string) => void;
  journalHistory: any[];
  setCurrentScreen: (screen: ScreenType) => void;
  analyzeJournal: () => void;
  handleSaveJournal: () => void;
  showReflection: boolean;
  setShowReflection: (show: boolean) => void;
  aiLoading: boolean;
  aiError: string | null;
  reflection: AIReflection | null;
  addGoal: (text?: string) => void;
  isPremium: boolean;
  journalCountToday: number;
  dailyJournalAwarded: string | null;
  todayKey: () => string;
  fontStyle: React.CSSProperties;
  headerFont: React.CSSProperties;
  currentScreen: string;
  coins: number;
}

const Journal: React.FC<JournalProps> = ({
  journalText,
  setJournalText,
  journalHistory,
  setCurrentScreen,
  analyzeJournal,
  handleSaveJournal,
  showReflection,
  setShowReflection,
  aiLoading,
  aiError,
  reflection,
  addGoal,
  isPremium,
  journalCountToday,
  dailyJournalAwarded,
  todayKey,
  fontStyle,
  headerFont,
  currentScreen,
  coins
}) => {
  const freeLimitHit = !isPremium && journalCountToday >= 1;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" style={fontStyle}>
      <Navigation 
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        setShowPremium={() => {}}
        coins={coins}
        isPremium={isPremium}
        headerFont={headerFont}
      />
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-slate-950/90 backdrop-blur-xl rounded-3xl p-10 border border-blue-800/30">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-blue-100 tracking-widest" style={headerFont}>JOURNAL ENTRY</h1>
            <div className="flex items-center gap-4">
              {!isPremium && <span className="text-xs text-slate-500">Free: 1 per day</span>}
              <div className="text-xs text-slate-500">
                <div>⌘+Enter to save</div>
                <div>⌘+Shift+A to analyze</div>
              </div>
            </div>
          </div>
          <textarea
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            placeholder="Express your thoughts..."
            className="w-full h-96 p-6 bg-slate-900/50 border border-blue-800/30 rounded-2xl resize-none focus:outline-none focus:border-blue-500 text-slate-300 mb-6"
          />
          
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-slate-500">
              {journalText.length} characters
            </span>
            {journalHistory.length > 0 && (
              <button 
                onClick={() => setCurrentScreen('journal-history')}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                View History ({journalHistory.length})
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={analyzeJournal}
              disabled={!journalText.trim() || aiLoading}
              className={`flex-1 py-4 rounded-xl font-bold border-2 transition-all tracking-widest relative ${
                !journalText.trim() || aiLoading 
                  ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed border-slate-700' 
                  : 'text-blue-100 border-blue-700 hover:bg-blue-900/30'
              }`}
            >
              {aiLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <span className={aiLoading ? 'opacity-0' : 'opacity-100'}>
                {aiLoading ? 'ANALYZING...' : 'ANALYZE'}
              </span>
            </button>
            <button 
              onClick={handleSaveJournal} 
              disabled={freeLimitHit || !journalText.trim()}
              className={`px-8 py-4 rounded-xl font-bold tracking-widest ${
                freeLimitHit || !journalText.trim() 
                  ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed' 
                  : 'text-blue-100 border-2 border-blue-700 hover:bg-blue-900/30'
              }`}
            >
              SAVE {dailyJournalAwarded !== todayKey() ? '(+10)' : ''}
            </button>
          </div>
        </div>
      </div>

      {showReflection && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-slate-950/95 rounded-3xl max-w-2xl w-full p-8 border border-blue-800/30">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-blue-100">Your UBloom Reflection</h2>
              <button onClick={() => setShowReflection(false)} className="text-slate-500 hover:text-blue-400"><X className="w-6 h-6" /></button>
            </div>

            {aiLoading && <p className="text-slate-400">Analyzing…</p>}
            {aiError && <p className="text-amber-300 text-sm mb-4">Note: {aiError}</p>}

            {reflection ? (
              <>
                <div className="mb-6">
                  <h3 className="text-blue-100 font-semibold mb-2">Insight</h3>
                  <p className="text-slate-300">{reflection.insight}</p>
                </div>
                <div className="mb-6">
                  <h3 className="text-blue-100 font-semibold mb-2">Growth Path</h3>
                  <p className="text-slate-300">{reflection.growth_path}</p>
                  <button
                    onClick={() => { addGoal(reflection.growth_path.replace(/^Try setting a mini-goal:\s*/i, '')); setShowReflection(false); }}
                    className="mt-4 px-4 py-2 rounded-xl text-blue-100 border-2 border-blue-700 hover:bg-blue-900/30">
                    Set as Goal
                  </button>
                </div>
                <div className="mb-2">
                  <h3 className="text-blue-100 font-semibold mb-2">Reflect Further</h3>
                  <p className="text-slate-300 italic">{reflection.reflection_prompt}</p>
                </div>
              </>
            ) : (
              !aiLoading && <p className="text-slate-400">No reflection available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Journal;