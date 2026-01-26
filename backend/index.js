const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = 3001;

// PostgreSQL接続設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

// タスク取得API (ToDoリストの表示用)
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// タスク登録API (DB保存 + Discord通知)
app.post('/api/notify', async (req, res) => {
  const { message } = req.body;
  
  try {
    // 1. データベースに保存
    const dbResult = await pool.query(
      'INSERT INTO tasks (content) VALUES ($1) RETURNING *',
      [message]
    );

    // 2. Discordに通知 (非同期で実行)
    fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `📝 **新しいタスクが登録されました**\n内容: ${message}`
      })
    }).catch(err => console.error("Discord通知エラー:", err));

    // 保存したデータをフロントエンドに返す
    res.status(200).json({ 
      success: true, 
      task: dbResult.rows[0],
      detail: "DB保存とDiscord通知が完了しました" 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "サーバーエラーが発生しました" });
  }
});

// タスクの完了状態を切り替えるAPI
app.patch('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // 現在の状態を反転させるSQL
    const result = await pool.query(
      'UPDATE tasks SET is_completed = NOT is_completed WHERE id = $1 RETURNING *',
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// タスクを削除するAPI
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ success: true, message: 'タスクを削除しました' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
