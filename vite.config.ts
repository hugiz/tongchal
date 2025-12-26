import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Vercel 환경 변수 process.env.API_KEY를 클라이언트 코드에 안전하게 주입
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env': '({})' // 빈 객체 폴리필로 런타임 에러 방지
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