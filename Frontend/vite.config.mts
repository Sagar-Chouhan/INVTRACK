import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/framer-motion')) return 'motion-vendor'
          if (id.includes('node_modules/lucide-react')) return 'icons-vendor'
          if (id.includes('node_modules/axios')) return 'network-vendor'
        },
      },
    },
  },
})
