import React from 'react';
import { Lock } from 'lucide-react';

type ScreenType = 'onboarding'|'signup'|'login'|'avatar-select'|'dashboard'|'journal'|'goals'|'games'|'friends'|'journal-history';

interface LoginProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  loginErrors: {[key: string]: string};
  handleLogin: () => void;
  setCurrentScreen: (screen: ScreenType) => void;
  fontStyle: React.CSSProperties;
  headerFont: React.CSSProperties;
}

const Login: React.FC<LoginProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  loginErrors,
  handleLogin,
  setCurrentScreen,
  fontStyle,
  headerFont
}) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4" style={fontStyle}>
    <div className="max-w-md w-full bg-slate-950/90 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-blue-800/30">
      <h1 className="text-3xl font-bold text-center mb-10 text-blue-100 tracking-widest" style={headerFont}>SIGN IN</h1>
      <div className="space-y-5 mb-8">
        <div>
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full p-4 bg-slate-900/50 border-b-2 ${loginErrors.email ? 'border-red-500' : 'border-blue-800/50'} text-blue-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all`}
          />
          {loginErrors.email && <p className="text-red-400 text-xs mt-1">{loginErrors.email}</p>}
        </div>
        <div className="relative">
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full p-4 bg-slate-900/50 border-b-2 ${loginErrors.password ? 'border-red-500' : 'border-blue-800/50'} text-blue-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all`}
          />
          <Lock className="absolute right-4 top-4 w-5 h-5 text-slate-600" />
          {loginErrors.password && <p className="text-red-400 text-xs mt-1">{loginErrors.password}</p>}
        </div>
        {loginErrors.general && <p className="text-red-400 text-xs">{loginErrors.general}</p>}
      </div>
      <button 
        onClick={handleLogin}
        className="w-full py-4 rounded-xl font-bold text-lg border-2 transition-all duration-300 tracking-widest mb-4 text-blue-100 border-blue-700 hover:bg-blue-900/30"
      >
        SIGN IN
      </button>
      <div className="text-center">
        <p className="text-slate-600 text-sm mb-4">Don't have an account?</p>
        <button 
          onClick={() => setCurrentScreen('signup')}
          className="text-blue-400 hover:text-blue-300 text-sm tracking-wider"
        >
          Create Account
        </button>
      </div>
      <div className="flex justify-center gap-2 mt-6"><div className="w-2 h-2 rounded-full bg-blue-500"></div><div className="w-2 h-2 rounded-full bg-slate-700"></div></div>
    </div>
  </div>
);

export default Login;