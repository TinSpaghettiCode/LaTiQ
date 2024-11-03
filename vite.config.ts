import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath } from 'url'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'src/client',
  publicDir: '../../public',
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true
  },
  server: {
    port: 3001,
    proxy: {
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/client')
    }
  },
  optimizeDeps: {
    exclude: ['mediasoup']
  }
})
