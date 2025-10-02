import axios from 'axios'

function inferBackendBase() {
  const env = import.meta.env.VITE_BACKEND_URL
  if (env) return env.replace(/\/$/, '')
  const { protocol, hostname } = window.location
  const port = (typeof __VITE_BACKEND_PORT__ !== 'undefined' ? __VITE_BACKEND_PORT__ : 3002)
  return `${protocol}//${hostname}:${port}`
}

const baseURL = inferBackendBase()

const api = axios.create({
  baseURL,
  timeout: 20000
})

export default api
