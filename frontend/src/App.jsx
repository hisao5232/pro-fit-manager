import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './Login';

const API_BASE = import.meta.env.VITE_API_URL || 'https://pro-fit-api.go-pro-world.net/api';

function App() {
  // ローカルストレージからログイン状態を復元
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [tasks, setTasks] = useState([]);
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (isLoggedIn) {
      fetchTasks();
      // 状態が変わったらストレージに保存
      localStorage.setItem('isLoggedIn', 'true');
    } else {
      localStorage.removeItem('isLoggedIn');
    }
  }, [isLoggedIn]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tasks`);
      setTasks(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content) return;
    try {
      if (editingId) {
        await axios.put(`${API_BASE}/tasks/${editingId}`, { content, description, due_date: dueDate });
      } else {
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
    if (task.due_date) setDueDate(task.due_date.split('T')[0]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isLoggedIn) return <Login onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <header className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
          <h1 className="text-3xl font-black italic text-white">PRO-FIT <span className="text-blue-500 not-italic">OPS</span></h1>
          <button onClick={() => { setIsLoggedIn(false); localStorage.removeItem('isLoggedIn'); }} className="text-xs font-bold text-slate-500">LOGOUT</button>
        </header>

        <form onSubmit={handleSubmit} className="mb-12 bg-slate-900/50 p-6 rounded-3xl border border-white/10 shadow-2xl">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50" value={content} onChange={(e) => setContent(e.target.value)} placeholder="タスク..." required />
              <input type="date" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-slate-300" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 h-24 outline-none" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="詳細..." />
            <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:opacity-90">{editingId ? 'UPDATE TASK' : 'DEPLOY TASK'}</button>
          </div>
        </form>

        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white/5 p-5 rounded-2xl border border-white/5 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  {/* 日付バッジの表示 */}
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    {task.due_date ? task.due_date.split('T')[0] : 'No Date'}
                  </span>
                  <h3 className="text-lg font-bold text-white">{task.content}</h3>
                </div>
                {task.description && <p className="text-slate-400 text-sm border-l-2 border-slate-700 pl-3 my-2">{task.description}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(task)} className="text-[10px] font-bold text-slate-400 hover:text-amber-500">修正</button>
                <button onClick={() => deleteTask(task.id)} className="text-[10px] font-bold text-slate-400 hover:text-red-500">削除</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
