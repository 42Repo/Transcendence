import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

const nginxHttpsPort = process.env.NGINX_HTTPS_PORT;
const hmrClientPort = nginxHttpsPort ? parseInt(nginxHttpsPort, 10) : 443;

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
      clientPort: hmrClientPort,
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
