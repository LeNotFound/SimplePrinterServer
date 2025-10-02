import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
import path from 'path'

function loadRootConfig() {
  const root = path.resolve(__dirname, '..')
  const p = path.join(root, 'config.json')
  if (fs.existsSync(p)) {
    try { return JSON.parse(fs.readFileSync(p, 'utf-8')) } catch {}
  }
  return { backendPort: 3002, frontendPort: 3003 }
}

const rootConf = loadRootConfig()

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue()],
    server: {
      port: Number(env.PORT || rootConf.frontendPort || 3003),
      host: true
    },
    define: {
      __VITE_BACKEND_PORT__: JSON.stringify(Number(env.VITE_BACKEND_PORT || rootConf.backendPort || 3002))
    }
  }
})
