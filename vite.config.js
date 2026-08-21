import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from "path";

export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      // Yeh line "@" ko "src" folder se jodti hai
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
      },
      '/assets': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});