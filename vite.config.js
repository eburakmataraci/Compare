import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    port: 5175, // doluysa Vite otomatik 5176/5177'ye geçer — sorun değil
    proxy: {
      '/api': { target: 'http://localhost:8787', changeOrigin: true },
      '/img': { target: 'http://localhost:8787', changeOrigin: true }, // 👈 önemli
    },
  },
})
