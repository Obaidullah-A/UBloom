import React, { useMemo, useState, useEffect } from 'react';
import {
  Home, BookOpen, Target, User, Users, Coins, Flame, Plus, X, Check,
  Sparkles, Brain, Zap, ChevronRight, Menu, Lock, Gift, Ticket, ShieldCheck, Crown, Mic, MicOff
} from 'lucide-react';

/**
 * UBloomApp
 * - Integrates /api/reflect (Flask) on ANALYZE
 * - Reflection modal with "Set as Goal" -> adds AI mini-goal (respecting 5-goal free limit)
 * - Free tier: 1 journal/day, 5 goals max
 * - Goals tab: Active/History, Done/Skip controls, daily points progress (50pt goal) + bitmoji mood
 * - Coin economy preserved (+10 journal once/day, +20 per completed goal)
 */

type GoalStatus = 'active' | 'done' | 'skipped';
type Goal = { id: number; text: string; status: GoalStatus; rewarded?: boolean; createdAt: string; completedAt?: string; skippedAt?: string; };
type Cosmetic = { id: number; name: string; icon: string; price: number };

type AIReflection = {
  insight: string;
  growth_category: 'Resilience' | 'Self-Discipline' | 'Emotional Regulation' | 'Motivation' | 'Relationships';
  growth_path: string;           // Starts with 'Try setting a mini-goal: ...'
  reflection_prompt: string;     // Open-ended question
};

// Utils
const todayKey = () => new Date().toISOString().slice(0,10); // YYYY-MM-DD

const UBloomApp = () => {
  // Routing
  const [currentScreen, setCurrentScreen] = useState<'onboarding'|'signup'|'avatar-select'|'dashboard'|'journal'|'goals'|'games'|'friends'|'journal-history'>('onboarding');
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Profile
  const [selectedAvatar, setSelectedAvatar] = useState<{id:number;emoji:string;name:string}|null>(null);
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [signupErrors, setSignupErrors] = useState<{[key: string]: string}>({});
  const fontStyle = { fontFamily: "'Roboto', 'Segoe UI', sans-serif" };
  const headerFont = { fontFamily: "'Neuropol X Rg', sans-serif" };

  // Journal + AI
  const [journalText, setJournalText] = useState('');
  const [showReflection, setShowReflection] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [reflection, setReflection] = useState<AIReflection | null>(null);
  const [journalHistory, setJournalHistory] = useState<{date: string, text: string, reflection?: AIReflection | null}[]>([]);
  
  // Notifications & Feedback
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // Goals
  const [goals, setGoals] = useState<Goal[]>([
    { id: 1, text: 'Morning walk for 20 minutes', status: 'done', rewarded: true, createdAt: todayKey(), completedAt: todayKey() },
    { id: 2, text: 'Read 10 pages', status: 'done', rewarded: true, createdAt: todayKey(), completedAt: todayKey() },
    { id: 3, text: 'Call a friend', status: 'active', createdAt: todayKey() },
    { id: 4, text: 'Drink 8 glasses of water', status: 'active', createdAt: todayKey() },
    { id: 5, text: 'Meditate for 10 minutes', status: 'active', createdAt: todayKey() },
    { id: 6, text: 'Write in gratitude journal', status: 'active', createdAt: todayKey() },
    { id: 7, text: 'Do 20 push-ups', status: 'active', createdAt: todayKey() }
  ]);
  const [newGoalText, setNewGoalText] = useState('');
  const [showGoalLimitModal, setShowGoalLimitModal] = useState(false);
  const [showGoalInput, setShowGoalInput] = useState(false);

  // Economy / streaks
  const [coins, setCoins] = useState(120);
  const [streak, setStreak] = useState(3);
  const [lastActiveDate, setLastActiveDate] = useState<string | null>(null);
  const [dailyJournalAwarded, setDailyJournalAwarded] = useState<string | null>(null);

  // Premium
  const [showShop, setShowShop] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  // Limits & unlockables
  const [journalCountToday, setJournalCountToday] = useState(0);
  const [unlockedGames, setUnlockedGames] = useState<string[]>([]);
  const [ownedCosmetics, setOwnedCosmetics] = useState<number[]>([]);
  const [streakBroken, setStreakBroken] = useState(false);
  const [insuranceUsedThisWeek, setInsuranceUsedThisWeek] = useState(false);

  // Daily points toward mood bar (separate from coins)
  const [pointsToday, setPointsToday] = useState<number>(0);
  
  // Progress tracking
  const [emotionHistory, setEmotionHistory] = useState<{date: string, emotion: string, score: number}[]>([
    {date: '2024-01-01', emotion: 'Happy', score: 8},
    {date: '2024-01-02', emotion: 'Calm', score: 7},
    {date: '2024-01-03', emotion: 'Anxious', score: 4},
    {date: '2024-01-04', emotion: 'Motivated', score: 9},
    {date: '2024-01-05', emotion: 'Content', score: 7},
    {date: '2024-01-06', emotion: 'Excited', score: 8},
    {date: '2024-01-07', emotion: 'Peaceful', score: 6}
  ]);
  const [growthCategories, setGrowthCategories] = useState({
    'Resilience': 75,
    'Self-Discipline': 60,
    'Emotional Regulation': 80,
    'Motivation': 65,
    'Relationships': 70
  });

  // Avatars / cosmetics (same as before)
  const avatars = [
    { id: 1, emoji: '🙂', name: 'Alpha' },
    { id: 2, emoji: '😎', name: 'Beta' },
    { id: 3, emoji: '😁', name: 'Gamma' },
    { id: 4, emoji: '🧑‍🦱', name: 'Delta' },
    { id: 5, emoji: '🧔', name: 'Epsilon' },
    { id: 6, emoji: '👩‍🦳', name: 'Zeta' },
    { id: 7, emoji: '🧑‍🦰', name: 'Eta' },
    { id: 8, emoji: '🧑‍🦲', name: 'Theta' },
    { id: 9, emoji: '🧑‍⚕️', name: 'Iota' }
  ];

  const cosmetics: Cosmetic[] = [
    { id: 1, name: 'Neural Crown', icon: '👑', price: 150 },
    { id: 2, name: 'Holographic Aura', icon: '✨', price: 100 },
    { id: 3, name: 'Quantum Visor', icon: '🕶️', price: 120 },
    { id: 4, name: 'Energy Shield', icon: '🛡️', price: 80 },
    { id: 5, name: 'Synth Cape', icon: '🧥', price: 60 },
    { id: 6, name: 'Neon Trail', icon: '💫', price: 50 }
  ];
  const freeCosmeticIds = useMemo(()=>[5,6],[]);
  const allCosmeticIds = useMemo(()=>cosmetics.map(c=>c.id),[cosmetics]);

  // Helpers
  const addCoins = (amt:number) => setCoins(c => c + amt);
  const addPointsToday = (amt:number) => setPointsToday(p => p + amt);
  const freeGoalLimit = 5;

  // Streak bookkeeping
  const touchDaily = () => {
    const today = todayKey();
    if (!lastActiveDate) { setLastActiveDate(today); setStreak(1); setStreakBroken(false); return; }
    if (lastActiveDate === today) return;

    const d1 = new Date(lastActiveDate);
    const d2 = new Date(today);
    const diffDays = Math.round((d2.getTime() - d1.getTime())/86400000);

    if (diffDays === 1) {
      const newS = streak + 1; setStreak(newS); setStreakBroken(false);
      if (newS % 7 === 0) addCoins(100); else if (newS % 3 === 0) addCoins(50);
    } else if (diffDays > 1) {
      if (isPremium && !insuranceUsedThisWeek) setInsuranceUsedThisWeek(true);
      else { setStreak(1); setStreakBroken(true); }
    }
    setLastActiveDate(today);
  };

  // ANALYZE -> call Flask
const analyzeJournal = async () => {
  setAiError(null);
  setAiLoading(true);
  
  // *** CRITICAL CHANGE: Use the full URL for the Python backend ***
  const FULL_API_URL = 'http://127.0.0.1:5000/api/reflect'; 

  try {
    const res = await fetch(FULL_API_URL, { // Use the full URL here
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ journal_text: journalText ?? '' })
    });
    
    // Check for HTTP errors (4xx, 5xx)
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data?.error || `HTTP Error: ${res.status}`);
    }

    const data = await res.json();
    
    // Check if the JSON data looks like a structured reflection
    if (!data.insight || !data.growth_path) {
        throw new Error("AI returned invalid structure. Check Python server logs.");
    }
    
    setReflection(data as AIReflection);
    setShowReflection(true);
  } catch (e:any) {
    // If the Python server is down, the catch block handles the error message
    setAiError(e.message || 'Connection failed. Is the Python server running on port 5000?');
    setShowReflection(true); 
  } finally {
    setAiLoading(false);
  }
};

  // Toast notification system
  const showToastMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Signup validation
  const validateSignup = () => {
    const errors: {[key: string]: string} = {};
    
    if (!username.trim()) errors.username = 'Full name is required';
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!password.trim()) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
    
    return errors;
  };

  const handleSignup = () => {
    const errors = validateSignup();
    setSignupErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      setCurrentScreen('avatar-select');
    }
  };

  // SAVE (awards +10 once/day, increments pointsToday)
  const handleSaveJournal = () => {
    const today = todayKey();
    if (!isPremium && journalCountToday >= 1) {
      showToastMessage('Free tier: 1 journal/day. Upgrade to Premium for unlimited journals.', 'error');
      return;
    }
    
    // Save to history
    setJournalHistory(prev => [{
      date: today,
      text: journalText,
      reflection: reflection || undefined
    }, ...prev.filter(entry => entry.date !== today)]);
    
    setJournalCountToday(c => c + 1);
    touchDaily();
    if (dailyJournalAwarded !== today) {
      addCoins(10);
      addPointsToday(10);
      setDailyJournalAwarded(today);
      showToastMessage('Journal saved! +10 coins earned', 'success');
    } else {
      showToastMessage('Journal saved!', 'success');
    }
    setCurrentScreen('dashboard');
  };

  // Add goal (respect free 5-goal cap)
  const addGoal = (textFromAI?: string) => {
    if (!isPremium) {
      const activeCount = goals.filter(g => g.status === 'active').length;
      if (activeCount >= freeGoalLimit) {
        setShowGoalLimitModal(true);
        return;
      }
    }
    const text = textFromAI ?? newGoalText;
    if (!text.trim()) return;
    setGoals(prev => [{ id: Date.now(), text: text.trim(), status: 'active', createdAt: new Date().toISOString() }, ...prev]);
    setNewGoalText('');
    setShowGoalInput(false);
    // Tiny toast UX
    if (textFromAI) alert('✨ Mini-goal added to your Active Goals!');
  };

  const handlePlusClick = () => {
    const activeCount = goals.filter(g => g.status === 'active').length;
    console.log('Plus clicked! Active goals:', activeCount, 'Premium:', isPremium, 'Limit:', freeGoalLimit);
    
    if (!isPremium && activeCount >= freeGoalLimit) {
      console.log('TRIGGERING MODAL - activeCount:', activeCount, 'freeGoalLimit:', freeGoalLimit);
      setShowGoalLimitModal(true);
      return;
    }
    
    console.log('Showing input field');
    setShowGoalInput(true);
  };

  // Goal actions
  const markDone = (goal: Goal) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== goal.id) return g;
      // Reward +20 only once when moving to done the first time
      const alreadyRewarded = g.rewarded === true;
      if (!alreadyRewarded) { 
        addCoins(20); 
        addPointsToday(20);
        showToastMessage('🎉 Goal completed! +20 coins earned', 'success');
      }
      return { ...g, status: 'done', rewarded: true, completedAt: new Date().toISOString() };
    }));
  };
  const markSkipped = (goal: Goal) => {
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, status: 'skipped', skippedAt: new Date().toISOString() } : g));
  };
  const markActive = (goal: Goal) => {
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, status: 'active' } : g));
  };

  // Marketplace / Premium (unchanged behaviors)
  const unlockFocusGame = () => {
    if (isPremium || unlockedGames.includes('FOCUS')) { alert('Focus game already available.'); return; }
    if (coins < 200) { alert('Not enough coins.'); return; }
    setCoins(c => c - 200);
    setUnlockedGames(prev => [...prev, 'FOCUS']);
    alert('Focus Quest unlocked!');
  };
  const buyEventTicket = () => {
    if (coins < 500) { alert('Not enough coins.'); return; }
    setCoins(c => c - 500);
    alert('🎫 Event ticket purchased (mock).');
  };
  const reviveStreak = () => {
    if (!streakBroken) { alert('Your streak is not broken.'); return; }
    if (coins < 100) { alert('Not enough coins to revive.'); return; }
    setCoins(c => c - 100);
    setStreakBroken(false);
    alert('🔥 Streak revived! Keep it going.');
  };
  const purchaseCosmetic = (item: Cosmetic) => {
    if (isPremium) { alert('Premium has all cosmetics unlocked already.'); return; }
    if (ownedCosmetics.includes(item.id) || freeCosmeticIds.includes(item.id)) { alert('You already own this cosmetic.'); return; }
    if (coins < item.price) return;
    setCoins(c => c - item.price);
    setOwnedCosmetics(prev => [...prev, item.id]);
    alert(`Purchased ${item.name}!`);
  };
  const activatePremium = () => {
    if (isPremium) return;
    setIsPremium(true);
    addCoins(500);
    setOwnedCosmetics(allCosmeticIds);
    setInsuranceUsedThisWeek(false);
    alert('Premium activated! Enjoy your perks.');
  };

  // Reset daily points automatically when the date flips (simple)
  useEffect(() => {
    const id = setInterval(() => {
      if (todayKey() !== (dailyJournalAwarded ?? '').slice(0,10)) {
        setPointsToday(0);
        setJournalCountToday(0);
      }
    }, 60000);
    return () => clearInterval(id);
  }, [dailyJournalAwarded]);

  // Auto-save journal draft
  useEffect(() => {
    if (journalText.length > 10) {
      const timer = setTimeout(() => {
        localStorage.setItem('journal-draft', journalText);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [journalText]);

  // Load journal draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('journal-draft');
    if (draft && !journalText) {
      setJournalText(draft);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to save journal
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && currentScreen === 'journal') {
        e.preventDefault();
        if (journalText.trim()) handleSaveJournal();
      }
      // Ctrl/Cmd + Shift + A to analyze
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A' && currentScreen === 'journal') {
        e.preventDefault();
        if (journalText.trim() && !aiLoading) analyzeJournal();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen, journalText, aiLoading]);

  // ---------- UI ----------
  const Navigation = () => (
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

  // ----- Screens (onboarding/signup/avatar kept same style—titles updated to UBLOOM) -----
  const onboardingScreens = [
    { title: 'UBLOOM', description: 'Your AI-powered emotional wellness companion',
      icon: (<img src="/lotus.svg" alt="UBloom Logo" className="w-32 h-32 mx-auto mb-8" />) },
    { title: 'Track Your Growth', description: 'Visualize emotional progress with AI insights',
      icon: (<svg className="w-40 h-40 mx-auto mb-8" viewBox="0 0 200 200" fill="none"><circle cx="100" cy="60" r="30" stroke="#60a5fa" strokeWidth="2" fill="none"/><path d="M100 90 L100 140" stroke="#60a5fa" strokeWidth="2"/><circle cx="70" cy="120" r="6" fill="#60a5fa"/><circle cx="100" cy="100" r="6" fill="#60a5fa"/><circle cx="130" cy="120" r="6" fill="#60a5fa"/><circle cx="85" cy="140" r="6" fill="#60a5fa"/><circle cx="115" cy="140" r="6" fill="#60a5fa"/></svg>) },
    { title: 'Build Your Future', description: 'Set goals, earn rewards, evolve your avatar',
      icon: (<svg className="w-40 h-40 mx-auto mb-8" viewBox="0 0 200 200" fill="none"><circle cx="100" cy="70" r="25" stroke="#60a5fa" strokeWidth="2" fill="none"/><path d="M100 95 L100 130" stroke="#60a5fa" strokeWidth="2"/><path d="M75 110 L100 130 L125 110" stroke="#60a5fa" strokeWidth="2" fill="none"/><circle cx="70" cy="100" r="4" fill="#60a5fa"/><circle cx="130" cy="100" r="4" fill="#60a5fa"/><circle cx="85" cy="130" r="4" fill="#60a5fa"/><circle cx="115" cy="130" r="4" fill="#60a5fa"/></svg>) }
  ] as const;

  if (currentScreen === 'onboarding') {
    const s = onboardingScreens[onboardingStep];
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4" style={fontStyle}>
        <div className="max-w-md w-full bg-slate-950/90 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center border border-blue-800/30">
          {s.icon}
          <h1 className="text-4xl font-bold mb-4 text-blue-100 tracking-widest" style={headerFont}>{s.title}</h1>
          <p className="text-slate-400 text-lg mb-12 leading-relaxed">{s.description}</p>
          <div className="flex justify-center gap-2 mb-8">
            {onboardingScreens.map((_, idx) => (<div key={idx} className={`h-1.5 rounded-full ${idx===onboardingStep?'w-8 bg-blue-500':'w-1.5 bg-slate-700'}`} />))}
          </div>
          <button onClick={() => onboardingStep < 2 ? setOnboardingStep(onboardingStep+1) : setCurrentScreen('signup')}
                  className="w-full py-4 rounded-xl text-blue-100 font-bold text-lg border-2 border-blue-700 hover:bg-blue-900/30 transition-all duration-300 tracking-widest">
            {onboardingStep < 2 ? 'NEXT' : 'GET STARTED'}
          </button>
        </div>
      </div>
    );
  }

  if (currentScreen === 'signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4" style={fontStyle}>
        <div className="max-w-md w-full bg-slate-950/90 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-blue-800/30">
          <h1 className="text-3xl font-bold text-center mb-10 text-blue-100 tracking-widest" style={headerFont}>SIGN UP</h1>
          <div className="space-y-5 mb-8">
            <div>
              <input 
                type="text" 
                placeholder="Full Name" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full p-4 bg-slate-900/50 border-b-2 ${signupErrors.username ? 'border-red-500' : 'border-blue-800/50'} text-blue-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all`}
              />
              {signupErrors.username && <p className="text-red-400 text-xs mt-1">{signupErrors.username}</p>}
            </div>
            <div>
              <input 
                type="email" 
                placeholder="Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full p-4 bg-slate-900/50 border-b-2 ${signupErrors.email ? 'border-red-500' : 'border-blue-800/50'} text-blue-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all`}
              />
              {signupErrors.email && <p className="text-red-400 text-xs mt-1">{signupErrors.email}</p>}
            </div>
            <div className="relative">
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full p-4 bg-slate-900/50 border-b-2 ${signupErrors.password ? 'border-red-500' : 'border-blue-800/50'} text-blue-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all`}
              />
              <Lock className="absolute right-4 top-4 w-5 h-5 text-slate-600" />
              {signupErrors.password && <p className="text-red-400 text-xs mt-1">{signupErrors.password}</p>}
            </div>
          </div>
          <button 
            onClick={handleSignup}
            className="w-full py-4 rounded-xl font-bold text-lg border-2 transition-all duration-300 tracking-widest mb-4 text-blue-100 border-blue-700 hover:bg-blue-900/30"
          >
            CREATE ACCOUNT
          </button>
          <p className="text-center text-slate-600 text-sm">Forgot your password?</p>
          <div className="flex justify-center gap-2 mt-6"><div className="w-2 h-2 rounded-full bg-blue-500"></div><div className="w-2 h-2 rounded-full bg-slate-700"></div></div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'avatar-select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4" style={fontStyle}>
        <div className="max-w-2xl w-full bg-slate-950/90 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-blue-800/30">
          <h1 className="text-3xl font-bold text-center mb-10 text-blue-100 tracking-widest" style={headerFont}>CHOOSE AN AVATAR</h1>
          <div className="grid grid-cols-3 gap-4 mb-10">
            {avatars.map((a) => {
              const locked = !isPremium && a.id > 3;
              return (
                <button key={a.id} onClick={() => !locked && setSelectedAvatar(a)}
                        className={`relative bg-slate-900/50 p-6 rounded-2xl border-2 transition-all duration-300 hover:border-blue-500 ${selectedAvatar?.id===a.id?'border-blue-500 bg-blue-900/20':'border-blue-800/30'} ${locked?'opacity-50 cursor-not-allowed':''}`}
                        title={locked ? 'Premium required' : ''}>
                  <div className="text-5xl mb-3 text-center">{a.emoji}</div>
                  {locked && <div className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded bg-slate-800/80 border border-slate-700 text-slate-300">Premium</div>}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-slate-900/50 border-2 border-blue-800/30 flex items-center justify-center">
              <img src="/lotus.svg" alt="UBloom" className="w-6 h-6" />
            </div>
            <span className="text-blue-100 font-bold tracking-widest">UBLOOM</span>
          </div>
          <button onClick={() => { if (selectedAvatar) setCurrentScreen('dashboard'); }}
                  disabled={!selectedAvatar}
                  className={`w-full py-4 rounded-xl font-bold text-lg tracking-widest transition-all duration-300 ${selectedAvatar ? 'border-2 border-blue-700 text-blue-100 hover:bg-blue-900/30' : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'}`}>
            CONTINUE
          </button>
        </div>
      </div>
    );
  }

  // DASHBOARD
  if (currentScreen === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" style={fontStyle}>
        <Navigation />
        <div className="max-w-7xl mx-auto p-6 grid grid-cols-5 gap-6">
          {/* Profile / Stats */}
          <div className="col-span-3 bg-slate-950/90 backdrop-blur-xl rounded-3xl p-8 border border-blue-800/30">
            <div className="text-center mb-6">
              <span className="text-blue-100 font-bold tracking-widest" style={headerFont}>PROGRESS DASHBOARD</span>
            </div>
            
            {/* Welcome Message */}
            {username && (
              <div className="text-center mb-6">
                <p className="text-blue-200 text-sm">Welcome back,</p>
                <p className="text-blue-100 font-bold text-lg tracking-wider">{username}</p>
              </div>
            )}

            {/* Streak Counter */}
            <div className="text-center mb-6">
              <div className="text-5xl mb-2">🔥</div>
              <div className="text-blue-100 font-bold text-2xl">{streak}</div>
              <div className="text-slate-400 text-sm">Day Streak</div>
              {streakBroken && (
                <button onClick={reviveStreak} className="mt-2 px-3 py-1 rounded text-xs border border-blue-700 text-blue-100 hover:bg-blue-900/30">Revive (100)</button>
              )}
            </div>

            {/* Stats Row */}
            <div className="flex justify-between text-center mb-6">
              <div><div className="text-blue-100 font-bold text-lg">{coins}</div><div className="text-slate-500 text-xs">Coins</div></div>
              <div><div className="text-blue-100 font-bold text-lg">{pointsToday}</div><div className="text-slate-500 text-xs">Points Today</div></div>
              <div><div className="text-blue-100 font-bold text-lg">{emotionHistory.length}</div><div className="text-slate-500 text-xs">Entries</div></div>
            </div>

            {/* Emotion Graph */}
            <div className="mb-6">
              <h4 className="text-blue-100 font-semibold text-sm mb-3">Emotion Trend (7 days)</h4>
              <div className="flex items-end justify-between h-16 bg-slate-900/30 rounded-lg p-2">
                {emotionHistory.slice(-7).map((entry, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div 
                      className="w-3 bg-blue-500 rounded-t" 
                      style={{height: `${(entry.score/10)*100}%`}}
                      title={`${entry.emotion}: ${entry.score}/10`}
                    />
                    <div className="text-xs text-slate-500 mt-1">{entry.date.slice(-2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Categories */}
            <div className="mb-6">
              <h4 className="text-blue-100 font-semibold text-sm mb-3">Growth Categories</h4>
              <div className="space-y-2">
                {Object.entries(growthCategories).map(([category, progress]) => (
                  <div key={category}>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{category}</span><span>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{width: `${progress}%`}} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setShowShop(true)} className="w-full py-3 rounded-xl text-blue-100 font-bold border-2 border-blue-700 hover:bg-blue-900/30 transition-all tracking-widest">
              CUSTOMIZE
            </button>
          </div>

          {/* Journal + Goals glance */}
          <div className="col-span-2 space-y-6">
            {/* Journal */}
            <div className="bg-slate-950/90 backdrop-blur-xl rounded-3xl p-8 border border-blue-800/30">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-blue-100 tracking-widest" style={headerFont}>JOURNAL</h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{isPremium ? 'Unlimited journals' : 'Free: 1 journal/day'}</span>
                  <button onClick={() => setCurrentScreen('journal')} className="text-blue-400 hover:text-blue-300 text-sm tracking-wider">NEW ENTRY</button>
                </div>
              </div>
              {journalText ? (
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-blue-800/20">
                  <p className="text-slate-400 italic">"{journalText.substring(0, 120)}..."</p>
                </div>
              ) : (
                <div className="bg-slate-900/30 p-8 rounded-2xl border-2 border-dashed border-slate-800 text-center">
                  <BookOpen className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-600">No entry today</p>
                </div>
              )}
            </div>

            {/* Goals summary */}
            <div className="bg-slate-950/90 backdrop-blur-xl rounded-3xl p-8 border border-blue-800/30">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-blue-100 tracking-widest" style={headerFont}>GOALS</h3>
                <div className="flex items-center gap-3">
                  {!isPremium && <span className="text-xs text-slate-500">Free: up to {freeGoalLimit} active goals</span>}
                </div>
              </div>
              <div className="space-y-3">
                {goals.slice(0,3).map(goal => (
                  <div key={goal.id} className={`flex items-center gap-4 p-4 rounded-xl border ${goal.status==='done'?'bg-blue-900/20 border-blue-800/50':'bg-slate-900/30 border-slate-800'}`}>
                    <span className={`flex-1 text-sm ${goal.status==='done'?'line-through text-slate-600':'text-slate-300'}`}>{goal.text}</span>
                    {goal.status==='active' && (
                      <>
                        <button onClick={() => markDone(goal)} className="px-4 py-2 rounded-md border border-blue-700 text-blue-100 text-sm hover:bg-blue-900/30 min-w-[80px]">Done</button>
                        <button onClick={() => markSkipped(goal)} className="px-4 py-2 rounded-md border border-slate-700 text-slate-300 text-sm hover:bg-slate-800/40 min-w-[80px]">Skip</button>
                      </>
                    )}
                    {goal.status==='done' && <span className="text-xs text-blue-400 font-bold">+20</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Shop Modal */}
        {showShop && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-950/95 backdrop-blur-xl rounded-3xl max-w-4xl w-full p-8 border border-blue-800/30">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-blue-100 tracking-widest" style={headerFont}>MARKETPLACE</h2>
                <button onClick={() => setShowShop(false)} className="text-slate-500 hover:text-blue-400"><X className="w-6 h-6" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-3 bg-blue-900/20 p-4 rounded-xl border border-blue-800/50 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3"><Coins className="w-6 h-6 text-blue-400" /><span className="text-blue-100 font-bold tracking-wider">BALANCE: {coins} COINS</span></div>
                  <div className="flex items-center gap-2">
                    <button onClick={unlockFocusGame} className="px-3 py-2 rounded-lg border border-blue-700 text-blue-100 hover:bg-blue-900/30 text-xs flex items-center gap-2"><Target className="w-4 h-4" /> Unlock Focus (200)</button>
                    <button onClick={buyEventTicket} className="px-3 py-2 rounded-lg border border-blue-700 text-blue-100 hover:bg-blue-900/30 text-xs flex items-center gap-2"><Ticket className="w-4 h-4" /> Event Ticket (500)</button>
                    <button onClick={reviveStreak} className="px-3 py-2 rounded-lg border border-blue-700 text-blue-100 hover:bg-blue-900/30 text-xs flex items-center gap-2"><Flame className="w-4 h-4" /> Revive Streak (100)</button>
                  </div>
                </div>
                <div className="md:col-span-3">
                  <h3 className="text-sm text-slate-400 mb-3 tracking-wider">AVATAR COSMETICS</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {cosmetics.map(item => {
                      const owned = isPremium || ownedCosmetics.includes(item.id) || freeCosmeticIds.includes(item.id);
                      const freeTag = freeCosmeticIds.includes(item.id) && !isPremium;
                      return (
                        <div key={item.id} className="bg-slate-900/50 p-4 rounded-2xl border border-blue-800/30 hover:border-blue-500 transition-all text-center">
                          <div className="text-3xl mb-2">{item.icon}</div>
                          <div className="text-slate-300 text-xs mb-2">{item.name}</div>
                          <div className="h-6 mb-2">
                            {freeTag && <span className="text-[10px] px-2 py-1 rounded bg-slate-800/80 border border-slate-700 text-slate-300">Free</span>}
                            {isPremium && <span className="text-[10px] px-2 py-1 rounded bg-blue-900/50 border border-blue-700 text-blue-200">Unlocked</span>}
                          </div>
                          <button onClick={() => purchaseCosmetic(item)} disabled={owned || isPremium || coins < item.price}
                                  className={`w-full py-2 rounded-lg text-xs font-bold tracking-wider ${owned||isPremium?'bg-slate-800/50 text-slate-500 cursor-not-allowed':'border border-blue-700 text-blue-100 hover:bg-blue-900/30'}`}>
                            {owned || isPremium ? 'Owned' : item.price}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Modal */}
        {showPremium && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-950/95 backdrop-blur-xl rounded-3xl max-w-3xl w-full p-8 border border-blue-800/30">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-blue-100 tracking-widest" style={headerFont}>UPGRADE</h2>
                <button onClick={() => setShowPremium(false)} className="text-slate-500 hover:text-blue-400"><X className="w-6 h-6" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border border-blue-800/40 bg-slate-900/60">
                  <h3 className="text-blue-100 font-bold tracking-wider mb-2">Free</h3>
                  <ul className="text-slate-400 text-sm space-y-2">
                    <li>• 1 journal/day</li>
                    <li>• 5 active goals max</li>
                    <li>• Basic avatars</li>
                    <li>• 2 free cosmetics</li>
                  </ul>
                </div>
                <div className="p-6 rounded-2xl border border-blue-800/60 bg-blue-950/50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-blue-100 font-bold tracking-wider">Premium</h3>
                    <span className="text-sm text-blue-200">$4.99 / month</span>
                  </div>
                  <ul className="text-blue-200 text-sm space-y-2">
                    <li>• Unlimited journals</li>
                    <li>• Unlimited goals</li>
                    <li>• All cosmetics unlocked</li>
                    <li>• Priority AI insights</li>
                    <li>• Bonus 500 coins/month</li>
                    <li>• Exclusive games</li>
                    <li>• Streak insurance (1 free miss/week)</li>
                  </ul>
                  <button onClick={activatePremium} disabled={isPremium}
                          className={`w-full mt-4 py-3 rounded-xl font-bold tracking-widest ${isPremium ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed' : 'border-2 border-blue-700 text-blue-100 hover:bg-blue-900/30'}`}>
                    {isPremium ? 'Active' : 'Go Premium'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Goal Limit Modal */}
        {showGoalLimitModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
            <div className="bg-slate-950/95 backdrop-blur-xl rounded-3xl max-w-md w-full p-8 border border-blue-800/30 shadow-2xl">
              <div className="text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-blue-100 mb-4 tracking-widest" style={headerFont}>GOAL LIMIT REACHED</h2>
                <p className="text-slate-300 mb-6">You've reached the maximum of {freeGoalLimit} active goals on the free tier.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowGoalLimitModal(false)}
                    className="flex-1 py-3 rounded-xl border-2 border-slate-700 text-slate-300 hover:bg-slate-800/40 font-bold tracking-wider"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => { setShowGoalLimitModal(false); setShowPremium(true); }}
                    className="flex-1 py-3 rounded-xl border-2 border-blue-700 text-blue-100 hover:bg-blue-900/30 font-bold tracking-wider"
                  >
                    UPGRADE
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>
    );
  }

  // JOURNAL
  if (currentScreen === 'journal') {
    const freeLimitHit = !isPremium && journalCountToday >= 1;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" style={fontStyle}>
        <Navigation />
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
            
            {/* Character count */}
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

              
              {/* ANALYZE Button (Moved to center/right for spacing) */}
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

        {/* Reflection Modal (after ANALYZE) */}
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
  }

  // GOALS (with Active / History, Done / Skip, Progress, coins up-right)
  if (currentScreen === 'goals') {
    const activeGoals = goals.filter(g => g.status === 'active');
    const history = goals.filter(g => g.status !== 'active');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" style={fontStyle}>
        <Navigation />
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-slate-950/90 backdrop-blur-xl rounded-3xl p-10 border border-blue-800/30">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-blue-100 tracking-widest" style={headerFont}>GOALS</h1>
              <div className="flex items-center gap-4">
                <div className="text-sm text-blue-200 flex items-center gap-1"><Coins className="w-4 h-4" /> {coins}</div>
                <button className="text-blue-400 hover:text-blue-300" onClick={handlePlusClick}><Plus className="w-6 h-6" /></button>
              </div>
            </div>

            {/* Progress / mood row */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Daily progress</span><span>{Math.min(pointsToday,50)}/50 pts</span></div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${Math.min(pointsToday/50,1)*100}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-3 justify-end text-slate-300">
                <span className="text-2xl">{pointsToday >= 50 ? '🙂' : '😞'}</span>
                <span className="text-sm">{pointsToday >= 50 ? 'Great job! Goal met' : '50 pts to cheer up'}</span>
              </div>
            </div>

            {/* Add New Goal */}
            {showGoalInput && (
              <div className="mb-6">
                <input
                  type="text"
                  value={newGoalText}
                  onChange={(e) => setNewGoalText(e.target.value)}
                  placeholder="Enter a new goal..."
                  className="w-full p-3 bg-slate-900/50 border border-blue-800/30 rounded-xl text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newGoalText.trim()) {
                      addGoal();
                    } else if (e.key === 'Escape') {
                      setShowGoalInput(false);
                      setNewGoalText('');
                    }
                  }}
                  onBlur={() => {
                    if (newGoalText.trim()) {
                      addGoal();
                    } else {
                      setShowGoalInput(false);
                    }
                  }}
                  autoFocus
                />
              </div>
            )}

            {/* Active */}
            <h2 className="text-blue-100 font-semibold mb-3">Active Goals ({activeGoals.length}{!isPremium?` / ${freeGoalLimit}`:''})</h2>
            <div className="space-y-3 mb-8">
              {activeGoals.length === 0 && <div className="text-slate-600 text-sm">No active goals. Add one above!</div>}
              {activeGoals.map(goal => (
                <div key={goal.id} className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 flex items-center gap-3">
                  <span className="flex-1 text-slate-300">{goal.text}</span>
                  <button onClick={() => markDone(goal)} className="px-4 py-2 rounded-md border border-blue-700 text-blue-100 text-sm hover:bg-blue-900/30 min-w-[80px]">Done</button>
                  <button onClick={() => markSkipped(goal)} className="px-4 py-2 rounded-md border border-slate-700 text-slate-300 text-sm hover:bg-slate-800/40 min-w-[80px]">Skip</button>
                </div>
              ))}
            </div>

            {/* History */}
            <h2 className="text-blue-100 font-semibold mb-3">History ({history.length})</h2>
            <div className="space-y-3">
              {history.length === 0 && <div className="text-slate-600 text-sm">No history yet.</div>}
              {history.map(goal => (
                <div key={goal.id} className={`p-4 rounded-xl border ${goal.status==='done'?'bg-blue-900/20 border-blue-800/50':'bg-slate-900/30 border-slate-800'} flex items-center gap-3`}>
                  <span className={`flex-1 ${goal.status==='done'?'line-through text-slate-500':'text-slate-300'}`}>{goal.text}</span>
                  {goal.status==='done' && <span className="text-xs text-blue-400 font-bold">+20</span>}
                  <button onClick={() => markActive(goal)} className="px-4 py-2 rounded-md border border-slate-700 text-slate-300 text-sm hover:bg-slate-800/40 min-w-[80px]">Make Active</button>
                </div>
              ))}
            </div>
          </div>

          {/* Goal Limit Modal */}
          {showGoalLimitModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
              <div className="bg-slate-950/95 backdrop-blur-xl rounded-3xl max-w-md w-full p-8 border border-blue-800/30 shadow-2xl">
                <div className="text-center">
                  <div className="text-4xl mb-4">⚠️</div>
                  <h2 className="text-xl font-bold text-blue-100 mb-4 tracking-widest">GOAL LIMIT REACHED</h2>
                  <p className="text-slate-300 mb-6">You've reached the maximum of {freeGoalLimit} active goals on the free tier.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowGoalLimitModal(false)}
                      className="flex-1 py-3 rounded-xl border-2 border-slate-700 text-slate-300 hover:bg-slate-800/40 font-bold tracking-wider"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => { 
                        setShowGoalLimitModal(false); 
                        setCurrentScreen('dashboard');
                        setShowPremium(true); 
                      }}
                      className="flex-1 py-3 rounded-xl border-2 border-blue-700 text-blue-100 hover:bg-blue-900/30 font-bold tracking-wider"
                    >
                      UPGRADE
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // GAMES
  if (currentScreen === 'games') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" style={fontStyle}>
        <Navigation />
        <div className="max-w-6xl mx-auto p-8">
          <div className="bg-slate-950/90 backdrop-blur-xl rounded-3xl p-10 border border-blue-800/30">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold text-blue-100 tracking-widest" style={headerFont}>GAMES</h1>
              <div className="text-sm text-blue-200 flex items-center gap-1">
                <Coins className="w-4 h-4" /> {coins}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Focus Quest */}
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-blue-800/30 hover:border-blue-500 transition-all">
                <div className="text-center">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-blue-100 font-bold mb-2 tracking-wider">FOCUS QUEST</h3>
                  <p className="text-slate-400 text-sm mb-4">Train your concentration with mindful challenges</p>
                  <div className="mb-4">
                    {unlockedGames.includes('FOCUS') || isPremium ? (
                      <span className="text-xs px-3 py-1 rounded-full bg-blue-900/50 border border-blue-700 text-blue-200">Unlocked</span>
                    ) : (
                      <span className="text-xs px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-slate-300">200 Coins</span>
                    )}
                  </div>
                  <button
                    onClick={unlockedGames.includes('FOCUS') || isPremium ? () => alert('🎯 Focus Quest launched!') : unlockFocusGame}
                    className="w-full py-3 rounded-xl border-2 border-blue-700 text-blue-100 hover:bg-blue-900/30 font-bold tracking-wider"
                  >
                    {unlockedGames.includes('FOCUS') || isPremium ? 'PLAY' : 'UNLOCK'}
                  </button>
                </div>
              </div>

              {/* Mood Matcher */}
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-blue-800/30 hover:border-blue-500 transition-all">
                <div className="text-center">
                  <div className="text-4xl mb-4">🎭</div>
                  <h3 className="text-blue-100 font-bold mb-2 tracking-wider">MOOD MATCHER</h3>
                  <p className="text-slate-400 text-sm mb-4">Match emotions to build emotional intelligence</p>
                  <div className="mb-4">
                    <span className="text-xs px-3 py-1 rounded-full bg-blue-900/50 border border-blue-700 text-blue-200">Free</span>
                  </div>
                  <button
                    onClick={() => alert('🎭 Mood Matcher launched!')}
                    className="w-full py-3 rounded-xl border-2 border-blue-700 text-blue-100 hover:bg-blue-900/30 font-bold tracking-wider"
                  >
                    PLAY
                  </button>
                </div>
              </div>

              {/* Zen Garden */}
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-blue-800/30 hover:border-blue-500 transition-all">
                <div className="text-center">
                  <div className="text-4xl mb-4">🌸</div>
                  <h3 className="text-blue-100 font-bold mb-2 tracking-wider">ZEN GARDEN</h3>
                  <p className="text-slate-400 text-sm mb-4">Relax and meditate in your virtual garden</p>
                  <div className="mb-4">
                    {isPremium ? (
                      <span className="text-xs px-3 py-1 rounded-full bg-blue-900/50 border border-blue-700 text-blue-200">Premium</span>
                    ) : (
                      <span className="text-xs px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-slate-300">Premium Only</span>
                    )}
                  </div>
                  <button
                    onClick={isPremium ? () => alert('🌸 Zen Garden opened!') : () => setShowPremium(true)}
                    className="w-full py-3 rounded-xl border-2 border-blue-700 text-blue-100 hover:bg-blue-900/30 font-bold tracking-wider"
                  >
                    {isPremium ? 'ENTER' : 'UPGRADE'}
                  </button>
                </div>
              </div>

              {/* Memory Palace */}
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-blue-800/30 hover:border-blue-500 transition-all">
                <div className="text-center">
                  <div className="text-4xl mb-4">🏰</div>
                  <h3 className="text-blue-100 font-bold mb-2 tracking-wider">MEMORY PALACE</h3>
                  <p className="text-slate-400 text-sm mb-4">Build and explore your personal memory space</p>
                  <div className="mb-4">
                    <span className="text-xs px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-slate-300">Coming Soon</span>
                  </div>
                  <button
                    disabled
                    className="w-full py-3 rounded-xl bg-slate-800/50 text-slate-600 cursor-not-allowed font-bold tracking-wider"
                  >
                    COMING SOON
                  </button>
                </div>
              </div>

              {/* Gratitude Collector */}
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-blue-800/30 hover:border-blue-500 transition-all">
                <div className="text-center">
                  <div className="text-4xl mb-4">✨</div>
                  <h3 className="text-blue-100 font-bold mb-2 tracking-wider">GRATITUDE COLLECTOR</h3>
                  <p className="text-slate-400 text-sm mb-4">Collect and share moments of gratitude</p>
                  <div className="mb-4">
                    <span className="text-xs px-3 py-1 rounded-full bg-blue-900/50 border border-blue-700 text-blue-200">Free</span>
                  </div>
                  <button
                    onClick={() => alert('✨ Gratitude Collector opened!')}
                    className="w-full py-3 rounded-xl border-2 border-blue-700 text-blue-100 hover:bg-blue-900/30 font-bold tracking-wider"
                  >
                    COLLECT
                  </button>
                </div>
              </div>

              {/* Challenge Arena */}
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-blue-800/30 hover:border-blue-500 transition-all">
                <div className="text-center">
                  <div className="text-4xl mb-4">⚔️</div>
                  <h3 className="text-blue-100 font-bold mb-2 tracking-wider">CHALLENGE ARENA</h3>
                  <p className="text-slate-400 text-sm mb-4">Compete in wellness challenges with friends</p>
                  <div className="mb-4">
                    {isPremium ? (
                      <span className="text-xs px-3 py-1 rounded-full bg-blue-900/50 border border-blue-700 text-blue-200">Premium</span>
                    ) : (
                      <span className="text-xs px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-slate-300">Premium Only</span>
                    )}
                  </div>
                  <button
                    onClick={isPremium ? () => alert('⚔️ Challenge Arena entered!') : () => setShowPremium(true)}
                    className="w-full py-3 rounded-xl border-2 border-blue-700 text-blue-100 hover:bg-blue-900/30 font-bold tracking-wider"
                  >
                    {isPremium ? 'COMPETE' : 'UPGRADE'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // FRIENDS
  if (currentScreen === 'friends') {
    const mockFriends = [
      { id: 1, name: 'Alex Chen', avatar: '😊', status: 'online', streak: 12, lastActive: '2 min ago' },
      { id: 2, name: 'Maya Patel', avatar: '🌟', status: 'away', streak: 8, lastActive: '1 hour ago' },
      { id: 3, name: 'Jordan Kim', avatar: '🎯', status: 'offline', streak: 15, lastActive: '3 hours ago' },
      { id: 4, name: 'Sam Rivera', avatar: '🌸', status: 'online', streak: 5, lastActive: 'Just now' }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" style={fontStyle}>
        <Navigation />
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-slate-950/90 backdrop-blur-xl rounded-3xl p-10 border border-blue-800/30">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold text-blue-100 tracking-widest" style={headerFont}>FRIENDS</h1>
              <button className="px-4 py-2 rounded-xl border-2 border-blue-700 text-blue-100 hover:bg-blue-900/30 font-bold tracking-wider">
                ADD FRIEND
              </button>
            </div>

            {/* Friend Requests */}
            <div className="mb-8">
              <h2 className="text-blue-100 font-semibold mb-4">Friend Requests (2)</h2>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-900/30 border border-blue-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">🤖</div>
                    <div>
                      <div className="text-slate-300 font-medium">Riley Thompson</div>
                      <div className="text-slate-500 text-sm">Mutual friend: Alex Chen</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-md border border-blue-700 text-blue-100 text-sm hover:bg-blue-900/30 min-w-[80px]">Accept</button>
                    <button className="px-4 py-2 rounded-md border border-slate-700 text-slate-300 text-sm hover:bg-slate-800/40 min-w-[80px]">Decline</button>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/30 border border-blue-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">🎨</div>
                    <div>
                      <div className="text-slate-300 font-medium">Casey Morgan</div>
                      <div className="text-slate-500 text-sm">From UBloom Community</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-md border border-blue-700 text-blue-100 text-sm hover:bg-blue-900/30 min-w-[80px]">Accept</button>
                    <button className="px-4 py-2 rounded-md border border-slate-700 text-slate-300 text-sm hover:bg-slate-800/40 min-w-[80px]">Decline</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Friends List */}
            <div>
              <h2 className="text-blue-100 font-semibold mb-4">Friends ({mockFriends.length})</h2>
              <div className="space-y-3">
                {mockFriends.map(friend => (
                  <div key={friend.id} className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 hover:border-blue-800/50 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="text-2xl">{friend.avatar}</div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${
                          friend.status === 'online' ? 'bg-green-500' : 
                          friend.status === 'away' ? 'bg-yellow-500' : 'bg-slate-600'
                        }`} />
                      </div>
                      <div>
                        <div className="text-slate-300 font-medium">{friend.name}</div>
                        <div className="text-slate-500 text-sm flex items-center gap-3">
                          <span>{friend.lastActive}</span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            {friend.streak} day streak
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 rounded-md border border-blue-700 text-blue-100 text-sm hover:bg-blue-900/30 min-w-[80px]">Message</button>
                      <button className="px-4 py-2 rounded-md border border-slate-700 text-slate-300 text-sm hover:bg-slate-800/40 min-w-[80px]">Challenge</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            <div className="mt-8">
              <h2 className="text-blue-100 font-semibold mb-4">Weekly Leaderboard</h2>
              <div className="bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-xl">🥇</div>
                    <div>
                      <div className="text-slate-300 font-medium">Jordan Kim</div>
                      <div className="text-slate-500 text-sm">15 day streak</div>
                    </div>
                  </div>
                  <div className="text-blue-400 font-bold">2,450 pts</div>
                </div>
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-xl">🥈</div>
                    <div>
                      <div className="text-slate-300 font-medium">Alex Chen</div>
                      <div className="text-slate-500 text-sm">12 day streak</div>
                    </div>
                  </div>
                  <div className="text-blue-400 font-bold">2,180 pts</div>
                </div>
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-xl">🥉</div>
                    <div>
                      <div className="text-slate-300 font-medium">You</div>
                      <div className="text-slate-500 text-sm">{streak} day streak</div>
                    </div>
                  </div>
                  <div className="text-blue-400 font-bold">{pointsToday * 7} pts</div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-xl">4️⃣</div>
                    <div>
                      <div className="text-slate-300 font-medium">Maya Patel</div>
                      <div className="text-slate-500 text-sm">8 day streak</div>
                    </div>
                  </div>
                  <div className="text-blue-400 font-bold">1,920 pts</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // JOURNAL HISTORY
  if (currentScreen === 'journal-history') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" style={fontStyle}>
        <Navigation />
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-slate-950/90 backdrop-blur-xl rounded-3xl p-10 border border-blue-800/30">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-blue-100 tracking-widest" style={headerFont}>JOURNAL HISTORY</h1>
              <button 
                onClick={() => setCurrentScreen('journal')}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Back to Journal
              </button>
            </div>
            
            <div className="space-y-6">
              {journalHistory.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No journal entries yet</p>
                </div>
              ) : (
                journalHistory.map((entry, index) => (
                  <div key={index} className="bg-slate-900/50 p-6 rounded-2xl border border-blue-800/20">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-blue-100 font-semibold">{entry.date}</span>
                      <span className="text-xs text-slate-500">{entry.text.length} characters</span>
                    </div>
                    <p className="text-slate-300 mb-4">{entry.text}</p>
                    {entry.reflection && (
                      <div className="border-t border-slate-700 pt-4">
                        <h4 className="text-blue-100 font-semibold mb-2">AI Reflection</h4>
                        <p className="text-slate-400 text-sm">{entry.reflection.insight}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Toast Notification */}
        {showToast && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl border backdrop-blur-xl transition-all duration-300 ${
            toastType === 'success' ? 'bg-green-900/80 border-green-700 text-green-100' :
            toastType === 'error' ? 'bg-red-900/80 border-red-700 text-red-100' :
            'bg-blue-900/80 border-blue-700 text-blue-100'
          }`}>
            {toastMessage}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Toast Notification - Global */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl border backdrop-blur-xl transition-all duration-300 ${
          toastType === 'success' ? 'bg-green-900/80 border-green-700 text-green-100' :
          toastType === 'error' ? 'bg-red-900/80 border-red-700 text-red-100' :
          'bg-blue-900/80 border-blue-700 text-blue-100'
        }`}>
          {toastMessage}
        </div>
      )}
      
      {/* Fallback for unmatched screens */}
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-blue-100 mb-4">Screen not found</h1>
          <button 
            onClick={() => setCurrentScreen('dashboard')}
            className="px-6 py-3 rounded-xl text-blue-100 border-2 border-blue-700 hover:bg-blue-900/30"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default UBloomApp;
