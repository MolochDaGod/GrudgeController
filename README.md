# ControllerGrudge - Souls-like Combat System

A third-person action combat system built with Three.js, inspired by Dark Souls, Assassin's Creed, and World of Warcraft.

## Features

- **Advanced Movement System**
  - Tank controls with responsive turning
  - Smooth walking, running, and backwards movement
  - Improved jump mechanics with coyote time and input buffering
  - Landing animations with recovery time
  - Dodge rolls (forward, left, right)

- **Combat System**
  - 3-hit combo attack chains
  - Block and strafe mechanics
  - Target lock system (Tab key)
  - Enemy tracking and collision

- **Animation System**
  - 50+ sword & shield animations
  - Animation-driven movement sync
  - Debug UI for testing animations
  - Smooth transitions between states

- **Camera System**
  - Auto-follow behind character
  - Free-look mode (hold RMB)
  - Smooth camera movement
  - Keyboard camera controls

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:3000 in your browser.

## Controls

### Movement
- **W/S** - Forward/Backward
- **A/D** - Turn Left/Right (tank controls)
- **Q/E** - Strafe Left/Right
- **Shift** - Run / Roll
- **Space** - Jump

### Combat
- **Left Click** - Attack (3-hit combo)
- **Right Click (Hold)** - Block
- **Tab** - Lock Target
- **X** - Cycle Targets
- **F** - Interact

### Dodge Rolls
- **Double-tap A** - Roll Left
- **Double-tap D** - Roll Right
- **Shift + W** - Roll Forward

### Camera
- **Mouse** - Look Around (when blocking)
- **I/K** - Pitch Up/Down
- **J/L** - Turn Left/Right

## Project Structure

```
controllerGrudge/
├── src/
│   ├── config/
│   │   └── GameConfig.js          # Single source of truth for all configs
│   ├── demos/
│   │   ├── EnhancedWarriorDemo.js # Main demo (only active demo)
│   │   └── archive/               # Old/unused demos
│   ├── systems/
│   │   ├── RacalvinController.js  # Core controller with jump improvements
│   │   ├── AnimationController.js # Animation state management
│   │   ├── AnimationMapper.js     # Animation file mappings
│   │   ├── AudioSystem.js         # 3D spatial audio
│   │   ├── HitZoneSystem.js       # Location-based damage
│   │   ├── ParticleSystem.js      # Combat effects
│   │   └── RangedWeaponSystem.js  # Projectile weapons
│   ├── ui/
│   │   └── AnimationDebugUI.js    # Animation testing interface
│   └── utils/
│       └── ObjectPool.js          # Performance optimization
├── public/
│   └── models/
│       └── RacalvinDaWarrior/     # Character and animation FBX files
├── docs/                          # All documentation organized by category
│   ├── setup/
│   ├── implementation/
│   └── reference/
├── index.html                     # Main entry point
├── package.json
├── vite.config.js
└── vercel.json
```

## Jump System Improvements

The jump system has been enhanced with modern game mechanics:

### Features
- **Coyote Time (150ms)** - Grace period after leaving ground edge
- **Jump Buffering (100ms)** - Queue jumps before landing
- **Landing States** - Light (0.2s) and heavy (0.4s) recovery animations
- **Air Control** - 30% directional influence while airborne
- **Forward Momentum** - Running jumps carry horizontal speed
- **Variable Jump Height** - Reduced from 10 to 8 for more grounded feel

### Animation Flow
```
jump (rising) → fall (descending) → land (recovery) → idle
```

## Combat System

### Attack Combos
1. **Slash 1** - Quick horizontal slash
2. **Slash 2** - Overhead swing
3. **Attack 2** - Heavy finisher with knockback

Each attack has a 1.5s animation lock to prevent sliding and ensure proper timing.

### Target Lock
- Press **Tab** to lock onto nearest enemy
- Enemies show health bars when locked
- Camera focuses on target
- Strafe around locked target with A/D while blocking

## Animation Debug UI

Press a button in the Animation Debug UI to:
- Play any animation immediately
- Assign custom hotkeys to animations
- Test animation transitions

Hotkeys are saved in localStorage for persistence.

## Development

### File Organization
- One main demo: `EnhancedWarriorDemo.js`
- One config: `GameConfig.js`
- All systems integrated into `RacalvinController.js`
- Documentation organized in `docs/` folder

### Configuration
All settings are in `src/config/GameConfig.js`:
- Movement physics
- Combat parameters
- Camera settings
- Animation mappings
- Enemy properties

### Adding New Animations
1. Place FBX file in `public/models/RacalvinDaWarrior/`
2. Add mapping in `GameConfig.js` animations section
3. Update state machine in `RacalvinController.js` if needed

## Performance

- Post-processing effects (bloom)
- Shadow mapping optimized
- Object pooling for particles
- Animation LOD system ready

## Deployment

Deployed on Vercel with auto-deploy on push to main branch.

```bash
# Manual deploy
vercel --prod
```

## Credits

Built with:
- Three.js - 3D rendering
- Vite - Build tool
- Mixamo/Meshy - Character and animations

## License

MIT
