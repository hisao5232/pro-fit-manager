# Pro-Fit Manager

## 概要
「Pro-Fit Manager」は、建設機械修理エンジニアとしてのタスク管理と、サッカー・筋トレのための体組成・スケジュール管理を統合したプライベート・マネージャーです。
Node.js (API) と React (Frontend) を Docker 環境で構築し、Discord Webhook を通じてリアルタイムな通知を行います。

## 技術スタック
- **Frontend:** React (Vite) / JavaScript
- **Backend:** Node.js (Express)
- **Database:** PostgreSQL 16
- **Infra:** Docker / Docker Compose
- **Deployment:** Ubuntu 24.04 (Xserver VPS) / Cloudflare

## ディレクトリ構成
- `backend/`: Node.js API サーバ
- `frontend/`: React フロントエンド
- `db-data/`: PostgreSQL 永続化データ（Git管理除外）

## セットアップ
1. リポジトリをクローン
2. ルートディレクトリに `.env` ファイルを作成し、以下の項目を設定
   ```env
   DB_USER=your_user
   DB_PASSWORD=your_password
   DB_NAME=profit_db
   DISCORD_WEBHOOK_URL=your_webhook_url
   ```

   Docker Compose で起動

Bash```
docker compose up --build
```
## 今後の実装予定
- [ ] PostgreSQL を利用した体重・体組成の記録機能

- [ ] Discord へのスケジュールリマインド機能

- [ ] React によるデータ可視化グラフの作成
