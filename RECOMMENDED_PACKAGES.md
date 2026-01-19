# Recommended Packages for Souls-Like Game

## 🎯 Essential Packages

### 1. **Physics Engine (REQUIRED for collisions)**

#### Option A: Cannon.js (Lightweight, Easy)
```bash
npm install cannon-es
npm install @types/cannon-es --save-dev  # TypeScript types
```

**Why:** 
- ✅ Simple rigid body physics
- ✅ Great for character controllers
- ✅ Good collision detection
- ✅ Low overhead

**Usage:**
```javascript
import * as CANNON from 'cannon-es';

// Character physics body
const body = new CANNON.Body({
  mass: 80,
  shape: new CANNON.Cylinder(0.5, 0.5, 1.8, 8),
  position: new CANNON.Vec3(0, 1, 0),
  fixedRotation: true // Character doesn't tip over
});
world.addBody(body);
```

#### Option B: Rapier (Best Performance)
```bash
npm install @dimforge/rapier3d-compat
```

**Why:**
- ✅ FASTEST physics engine
- ✅ Better collision detection
- ✅ Used in professional games
- ✅ WebAssembly powered

---

### 2. **Animation System (OPTIONAL - Three.js has built-in)**

#### You Already Have: Three.js AnimationMixer ✅
```javascript
import * as THREE from 'three';

const mixer = new THREE.AnimationMixer(character);
const action = mixer.clipAction(animation);
action.play();
```

**Three.js includes:**
- ✅ Animation blending (.crossFadeTo())
- ✅ Weight-based mixing
- ✅ Time scaling
- ✅ Event callbacks

#### Optional Enhancement: Yuka.js (AI + Advanced Controllers)
```bash
npm install yuka
```

**Why:**
- Advanced character controllers
- Steering behaviors
- Pathfinding
- State machines

---

### 3. **Input Management**

#### Option: Input.js (Clean input handling)
```bash
npm install input.js
```

Or stick with your current input system (which is good!)

---

### 4. **Performance & Debugging**

#### Stats.js (FPS Monitor)
```bash
npm install stats.js
npm install @types/stats.js --save-dev
```

**Why:**
- Monitor FPS
- Track frame time
- Memory usage

```javascript
import Stats from 'stats.js';

const stats = new Stats();
document.body.appendChild(stats.dom);

function animate() {
  stats.begin();
  // your rendering code
  stats.end();
}
```

#### Tweakpane (Debug UI - HIGHLY RECOMMENDED)
```bash
npm install tweakpane
```

**Why:**
- Live tune values (camera distance, speeds, etc.)
- Save/load presets
- Clean UI

```javascript
import { Pane } from 'tweakpane';

const pane = new Pane();
pane.addInput(config, 'cameraDistance', { min: 3, max: 10 });
pane.addInput(config, 'attackDuration', { min: 0.3, max: 2.0 });
```

---

### 5. **Post-Processing**

#### Already included in Three.js ✅
```javascript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
```

---

## 🎮 Recommended Installation for Your Game

### Core Physics (Choose ONE):

**For simplicity:**
```bash
npm install cannon-es
```

**For best performance:**
```bash
npm install @dimforge/rapier3d-compat
```

### Development Tools:
```bash
npm install stats.js tweakpane --save-dev
```

### Optional Enhancement:
```bash
npm install yuka  # Advanced AI and character controllers
```

---

## 📦 Updated package.json

Here's what I recommend adding:

```json
{
  "dependencies": {
    "three": "^0.160.0",
    "cannon-es": "^0.20.0"
  },
  "devDependencies": {
    "http-server": "^14.1.1",
    "vite": "^6.4.1",
    "stats.js": "^0.17.0",
    "tweakpane": "^4.0.3"
  }
}
```

---

## 🔧 Why You DON'T Need Extra Animation Libraries

**Three.js AnimationMixer is already excellent because:**

1. **Built-in Blending**
   ```javascript
   action1.fadeOut(0.3);
   action2.fadeIn(0.3);
   action2.play();
   ```

2. **Weight Control**
   ```javascript
   action.setEffectiveWeight(0.5);  // 50% influence
   ```

3. **Time Control**
   ```javascript
   action.setEffectiveTimeScale(1.5);  // 1.5x speed
   ```

4. **Root Motion Support**
   ```javascript
   mixer.addEventListener('finished', (e) => {
     // Animation complete callback
   });
   ```

Your `AnimationController` class already wraps this perfectly!

---

## 🎯 What You Actually NEED

### For Stable Character Movement:

1. **Physics Engine** (Cannon-es or Rapier) - For proper collisions
2. **Your RacalvinController** ✅ (Already handles movement)
3. **Your AnimationController** ✅ (Already handles blending)

### For Better Development:

1. **Stats.js** - Monitor performance
2. **Tweakpane** - Live-tune values

---

## 🚀 Quick Install Command

**Minimal (Just physics):**
```bash
npm install cannon-es
```

**Recommended (Physics + Dev Tools):**
```bash
npm install cannon-es stats.js tweakpane
```

**Full (Everything):**
```bash
npm install cannon-es @dimforge/rapier3d-compat yuka stats.js tweakpane
```

---

## 📋 Integration Example: Cannon.js

### 1. Install
```bash
npm install cannon-es
```

### 2. Create Physics World
```javascript
// src/systems/PhysicsWorld.js
import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export class PhysicsWorld {
  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -25, 0) // Match your gravity
    });
    
    // Ground plane
    const groundBody = new CANNON.Body({
      mass: 0, // static
      shape: new CANNON.Plane()
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(groundBody);
    
    this.bodies = [];
  }
  
  createCharacterBody(position) {
    const body = new CANNON.Body({
      mass: 80,
      shape: new CANNON.Cylinder(0.5, 0.5, 1.8, 8),
      position: new CANNON.Vec3(position.x, position.y, position.z),
      fixedRotation: true,
      linearDamping: 0.9,
      angularDamping: 0.9
    });
    
    this.world.addBody(body);
    this.bodies.push(body);
    return body;
  }
  
  update(deltaTime) {
    this.world.step(1/60, deltaTime, 3);
  }
  
  syncMeshToBody(mesh, body) {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  }
}
```

### 3. Integrate with Controller
```javascript
// In your main file
import { PhysicsWorld } from './systems/PhysicsWorld.js';

const physics = new PhysicsWorld();
const characterBody = physics.createCharacterBody(controller.character.position);

// In update loop
function animate() {
  const delta = clock.getDelta();
  
  // Update physics
  physics.update(delta);
  
  // Sync controller with physics
  controller.character.position.copy(characterBody.position);
  
  // Update controller
  controller.update(delta, 0);
  
  // Render
  renderer.render(scene, camera);
}
```

---

## ⚠️ What You DON'T Need

❌ **Separate animation library** (Three.js has it)
❌ **Ammo.js** (Too complex for your needs)
❌ **PhysX** (Overkill, hard to integrate)
❌ **Animation blending plugins** (Already in Three.js)
❌ **Tween libraries** (Unless you want UI animations)

---

## 🎯 My Recommendation

**Start with this:**
```bash
npm install cannon-es stats.js tweakpane
```

This gives you:
- ✅ Proper physics collisions
- ✅ Performance monitoring
- ✅ Live value tuning
- ✅ Everything you need for a Souls-like

Your existing `RacalvinController` + `AnimationController` already handles character movement and animation blending perfectly!

---

## 📚 Documentation Links

- **Three.js Animation:** https://threejs.org/docs/#api/en/animation/AnimationMixer
- **Cannon-es:** https://pmndrs.github.io/cannon-es/
- **Rapier:** https://rapier.rs/
- **Tweakpane:** https://cocopon.github.io/tweakpane/
- **Stats.js:** https://github.com/mrdoob/stats.js

---

**Ready to install? Run:**
```bash
npm install cannon-es stats.js tweakpane
```
