import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './calendar-custom.css';
import Login from './Login';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// APIのベースURL設定。VPSのバックエンドURLを参照
const API_BASE = import.meta.env.VITE_API_URL || 'https://pro-fit-api.go-pro-world.net/api';

function App() {
  // --- 1. 状態管理 (State) ---
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [tasks, setTasks] = useState([]);
  const [historyData, setHistoryData] = useState([]); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [bodyStats, setBodyStats] = useState({ height: 177, weight: 63, body_fat: 10 });
  
  // 画像アップロード用のState
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // --- 2. 副作用処理 (useEffect) ---
  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem('isLoggedIn', 'true');
      fetchTasks();
      fetchBodyStats(); 
    }
  }, [isLoggedIn]);

  // --- 3. データ取得関数 (Fetch Functions) ---
  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tasks`);
      setTasks(res.data);
    } catch (err) { console.error("Task fetch error:", err); }
  };

  const fetchBodyStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/body-stats`);
      if (res.data && res.data.length > 0) {
        const sortedForChart = [...res.data].sort((a, b) => new Date(a.date) - new Date(b.date));
        setHistoryData(sortedForChart);
        const latest = res.data[0]; 
        setBodyStats({
          height: latest.height || 177,
          weight: latest.weight || 63,
          body_fat: latest.body_fat || 10
        });
      }
    } catch (err) { console.error("Stats fetch error:", err); }
  };

  // --- 4. トレーニング・体重記録の操作 ---
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

  // --- 5. カレンダーの描画ロジック (重要：カメラアイコン追加) ---
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toLocaleDateString('sv-SE');
      const dayTasks = tasks.filter(t => t.due_date && t.due_date.slice(0, 10) === dateStr);
      const dayStats = historyData.find(d => d.date?.slice(0, 10) === dateStr) || {};
      const hasImage = dayTasks.some(t => t.image_url); // 画像があるか判定

      return (
        <div className="flex flex-col h-full min-h-[70px] w-full py-1 overflow-hidden relative">
          {/* カメラアイコン表示 (画像がある日付のみ) */}
          {hasImage && (
            <div className="absolute top-0.5 right-0.5 text-blue-400 bg-slate-900/80 rounded-full p-0.5 z-10 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          )}

          <div className="flex-grow overflow-y-auto mb-1 pr-0.5 text-left">
            {dayTasks.map(t => (
              <div key={t.id} className="text-[8px] bg-blue-600/30 rounded px-1 truncate mb-0.5 border border-blue-500/10 cursor-pointer" 
                   onClick={(e) => { 
                     e.stopPropagation(); 
                     setEditingId(t.id); 
                     setContent(t.content); 
                     setDescription(t.description); 
                     setSelectedDate(new Date(t.due_date));
                     setPreviewUrl(t.image_url ? `https://pro-fit-api.go-pro-world.net${t.image_url}` : null);
                     setIsModalOpen(true); 
                   }}>
                {t.content}
              </div>
            ))}
          </div>

          <div className="flex justify-around items-center pt-1 border-t border-white/5 flex-shrink-0">
            {[
              { key: 'train_upper', label: '上', activeClass: 'bg-red-500 shadow-red-500/40' },
              { key: 'train_core', label: '体', activeClass: 'bg-orange-500 shadow-orange-500/40' },
              { key: 'train_lower', label: '下', activeClass: 'bg-blue-500 shadow-blue-500/40' }
            ].map(item => (
              <button
                key={item.key}
                type="button"
                onClick={(e) => toggleTraining(e, dateStr, item.key, dayStats[item.key])}
                className={`text-[10px] w-5 h-5 flex items-center justify-center rounded transition-all pointer-events-auto ${
                  dayStats[item.key] 
                  ? `${item.activeClass} text-white font-bold shadow-lg` 
                  : 'bg-white/5 text-slate-500 hover:bg-white/10 border border-white/5'
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

  // --- 6. タスク投稿・編集・削除処理 (重要：FormData対応) ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDateClick = (date) => { 
    setSelectedDate(date); 
    setEditingId(null); 
    setContent(''); 
    setDescription(''); 
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsModalOpen(true); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dateString = selectedDate.toLocaleDateString('sv-SE');
    
    // 画像を送るためにFormDataを使用
    const formData = new FormData();
    formData.append('content', content);
    formData.append('description', description);
    formData.append('due_date', dateString);
    if (selectedFile) formData.append('image', selectedFile);

    try {
      if (editingId) {
        // ※編集時の画像更新はバックエンド側のPUT対応も必要ですが、まずはPOSTで新規を優先
        await axios.put(`${API_BASE}/tasks/${editingId}`, { content, description, due_date: dateString });
      } else {
        await axios.post(`${API_BASE}/notify`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setIsModalOpen(false);
      fetchTasks();
    } catch (err) { console.error("Submit error:", err); }
  };

  const deleteTask = async () => {
    if (!window.confirm("削除しますか？")) return;
    try {
      await axios.delete(`${API_BASE}/tasks/${editingId}`);
      setIsModalOpen(false);
      fetchTasks();
    } catch (err) { console.error(err); }
  };
  
  const bmi = (bodyStats.weight / ((bodyStats.height / 100) ** 2)).toFixed(1);

  // --- 7. レンダリング (UI) ---
  if (!isLoggedIn) return <Login onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto pb-20">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black italic shadow-lg shadow-blue-600/20">P</div>
            <h1 className="text-2xl font-black italic tracking-tighter text-white">PRO-FIT <span className="text-blue-500">OPS</span></h1>
          </div>
          <button onClick={() => { setIsLoggedIn(false); localStorage.removeItem('isLoggedIn'); }} className="text-xs font-bold text-slate-500 hover:text-red-400 transition-colors uppercase tracking-widest">Logout</button>
        </header>

        {/* カレンダーセクション */}
        <div className="bg-slate-900/50 rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden mb-8 p-2 backdrop-blur-xl">
          <Calendar onChange={setSelectedDate} onClickDay={handleDateClick} value={selectedDate} tileContent={tileContent} locale="ja-JP" calendarType="gregory" className="full-calendar" />
        </div>

        {/* 体組成入力・BMIセクション */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-slate-900/50 p-8 rounded-[2rem] border border-white/10 shadow-xl">
            <h3 className="text-xl font-bold text-blue-400 mb-6 flex items-center gap-3">
              <span className="p-2 bg-blue-500/10 rounded-lg text-sm">🏃‍♂️</span> CONDITION LOG
            </h3>
            <form onSubmit={handleBodyStatsSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div><label className="block text-[10px] font-black text-slate-500 mb-2 tracking-widest uppercase">Height (cm)</label><input type="number" step="0.1" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white" value={bodyStats.height} onChange={e => setBodyStats({...bodyStats, height: parseFloat(e.target.value) || 0})} /></div>
              <div><label className="block text-[10px] font-black text-slate-500 mb-2 tracking-widest uppercase">Weight (kg)</label><input type="number" step="0.1" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white" value={bodyStats.weight} onChange={e => setBodyStats({...bodyStats, weight: parseFloat(e.target.value) || 0})} /></div>
              <div><label className="block text-[10px] font-black text-slate-500 mb-2 tracking-widest uppercase">Body Fat (%)</label><input type="number" step="0.1" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white" value={bodyStats.body_fat} onChange={e => setBodyStats({...bodyStats, body_fat: parseFloat(e.target.value) || 0})} /></div>
              <button type="submit" className="sm:col-span-3 bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98]">SAVE DATA</button>
            </form>
          </div>
          <div className="bg-slate-900/50 p-8 rounded-[2rem] border border-white/10 flex flex-col justify-center items-center text-center shadow-xl">
            <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mb-2">Current BMI</p>
            <p className="text-6xl font-black text-white mb-2">{bmi}</p>
            <div className={`px-4 py-1 rounded-full text-[10px] font-bold ${bmi < 25 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
              {bmi < 18.5 ? 'UNDERWEIGHT' : bmi < 25 ? 'NORMAL' : 'OVERWEIGHT'}
            </div>
          </div>
        </div>

        {/* グラフセクション */}
        <div className="bg-slate-900/50 p-8 rounded-[2rem] border border-white/10 shadow-xl mb-8">
          <h3 className="text-xl font-bold text-blue-400 mb-8 flex items-center gap-3">
             <span className="p-2 bg-blue-500/10 rounded-lg text-sm">📈</span> PROGRESS CHART
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="date" tick={{fill: '#475569', fontSize: 10}} tickFormatter={(str) => str ? str.substring(5, 10).replace('-', '/') : ''} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" stroke="#3b82f6" tick={{fill: '#475569'}} domain={['dataMin - 1', 'dataMax + 1']} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#f472b6" tick={{fill: '#475569'}} domain={[0, 25]} axisLine={false} tickLine={false} />
                <Tooltip labelFormatter={(val) => val ? val.substring(0, 10) : ''} contentStyle={{backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px'}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                <Line yAxisId="left" type="monotone" dataKey="weight" name="体重" stroke="#3b82f6" strokeWidth={4} dot={{r: 4, fill: '#3b82f6', stroke: '#0f172a'}} connectNulls={true} />
                <Line yAxisId="right" type="monotone" dataKey="body_fat" name="体脂肪率" stroke="#f472b6" strokeWidth={4} dot={{r: 4, fill: '#f472b6', stroke: '#0f172a'}} connectNulls={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* タスク入力モーダル (重要：ファイル選択とプレビュー追加) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm text-slate-100">
            <div className="bg-slate-900 border border-white/10 w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl">
              <h2 className="text-2xl font-black text-white mb-6 tracking-tight uppercase">{editingId ? 'Edit Task' : 'New Task'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500/50 text-white font-bold" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Task Name" required />
                <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 h-24 outline-none focus:ring-2 focus:ring-blue-500/50 text-white" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details" />
                
                {/* 画像アップロードフィールド */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 tracking-widest uppercase">Photo (Training/Meal)</label>
                  <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed border-white/10 rounded-2xl bg-white/5 transition-all hover:border-blue-500/30">
                    {previewUrl ? (
                      <div className="relative w-full aspect-video overflow-hidden rounded-lg">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => { setSelectedFile(null); setPreviewUrl(null); }} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-xs">✕</button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs text-slate-500 mb-2">No photo selected</p>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="fileInput" />
                        <label htmlFor="fileInput" className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold py-2 px-4 rounded-full transition-all tracking-wider">SELECT FILE</label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-500 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all">SAVE</button>
                  {editingId && <button type="button" onClick={deleteTask} className="px-6 bg-red-900/20 text-red-500 rounded-2xl border border-red-500/20 font-bold transition-colors hover:bg-red-900/40">DELETE</button>}
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 bg-slate-800 text-slate-300 rounded-2xl font-bold hover:bg-slate-700 transition-colors">BACK</button>
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
