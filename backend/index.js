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

// 1. タスク取得 (期限の近い順、かつ作成順)
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

// 2. タスク登録 (即時通知を削除)
app.post('/api/notify', async (req, res) => {
  const { content, description, due_date } = req.body;
  
  if (!content) {
    return res.status(400).json({ success: false, error: "内容は必須です" });
  }

  try {
    const dbResult = await pool.query(
      'INSERT INTO tasks (content, description, due_date) VALUES ($1, $2, $3) RETURNING *',
      [content, description || "", due_date || new Date()] 
    );
    // 即時通知は不要とのことなので、ここでの Discord 通知処理は削除しました
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

// 5. タスクの更新
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

// 6. 毎朝5時半の通知用エンドポイント (cronから叩かれる)
app.get('/api/daily-report', async (req, res) => {
  try {
    // スウェーデン語(sv-SE)ロケールを使うと YYYY-MM-DD 形式が簡単に取得できます
    const today = new Date().toLocaleDateString('sv-SE');
    
    const result = await pool.query(
      'SELECT content, description FROM tasks WHERE due_date = $1',
      [today]
    );

    if (result.rows.length > 0) {
      const taskList = result.rows.map(t => `🔹 **${t.content}**\n${t.description || '詳細なし'}`).join('\n\n');
      
      if (process.env.DISCORD_WEBHOOK_URL) {
        await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🌅 **本日のタスク予定 (${today})**\n\n${taskList}`
          })
        });
        res.json({ success: true, message: "通知を送信しました" });
      } else {
        res.status(400).json({ error: "Webhook URLが設定されていません" });
      }
    } else {
      res.json({ success: true, message: "本日の予定はありません" });
    }
  } catch (err) {
    console.error("Daily Report Error:", err);
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

// 体組成データの取得（最新30日分など）
app.get('/api/body-stats', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM body_stats ORDER BY date DESC LIMIT 30');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 体組成データ、30m走の記録保存
app.post('/api/body-stats', async (req, res) => {
  const { height, weight, body_fat, sprint_time, steps, date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO body_stats (height, weight, body_fat, sprint_time, steps, date) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (date) DO UPDATE 
       SET height = EXCLUDED.height, weight = EXCLUDED.weight, 
           body_fat = EXCLUDED.body_fat, sprint_time = EXCLUDED.sprint_time, 
           steps = EXCLUDED.steps
       RETURNING *`,
      [height, weight, body_fat, sprint_time, steps, date]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
