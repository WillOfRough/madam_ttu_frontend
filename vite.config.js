import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// 환경: prd (운영) - 로컬 npm run dev 폴백은 love-soul
// 이 파일은 prd 브랜치 전용 값을 가지며 dev 브랜치와는 머지하지 말 것.
// .gitattributes 의 -merge 속성이 자동 머지를 차단함.
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_BASE_URL || 'https://love-soul-265481232089.asia-northeast3.run.app'

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
