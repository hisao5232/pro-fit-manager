import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './Login'; // Loginコンポーネントをインポート

const API_BASE = import.meta.env.VITE_API_URL || 'https://pro-fit-api.go-pro-world.net/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [content, setContent] = useState('');

  // ログイン後にタスクを取得
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
      await axios.post(`${API_BASE}/notify`, { content, description: "" });
      setContent('');
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  // 1. 未ログインならLogin画面を表示
  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  // 2. ログイン済みならメイン画面を表示
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-black text-slate-800 tracking-tighter">TASK DASHBOARD</h1>
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
          >
            LOGOUT
          </button>
        </header>

        <form onSubmit={addTask} className="mb-8 flex gap-2">
          <input
            className="flex-1 border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="新しいタスクを入力..."
          />
          <button className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition-all">
            追加
          </button>
        </form>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
              <span className="text-slate-700 font-medium">{task.content}</span>
              <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-1 rounded-full font-bold">TASK ID: {task.id}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
