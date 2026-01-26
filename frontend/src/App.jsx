import { useState, useEffect } from 'react'

function App() {
  const [status, setStatus] = useState('待機中...')
  const [message, setMessage] = useState('')
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
    if (!message) return alert('メッセージを入力してください');

    setStatus('送信中...')
    try {
      const response = await fetch(`${API_BASE}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message })
      })
      
      if (response.ok) {
        setStatus('送信成功！')
        setMessage('')
        fetchTasks() // 投稿後にリストを再取得して更新する
      } else {
        setStatus('エラーが発生しました。')
      }
    } catch (err) {
      setStatus('接続に失敗しました。')
    }
  }

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Pro-Fit Manager</h1>
      
      <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <p>ステータス: {status}</p>
        <form onSubmit={sendNotification}>
          <input 
            type="text" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="新しいタスクを入力"
            style={{ padding: '10px', width: '70%', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button type="submit" style={{ padding: '10px', marginLeft: '5px', backgroundColor: '#5865F2', color: 'white', border: 'none', borderRadius: '4px' }}>
            追加
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'left' }}>
        <h2>現在のタスク一覧</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
    {tasks.map(task => (
      <li 
    key={task.id} 
    onClick={() => toggleTask(task.id)}
    style={{ 
      padding: '10px', 
      borderBottom: '1px solid #eee', 
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'center', // 垂直中央揃え
      cursor: 'pointer',
      backgroundColor: task.is_completed ? '#f9f9f9' : 'transparent'
    }}
  >
    <div style={{ flex: 1 }}> {/* 文字部分を広げる */}
      <span style={{ 
        textDecoration: task.is_completed ? 'line-through' : 'none',
        color: task.is_completed ? '#aaa' : '#000',
        marginRight: '10px'
      }}>
        {task.content}
      </span>
      <br />
      <small style={{ color: '#888', fontSize: '10px' }}>
        {new Date(task.created_at).toLocaleString('ja-JP')}
      </small>
    </div>

    <button 
      onClick={(e) => deleteTask(e, task.id)}
      style={{ 
        backgroundColor: '#ff4d4d', 
        color: 'white', 
        border: 'none', 
        borderRadius: '4px', 
        padding: '5px 10px',
        cursor: 'pointer'
      }}
    >
      削除
    </button>
  </li>
    ))}
  </ul>
      </div>
    </div>
  )
}

export default App
