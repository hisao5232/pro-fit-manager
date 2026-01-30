import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './calendar-custom.css';
import Login from './Login';

const API_BASE = import.meta.env.VITE_API_URL || 'https://pro-fit-api.go-pro-world.net/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // フォーム用
  const [editingId, setEditingId] = useState(null);
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem('isLoggedIn', 'true');
      fetchTasks();
    }
  }, [isLoggedIn]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tasks`);
      setTasks(res.data);
    } catch (err) { console.error(err); }
  };

  // タスクラベルをクリックした時の処理（修正モード）
  const handleEditClick = (e, task) => {
    e.stopPropagation(); // 日付クリックイベントの発火を防ぐ
    setEditingId(task.id);
    setContent(task.content);
    setDescription(task.description);
    setSelectedDate(new Date(task.due_date));
    setIsModalOpen(true);
  };

  // カレンダー内の表示
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateString = date.toLocaleDateString('sv-SE');
      const dayTasks = tasks.filter(t => t.due_date && t.due_date.slice(0, 10) === dateString);
      return (
        <div className="task-labels">
          {dayTasks.map(t => (
            <div 
              key={t.id} 
              className="task-label-item"
              onClick={(e) => handleEditClick(e, t)}
            >
              {t.content}
            </div>
          ))}
        </div>
      );
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setEditingId(null); // 新規作成モード
    setContent('');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dateString = selectedDate.toLocaleDateString('sv-SE');
    try {
      if (editingId) {
        await axios.put(`${API_BASE}/tasks/${editingId}`, { content, description, due_date: dateString });
      } else {
        await axios.post(`${API_BASE}/notify`, { content, description, due_date: dateString });
      }
      setIsModalOpen(false);
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  const deleteTask = async () => {
    if (!window.confirm("このタスクを削除しますか？")) return;
    try {
      await axios.delete(`${API_BASE}/tasks/${editingId}`);
      setIsModalOpen(false);
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  if (!isLoggedIn) return <Login onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black italic text-white">PRO-FIT <span className="text-blue-500">OPS</span></h1>
          <button onClick={() => { setIsLoggedIn(false); localStorage.removeItem('isLoggedIn'); }} className="text-xs font-bold text-slate-500 hover:text-red-400">LOGOUT</button>
        </header>

        <div className="bg-slate-900/50 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          <Calendar
            onChange={setSelectedDate}
            onClickDay={handleDateClick}
            value={selectedDate}
            tileContent={tileContent}
            locale="ja-JP"
            calendarType="gregory" // ★日曜始まりに設定
            className="full-calendar"
          />
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 w-full max-w-md p-6 rounded-3xl shadow-2xl">
              <h2 className="text-xl font-bold text-blue-400 mb-4">
                {editingId ? 'タスクを修正' : `${selectedDate.toLocaleDateString('ja-JP')} の新規タスク`}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50" value={content} onChange={(e) => setContent(e.target.value)} placeholder="タスク名" required />
                <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 h-24 outline-none focus:ring-2 focus:ring-blue-500/50" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="詳細・メモ" />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-500">
                    {editingId ? '更新' : '保存'}
                  </button>
                  {editingId && (
                    <button type="button" onClick={deleteTask} className="px-4 bg-red-900/30 text-red-500 rounded-xl font-bold border border-red-500/20">削除</button>
                  )}
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 bg-slate-800 text-slate-300 rounded-xl font-bold">戻る</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default App;
