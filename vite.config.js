import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';

export default defineConfig(({ command, mode }) => ({
  root: resolve(__dirname, 'web-src'),
  base: './',
  
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: mode === 'development',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'web-src/index.html')
      },
      output: {
        manualChunks(id) {
          if (id.includes('design-system')) {
            return 'design-system';
          }
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (/\.(css)$/.test(name ?? '')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          if (/\.(png|jpe?g|gif|svg|ico)$/.test(name ?? '')) {
            return 'assets/images/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
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
      localsConvention: 'camelCase',
      generateScopedName: mode === 'production' 
        ? '[hash:base64:8]' 
        : '[name]__[local]__[hash:base64:5]',
      exclude: '**/design-system/**'
    }
  },

  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'actions/shared'),
      '@frontend': resolve(__dirname, 'actions/frontend'),
      '@backend': resolve(__dirname, 'actions/backend'),
      '@': resolve(__dirname, 'web-src/src'),
      '@styles': resolve(__dirname, 'web-src/src/styles'),
      '@js': resolve(__dirname, 'web-src/src/js'),
      '@components': resolve(__dirname, 'web-src/src/components'),
    }
  },

  server: {
    port: 9080,
    strictPort: true,
    host: true,
    open: true,
    hmr: {
      overlay: true
    },
    watch: {
      include: [
        'web-src/src/**',
        'web-src/index.html'
      ]
    }
  },

  preview: {
    port: 9080,
    strictPort: true,
    host: true
  },

  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],

  optimizeDeps: {
    include: [
      'htmx.org',
      'hyperscript.org'
    ]
  }
})); 