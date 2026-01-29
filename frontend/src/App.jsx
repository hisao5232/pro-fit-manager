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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans touch-manipulation">
      <div className="max-w-3xl mx-auto">
        {/* ヘッダー */}
        <header className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-black italic text-white tracking-tighter">
              PRO-FIT <span className="text-blue-500 not-italic">OPS</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Maintenance Management</p>
          </div>
          <button 
            onClick={() => { setIsLoggedIn(false); localStorage.removeItem('isLoggedIn'); }} 
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-red-400 border border-white/10 rounded-lg transition-colors"
          >
            LOGOUT
          </button>
        </header>

        {/* 入力フォーム：修正モード時は枠線の色を変えて強調 */}
        <form 
          onSubmit={handleSubmit} 
          className={`mb-12 p-6 rounded-3xl border transition-all duration-300 shadow-2xl ${
            editingId ? 'bg-amber-950/20 border-amber-500/50' : 'bg-slate-900/50 border-white/10'
          }`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-blue-400 uppercase ml-1">Task Title</label>
                <input 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  placeholder="修理・点検項目..." 
                  required 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-blue-400 uppercase ml-1">Target Date</label>
                <input 
                  type="date" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-slate-300 focus:ring-2 focus:ring-blue-500/50" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)} 
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-blue-400 uppercase ml-1">Details</label>
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 h-24 outline-none focus:ring-2 focus:ring-blue-500/50 resize-none" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="不具合状況や交換部品など..." 
              />
            </div>
            
            <div className="flex gap-2">
              <button className={`flex-1 font-black py-4 rounded-2xl transition-all active:scale-95 shadow-lg ${
                editingId ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'
              }`}>
                {editingId ? 'UPDATE TASK' : 'DEPLOY TASK'}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="px-6 bg-slate-800 text-slate-300 rounded-2xl font-bold text-xs hover:bg-slate-700"
                >
                  CANCEL
                </button>
              )}
            </div>
          </div>
        </form>

        {/* タスクリスト */}
        <div className="space-y-4">
          {tasks.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
              <p className="text-slate-600 font-bold uppercase tracking-widest text-sm">No tasks assigned</p>
            </div>
          )}
          {tasks.map((task) => (
            <div key={task.id} className="group bg-white/5 p-5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all flex justify-between items-start shadow-sm">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  {/* 日付表示の修正：ISO形式でも対応できるように slice(0, 10) を使用 */}
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {task.due_date ? task.due_date.slice(0, 10) : 'NO DATE'}
                  </span>
                  <h3 className="text-lg font-bold text-white tracking-tight">{task.content}</h3>
                </div>
                {task.description && (
                  <p className="text-slate-400 text-sm border-l-2 border-blue-500/30 pl-3 my-2 leading-relaxed whitespace-pre-wrap">
                    {task.description}
                  </p>
                )}
              </div>
              
              {/* 操作ボタン：少し大きくして押しやすく */}
              <div className="flex flex-col gap-2 ml-4">
                <button 
                  onClick={() => startEdit(task)} 
                  className="px-3 py-1.5 bg-white/5 rounded-lg text-[10px] font-black text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition-all uppercase tracking-tighter"
                >
                  Edit
                </button>
                <button 
                  onClick={() => deleteTask(task.id)} 
                  className="px-3 py-1.5 bg-white/5 rounded-lg text-[10px] font-black text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all uppercase tracking-tighter"
                >
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
