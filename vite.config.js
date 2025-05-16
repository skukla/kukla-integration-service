import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';

export default defineConfig(({ command }) => ({
  root: 'web-src',
  base: './',
  
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        bundle: resolve(__dirname, 'web-src/index.html')
      },
      output: {
        manualChunks: {
          spectrum: [
            '@spectrum-css/tokens',
            '@spectrum-css/page',
            '@spectrum-css/button',
            '@spectrum-css/table',
            '@spectrum-css/typography',
            '@spectrum-css/icon',
            '@spectrum-css/dialog',
            '@spectrum-css/buttongroup',
            '@spectrum-css/progresscircle'
          ]
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: command === 'build',
        drop_debugger: command === 'build'
      }
    }
  },

  css: {
    devSourcemap: true,
    modules: {
      scopeBehaviour: 'local'
    },
    postcss: {
      plugins: []
    }
  },

  server: {
    port: 9080,
    strictPort: true,
    host: true,
    open: true,
    hmr: {
      overlay: true
    }
  },

  preview: {
    port: 9080,
    strictPort: true,
    host: true
  },

  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
      modernPolyfills: true
    })
  ],

  optimizeDeps: {
    include: ['htmx.org']
  }
})); 