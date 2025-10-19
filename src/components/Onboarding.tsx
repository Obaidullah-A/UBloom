import React from 'react';

type ScreenType = 'onboarding'|'signup'|'avatar-select'|'dashboard'|'journal'|'goals'|'games'|'friends'|'journal-history';

interface OnboardingProps {
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
  setCurrentScreen: (screen: ScreenType) => void;
  fontStyle: React.CSSProperties;
  headerFont: React.CSSProperties;
}

const onboardingScreens = [
  { title: 'UBLOOM', description: 'Your AI-powered emotional wellness companion',
    icon: (<img src="/lotus.svg" alt="UBloom Logo" className="w-32 h-32 mx-auto mb-8" />) },
  { title: 'Track Your Growth', description: 'Visualize emotional progress with AI insights',
    icon: (<svg className="w-40 h-40 mx-auto mb-8" viewBox="0 0 200 200" fill="none"><circle cx="100" cy="60" r="30" stroke="#60a5fa" strokeWidth="2" fill="none"/><path d="M100 90 L100 140" stroke="#60a5fa" strokeWidth="2"/><circle cx="70" cy="120" r="6" fill="#60a5fa"/><circle cx="100" cy="100" r="6" fill="#60a5fa"/><circle cx="130" cy="120" r="6" fill="#60a5fa"/><circle cx="85" cy="140" r="6" fill="#60a5fa"/><circle cx="115" cy="140" r="6" fill="#60a5fa"/></svg>) },
  { title: 'Build Your Future', description: 'Set goals, earn rewards, evolve your avatar',
    icon: (<svg className="w-40 h-40 mx-auto mb-8" viewBox="0 0 200 200" fill="none"><circle cx="100" cy="70" r="25" stroke="#60a5fa" strokeWidth="2" fill="none"/><path d="M100 95 L100 130" stroke="#60a5fa" strokeWidth="2"/><path d="M75 110 L100 130 L125 110" stroke="#60a5fa" strokeWidth="2" fill="none"/><circle cx="70" cy="100" r="4" fill="#60a5fa"/><circle cx="130" cy="100" r="4" fill="#60a5fa"/><circle cx="85" cy="130" r="4" fill="#60a5fa"/><circle cx="115" cy="130" r="4" fill="#60a5fa"/></svg>) }
] as const;

const Onboarding: React.FC<OnboardingProps> = ({
  onboardingStep,
  setOnboardingStep,
  setCurrentScreen,
  fontStyle,
  headerFont
}) => {
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
};

export default Onboarding;