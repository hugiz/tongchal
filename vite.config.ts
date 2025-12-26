
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Vercel 빌드 시 process.env.API_KEY가 코드에 안전하게 주입되도록 설정
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    // 일부 라이브러리에서 요구할 수 있는 process 객체 정의
    'process.env': process.env
  },
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
