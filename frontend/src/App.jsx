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

  // 1. コンディションログは3項目に固定
  const [bodyStats, setBodyStats] = useState({ height: 177, weight: 63, body_fat: 10 });

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
      if (res.data && res.data.length > 0) {
        // グラフ用（日付順）
        const sortedData = [...res.data].sort((a, b) => new Date(a.date) - new Date(b.date));
        setHistoryData(sortedData);
        
        // 最新の数値をフォームにセット
        const latest = res.data[0];
        setBodyStats({
          height: latest.height || 177,
          weight: latest.weight || 63,
          body_fat: latest.body_fat || 10
        });
      }
    } catch (err) { console.error("Stats fetch error:", err); }
  };

  // トレーニングのチェックを切り替える
  const toggleTraining = async (e, dateStr, part, currentValue) => {
    e.stopPropagation();
    try {
      await axios.post(`${API_BASE}/body-stats`, {
        date: dateStr,
        [part]: !currentValue
      });
      fetchBodyStats();
    } catch (err) { console.error("Training update error:", err); }
  };

  const handleBodyStatsSubmit = async (e) => {
    e.preventDefault();
    try {
      const dateString = new Date().toLocaleDateString('sv-SE');
      await axios.post(`${API_BASE}/body-stats`, { ...bodyStats, date: dateString });
      alert("コンディションを記録しました！");
      fetchBodyStats(); 
    } catch (err) { console.error("Save error:", err); }
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toLocaleDateString('sv-SE');
      const dayTasks = tasks.filter(t => t.due_date && t.due_date.slice(0, 10) === dateStr);
      const dayStats = historyData.find(d => d.date?.slice(0, 10) === dateStr) || {};

      return (
        <div className="flex flex-col h-full min-h-[45px]">
          <div className="task-labels mb-1">
            {dayTasks.map(t => (
              <div key={t.id} className="text-[8px] bg-blue-600/30 rounded px-1 truncate mb-0.5" 
                   onClick={(e) => { e.stopPropagation(); setEditingId(t.id); setContent(t.content); setDescription(t.description); setSelectedDate(new Date(t.due_date)); setIsModalOpen(true); }}>
                {t.content}
              </div>
            ))}
          </div>
          {/* 2. 「上 体 下」のチェックボックス風表示 */}
          <div className="flex justify-around mt-auto pt-1 border-t border-white/5">
            {[
              { key: 'train_upper', label: '上' },
              { key: 'train_core', label: '体' },
              { key: 'train_lower', label: '下' }
            ].map(item => (
              <span 
                key={item.key}
                onClick={(e) => toggleTraining(e, dateStr, item.key, dayStats[item.key])}
                className={`text-[9px] cursor-pointer px-0.5 rounded ${dayStats[item.key] ? 'text-blue-400 font-bold bg-blue-400/10' : 'text-slate-600'}`}
              >
                {item.label}
              </span>
            ))}
          </div>
        </div>
      );
    }
  };

  const handleDateClick = (date) => { setSelectedDate(date); setEditingId(null); setContent(''); setDescription(''); setIsModalOpen(true); };
  const handleSubmit = async (e) => { e.preventDefault(); const dateString = selectedDate.toLocaleDateString('sv-SE'); try { if (editingId) { await axios.put(`${API_BASE}/tasks/${editingId}`, { content, description, due_date: dateString }); } else { await axios.post(`${API_BASE}/notify`, { content, description, due_date: dateString }); } setIsModalOpen(false); fetchTasks(); } catch (err) { console.error(err); } };
  const deleteTask = async () => { if (!window.confirm("削除しますか？")) return; try { await axios.delete(`${API_BASE}/tasks/${editingId}`); setIsModalOpen(false); fetchTasks(); } catch (err) { console.error(err); } };
  
  const bmi = (bodyStats.weight / ((bodyStats.height / 100) ** 2)).toFixed(1);

  if (!isLoggedIn) return <Login onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans">
      <div className="max-w-6xl mx-auto pb-20">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black italic">PRO-FIT <span className="text-blue-500">OPS</span></h1>
          <button onClick={() => { setIsLoggedIn(false); localStorage.removeItem('isLoggedIn'); }} className="text-xs font-bold text-slate-500">LOGOUT</button>
        </header>

        <div className="bg-slate-900/50 rounded-3xl border border-white/10 shadow-2xl overflow-hidden mb-8">
          <Calendar onChange={setSelectedDate} onClickDay={handleDateClick} value={selectedDate} tileContent={tileContent} locale="ja-JP" calendarType="gregory" className="full-calendar" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-slate-900/50 p-6 rounded-3xl border border-white/10">
            <h3 className="text-xl font-bold text-blue-400 mb-6 flex items-center gap-2">🏃‍♂️ CONDITION LOG</h3>
            <form onSubmit={handleBodyStatsSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className="block text-[10px] font-bold text-slate-500 mb-2">HEIGHT (CM)</label><input type="number" step="0.1" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" value={bodyStats.height} onChange={e => setBodyStats({...bodyStats, height: parseFloat(e.target.value) || 0})} /></div>
              <div><label className="block text-[10px] font-bold text-slate-500 mb-2">WEIGHT (KG)</label><input type="number" step="0.1" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" value={bodyStats.weight} onChange={e => setBodyStats({...bodyStats, weight: parseFloat(e.target.value) || 0})} /></div>
              <div><label className="block text-[10px] font-bold text-slate-500 mb-2">BODY FAT (%)</label><input type="number" step="0.1" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" value={bodyStats.body_fat} onChange={e => setBodyStats({...bodyStats, body_fat: parseFloat(e.target.value) || 0})} /></div>
              <button type="submit" className="sm:col-span-3 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all">SAVE TODAY'S STATS</button>
            </form>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/10 flex flex-col justify-center items-center text-center">
            <p className="text-slate-500 text-xs font-bold uppercase mb-1">Current BMI</p>
            <p className="text-5xl font-black text-white">{bmi}</p>
          </div>
        </div>

        {/* 3. グラフセクション (historyDataを使用して再描画) */}
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/10 shadow-xl">
          <h3 className="text-xl font-bold text-blue-400 mb-6 flex items-center gap-2">📈 PROGRESS CHART</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{fill: '#64748b', fontSize: 10}} tickFormatter={(str) => str ? str.split('-').slice(1).join('/') : ''} />
                <YAxis yAxisId="left" stroke="#3b82f6" tick={{fill: '#64748b'}} domain={['dataMin - 1', 'dataMax + 1']} />
                <YAxis yAxisId="right" orientation="right" stroke="#f472b6" tick={{fill: '#64748b'}} domain={[0, 25]} />
                <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px'}} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="weight" name="体重" stroke="#3b82f6" strokeWidth={4} dot={{r: 4}} />
                <Line yAxisId="right" type="monotone" dataKey="body_fat" name="体脂肪率" stroke="#f472b6" strokeWidth={4} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* モーダル */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm text-slate-100">
            <div className="bg-slate-900 border border-white/10 w-full max-w-md p-6 rounded-3xl">
              <h2 className="text-xl font-bold text-blue-400 mb-4">{editingId ? '修正' : '新規タスク'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 text-white" value={content} onChange={(e) => setContent(e.target.value)} placeholder="タスク名 (例: 50m走 6.5s)" required />
                <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 h-24 outline-none focus:ring-2 focus:ring-blue-500/50 text-white" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="詳細・メモ (例: 12000歩)" />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl">保存</button>
                  {editingId && <button type="button" onClick={deleteTask} className="px-4 bg-red-900/30 text-red-500 rounded-xl border border-red-500/20">削除</button>}
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
