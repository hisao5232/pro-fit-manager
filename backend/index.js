// backend/index.js
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

async function sendTestNotification() {
    console.log("Discord通知を送信中...");
    
    try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: "🚀 **Pro-Fit Manager 起動テスト**\nhisaoさん、VPS上のコンテナから通知に成功しました！"
            })
        });

        if (response.ok) {
            console.log("通知成功！Discordを確認してください。");
        } else {
            console.error("通知失敗:", response.statusText);
        }
    } catch (error) {
        console.error("エラーが発生しました:", error);
    }
}

// 起動時に1回だけ実行
sendTestNotification();

// コンテナを落とさないためのダミー待機
setInterval(() => {}, 1000);
