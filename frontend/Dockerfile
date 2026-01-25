FROM node:20-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Viteのデフォルトポート
EXPOSE 5173

# Viteを起動。--host 0.0.0.0 を指定しないとコンテナ外（VPS）からアクセスできません
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
