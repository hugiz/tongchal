import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Vercel 환경 변수를 클라이언트 코드에서 process.env로 접근 가능하게 매핑
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env': '({})' // 빈 객체로 폴리필하여 에러 방지
  },
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});