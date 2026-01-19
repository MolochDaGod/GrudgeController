# 🏆 Best Practices Setup Guide - Production Ready

## ✅ What Was Installed & Created

### **Packages Installed**
```bash
✅ cannon-es        - Physics engine
✅ stats.js         - Performance monitoring  
✅ tweakpane        - Live value tuning
✅ howler           - 3D audio system
✅ eslint           - Code linting
✅ prettier         - Code formatting
✅ vitest           - Testing framework
✅ @vitest/ui       - Test UI
```

### **New Systems Created**
```
src/
├── systems/
│   ├── AudioSystem.js        ✅ 3D audio with pooling
│   ├── ParticleSystem.js     ✅ Efficient particle effects
│   ├── HitZoneSystem.js      ✅ Location-based damage
│   ├── RangedWeaponSystem.js ✅ Ranged combat
│   └── AnimationMapper.js    ✅ Multi-pack animation mapping
├── utils/
│   └── ObjectPool.js         ✅ Performance optimization
```

### **Configuration Files**
```
✅ .eslintrc.json      - Code quality rules
✅ .prettierrc.json    - Formatting rules  
✅ vite.config.js      - Build optimization
✅ tests/              - Example test files
```

---

## 🎯 New npm Scripts

### Development
```bash
npm run dev          # Start dev server (port 3000)
npm start            # Same as dev
npm run serve        # HTTP server (port 8080)
```

### Testing
```bash
npm test             # Run tests in watch mode
npm run test:ui      # Open test UI in browser
npm run test:run     # Run tests once (CI mode)
```

### Code Quality
```bash
npm run lint         # Check code for errors
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format all code
npm run format:check # Check formatting
```

### Build & Preview
```bash
npm run build        # Production build
npm run preview      # Preview production build
```

---

## 🎨 AudioSystem Usage

### Quick Start
```javascript
import { AudioSystem } from './systems/AudioSystem.js';

// Initialize
const audio = new AudioSystem();
await audio.initialize(); // Call after user interaction

// Load sounds
await audio.loadSound('sword_hit', '/sounds/sword_hit.mp3', {
  category: 'sfx',
  pool: 5,
  spatial: true  // 3D positional audio
});

// Play sound
audio.play('sword_hit', {
  position: [x, y, z],
  volume: 0.8
});

// Update listener position (every frame)
audio.updateListener(camera.position, cameraForward);
```

### Sound Categories
```javascript
audio.setVolume('master', 0.8);  // Master volume
audio.setVolume('sfx', 0.7);     // Sound effects
audio.setVolume('music', 0.5);   // Background music
audio.setVolume('ui', 0.6);      // UI sounds
audio.setVolume('ambient', 0.4); // Ambient sounds
audio.setVolume('voice', 1.0);   // Voice lines
```

### Music System
```javascript
// Play background music with crossfade
await audio.playMusic('combat_music', 2000); // 2s fade in

// Stop music
audio.stopMusic(1500); // 1.5s fade out

// Mute/unmute
audio.toggleMute();
```

---

## 💥 ParticleSystem Usage

### Quick Start
```javascript
import { ParticleSystem } from './systems/ParticleSystem.js';

// Initialize
const particles = new ParticleSystem(scene);

// Update every frame
particles.update(deltaTime);
```

### Emit Effects
```javascript
// Blood spray (on hit)
particles.emitBlood(position, direction, intensity);

// Sparks (metal hits, blocks)
particles.emitSparks(position, direction, count);

// Dust cloud (rolls, falls)
particles.emitDust(position, count);

// Magic effects
particles.emitMagic(position, 0x00FFFF, count);

// Impact ring
particles.emitImpact(position, normal);
```

### Custom Particles
```javascript
particles.emit('blood', position, {
  count: 20,
  speed: 5,
  spread: Math.PI / 3,
  direction: new THREE.Vector3(0, 1, 0),
  gravity: -15,
  color: 0x8B0000,
  scale: 1.5
});
```

---

## 🎯 ObjectPool Usage

### Basic Usage
```javascript
import { ObjectPool } from './utils/ObjectPool.js';

// Create pool
const projectilePool = new ObjectPool(
  () => createProjectile(),  // Factory function
  100,                        // Initial size
  200                         // Max size
);

// Acquire object
const projectile = projectilePool.acquire();

// Use object...
projectile.position.set(x, y, z);

// Release when done
projectilePool.release(projectile);
```

### Three.js Objects
```javascript
import { ThreeObjectPool } from './utils/ObjectPool.js';

const meshPool = new ThreeObjectPool(
  () => new THREE.Mesh(geometry, material),
  50
);

// Automatically handles disposal
meshPool.dispose(); // Cleans up all objects
```

### Pool Manager
```javascript
import { PoolManager } from './utils/ObjectPool.js';

const poolManager = new PoolManager();

// Create multiple pools
poolManager.createPool('projectiles', () => createProjectile(), 100);
poolManager.createPool('particles', () => createParticle(), 200);

// Use pools
const proj = poolManager.acquire('projectiles');
poolManager.release('projectiles', proj);

// Get stats
console.log(poolManager.getAllStats());
```

---

## 🧪 Testing

### Running Tests
```bash
# Watch mode (runs on file change)
npm test

# UI mode (visual test runner)
npm run test:ui

# Run once (for CI/CD)
npm run test:run
```

### Writing Tests
```javascript
// tests/MySystem.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { MySystem } from '../src/systems/MySystem.js';

describe('MySystem', () => {
  let system;
  
  beforeEach(() => {
    system = new MySystem();
  });
  
  it('should do something', () => {
    const result = system.doSomething();
    expect(result).toBe(expected);
  });
});
```

### Test Coverage
```bash
# Add to package.json scripts:
"test:coverage": "vitest run --coverage"

# Install coverage tool:
npm install --save-dev @vitest/coverage-v8
```

---

## 📝 Code Quality Workflow

### Pre-commit Checklist
```bash
1. npm run lint:fix      # Fix linting issues
2. npm run format        # Format code
3. npm test              # Run tests
4. git add .
5. git commit -m "feat: your message"
```

### VSCode Integration
Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript"]
}
```

### Recommended VSCode Extensions
- **ESLint** - dbaeumer.vscode-eslint
- **Prettier** - esbenp.prettier-vscode
- **Vitest** - ZixuanChen.vitest-explorer

---

## 🔧 Vite Configuration

### Environment Variables
Create `.env` file:
```env
# Development
VITE_DEBUG_MODE=true
VITE_PHYSICS_DEBUG=false
VITE_SHOW_STATS=true

# API (if needed)
VITE_API_URL=http://localhost:3001
```

Use in code:
```javascript
if (import.meta.env.VITE_DEBUG_MODE === 'true') {
  console.log('Debug mode enabled');
}
```

### Build Optimization
Already configured in `vite.config.js`:
- ✅ Code splitting (separate chunks for three, cannon, howler)
- ✅ Tree shaking
- ✅ Minification (Terser)
- ✅ Source maps for debugging
- ✅ Asset optimization

---

## 🎮 Complete Integration Example

```javascript
// main.js - Production setup
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import Stats from 'stats.js';
import { Pane } from 'tweakpane';

// Systems
import { AudioSystem } from './systems/AudioSystem.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { HitZoneSystem } from './systems/HitZoneSystem.js';
import { RangedWeaponSystem } from './systems/RangedWeaponSystem.js';
import { RacalvinController } from './systems/RacalvinController.js';
import { PoolManager } from './utils/ObjectPool.js';

// Initialize core
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// Physics
const physicsWorld = new CANNON.World({ gravity: new CANNON.Vec3(0, -25, 0) });

// Systems
const audio = new AudioSystem();
const particles = new ParticleSystem(scene);
const hitZones = new HitZoneSystem();
const ranged = new RangedWeaponSystem(scene, camera);
const pools = new PoolManager();
const controller = new RacalvinController();

// Debug tools
const stats = new Stats();
document.body.appendChild(stats.dom);

const pane = new Pane();
pane.addInput(controller.config, 'cameraDistance', { min: 3, max: 15 });
pane.addInput(controller.config, 'maxSpeed', { min: 1, max: 20 });

// Initialize
async function init() {
  // Audio (after user interaction)
  await audio.initialize();
  await audio.preloadDefaultSounds();
  
  // Setup hit zones
  hitZones.createHitZones('player', playerMesh, physicsWorld);
  
  // Setup pools
  pools.createPool('projectiles', () => createProjectile(), 50);
  pools.createPool('damage_numbers', () => createDamageNumber(), 20);
  
  // Start game loop
  animate();
}

// Game loop
function animate() {
  requestAnimationFrame(animate);
  
  const delta = clock.getDelta();
  
  stats.begin();
  
  // Update systems
  physicsWorld.step(1/60, delta, 3);
  hitZones.update(delta);
  particles.update(delta);
  controller.update(delta, groundHeight, waterLevel, enemies);
  ranged.update(delta, controller, isAimButtonPressed);
  audio.updateListener(camera.position, cameraForward);
  
  // Render
  renderer.render(scene, camera);
  
  stats.end();
}

// Start on user interaction
document.addEventListener('click', init, { once: true });
```

---

## 📊 Performance Monitoring

### Stats.js
```javascript
import Stats from 'stats.js';

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb
document.body.appendChild(stats.dom);

function animate() {
  stats.begin();
  // Your rendering code
  stats.end();
}
```

### Tweakpane
```javascript
import { Pane } from 'tweakpane';

const pane = new Pane();

// Add folders
const camera = pane.addFolder({ title: 'Camera' });
camera.addInput(controller.config, 'cameraDistance', { min: 3, max: 15 });
camera.addInput(controller.config, 'cameraSensitivity', { min: 0.5, max: 10 });

const combat = pane.addFolder({ title: 'Combat' });
combat.addInput(controller.config, 'attackDuration', { min: 0.3, max: 3 });
combat.addInput(controller.config, 'rollDuration', { min: 0.3, max: 2 });

// Add buttons
pane.addButton({ title: 'Reset Camera' }).on('click', () => {
  controller.resetCamera();
});

// Monitor values
const monitor = pane.addMonitor(particles, 'activeParticles', {
  label: 'Active Particles',
  interval: 100
});
```

### Pool Stats
```javascript
// Log pool performance
setInterval(() => {
  console.log('Pool Stats:', pools.getAllStats());
}, 5000);
```

---

## 🔒 Best Practices Checklist

### Code Organization
- ✅ One system per file
- ✅ Clear separation of concerns
- ✅ Consistent naming conventions
- ✅ JSDoc comments for public APIs
- ✅ ES6 modules (import/export)

### Performance
- ✅ Object pooling for frequently created/destroyed objects
- ✅ Avoid creating objects in update loops
- ✅ Use `requestAnimationFrame` not `setInterval`
- ✅ Dispose of Three.js objects properly
- ✅ Limit particle counts

### Memory Management
- ✅ Dispose geometries and materials
- ✅ Remove event listeners
- ✅ Clear pools on scene change
- ✅ Unload unused audio
- ✅ Release unused textures

### Audio
- ✅ Initialize after user interaction
- ✅ Use 3D spatial audio sparingly
- ✅ Limit concurrent sounds (pooling)
- ✅ Preload common sounds
- ✅ Compress audio files

### Testing
- ✅ Write tests for core systems
- ✅ Test edge cases
- ✅ Use descriptive test names
- ✅ Keep tests isolated
- ✅ Mock external dependencies

### Git
- ✅ `.gitignore` includes node_modules, dist
- ✅ Commit messages follow convention
- ✅ Small, focused commits
- ✅ Test before committing
- ✅ Code review before merging

---

## 🚀 Deployment Checklist

### Before Build
```bash
1. npm run lint          # No errors
2. npm run format:check  # All formatted
3. npm run test:run      # All tests pass
4. Update version in package.json
5. Update CHANGELOG.md
```

### Build for Production
```bash
npm run build

# Output in dist/ folder
# - Optimized and minified
# - Source maps included
# - Code split into chunks
```

### Performance Check
```bash
npm run stats  # Analyze bundle size

# Check for:
# - Large dependencies
# - Duplicate code
# - Unused exports
```

---

## 📚 Additional Resources

### Documentation
- **Three.js**: https://threejs.org/docs/
- **Cannon-es**: https://pmndrs.github.io/cannon-es/
- **Howler.js**: https://howlerjs.com/
- **Vitest**: https://vitest.dev/
- **ESLint**: https://eslint.org/
- **Vite**: https://vitejs.dev/

### Your Project Docs
- `IMPLEMENTATION_SUMMARY.md` - Complete feature overview
- `QUICK_REFERENCE.md` - Quick lookup guide
- `CONTROLS_ANIMATIONS_REFERENCE.md` - Full controls list
- `SOULS_LIKE_IMPROVEMENTS.md` - Combat feel guide
- `RECOMMENDED_PACKAGES.md` - Package details

---

## 🎯 Next Steps

### Immediate
1. ✅ Run `npm test` to verify tests work
2. ✅ Run `npm run lint` to check code quality
3. ✅ Try `npm run test:ui` for visual testing
4. ✅ Start dev server with `npm run dev`

### Integration
1. Add AudioSystem to your main game loop
2. Setup particle effects for combat hits
3. Integrate object pooling for projectiles
4. Add debug UI with Tweakpane
5. Write tests for your custom systems

### Polish
1. Add more sound effects
2. Create custom particle types
3. Implement save system
4. Add damage number system
5. Create UI for settings

---

**Status: ✅ Production-Ready Infrastructure Complete!**

Your project now has professional-grade tools for:
- 🎵 Audio management
- 💥 Particle effects
- ⚡ Performance optimization
- 🧪 Testing
- 📝 Code quality
- 🏗️ Build optimization

**Everything is ready for you to build an amazing game!** 🎮
