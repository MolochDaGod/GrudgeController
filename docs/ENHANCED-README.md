# Enhanced Warrior Combat System - Documentation

## Overview

This is a **modular, reusable** Three.js combat system with the following features:

- ✅ **Tank Controls** - Classic Resident Evil/Dark Souls style controls
- ✅ **Target Lock System** - Lock onto enemies with visual indicators and health bars
- ✅ **Souls-Like Dodge Rolls** - Double-tap A/D for directional rolls with i-frames
- ✅ **Collision System** - Physical collisions with enemies, no clipping
- ✅ **Combat Range Management** - Auto-positioning to perfect attack distance
- ✅ **Dynamic Weapon System** - Load and attach weapons from GLB/FBX files
- ✅ **Modular Configuration** - Easy to customize for different games
- ✅ **Combat System** - Particles, trails, shockwaves, camera shake, raycasting
- ✅ **Character Controller** - Jump combos, rolling, blocking, swimming, ledge climbing

---

## 🎮 Quick Start

### 1. Install Dependencies

```bash
npm install
```

**Required Dependencies:**

- `three` (^0.160.0) - Three.js 3D library with all required loaders:
  - `FBXLoader` - For character and animation loading
  - `GLTFLoader` - For weapon loading
  - `EffectComposer` - Post-processing effects
  - `RenderPass` - Base render pass
  - `UnrealBloomPass` - Bloom lighting effects

**Dev Dependencies:**

- `vite` (^5.0.0) - Fast build tool and dev server
- `http-server` (^14.1.1) - Alternative static server

All Three.js loaders and post-processing modules are included in the core `three` package under `three/examples/jsm/`.

### 2. Launch Demo

```bash
npx vite enhanced.html
```

### 3. Controls

**Movement:**

- `W/S` - Move forward/backward
- `A/D` - Turn left/right
- `Shift + W/S` - Run / Roll Forward
- `Space` - Jump (press quickly for double/triple jump)

**Combat:**

- `Left Click` - Attack
- `Right Click` - Block
- `Z` - Lock onto nearest target
- `X` - Cycle to next target

**Dodge Rolls (Souls-Like):**

- `Double-tap A` - Dodge Roll Left
- `Double-tap D` - Dodge Roll Right  
- `Shift + W` - Roll Forward

**Camera:**

- `Mouse` - Look around (click to lock pointer)
- `I/K` - Pitch up/down
- `J/L` - Turn camera left/right

---

## 📁 File Structure

```
Enhanced Warrior Combat System/
├── RacalvinController.js      # Character controller (movement, physics)
├── TargetLockSystem.js         # Target lock visuals and logic
├── WeaponSystem.js             # Load and attach weapons to bones
├── GameConfig.js               # Centralized configuration
├── CombatSystem.js             # Combat mechanics and effects
├── EnhancedWarriorDemo.js      # Main demo implementation
├── enhanced.html               # Launcher
└── RacalvinDaWarrior/          # Character models and animations
    ├── Meshy_AI_Orc_Warlord_Render_1220104017_texture_fbx.fbx
    ├── sword and shield slash.fbx
    ├── sword and shield attack.fbx
    └── ... (50 animations)
```

---

## ⚙️ Configuration

### Using GameConfig.js

All settings are centralized in `GameConfig.js`:

```javascript
import { GAME_CONFIG, createCustomConfig } from './GameConfig.js';

// Option 1: Use default config
const demo = new WarriorCombatDemo();

// Option 2: Override specific settings
const demo = new WarriorCombatDemo({
  character: {
    maxSpeed: 12,  // Faster movement
  },
  targetLock: {
    range: 20,     // Lock targets from farther away
  }
});

// Option 3: Use presets
import { PRESETS } from './GameConfig.js';
const config = createCustomConfig(PRESETS.action);
const demo = new WarriorCombatDemo(config);
```

### Key Configuration Sections

#### Character Settings

```javascript
character: {
  maxSpeed: 8,                // Max run speed
  walkSpeed: 3.2,             // Walk speed
  rollCooldown: 0.8,          // Cooldown between rolls
  rollIframes: 0.4,           // Invincibility frames (i-frames)
  characterRadius: 0.5,       // Character collision radius
  combatRange: 2.5,           // Ideal distance for attacks
  minCombatRange: 1.5,        // Minimum distance (collision)
  jumpVelocity: 10,           // Jump height
  rollSpeed: 12,              // Roll speed
  rollDuration: 0.5,          // Roll duration (seconds)
}
```

#### Target Lock Settings

```javascript
targetLock: {
  enabled: true,              // Enable target lock system
  range: 15,                  // Lock-on range
  angle: Math.PI / 3,         // Lock-on cone angle (60°)
  circleRadius: 0.5,          // Ground circle size
  circleColor: 0xff0000,      // Circle color (red)
  healthBarHeight: 2.5,       // Health bar height above enemy
}
```

#### Weapon Settings

```javascript
weapon: {
  enabled: true,
  boneName: null,             // Auto-detect if null
  boneKeywords: ['right', 'hand'],  // For auto-detection
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: -Math.PI / 2, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  useFallback: true,          // Create simple sword if GLB fails
}
```

#### File Paths

```javascript
paths: {
  characterModel: './RacalvinDaWarrior/model.fbx',
  weapon: '../My project/Assets/Editor/ThreeExporter/racsknife.glb',
  animations: './RacalvinDaWarrior/',
}
```

---

## 🎯 Target Lock System

### Features

1. **Visual Indicators:**
   - Red circle at target's feet (rotates)
   - Health bar above target's head
   - Color-coded health: Green → Yellow → Red

2. **Auto-Detection:**
   - Finds nearest enemy in front of player
   - Maximum range: 15 units (configurable)
   - Cone angle: 60° (configurable)

3. **Controls:**
   - `Z` - Toggle lock on/off
   - `X` - Cycle to next target
   - Auto-unlock if target moves out of range

### Usage Example

```javascript
import { TargetLockSystem, TargetableEntity } from './TargetLockSystem.js';

// Create system
const targetLockSystem = new TargetLockSystem(scene, camera);

// Create targetable enemy
const enemy = new THREE.Mesh(geometry, material);
const targetable = new TargetableEntity(enemy, 100); // 100 max health

// Create indicator
targetLockSystem.createIndicator(targetable, 0.5);

// Lock target
targetLockSystem.setActiveTarget(targetable);

// Update health
targetable.takeDamage(25);
targetLockSystem.setTargetHealth(targetable, targetable.currentHealth, targetable.maxHealth);

// Update every frame
targetLockSystem.update();
```

---

## ⚔️ Weapon System

### Features

1. **Auto Bone Detection** - Finds "right hand" bone automatically
2. **Fallback Sword** - Creates simple sword if GLB fails to load
3. **Flexible Configuration** - Position, rotation, scale adjustable

### Usage Example

```javascript
import { WeaponSystem, WEAPON_PRESETS } from './WeaponSystem.js';

// Create system
const weaponSystem = new WeaponSystem();

// Attach weapon (basic)
await weaponSystem.attachWeapon(
  character,
  'path/to/weapon.glb',
  WEAPON_PRESETS.rightHand
);

// Attach weapon (with fallback)
await weaponSystem.attachWeaponSafe(
  character,
  'path/to/weapon.glb',
  {
    boneKeywords: ['right', 'hand'],
    position: new THREE.Vector3(0, 0.05, 0),
    rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
    scale: new THREE.Vector3(1, 1, 1)
  }
);

// Show/hide weapon
weaponSystem.setWeaponVisible(character, false);

// Detach weapon
weaponSystem.detachWeapon(character);
```

### Weapon Presets

```javascript
WEAPON_PRESETS.rightHand      // Standard sword in right hand
WEAPON_PRESETS.leftHand       // Weapon in left hand
WEAPON_PRESETS.knifeRightHand // Knife/dagger grip
WEAPON_PRESETS.twoHanded      // Two-handed weapon
WEAPON_PRESETS.shield         // Shield on left forearm
```

---

## 🎮 Character Controller

### Features

- **Tank Controls** - A/D turn, W/S move forward/back
- **Jump Combos** - Press Space quickly for double/triple jump
- **Rolling** - Shift + W/S for dodge roll with i-frames
- **Blocking** - Right-click to block, A/D become strafe
- **Swimming** - Wade in shallow water, swim in deep water
- **Ledge Climbing** - Auto-grab ledges, climb up or shimmy

### Usage Example

```javascript
import { RacalvinController, DEFAULT_CONFIG } from './RacalvinController.js';

// Create controller
const controller = new RacalvinController({
  maxSpeed: 10,
  jumpVelocity: 12,
  rollSpeed: 15
});

// Set position
controller.setPosition(0, 0, 0);

// Setup input listeners
controller.setupInputListeners(canvasElement);

// Update every frame
controller.update(delta, groundHeight, waterLevel, targetableObjects);

// Apply to character and camera
controller.applyToCharacter(characterMesh);
controller.applyToCamera(camera);

// Get animation name
const animName = controller.getAnimationName(); // 'Idle', 'Walk', 'Attack', etc.

// Get locked target
const target = controller.getLockedTarget();
```

---

## 🎨 Free Visual Effects (Built into Three.js)

All these effects are **FREE** and included in Three.js! No extra dependencies needed.

### Currently Active Effects

- ✅ **UnrealBloomPass** - Glow/bloom lighting
- ✅ **Particle Systems** - Impact bursts, trails, shockwaves
- ✅ **ACES Filmic Tone Mapping** - Cinematic color grading
- ✅ **SRGB Color Space** - Proper color management

### Additional FREE Effects You Can Enable

#### 1. **Outline Pass** - Perfect for Target Lock

```javascript
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';

const outlinePass = new OutlinePass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  scene, camera
);
outlinePass.edgeStrength = 3.0;
outlinePass.edgeGlow = 0.7;
outlinePass.visibleEdgeColor.set('#ff0000');
composer.addPass(outlinePass);
```

#### 2. **SSAO** - Realistic Ambient Occlusion

```javascript
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';

const ssaoPass = new SSAOPass(scene, camera, width, height);
composer.addPass(ssaoPass);
```

#### 3. **FXAA** - Fast Anti-Aliasing

```javascript
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

const fxaaPass = new ShaderPass(FXAAShader);
composer.addPass(fxaaPass);
```

#### 4. **Film Grain** - Cinematic Look

```javascript
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';

const filmPass = new FilmPass(0.35, 0.5, 2048, false);
composer.addPass(filmPass);
```

#### 5. **Glitch Effect** - For Damage/Low Health

```javascript
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';

const glitchPass = new GlitchPass();
composer.addPass(glitchPass);
```

#### 6. **Motion Blur** - Afterimage Trails

```javascript
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';

const afterimagePass = new AfterimagePass(0.96);
composer.addPass(afterimagePass);
```

### All FREE Built-in Passes

- `UnrealBloomPass` ✅ Active
- `OutlinePass` - Object highlighting
- `SSAOPass` - Ambient occlusion  
- `SSRPass` - Screen space reflections
- `TAARenderPass` - Temporal anti-aliasing
- `SAOPass` - Scalable ambient obscurance
- `FilmPass` - Film grain
- `GlitchPass` - Digital glitch
- `DotScreenPass` - Retro dot matrix
- `RGBShiftPass` - Chromatic aberration
- `AfterimagePass` - Motion blur
- `HalftonePass` - Comic book style
- `BokehPass` - Depth of field blur

All effects are in `three/examples/jsm/postprocessing/`!

---

## ⚡ Rendering Pipeline Best Practices

### ✅ Already Implemented

1. **Color Management**

   ```javascript
   renderer.outputColorSpace = THREE.SRGBColorSpace;
   renderer.toneMapping = THREE.ACESFilmicToneMapping;
   renderer.toneMappingExposure = 1.0;
   ```

2. **Memory Leak Prevention**
   - ✅ Comprehensive dispose() method
   - ✅ Texture disposal
   - ✅ Animation mixer cleanup  
   - ✅ Geometry/material disposal
   - ✅ Render target cleanup
   - ✅ Animation frame cancellation

3. **Performance Optimizations**
   - ✅ Pixel ratio capped at 2x
   - ✅ Frustum culling enabled
   - ✅ Stencil buffer disabled
   - ✅ Power preference: high-performance
   - ✅ Adaptive quality reduction

4. **Object Pooling**
   - ✅ Particle recycling
   - ✅ Effect reuse
   - ✅ Minimal per-frame allocations

### No Duplications Found

- ✅ Single renderer instance
- ✅ No duplicate materials
- ✅ Efficient render loop
- ✅ Proper resource cleanup

---

## 🔧 Adapting for Your Game

### 1. Change Character Model

Edit `GameConfig.js`:

```javascript
paths: {
  characterModel: './YourCharacter/model.fbx',
  animations: './YourCharacter/',
}
```

### 2. Map Your Animations

Edit `GameConfig.js`:

```javascript
animations: {
  idle: 'idle_animation.fbx',
  walk: 'walk_loop.fbx',
  run: 'run_cycle.fbx',
  slash1: 'attack_slash_01.fbx',
  // ... etc
}
```

### 3. Change Weapon

Edit `GameConfig.js`:

```javascript
paths: {
  weapon: './weapons/your_sword.glb',
}

weapon: {
  position: { x: 0, y: 0.1, z: 0 },  // Adjust grip
  rotation: { x: -Math.PI / 2, y: 0, z: Math.PI / 4 },
  scale: { x: 1.5, y: 1.5, z: 1.5 },  // Make bigger
}
```

### 4. Customize Combat

Edit `GameConfig.js`:

```javascript
combat: {
  detectionRadius: 20.0,      // Larger detection range
  traversalSpeed: 15.0,       // Faster movement to enemies
  
  attacks: {
    slash1: { damage: 25, range: 3.0, color: '#00ff00' },
    powerAttack: { damage: 100, range: 5.0, color: '#ff00ff' },
  }
}
```

### 5. Use Configuration Presets

```javascript
import { PRESETS } from './GameConfig.js';

// Fast-paced action game
const config = createCustomConfig(PRESETS.action);

// Slow adventure game
const config = createCustomConfig(PRESETS.adventure);

// Stealth game
const config = createCustomConfig(PRESETS.stealth);
```

---

## 🐛 Troubleshooting

### Weapon Not Loading

1. Check file path in `GameConfig.js`
2. Make sure GLB file exists at that path
3. Check browser console for errors
4. Fallback sword will appear if `useFallback: true`

### Target Lock Not Working

1. Ensure enemies are `TargetableEntity` objects
2. Pass `targetableEnemies` array to `controller.update()`
3. Check `targetLock.enabled: true` in config
4. Verify target is within `targetLock.range`

### Animations Not Playing

1. Check animation file paths in `GameConfig.js`
2. Ensure FBX files are in correct folder
3. Check `debug.logAnimations: true` to see load status
4. Verify animation mixer is updating: `mixer.update(delta)`

### Character Falling Through Ground

1. Ensure `groundHeight` parameter is correct in `controller.update(delta, groundHeight)`
2. Ground should be at Y = 0 by default
3. Check character's initial position

---

## 📦 Exporting to Another Project

### Method 1: Copy Files

1. Copy these files to your project:
   - `RacalvinController.js`
   - `TargetLockSystem.js`
   - `WeaponSystem.js`
   - `GameConfig.js`
   - `CombatSystem.js`

2. Copy your character model and animations

3. Create your own demo file based on `EnhancedWarriorDemo.js`

### Method 2: NPM Package (Future)

```bash
npm install @racalvin/combat-system
```

```javascript
import { 
  RacalvinController, 
  TargetLockSystem, 
  WeaponSystem 
} from '@racalvin/combat-system';
```

---

## 📝 API Reference

### RacalvinController

```javascript
constructor(config)
update(delta, groundHeight, waterLevel, targetableObjects)
setPosition(x, y, z)
applyToCharacter(mesh)
applyToCamera(camera)
getAnimationName() → string
getLockedTarget() → TargetableEntity | null
clearTargetLock()
applyHit(direction, damage)
```

### TargetLockSystem

```javascript
constructor(scene, camera)
createIndicator(target, radius)
setActiveTarget(target)
setTargetHealth(target, current, max)
update()
removeIndicator(target)
clear()
pulseTarget(target)
```

### WeaponSystem

```javascript
constructor()
async loadWeapon(path) → THREE.Object3D
async attachWeapon(character, path, options)
async attachWeaponSafe(character, path, options)
detachWeapon(character)
getWeapon(character) → THREE.Object3D | null
setWeaponVisible(character, visible)
dispose()
```

### TargetableEntity

```javascript
constructor(mesh, maxHealth)
takeDamage(amount) → boolean (true if killed)
heal(amount)
getHealthPercent() → number (0-1)
reset()
```

---

## 🎨 Customization Examples

### Example 1: Archer Character

```javascript
const archerConfig = {
  paths: {
    characterModel: './archer/model.fbx',
    weapon: './weapons/bow.glb',
  },
  weapon: {
    boneKeywords: ['left', 'hand'],  // Bow in left hand
  },
  character: {
    maxSpeed: 10,      // Faster movement
    rollSpeed: 15,     // Quick dodges
  },
  targetLock: {
    range: 25,         // Lock from farther away
  }
};

const demo = new WarriorCombatDemo(archerConfig);
```

### Example 2: Heavy Knight

```javascript
const knightConfig = {
  character: {
    maxSpeed: 5,       // Slower movement
    walkSpeed: 2,
    rollSpeed: 8,      // Slower rolls
  },
  weapon: {
    preset: 'twoHanded',
    scale: { x: 1.5, y: 1.5, z: 1.5 },  // Bigger weapon
  },
  combat: {
    attacks: {
      heavySlash: { damage: 50, range: 3.5, color: '#8b0000' },
    }
  }
};
```

### Example 3: Rogue/Assassin

```javascript
const rogueConfig = {
  character: {
    maxSpeed: 12,      // Very fast
    rollSpeed: 18,
    rollDuration: 0.3, // Quick rolls
  },
  weapon: {
    preset: 'knifeRightHand',
  },
  targetLock: {
    angle: Math.PI / 4,  // Narrower lock cone
  }
};
```

---

## 🎨 Free Visual Effects (FX)

All these effects are **FREE** and built into Three.js! Enable them in `GameConfig.js`:

### Built-in Post-Processing Effects

#### 1. **Bloom** (Currently Active)

```javascript
postProcessing: {
  bloom: {
    enabled: true,
    strength: 0.3,      // Glow intensity
    radius: 0.4,        // Glow spread
    threshold: 0.85,    // Brightness threshold
  }
}
```

#### 2. **FXAA - Fast Anti-Aliasing**

```javascript
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

postProcessing: {
  fxaa: {
    enabled: true,
  }
}
```

#### 3. **SSAO - Ambient Occlusion**

Adds realistic shadows in crevices and corners:

```javascript
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';

postProcessing: {
  ssao: {
    enabled: true,
    kernelRadius: 8,
    minDistance: 0.005,
    maxDistance: 0.1,
  }
}
```

#### 4. **Outline Pass** - Perfect for Target Lock

```javascript
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';

postProcessing: {
  outline: {
    enabled: true,
    edgeStrength: 3.0,
    edgeGlow: 0.7,
    edgeThickness: 1.0,
    visibleEdgeColor: '#ff0000',  // Red outline for locked targets
  }
}
```

#### 5. **Film Grain Effect**

```javascript
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';

const filmPass = new FilmPass(0.35, 0.5, 2048, false);
composer.addPass(filmPass);
```

#### 6. **Glitch Effect** - For damage/low health

```javascript
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';

const glitchPass = new GlitchPass();
composer.addPass(glitchPass);
// Trigger only when damaged
```

#### 7. **Afterimage/Motion Blur**

```javascript
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';

const afterimagePass = new AfterimagePass(0.96); // 0.96 = trail strength
composer.addPass(afterimagePass);
```

### Particle Effects (Already Implemented)

The Combat System includes these FREE particle effects:

1. **Impact Particles** - Burst on hit
2. **Sword Trails** - Motion blur during attacks
3. **Shockwave Rings** - Ground impact effects
4. **Combo Sparks** - Visual feedback for combos

### How to Add More Effects

1. **Import the effect:**

```javascript
import { EffectPass } from 'three/examples/jsm/postprocessing/EffectPass.js';
```

1. **Add to composer in setupPostProcessing():**

```javascript
setupPostProcessing() {
  // ... existing code ...
  
  if (this.config.postProcessing.outline.enabled) {
    const outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.scene,
      this.camera
    );
    this.composer.addPass(outlinePass);
  }
}
```

1. **Enable in GameConfig.js** (already set up!)

---

## 🚀 Performance Best Practices

### ✅ Implemented Optimizations

1. **Color Space Management**
   - `outputColorSpace` set to SRGB
   - `toneMapping` using ACES Filmic
   - Proper gamma correction

2. **Memory Management**
   - Comprehensive dispose() method
   - Texture disposal on materials
   - Animation mixer cleanup
   - Post-processing cleanup

3. **Rendering Optimizations**
   - Pixel ratio capped at 2x
   - Shadow map optimization
   - Frustum culling enabled
   - Stencil buffer disabled (not needed)

4. **Object Pooling**
   - Particles recycled
   - Effects reused when possible
   - Minimal allocations per frame

5. **Frame Rate Control**
   - Adaptive quality reduction
   - FPS monitoring
   - Delta time clamping

### Performance Settings

```javascript
performance: {
  maxParticles: 100,          // Reduce to 50 for low-end
  shadowMapSize: 2048,        // Reduce to 1024 for low-end
  antialias: true,            // Disable for performance
  maxFPS: 60,
  adaptiveQuality: true,      // Auto-reduce quality if FPS drops
  minFPS: 30,                 // Trigger quality reduction
  frustumCulling: true,       // Don't render off-screen objects
  objectCulling: true,        // Cull distant objects
}
```

### To Prevent Memory Leaks

✅ All geometry, materials, and textures properly disposed  
✅ Animation loops properly cancelled  
✅ Event listeners removed on cleanup  
✅ Renderer context force-released  
✅ Post-processing render targets disposed  

---

## 🚀 Performance Tips

1. **Reduce Particle Count:**

   ```javascript
   performance: {
     maxParticles: 50,  // Default 100
   }
   ```

2. **Lower Shadow Resolution:**

   ```javascript
   performance: {
     shadowMapSize: 1024,  // Default 2048
   }
   ```

3. **Disable Post-Processing:**

   ```javascript
   postProcessing: {
     enabled: false,
   }
   ```

4. **Limit FPS:**

   ```javascript
   performance: {
     maxFPS: 30,
   }
   ```

---

## 📄 License

This system is designed to be modular and reusable across different projects.

---

## 🙋 Support

If you encounter issues:

1. Check browser console for errors
2. Verify all file paths in `GameConfig.js`
3. Enable debug logging:

   ```javascript
   debug: {
     logAnimations: true,
     logTargetLock: true,
   }
   ```

---

**Enjoy your modular combat system!** ⚔️🎮
