const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = 3001;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

// 1. タスク取得 (詳細も含む全カラムを返す)
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. タスク登録 (詳細 description を保存する方に一本化)
app.post('/api/notify', async (req, res) => {
  const { message, description } = req.body;
  
  try {
    const dbResult = await pool.query(
      'INSERT INTO tasks (content, description) VALUES ($1, $2) RETURNING *',
      [message, description]
    );

    // Discord通知
    fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `📝 **新しいタスク**\n内容: ${message}\n詳細: ${description || 'なし'}`
      })
    }).catch(err => console.error("Discord通知エラー:", err));

    res.status(200).json({ success: true, task: dbResult.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "サーバーエラーが発生しました" });
  }
});

// 3. 完了状態の切り替え
app.patch('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE tasks SET is_completed = NOT is_completed WHERE id = $1 RETURNING *',
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. 削除
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
