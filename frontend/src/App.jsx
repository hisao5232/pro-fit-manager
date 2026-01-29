import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './Login';

const API_BASE = import.meta.env.VITE_API_URL || 'https://pro-fit-api.go-pro-world.net/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]); // デフォルト今日
  const [editingId, setEditingId] = useState(null); // 修正モードの管理

  useEffect(() => {
    if (isLoggedIn) fetchTasks();
  }, [isLoggedIn]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tasks`);
      setTasks(res.data);
    } catch (err) { console.error(err); }
  };

  // 登録または更新
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content) return;

    try {
      if (editingId) {
        // 修正保存を実行
        await axios.put(`${API_BASE}/tasks/${editingId}`, { content, description, due_date: dueDate });
      } else {
        // 新規登録を実行
        await axios.post(`${API_BASE}/notify`, { content, description, due_date: dueDate });
      }
      resetForm();
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  const resetForm = () => {
    setContent('');
    setDescription('');
    setDueDate(new Date().toISOString().split('T')[0]);
    setEditingId(null);
  };

  const deleteTask = async (id) => {
    if (!window.confirm("このタスクを削除しますか？")) return;
    try {
      await axios.delete(`${API_BASE}/tasks/${id}`);
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setContent(task.content);
    setDescription(task.description);
    // 日付の形式を調整してセット
    if (task.created_at) setDueDate(task.created_at.split('T')[0]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isLoggedIn) return <Login onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter italic text-white">
              PRO-FIT <span className="text-blue-500 not-italic">OPS</span>
            </h1>
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold">Heavy Equipment Maintenance</p>
          </div>
          <button onClick={() => setIsLoggedIn(false)} className="text-xs font-bold text-slate-500 hover:text-red-400 transition-colors">LOGOUT</button>
        </header>

        {/* フォームエリア */}
        <form onSubmit={handleSubmit} className="mb-12 bg-slate-900/50 p-6 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-1">
                <label className="text-[10px] font-bold text-blue-400 uppercase ml-1 mb-2 block">Task Title</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                  value={content} onChange={(e) => setContent(e.target.value)} placeholder="点検項目・タスク..." required
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-[10px] font-bold text-blue-400 uppercase ml-1 mb-2 block">Target Date</label>
                <input
                  type="date"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-slate-300"
                  value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-blue-400 uppercase ml-1 mb-2 block">Description</label>
              <textarea
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 h-24 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                value={description} onChange={(e) => setDescription(e.target.value)} placeholder="詳細・メモ..."
              />
            </div>
            <div className="flex gap-2">
              <button className={`flex-1 ${editingId ? 'bg-amber-600' : 'bg-blue-600'} text-white font-black py-4 rounded-2xl shadow-lg hover:opacity-90 transition-all active:scale-95 text-sm`}>
                {editingId ? 'UPDATE TASK' : 'DEPLOY TASK'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="px-6 bg-slate-800 text-white rounded-2xl font-bold text-xs">キャンセル</button>
              )}
            </div>
          </div>
        </form>

        {/* リストエリア */}
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="group bg-white/5 p-5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">#{task.id}</span>
                    <h3 className="text-lg font-bold text-white tracking-tight">{task.content}</h3>
                  </div>
                  {task.description && <p className="text-slate-400 text-sm border-l-2 border-slate-700 pl-3 my-3 leading-relaxed">{task.description}</p>}
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => startEdit(task)} className="p-2 bg-white/5 rounded-lg hover:bg-amber-500/20 text-slate-400 hover:text-amber-500 transition-all">
                    <span className="text-[10px] font-bold">修正</span>
                  </button>
                  <button onClick={() => deleteTask(task.id)} className="p-2 bg-white/5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-500 transition-all">
                    <span className="text-[10px] font-bold">削除</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
