import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Supabase Site URL / Redirect URLs 와 포트를 맞춰야 OAuth 복귀가 됩니다.
    port: 3000,
    strictPort: true,
  },
})
