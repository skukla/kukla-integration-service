import { resolve } from 'path';

import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env file based on mode in case we need it later
  loadEnv(mode, process.cwd());

  // Determine if we're in production
  const isProduction = mode === 'production';

  return {
    root: resolve(__dirname, 'web-src'),
    base: './',

    build: {
      outDir: resolve(__dirname, 'dist'),
      emptyOutDir: true,
      sourcemap: !isProduction,
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'web-src/index.html'),
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
          },
        },
      },
      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          }
        : undefined,
    },

    css: {
      devSourcemap: !isProduction,
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: isProduction ? '[hash:base64:8]' : '[name]__[local]__[hash:base64:5]',
        exclude: '**/design-system/**',
      },
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
      },
    },

    server: {
      port: 3000,
      strictPort: true,
      host: true,
      open: true,
      hmr: {
        overlay: true,
      },
      watch: {
        include: ['web-src/src/**', 'web-src/index.html'],
      },
    },

    preview: {
      port: 3000,
      strictPort: true,
      host: true,
    },

    optimizeDeps: {
      include: ['htmx.org', 'hyperscript.org'],
    },

    // Define environment variables
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.VITE_APP_ENV': JSON.stringify(mode),
    },
  };
});
