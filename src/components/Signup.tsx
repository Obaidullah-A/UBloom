import React from 'react';
import { Lock } from 'lucide-react';

interface SignupProps {
  username: string;
  setUsername: (username: string) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  signupErrors: {[key: string]: string};
  handleSignup: () => void;
  fontStyle: React.CSSProperties;
  headerFont: React.CSSProperties;
}

const Signup: React.FC<SignupProps> = ({
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  signupErrors,
  handleSignup,
  fontStyle,
  headerFont
}) => (
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

export default Signup;