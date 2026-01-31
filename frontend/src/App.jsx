import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './calendar-custom.css';
import Login from './Login';
// --- グラフ用インポート ---
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

  // --- コンディション記録の状態管理 (sprint_time, stepsを追加) ---
  const [bodyStats, setBodyStats] = useState({ 
    height: 177, 
    weight: 63, 
    body_fat: 10,
    sprint_time: 4.50,
    steps: 10000 
  });
  const [historyData, setHistoryData] = useState([]); 

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
        const latest = res.data[0];
        setBodyStats({
          height: latest.height || 177,
          weight: latest.weight || 63,
          body_fat: latest.body_fat || 10,
          sprint_time: latest.sprint_time || 0,
          steps: latest.steps || 0
        });
        const sortedData = [...res.data].reverse();
        setHistoryData(sortedData);
      }
    } catch (err) { console.error("BodyStats fetch error:", err); }
  };

  const handleBodyStatsSubmit = async (e) => {
    e.preventDefault();
    try {
      const dateString = new Date().toLocaleDateString('sv-SE');
      await axios.post(`${API_BASE}/body-stats`, { ...bodyStats, date: dateString });
      alert("コンディションを記録しました！");
      fetchBodyStats(); 
    } catch (err) { console.error("BodyStats save error:", err); }
  };

  // タスク関連のハンドラ（変更なし）
  const handleEditClick = (e, task) => {
    e.stopPropagation();
    setEditingId(task.id);
    setContent(task.content);
    setDescription(task.description);
    setSelectedDate(new Date(task.due_date));
    setIsModalOpen(true);
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateString = date.toLocaleDateString('sv-SE');
      const dayTasks = tasks.filter(t => t.due_date && t.due_date.slice(0, 10) === dateString);
      return (
        <div className="task-labels">
          {dayTasks.map(t => (
            <div key={t.id} className="task-label-item" onClick={(e) => handleEditClick(e, t)}>
              {t.content}
            </div>
          ))}
        </div>
      );
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setEditingId(null);
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

        {/* コンディション入力セクション */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-slate-900/50 p-6 rounded-3xl border border-white/10 shadow-xl">
            <h3 className="text-xl font-bold text-blue-400 mb-6 flex items-center gap-2">
              🏃‍♂️ CONDITION LOG
            </h3>
            <form onSubmit={handleBodyStatsSubmit} className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Height</label>
                  <input type="number" step="0.1" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/50" 
                    value={bodyStats.height} onChange={e => setBodyStats({...bodyStats, height: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Weight</label>
                  <input type="number" step="0.1" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/50" 
                    value={bodyStats.weight} onChange={e => setBodyStats({...bodyStats, weight: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Body Fat</label>
                  <input type="number" step="0.1" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/50" 
                    value={bodyStats.body_fat} onChange={e => setBodyStats({...bodyStats, body_fat: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase text-orange-400">30m (s)</label>
                  <input type="number" step="0.01" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500/50" 
                    value={bodyStats.sprint_time} onChange={e => setBodyStats({...bodyStats, sprint_time: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase text-emerald-400">Steps</label>
                  <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/50" 
                    value={bodyStats.steps} onChange={e => setBodyStats({...bodyStats, steps: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-2xl transition-all">
                SAVE DATA
              </button>
            </form>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col justify-center items-center text-center">
            <p className="text-slate-500 text-xs font-bold uppercase mb-1">Current BMI</p>
            <p className="text-5xl font-black text-white">{bmi}</p>
            <div className="w-full h-px bg-white/5 my-4"></div>
            <p className="text-2xl font-black text-green-400 tracking-tighter italic">PHYSICAL: OK</p>
          </div>
        </div>

        {/* グラフセクション */}
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/10 shadow-xl mb-8">
          <h3 className="text-xl font-bold text-blue-400 mb-6 flex items-center gap-2">📈 PROGRESS CHART</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{fill: '#64748b', fontSize: 10}} tickFormatter={(s) => s ? s.split('-').slice(1).join('/') : ''} />
                <YAxis yAxisId="left" stroke="#3b82f6" tick={{fill: '#64748b'}} domain={['dataMin - 1', 'dataMax + 1']} />
                <YAxis yAxisId="right" orientation="right" stroke="#f472b6" tick={{fill: '#64748b'}} domain={[0, 25]} />
                <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'}} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="weight" name="体重" stroke="#3b82f6" strokeWidth={3} dot={{r:4}} />
                <Line yAxisId="right" type="monotone" dataKey="body_fat" name="体脂肪率" stroke="#f472b6" strokeWidth={3} dot={{r:4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 30m走と歩数の詳細カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/10 shadow-xl flex items-center gap-6">
            <div className="bg-orange-500/20 p-4 rounded-2xl text-orange-500 text-3xl font-bold italic">⚡</div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">30m Sprint Time</p>
              <p className="text-4xl font-black text-white">
                {(Number(bodyStats.sprint_time) || 0).toFixed(2)} 
                <span className="text-sm font-normal text-slate-500"> sec</span>
              </p>
            </div>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/10 shadow-xl flex items-center gap-6">
            <div className="bg-emerald-500/20 p-4 rounded-2xl text-emerald-500 text-3xl">👣</div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Daily Steps</p>
              <p className="text-4xl font-black text-white">{bodyStats.steps?.toLocaleString()} <span className="text-sm font-normal text-slate-500">steps</span></p>
            </div>
          </div>
        </div>

        {/* モーダル */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 w-full max-w-md p-6 rounded-3xl shadow-2xl">
              <h2 className="text-xl font-bold text-blue-400 mb-4">{editingId ? '修正' : '新規タスク'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50" value={content} onChange={(e) => setContent(e.target.value)} placeholder="タスク名" required />
                <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 h-24 outline-none focus:ring-2 focus:ring-blue-500/50" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="詳細・メモ" />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-500">保存</button>
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
