import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  // 👇 Ensures SPA fallback routing (for Render & similar hosts)
  server: {
    historyApiFallback: true,
  }
})
