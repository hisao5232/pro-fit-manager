import { useState, useEffect } from 'react'
import './App.css' // CSSをインポート

function App() {
  const [status, setStatus] = useState('待機中...')
  const [message, setMessage] = useState('')
  const [description, setDescription] = useState('') // 詳細用のState
  const [tasks, setTasks] = useState([]) // タスク一覧を保持する

  const API_BASE = 'http://210.131.216.110:3001/api'

  const toggleTask = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PATCH',
      })
      if (response.ok) {
        fetchTasks() // 状態が変わったので再取得
      }
    } catch (err) {
      console.error('更新失敗:', err)
    }
  }

  const deleteTask = async (e, id) => {
    e.stopPropagation(); // 親要素のonClick（完了切り替え）が動かないようにする
    if (!window.confirm('このタスクを削除しますか？')) return;

    try {
      const response = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchTasks()
      }
    } catch (err) {
      console.error('削除失敗:', err)
    }
  }

  // タスク一覧を取得する関数
  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE}/tasks`)
      const data = await response.json()
      setTasks(data)
    } catch (err) {
      console.error('データ取得失敗:', err)
    }
  }

  // 初回読み込み時に実行
  useEffect(() => {
    fetchTasks()
  }, [])

  const sendNotification = async (e) => {
    e.preventDefault();
    if (!message) return alert('タスク名を入力してください');

    setStatus('送信中...')
    try {
      const response = await fetch(`${API_BASE}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, description }) // descriptionを送る
      })
      
      if (response.ok) {
        setStatus('送信成功！')
        setMessage(''); setDescription(''); // 入力欄をクリア
        fetchTasks()
      }
    } catch (err) {
      setStatus('接続失敗')
    }
  }

  return (
    <div className="container">
      <h1>Pro-Fit Manager</h1>
      
      <form onSubmit={sendNotification} className="input-group">
        <input 
          type="text" 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="タスク名"
        />
        {/* 詳細入力用のtextareaを追加 */}
        <textarea 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="詳細"
          className="input-description"
        />
        <button type="submit" className="add-btn">タスク追加</button>
      </form>

      <ul className="task-list">
  {tasks.map(task => (
    <li key={task.id} className="task-item">
      <div className="task-content" onClick={() => toggleTask(task.id)}>
        {/* タスク名 */}
        <span className={`task-text ${task.is_completed ? 'completed' : ''}`}>
          {task.content}
        </span>

        {/* 詳細内容：データがある場合のみ表示 */}
        {task.description && (
          <div className="task-desc-display">
            {task.description}
          </div>
        )}

        <span className="task-date">
          {new Date(task.created_at).toLocaleString('ja-JP')}
        </span>
      </div>
      
      <button className="del-btn" onClick={(e) => deleteTask(e, task.id)}>
        削除
      </button>
    </li>
  ))}
</ul>
    </div>
  )
}

export default App
