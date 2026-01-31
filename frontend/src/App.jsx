import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './calendar-custom.css';
import Login from './Login';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API_BASE = import.meta.env.VITE_API_URL || 'https://pro-fit-api.go-pro-world.net/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [tasks, setTasks] = useState([]);
  const [historyData, setHistoryData] = useState([]); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [editingId, setEditingId] = useState(null);
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');

  const [bodyStats, setBodyStats] = useState({ 
    height: 177, weight: 63, body_fat: 10, sprint_time: 0, steps: 0 
  });

  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem('isLoggedIn', 'true');
      fetchTasks();
      fetchBodyStats(); 
    }
  }, [isLoggedIn]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tasks`);
      setTasks(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchBodyStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/body-stats`);
      if (res.data.length > 0) {
        const sortedData = [...res.data].reverse();
        setHistoryData(sortedData);
        // 今日のデータがあればセット
        const todayStr = new Date().toLocaleDateString('sv-SE');
        const todayData = res.data.find(d => d.date?.slice(0,10) === todayStr);
        if (todayData) {
          setBodyStats(todayData);
        }
      }
    } catch (err) { console.error("Stats fetch error:", err); }
  };

  // --- トレーニング状況の更新用 ---
  const toggleTraining = async (e, dateStr, part, currentValue) => {
    e.stopPropagation(); // カレンダーのクリックイベント発火を防ぐ
    try {
      await axios.post(`${API_BASE}/body-stats`, {
        date: dateStr,
        [part]: !currentValue
      });
      fetchBodyStats(); // 表示を更新
    } catch (err) { console.error("Training update error:", err); }
  };

  const handleBodyStatsSubmit = async (e) => {
    e.preventDefault();
    try {
      const dateString = new Date().toLocaleDateString('sv-SE');
      await axios.post(`${API_BASE}/body-stats`, { ...bodyStats, date: dateString });
      alert("記録しました！");
      fetchBodyStats(); 
    } catch (err) { console.error("Save error:", err); }
  };

  // カレンダーのタイル内表示
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toLocaleDateString('sv-SE');
      const dayTasks = tasks.filter(t => t.due_date && t.due_date.slice(0, 10) === dateStr);
      const dayStats = historyData.find(d => d.date?.slice(0, 10) === dateStr) || {};

      return (
        <div className="flex flex-col h-full justify-between min-h-[40px]">
          {/* タスク名表示 */}
          <div className="task-labels">
            {dayTasks.map(t => (
              <div key={t.id} className="task-label-item text-[8px] bg-blue-600/30 border border-blue-500/30 rounded px-1 mb-0.5 truncate" 
                   onClick={(e) => { e.stopPropagation(); setEditingId(t.id); setContent(t.content); setDescription(t.description); setSelectedDate(new Date(t.due_date)); setIsModalOpen(true); }}>
                {t.content}
              </div>
            ))}
          </div>

          {/* トレーニングチェックボックス (略称表示) */}
          <div className="flex justify-center gap-1 mt-1 border-t border-white/5 pt-1">
            {[
              { key: 'train_upper', label: '上', color: 'text-red-400' },
              { key: 'train_core', label: '体', color: 'text-yellow-400' },
              { key: 'train_lower', label: '下', color: 'text-green-400' }
            ].map(item => (
              <button
                key={item.key}
                onClick={(e) => toggleTraining(e, dateStr, item.key, dayStats[item.key])}
                className={`text-[9px] font-bold w-4 h-4 rounded-sm flex items-center justify-center transition-all border ${
                  dayStats[item.key] 
                  ? `${item.color} border-current bg-white/10` 
                  : 'text-slate-600 border-slate-700 hover:border-slate-500'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      );
    }
  };

  // 以下、以前の関数はそのまま
  const handleDateClick = (date) => { setSelectedDate(date); setEditingId(null); setContent(''); setDescription(''); setIsModalOpen(true); };
  const handleSubmit = async (e) => { e.preventDefault(); const dateString = selectedDate.toLocaleDateString('sv-SE'); try { if (editingId) { await axios.put(`${API_BASE}/tasks/${editingId}`, { content, description, due_date: dateString }); } else { await axios.post(`${API_BASE}/notify`, { content, description, due_date: dateString }); } setIsModalOpen(false); fetchTasks(); } catch (err) { console.error(err); } };
  const deleteTask = async () => { if (!window.confirm("削除しますか？")) return; try { await axios.delete(`${API_BASE}/tasks/${editingId}`); setIsModalOpen(false); fetchTasks(); } catch (err) { console.error(err); } };
  const bmi = (bodyStats.weight / ((bodyStats.height / 100) ** 2)).toFixed(1);

  if (!isLoggedIn) return <Login onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4">
      <div className="max-w-6xl mx-auto pb-20">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black italic text-white">PRO-FIT <span className="text-blue-500">OPS</span></h1>
          <button onClick={() => { setIsLoggedIn(false); localStorage.removeItem('isLoggedIn'); }} className="text-xs font-bold text-slate-500 hover:text-red-400 transition-colors">LOGOUT</button>
        </header>

        {/* カレンダー */}
        <div className="bg-slate-900/50 rounded-3xl border border-white/10 shadow-2xl overflow-hidden mb-8">
          <Calendar
            onChange={setSelectedDate}
            onClickDay={handleDateClick}
            value={selectedDate}
            tileContent={tileContent}
            locale="ja-JP"
            calendarType="gregory"
            className="full-calendar"
          />
        </div>

        {/* コンディション入力セクション (以前のコードと同じ) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-slate-900/50 p-6 rounded-3xl border border-white/10 shadow-xl">
            <h3 className="text-xl font-bold text-blue-400 mb-6 flex items-center gap-2">🏃‍♂️ CONDITION LOG</h3>
            <form onSubmit={handleBodyStatsSubmit} className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div><label className="block text-[10px] font-bold text-slate-500 mb-2">Height</label><input type="number" step="0.1" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none" value={bodyStats.height} onChange={e => setBodyStats({...bodyStats, height: parseFloat(e.target.value) || 0})} /></div>
                <div><label className="block text-[10px] font-bold text-slate-500 mb-2">Weight</label><input type="number" step="0.1" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none" value={bodyStats.weight} onChange={e => setBodyStats({...bodyStats, weight: parseFloat(e.target.value) || 0})} /></div>
                <div><label className="block text-[10px] font-bold text-slate-500 mb-2">Body Fat</label><input type="number" step="0.1" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none" value={bodyStats.body_fat} onChange={e => setBodyStats({...bodyStats, body_fat: parseFloat(e.target.value) || 0})} /></div>
                <div><label className="block text-[10px] font-bold text-slate-500 mb-2 text-orange-400">30m (s)</label><input type="number" step="0.01" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none" value={bodyStats.sprint_time} onChange={e => setBodyStats({...bodyStats, sprint_time: parseFloat(e.target.value) || 0})} /></div>
                <div><label className="block text-[10px] font-bold text-slate-500 mb-2 text-emerald-400">Steps</label><input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none" value={bodyStats.steps} onChange={e => setBodyStats({...bodyStats, steps: parseInt(e.target.value) || 0})} /></div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-2xl transition-all">SAVE DATA</button>
            </form>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col justify-center items-center">
            <p className="text-slate-500 text-xs font-bold uppercase mb-1">Current BMI</p>
            <p className="text-5xl font-black text-white">{bmi}</p>
          </div>
        </div>

        {/* 下部の詳細カード (以前のコードと同じ) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/10 flex items-center gap-6">
            <div className="text-3xl">⚡</div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase">30m Sprint</p>
              <p className="text-4xl font-black text-white">{(Number(bodyStats.sprint_time) || 0).toFixed(2)}s</p>
            </div>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/10 flex items-center gap-6">
            <div className="text-3xl">👣</div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase">Daily Steps</p>
              <p className="text-4xl font-black text-white">{bodyStats.steps?.toLocaleString()} steps</p>
            </div>
          </div>
        </div>

        {/* モーダル */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 w-full max-w-md p-6 rounded-3xl">
              <h2 className="text-xl font-bold text-blue-400 mb-4">{editingId ? '修正' : '新規タスク'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" value={content} onChange={(e) => setContent(e.target.value)} placeholder="タスク名" required />
                <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 h-24 outline-none" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="詳細・メモ" />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl">保存</button>
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
