# Racalvin Combat System - Three.js Game Engine

A **modular, reusable** Three.js combat system with tank controls, target locking, dynamic weapons, and visual effects.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run the demo
npx vite

# Or open directly
npx vite index.html
```

Then open <http://localhost:5173> in your browser.

## 📁 Project Structure

```
racalvin-combat-system/
├── index.html                 # Main entry point
├── package.json              # Dependencies
│
├── src/                      # Source code
│   ├── systems/             # Core game systems
│   │   ├── RacalvinController.js    # Character controller
│   │   ├── TargetLockSystem.js      # Target lock visuals
│   │   ├── WeaponSystem.js          # Weapon loading
│   │   └── CombatSystem.js          # Combat mechanics
│   │
│   ├── config/              # Configuration files
│   │   ├── GameConfig.js           # Main config
│   │   ├── warrior-scene.json      # Warrior scene config
│   │   ├── warrior-config.json     # Animation mappings
│   │   └── combat-scene.json       # Combat scene config
│   │
│   └── demos/               # Demo implementations
│       ├── EnhancedWarriorDemo.js  # Main demo (modular)
│       ├── WarriorDemo.js          # Original warrior demo
│       ├── CombatDemo.js           # Combat demo
│       └── SimpleTest.js           # Quick test
│
├── public/                  # Static assets
│   └── models/             # 3D models and animations
│       └── RacalvinDaWarrior/     # Character files
│
└── docs/                   # Documentation
    ├── ENHANCED-README.md         # Full documentation
    ├── WARRIOR-GUIDE.md          # Warrior guide
    ├── QUICKSTART.md             # Quick start guide
    └── SETUP.md                  # Setup instructions
```

## 🎮 Controls

### Movement

- `W/S` - Move forward/backward
- `A/D` - Turn left/right
- `Shift` - Run / Roll
- `Space` - Jump (triple jump combo)

### Combat

- `Left Click` - Attack
- `Right Click` - Block (A/D become strafe)
- `Z` - Lock onto target
- `X` - Cycle targets

### Camera

- `Mouse` - Look around (click to lock pointer)
- `I/K` - Pitch up/down
- `J/L` - Turn camera left/right

## ✨ Features

### 🎯 Target Lock System

- Press Z to lock nearest enemy
- Red circle indicator at feet
- Health bar above head
- Auto-unlock when out of range
- Color-coded health (green → yellow → red)

### ⚔️ Dynamic Weapon System

- Loads weapons from GLB/FBX files
- Auto-detects hand bones
- Fallback sword if loading fails
- Easy position/rotation adjustment

### 🎮 Character Controller

- **Tank Controls** - Classic Resident Evil style
- **Jump Combos** - Double/triple jumps
- **Rolling** - I-frames during dodge
- **Swimming** - Wade/swim mechanics
- **Ledge Climbing** - Auto-grab ledges

### 💥 Combat System

- Particle effects on hit
- Shockwave rings
- Camera shake
- Sword trails
- Combo counter

## 🔧 Configuration

All settings are in `src/config/GameConfig.js`:

```javascript
// Change character
paths: {
  characterModel: './public/models/YourCharacter/model.fbx',
  weapon: './weapons/your_sword.glb',
}

// Adjust gameplay
character: {
  maxSpeed: 12,      // Faster movement
  jumpVelocity: 15,  // Higher jumps
}

// Customize target lock
targetLock: {
  range: 20,         // Lock from farther away
  circleColor: 0x00ff00,  // Green circle
}
```

## 📦 Using in Your Project

### 1. Copy Core Systems

Copy these files to your project:

```
src/systems/RacalvinController.js
src/systems/TargetLockSystem.js
src/systems/WeaponSystem.js
src/systems/CombatSystem.js
src/config/GameConfig.js
```

### 2. Import and Use

```javascript
import { RacalvinController } from './systems/RacalvinController.js';
import { TargetLockSystem } from './systems/TargetLockSystem.js';
import { WeaponSystem } from './systems/WeaponSystem.js';
import { GAME_CONFIG } from './config/GameConfig.js';

// Create controller
const controller = new RacalvinController(GAME_CONFIG.character);

// Create target lock
const targetLock = new TargetLockSystem(scene, camera);

// Load weapon
const weaponSystem = new WeaponSystem();
await weaponSystem.attachWeapon(character, 'path/to/weapon.glb');

// Update loop
function animate() {
  controller.update(delta, groundHeight, waterLevel, enemies);
  controller.applyToCharacter(characterMesh);
  controller.applyToCamera(camera);
  targetLock.update();
}
```

## 🎨 Customization

### Create Custom Config

```javascript
import { createCustomConfig, PRESETS } from './config/GameConfig.js';

// Use preset
const actionConfig = createCustomConfig(PRESETS.action);

// Or customize
const customConfig = createCustomConfig({
  character: { maxSpeed: 15 },
  weapon: { scale: { x: 2, y: 2, z: 2 } }
});

const demo = new WarriorCombatDemo(customConfig);
```

### Available Presets

- `PRESETS.action` - Fast-paced combat
- `PRESETS.adventure` - Slow exploration
- `PRESETS.stealth` - Tactical gameplay

## 📚 Documentation

- [ENHANCED-README.md](docs/ENHANCED-README.md) - Complete API docs
- [WARRIOR-GUIDE.md](docs/WARRIOR-GUIDE.md) - Warrior character guide
- [QUICKSTART.md](docs/QUICKSTART.md) - Quick start tutorial
- [SETUP.md](docs/SETUP.md) - Setup instructions

## 🐛 Troubleshooting

### Weapon Not Loading

- Check file path in GameConfig.js
- Ensure GLB file exists
- Fallback sword will appear automatically

### Target Lock Not Working

- Ensure enemies are `TargetableEntity` objects
- Check `targetLock.enabled: true` in config
- Verify enemies are within range

### Animations Not Playing

- Check animation paths in GameConfig.js
- Enable `debug.logAnimations: true`
- Verify FBX files exist

## 🌐 Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari (may have limited features)

## 📝 License

Designed to be modular and reusable across projects.

## 🙋 Support

For issues:

1. Check browser console for errors
2. Enable debug logging in GameConfig.js
3. Review documentation in `/docs`

---

**Made for Puter Apps & Three.js Games** 🎮⚔️
