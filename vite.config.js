import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'u1.local.com+1-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'u1.local.com+1.pem')),
    },
    // The backend is running on 443, so the frontend should run on a different port.
    // The domain names (u1.local.com) map to 127.0.0.1.
    // The backend listens on 443.
    // The frontend listens on default 5173.
    // The browser will visit https://localhost:5173 (or similar) and send requests to https://u1.local.com:443.
    host: '0.0.0.0',
    port: 5173,
  }
})
