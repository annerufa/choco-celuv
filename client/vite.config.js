import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['xlsx'],
    include: ['recharts'],   // ← tambah ini
  },
  build: {
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            { name: 'leaflet', test: /node_modules\/leaflet/ },
            { name: 'react-leaflet', test: /node_modules\/(react-leaflet|@react-leaflet)/ },
            { name: 'vendor', test: /node_modules\/(react|react-dom)/ },
            { name: 'xlsx', test: /node_modules\/xlsx/ },
          ]
        }
      }
    }
  }
})