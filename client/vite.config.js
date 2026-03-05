import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default ({ mode }) => {
  process.env = {...process.env, ...loadEnv(mode, process.cwd())};
  return defineConfig({
    //base: `${process.env.VITE_BASE_URL === '/' ?'' :process.env.VITE_BASE_URL}`,
    plugins: [react()],
    server: {
      proxy: {
        '/api': 'http://localhost:3000'
      }
    },
    build: {
      outDir: './../webpub'
    }
  })
}

