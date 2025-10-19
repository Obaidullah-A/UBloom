import React from 'react';

interface Avatar {
  id: number;
  emoji: string;
  name: string;
}

type ScreenType = 'onboarding'|'signup'|'avatar-select'|'dashboard'|'journal'|'goals'|'games'|'friends'|'journal-history';

interface AvatarSelectProps {
  avatars: Avatar[];
  selectedAvatar: Avatar | null;
  setSelectedAvatar: (avatar: Avatar) => void;
  setCurrentScreen: (screen: ScreenType) => void;
  isPremium: boolean;
  fontStyle: React.CSSProperties;
  headerFont: React.CSSProperties;
  handleAvatarSelect?: (avatarUrl: string) => void;
}

const AvatarSelect: React.FC<AvatarSelectProps> = ({
  avatars,
  selectedAvatar,
  setSelectedAvatar,
  setCurrentScreen,
  isPremium,
  fontStyle,
  headerFont,
  handleAvatarSelect
}) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4" style={fontStyle}>
    <div className="max-w-4xl w-full bg-slate-950/90 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-blue-800/30">
      <h1 className="text-3xl font-bold text-center mb-10 text-blue-100 tracking-widest" style={headerFont}>CREATE YOUR AVATAR</h1>
      
      <div className="mb-6">
        <iframe
          src="https://ubloom.readyplayer.me/avatar?frameApi"
          className="w-full h-[600px] border-none rounded-2xl"
          allow="camera *; microphone *"
          onLoad={(e) => {
            const iframe = e.target as HTMLIFrameElement;
            window.addEventListener('message', (event) => {
              if (event.data?.source === 'readyplayerme') {
                if (event.data.eventName === 'v1.avatar.exported') {
                  console.log('Avatar URL:', event.data.url);
                  if (handleAvatarSelect) {
                    handleAvatarSelect(event.data.url);
                  }
                }
              }
            });
          }}
        />
      </div>
      
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
        <span className="text-blue-100 font-bold tracking-widest" style={headerFont}>UBLOOM</span>
      </div>
      <button onClick={() => { if (selectedAvatar) setCurrentScreen('dashboard'); }}
              disabled={!selectedAvatar}
              className={`w-full py-4 rounded-xl font-bold text-lg tracking-widest transition-all duration-300 ${selectedAvatar ? 'border-2 border-blue-700 text-blue-100 hover:bg-blue-900/30' : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'}`}>
        CONTINUE
      </button>
    </div>
  </div>
);

export default AvatarSelect;