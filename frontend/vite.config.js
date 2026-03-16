import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // .envファイルを探すディレクトリを一つ上のルートディレクトリに指定
  envDir: '../', 
  server: {
    host: true,
    port: 5173,
  }
})
