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

// 1. タスク取得 (期限の近い順、かつ新しく作った順)
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks ORDER BY due_date ASC, created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. タスク登録 (due_date を受け取るように修正)
app.post('/api/notify', async (req, res) => {
  // ★修正ポイント: due_date をしっかり受け取る
  const { content, description, due_date } = req.body;
  
  if (!content) {
    return res.status(400).json({ success: false, error: "内容は必須です" });
  }

  try {
    const dbResult = await pool.query(
      'INSERT INTO tasks (content, description, due_date) VALUES ($1, $2, $3) RETURNING *',
      [content, description || "", due_date || new Date()] 
    );

    if (process.env.DISCORD_WEBHOOK_URL) {
      fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `📝 **新規タスク**\n**期限:** ${due_date || '未設定'}\n**内容:** ${content}\n**詳細:** ${description || 'なし'}`
        })
      }).catch(err => console.error("Discord通知エラー:", err));
    }

    res.status(200).json({ success: true, task: dbResult.rows[0] });
  } catch (err) {
    console.error("POST Error:", err);
    res.status(500).json({ success: false, error: "サーバーエラー" });
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
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. タスクの更新 (UPDATE)
app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { content, description, due_date } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tasks SET content = $1, description = $2, due_date = $3 WHERE id = $4 RETURNING *',
      [content, description, due_date, id]
    );
    res.json({ success: true, task: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "更新失敗" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
