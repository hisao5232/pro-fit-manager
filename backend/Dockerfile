# 軽量なNode.jsイメージを使用
FROM node:20-slim

# コンテナ内の作業ディレクトリを設定
WORKDIR /app

# 依存関係ファイルをコピー（キャッシュ効率化のため）
COPY package*.json ./

# npmでパッケージをインストール
RUN npm install

# ソースコードをコピー
COPY . .

# アプリケーションを起動
# node --watch はNode.js 20以降で使える便利なホットリロード機能です
CMD ["node", "--watch", "index.js"]
