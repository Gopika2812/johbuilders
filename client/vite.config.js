import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: ['es2020', 'safari14', 'chrome87', 'firefox78', 'edge88'],
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('exceljs') || id.includes('xlsx-js-style') || id.includes('file-saver')) {
              return 'excel-vendor';
            }
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf-vendor';
            }
            if (id.includes('three') || id.includes('@react-three')) {
              return 'three-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
          }
        }
      }
    }
  }
})
