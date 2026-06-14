import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 8000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('react-icons')) {
            return 'icons';
          }

          if (id.includes('@supabase/supabase-js')) {
            return 'supabase';
          }

          if (id.includes('react-router')) {
            return 'router';
          }

          if (id.includes('react')) {
            return 'react-vendor';
          }

          return 'vendor';
        },
      },
    },
  },
});
