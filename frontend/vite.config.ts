import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
      tailwindcss(),
    ],
    server: {
    host: '0.0.0.0',
    port: 5173,
    historyApiFallback: true,
    strictPort: true,
    hmr: {
      clientPort: 443,
      protocol: 'wss'
    },
    watch: {
       usePolling: true,
     }
  },
  build: {
    outDir: 'dist',
  },
});
