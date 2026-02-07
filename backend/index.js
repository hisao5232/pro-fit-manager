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

// --- タスク関連 ---
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY due_date ASC, created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/notify', async (req, res) => {
  const { content, description, due_date } = req.body;
  if (!content) return res.status(400).json({ success: false, error: "内容は必須です" });
  try {
    const dbResult = await pool.query(
      'INSERT INTO tasks (content, description, due_date) VALUES ($1, $2, $3) RETURNING *',
      [content, description || "", due_date || new Date()]
    );
    res.status(200).json({ success: true, task: dbResult.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: "サーバーエラー" }); }
});

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { content, description, due_date } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tasks SET content = $1, description = $2, due_date = $3 WHERE id = $4 RETURNING *',
      [content, description, due_date, id]
    );
    res.json({ success: true, task: result.rows[0] });
  } catch (err) { res.status(500).json({ error: "更新失敗" }); }
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- デイリーレポート（Discord通知）---
app.get('/api/daily-report', async (req, res) => {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return res.status(500).json({ error: "Webhook URLが設定されていません" });

    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    const result = await pool.query(
      'SELECT content, description FROM tasks WHERE due_date::date = $1',
      [today]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, message: "本日の予定はありません" });
    }

    const taskList = result.rows.map(t => `- **${t.content}**: ${t.description || '詳細なし'}`).join('\n');
    
    // axios.post の代わりに標準の fetch を使用
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `### 📅 本日のトレーニング・タスク (${today})\n${taskList}`
      })
    });

    if (!response.ok) throw new Error(`Discord API error: ${response.status}`);

    res.json({ success: true, message: "通知を送信しました" });
  } catch (err) {
    console.error("Daily report error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- 体組成・トレーニング記録関連 ---
app.get('/api/body-stats', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM body_stats ORDER BY date DESC LIMIT 30');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/body-stats', async (req, res) => {
  const { height, weight, body_fat, date, train_upper, train_core, train_lower } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO body_stats (height, weight, body_fat, date, train_upper, train_core, train_lower)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (date) DO UPDATE
       SET height = COALESCE(EXCLUDED.height, body_stats.height),
           weight = COALESCE(EXCLUDED.weight, body_stats.weight),
           body_fat = COALESCE(EXCLUDED.body_fat, body_stats.body_fat),
           train_upper = COALESCE(EXCLUDED.train_upper, body_stats.train_upper),
           train_core = COALESCE(EXCLUDED.train_core, body_stats.train_core),
           train_lower = COALESCE(EXCLUDED.train_lower, body_stats.train_lower)
       RETURNING *`,
      [height, weight, body_fat, date, train_upper, train_core, train_lower]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("body-stats error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
