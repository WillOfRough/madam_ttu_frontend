import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://love-soul-265481232089.asia-northeast3.run.app',
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: 'localhost',
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
})
