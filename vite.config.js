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
    target: 'es2015',
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
          'howler': ['howler'],
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
  assetsInclude: ['**/*.fbx', '**/*.glb', '**/*.gltf'],
  
  // Optimization
  optimizeDeps: {
    include: ['three', 'cannon-es', 'howler', 'stats.js', 'tweakpane']
  },
  
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  }
});
