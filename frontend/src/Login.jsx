import React, { useState } from 'react';

function Login({ onLogin }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // 開発用：あとでバックエンド認証に置き換えます
    if (userId === "hisao" && password === "1983") {
      onLogin();
    } else {
      alert("IDまたはパスワードが違います");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-blue-900 to-slate-800 px-4">
      <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">
            PRO-FIT <span className="text-blue-400 not-italic">MANAGER</span>
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            Repair Engineer's System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 ml-1">User ID</label>
            <input 
              type="text" 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
              placeholder="Username"
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 ml-1">Password</label>
            <input 
              type="password" 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-900/40 transition-all active:scale-95"
          >
            SIGN IN
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
