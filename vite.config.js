import { defineConfig } from 'vite';

export default defineConfig({
  // Development server
  server: {
    port: 3000,
    open: true,
    host: true
  },
  
  // Build optimization
  build: {
    target: 'esnext', // Required for @dimforge/rapier3d-compat WASM + top-level await
    minify: 'terser',
    sourcemap: true,
    
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for debugging
        drop_debugger: true
      }
    },
    
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'cannon': ['cannon-es'],
          'systems': [
            './src/systems/AudioSystem.js',
            './src/systems/ParticleSystem.js',
            './src/systems/HitZoneSystem.js',
            './src/systems/RangedWeaponSystem.js'
          ]
        }
      }
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000
  },
  
  // Asset handling
  assetsInclude: ['**/*.fbx', '**/*.glb', '**/*.gltf', '**/*.wasm'],
  
  // Optimization
  optimizeDeps: {
    include: ['three', 'cannon-es', 'howler', 'stats.js', 'tweakpane'],
    exclude: ['@dimforge/rapier3d-compat'] // Let rapier handle its own WASM loading
  },
  
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  }
});
