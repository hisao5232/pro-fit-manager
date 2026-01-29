const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = 3001;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// CORS設定（すべてのオリジンを許可）
app.use(cors());
app.use(express.json());

// 1. タスク取得
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/tasks Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. タスク登録 (フロントエンドの content と名称を統一)
app.post('/api/notify', async (req, res) => {
  // フロントエンドから送られてくる名前 'content' で受け取る
  const { content, description } = req.body;
  
  // バリデーション: contentが空の場合はエラーを返す
  if (!content) {
    return res.status(400).json({ success: false, error: "内容(content)は必須です" });
  }

  try {
    // DB保存
    const dbResult = await pool.query(
      'INSERT INTO tasks (content, description) VALUES ($1, $2) RETURNING *',
      [content, description || ""]
    );

    // Discord通知 (fetchが使えないNodeバージョンの場合は、axios等への差し替えが必要ですがNode 18+なら動きます)
    if (process.env.DISCORD_WEBHOOK_URL) {
      fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `📝 **新しいタスクを追加しました**\n**内容:** ${content}\n**詳細:** ${description || 'なし'}`
        })
      }).catch(err => console.error("Discord通知エラー:", err));
    }

    res.status(200).json({ success: true, task: dbResult.rows[0] });
  } catch (err) {
    console.error("POST /api/notify Error:", err);
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
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "タスクが見つかりません" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. 削除
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "タスクが見つかりません" });
    }
    res.json({ success: true, message: 'タスクを削除しました' });
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

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "タスクが見つかりません" });
    }

    res.json({ success: true, task: result.rows[0] });
  } catch (err) {
    console.error("UPDATE Error:", err);
    res.status(500).json({ error: "サーバーエラーで更新できませんでした" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
