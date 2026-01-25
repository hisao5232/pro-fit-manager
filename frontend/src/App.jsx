import { useState } from 'react'

function App() {
  const [status, setStatus] = useState('待機中...')

  const sendNotification = async () => {
    setStatus('送信中...')
    try {
      const response = await fetch('http://210.131.216.110:3001/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Reactのボタンから通知を送りました！' })
      })
      
      if (response.ok) {
        setStatus('送信成功！Discordを見てね。')
      } else {
        setStatus('エラーが発生しました。')
      }
    } catch (err) {
      setStatus('接続に失敗しました。')
    }
  }

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Pro-Fit Manager</h1>
      <div style={{ margin: '20px' }}>
        <p>ステータス: {status}</p>
        <button 
          onClick={sendNotification}
          style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
        >
          Discordに通知を送る
        </button>
      </div>
    </div>
  )
}

export default App
