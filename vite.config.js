import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom domain (opportunistic.online) serves at site root.
export default defineConfig({
  plugins: [react()],
  base: '/',
})
