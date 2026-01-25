const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

const PORT = 3001;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

app.use(cors()); // 追加：すべてのドメインからのアクセスを許可（開発用）
// JSON形式のリクエストを解析できるようにする
app.use(express.json());

// テスト用エンドポイント (http://localhost:3001/ へのアクセス確認)
app.get('/', (req, res) => {
    res.send('Pro-Fit Manager API is running!');
});

// Discord通知用エンドポイント
app.post('/api/notify', async (req, res) => {
    const { message } = req.body;
    
    console.log("Discord通知リクエストを受信:", message);

    try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: message || "デフォルトの通知メッセージです。"
            })
        });

        if (response.ok) {
            res.status(200).json({ success: true, detail: "Discordに送信しました" });
        } else {
            res.status(500).json({ success: false, detail: "Discord送信に失敗しました" });
        }
    } catch (error) {
        res.status(500).json({ success: false, detail: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
