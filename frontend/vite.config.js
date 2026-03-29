import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '^/(register|token|users|profile|resume-upload|industry-roles|skill-gap|admin|health)': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});
