import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Served from https://ashokmn1.github.io/visual-flow-builder/ on GitHub Pages
  base: process.env.GITHUB_PAGES ? '/visual-flow-builder/' : '/',
})
