import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // 基本スタイル
import './calendar-custom.css'; // カスタムスタイル（後述）
import Login from './Login';

const API_BASE = import.meta.env.VITE_API_URL || 'https://pro-fit-api.go-pro-world.net/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (isLoggedIn) fetchTasks();
  }, [isLoggedIn]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tasks`);
      setTasks(res.data);
    } catch (err) { console.error(err); }
  };

  // カレンダーの各日付の下にタスクがあるかチェックして印をつける
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateString = date.toISOString().split('T')[0];
      const hasTask = tasks.some(t => t.due_date && t.due_date.slice(0, 10) === dateString);
      return hasTask ? <div className="dot"></div> : null;
    }
  };

  if (!isLoggedIn) return <Login onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 左側：カレンダーとコントロール */}
        <div className="lg:col-span-1 space-y-6">
          <header className="border-b border-white/5 pb-4">
            <h1 className="text-2xl font-black italic">PRO-FIT <span className="text-blue-500">OPS</span></h1>
          </header>

          <div className="bg-slate-900/50 p-4 rounded-3xl border border-white/10 shadow-2xl">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileContent={tileContent}
              locale="ja-JP"
              className="custom-calendar"
            />
          </div>
          
          <button 
            onClick={() => { setIsLoggedIn(false); localStorage.removeItem('isLoggedIn'); }}
            className="w-full py-3 text-xs font-bold text-slate-500 hover:text-red-400 border border-white/5 rounded-xl transition-all"
          >
            LOGOUT
          </button>
        </div>

        {/* 右側：選択した日のタスクリスト */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-blue-400">
              {selectedDate.toLocaleDateString('ja-JP')} のタスク
            </h2>
          </div>

          <div className="space-y-4">
            {tasks
              .filter(t => t.due_date && t.due_date.slice(0, 10) === selectedDate.toISOString().split('T')[0])
              .map(task => (
                <div key={task.id} className="bg-white/5 p-5 rounded-2xl border border-white/5 border-l-4 border-l-blue-500">
                  <h3 className="font-bold text-white">{task.content}</h3>
                  {task.description && <p className="text-sm text-slate-400 mt-2">{task.description}</p>}
                </div>
              ))}
            {tasks.filter(t => t.due_date && t.due_date.slice(0, 10) === selectedDate.toISOString().split('T')[0]).length === 0 && (
              <p className="text-slate-600 italic py-10 text-center border-2 border-dashed border-white/5 rounded-2xl">
                この日の予定はありません
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;

