# Three.js Combat System - Complete Setup

🎮 **Ready-to-run combat system with physical attacks, visual effects, and multiple animations**

## 🚀 Quick Start

### Option 1: Using Vite (Recommended)

```bash
cd "E:\Gamewithall\Grudge Strat\Exported_FBX_Models"
npm install
npm run dev
```

### Option 2: Using Simple HTTP Server

```bash
cd "E:\Gamewithall\Grudge Strat\Exported_FBX_Models"
npm install
npm run serve
```

Then open your browser to `http://localhost:8080`

---

## 📁 Files Created

### Core System Files

- **CombatSystem.js** - Enhanced combat engine with effects
- **CombatDemo.js** - Complete game implementation
- **combat-scene.json** - Scene configuration (loadable)
- **index.html** - Game launcher with UI
- **package.json** - Dependencies

### Features Implemented

#### ✅ Combat Mechanics

- **Smart Targeting** - Auto-targets nearest enemy in direction
- **Dash-to-Enemy** - Smooth traversal with speed control
- **Combo System** - Chain attacks with combo counter
- **Multiple Attacks** - slash1, slash2, attack2, kick, charge, punch, roundhouse, backkick
- **Damage System** - Enemy health and stun mechanics

#### ✅ Visual Effects

- **Movement Trails** - Color-coded trails during traversal
- **Impact Particles** - Burst effects on hit with customizable colors
- **Shockwave Rings** - Expanding ring effects on impact
- **Camera Shake** - Dynamic shake based on attack power
- **Particle Physics** - Gravity-affected particle systems

#### ✅ Animation System

- **Smooth Blending** - Crossfade between animations
- **Attack Animations** - All attack types from exported FBX
- **Locomotion** - Idle, walk, run, sprint
- **Traversal Anims** - Jump spin, side flip, spin
- **Enemy Anims** - Idle, hit reactions, death

#### ✅ Controller Support

- **Keyboard** - WASD + Space + Number keys
- **Gamepad** - Full controller support ready
- **Input Smoothing** - Camera-relative movement

---

## 🎮 Controls

### Keyboard

| Key | Action |
|-----|--------|
| W/A/S/D | Move character |
| SPACE | Basic attack (auto-combo) |
| 1 | Slash 1 (Punch) |
| 2 | Slash 2 (Kick) |
| 3 | Attack 2 (Roundhouse) |
| 4 | Kick (Back Kick) |
| 5 | Charge (Jump Spin) |

### Gamepad (Ready to configure)

- Left Stick: Movement
- Right Stick: Camera
- A Button: Attack
- Bumpers: Lock-on/Dodge

---

## 🎯 Attack Properties

Each attack has unique properties defined in `combat-scene.json`:

```javascript
{
  "slash1": {
    "damage": 10,
    "range": 2.5,        // How close to get
    "speed": 1.0,        // Animation speed
    "effectColor": "0xff6b6b",
    "nextAttack": "slash2"  // Auto-combo
  }
}
```

### Attack Chain

```
slash1 → slash2 → attack2 → kick
```

Or use individual attacks with number keys!

---

## 📊 Scene Configuration (combat-scene.json)

The entire scene is configurable via JSON:

### Player Setup

```json
{
  "player": {
    "model": {
      "path": "Character/Models/Armature.fbx",
      "scale": [0.01, 0.01, 0.01]
    },
    "animations": {
      "slash1": {
        "path": "Freeflow Combat/.../Punch.fbx",
        "damage": 10,
        "range": 2.5
      }
    }
  }
}
```

### Enemy Setup

```json
{
  "enemies": [
    {
      "model": { "path": "..." },
      "health": 100,
      "position": [5, 0, 0]
    }
  ]
}
```

### Visual Effects

```json
{
  "postProcessing": {
    "bloom": { "enabled": true, "strength": 0.5 },
    "vignette": { "enabled": true }
  }
}
```

---

## 🎨 Visual Effects System

### Effect Types

1. **Movement Trails**
   - Colored line trails following player
   - Fade over time
   - Color matches attack type

2. **Impact Particles**
   - 30+ particles per hit
   - Random velocities
   - Gravity simulation
   - Additive blending

3. **Shockwave Rings**
   - Expanding ring on impact
   - Scales with attack intensity
   - Fades as it expands

4. **Camera Shake**
   - Intensity based on attack
   - Duration: 0.3 seconds
   - Smooth falloff

---

## 🔧 Customization

### Add New Attack

```javascript
// In combat-scene.json
"newAttack": {
  "path": "path/to/animation.fbx",
  "loop": false,
  "timeScale": 1.0,
  "damage": 20,
  "range": 3.0
}
```

### Change Effect Colors

```javascript
// In CombatDemo.js - getAttackColor()
const colors = {
  myAttack: 0x00ff00  // Green
};
```

### Adjust Combat Feel

```javascript
// In combat-scene.json
"combat": {
  "detectionRadius": 10.0,      // How far to detect enemies
  "traversalSpeed": 8.0,         // Speed to dash to enemy
  "cameraShakeIntensity": 0.3,  // Shake power
  "comboWindow": 0.6             // Time to continue combo
}
```

---

## 🎭 Animation Mapping

| Animation File | In-Game Name | Type |
|---------------|--------------|------|
| Punch.fbx | slash1 | Attack |
| Kick.fbx | slash2 | Attack |
| Roundhouse Kick.fbx | attack2 | Attack |
| Back Kick.fbx | kick | Attack |
| Jump Spin.fbx | charge | Attack |
| Side Flip.fbx | traversal1 | Movement |
| Spin.fbx | traversal2 | Movement |
| Stand--Idle.anim.fbx | idle | Locomotion |

---

## 🐛 Troubleshooting

### Models not loading?

- Check FBX file paths in `combat-scene.json`
- Ensure paths are relative to the HTML file
- Verify FBX files exist in correct folders

### Animations not playing?

- Check browser console for loading errors
- Verify animation paths in JSON
- Ensure AnimationMixer is updating

### Effects not showing?

- Enable bloom in post-processing
- Check particle material blending
- Verify scene lighting

### Performance issues?

- Reduce particle count in CombatSystem.js
- Disable bloom effect
- Lower shadow map resolution

---

## 📈 Performance Tips

- **Particle count**: Adjust in `createImpactEffect()` (default: 30)
- **Shadow quality**: Set in scene config (default: 2048)
- **Bloom**: Disable for +10-20 FPS
- **Enemy count**: Max 5-8 recommended

---

## 🎯 Next Steps

1. **Add Sound Effects**
   - Import audio files
   - Hook into attack events
   - Add spatial audio

2. **Add Hit Reactions**
   - Enemy knockback
   - Hitstun animations
   - Ragdoll on death

3. **Expand Combos**
   - Branching combo trees
   - Directional inputs
   - Aerial combos

4. **UI Enhancements**
   - Damage numbers
   - Health bars above enemies
   - Combo rating (S, A, B, C)

---

## 🔗 File Structure

```
Exported_FBX_Models/
├── index.html              # Game launcher
├── package.json            # Dependencies
├── combat-scene.json       # Scene config
├── CombatSystem.js         # Combat engine
├── CombatDemo.js           # Game implementation
├── AttackMotionSystem.js   # Original system (deprecated)
├── README.md               # This file
│
├── Character/
│   ├── Models/
│   │   └── Armature.fbx
│   └── Animations/
│       ├── Stand--Idle.anim.fbx
│       ├── Locomotion--Walk_N.anim.fbx
│       └── ...
│
├── Freeflow Combat/
│   └── Demo/Models/Animations/
│       ├── Player/Attacks/
│       │   ├── Punch.fbx
│       │   ├── Kick.fbx
│       │   └── ...
│       └── Player/Traversal/
│           └── ...
│
└── Environment/Art/Models/
    └── ...
```

---

## 📝 License

Converted from Unity Freeflow Combat System  
Three.js implementation for educational/personal use

---

## 🎉 Credits

- Original Unity combat system: Freeflow Combat
- Three.js implementation: Custom
- FBX models: From your Unity project
- Effects system: Custom particle and shader effects

---

**Ready to test!** Just run `npm install` then `npm run dev` and start fighting! 🥊
