import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Build-time guard: abort if any secret-only env var is accidentally
 * prefixed with VITE_ (which would embed it in the client bundle).
 */
function secretKeyGuard() {
  return {
    name: 'secret-key-guard',
    configResolved(config) {
      const dangerous = ['STRIPE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'STRIPE_WEBHOOK_SECRET'];
      const env = config.env;
      for (const key of Object.keys(env)) {
        if (dangerous.some((dk) => key === `VITE_${dk}` || key === dk)) {
          // VITE_STRIPE_SECRET_KEY in client bundle = critical leak
          if (key.startsWith('VITE_') && dangerous.some((dk) => key === `VITE_${dk}`)) {
            throw new Error(
              `SECURITY: "${key}" must NOT have the VITE_ prefix. ` +
              `Secret keys prefixed with VITE_ are embedded in the client bundle and visible to every user.`
            );
          }
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), secretKeyGuard()],
  server: {
    port: 8000,
  },
  build: {
    chunkSizeWarningLimit: 500,
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
