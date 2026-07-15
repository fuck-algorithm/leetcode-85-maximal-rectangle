import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/leetcode-85-maximal-rectangle/',
  server: {
    port: 54321
  }
})
