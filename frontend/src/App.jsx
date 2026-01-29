import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './Login';

const API_BASE = import.meta.env.VITE_API_URL || 'https://pro-fit-api.go-pro-world.net/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [content, setContent] = useState('');
  const [description, setDescription] = useState(''); // 詳細用の状態を追加

  useEffect(() => {
    if (isLoggedIn) {
      fetchTasks();
    }
  }, [isLoggedIn]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tasks`);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!content) return;
    try {
      // content と description 両方を送る
      await axios.post(`${API_BASE}/notify`, { content, description });
      setContent('');
      setDescription(''); // 入力後リセット
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        {/* ヘッダー */}
        <header className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter italic text-white">
              PRO-FIT <span className="text-blue-500 not-italic">DASHBOARD</span>
            </h1>
            <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-bold">Task Management Unit</p>
          </div>
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-red-400 border border-white/10 rounded-lg transition-all"
          >
            LOGOUT
          </button>
        </header>

        {/* 入力フォーム（モダンなカード形式） */}
        <form onSubmit={addTask} className="mb-12 bg-white/5 p-6 rounded-2xl border border-white/10 shadow-xl">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 ml-1">Task Title</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="タスクのタイトルを入力..."
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 ml-1">Details (Optional)</label>
              <textarea
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white h-24 resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="修理箇所の詳細やメモなど..."
              />
            </div>
            <button className="bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/40 active:scale-95">
              DEPLOY TASK
            </button>
          </div>
        </form>

        {/* タスクリスト */}
        <div className="grid gap-4">
          {tasks.map((task) => (
            <div key={task.id} className="group bg-white/5 p-5 rounded-2xl border border-white/10 hover:border-blue-500/50 transition-all shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-white tracking-tight">{task.content}</h3>
                <span className="text-[10px] bg-white/5 text-slate-500 px-2 py-1 rounded-md font-mono">ID: {task.id}</span>
              </div>
              {task.description && (
                <p className="text-slate-400 text-sm leading-relaxed border-l-2 border-blue-500/30 pl-3 mt-2">
                  {task.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
