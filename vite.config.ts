import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'https://grocyprobackend-2.onrender.com',
            changeOrigin: true,
            secure: true,
            configure: (proxy) => {
              proxy.on('error', (err) => {
                console.log('Proxy error:', err.message);
              });
            },
          },
          '/uploads': {
            target: 'https://grocyprobackend-2.onrender.com',
            changeOrigin: true,
            secure: true,
          },
        },
      },
      plugins: [
        react(),
        tailwindcss(),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
