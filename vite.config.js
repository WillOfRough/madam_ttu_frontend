import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// 로컬 npm run dev 의 백엔드 폴백은 .env.development 의 VITE_API_BASE_URL 로 관리.
// 개발자별 오버라이드는 .env.development.local (gitignore).
// branch 분기 없는 단일 파일로 운영한다.
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_BASE_URL || ''

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
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
  }
})
