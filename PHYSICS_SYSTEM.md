# Physics System - Rapier.js Integration

## Overview
The controllerGrudge project now includes a **high-performance physics engine** powered by [Rapier.js](https://rapier.rs), a Rust-based WASM physics library that provides near-native performance in web browsers.

## Features

### ✅ Speed-Based Collision Response
The system automatically detects collision impact speed and triggers appropriate responses:

| Impact Type | Speed Range | Response |
|-------------|-------------|----------|
| **Light** | 0-2 m/s | Slight slowdown, no animation |
| **Medium** | 2-5 m/s | Light hit animation + small knockback |
| **Heavy** | 5-8 m/s | Heavy hit animation + strong knockback |
| **Ragdoll** | >8 m/s | Full ragdoll physics activation |

### ✅ Ragdoll Physics
- Activates automatically on extreme impacts (>8 m/s)
- Creates physics bodies for each bone in the skeleton
- Smooth 2-second ragdoll duration before returning to animation
- Locks player input during ragdoll state

### ✅ Collision Detection
- **Capsule colliders** for characters (realistic human shape)
- **Box/Cylinder colliders** for static obstacles
- Continuous collision detection prevents tunneling
- Velocity tracking for accurate impact speed calculation

## Installation

Already installed! The system uses:
```bash
npm install @dimforge/rapier3d-compat
```

## Usage

### Basic Setup
The physics system is automatically initialized when you call `initializeSystems()`:

```javascript
// In EnhancedWarriorDemo.js
await this.controller.initializeSystems(this.scene, this.camera, this.warrior);
```

### Adding Colliders

#### Character (Kinematic)
```javascript
this.physicsSystem.addCharacter(characterMesh, {
  mass: 70,              // kg
  radius: 0.4,           // Capsule radius
  height: 1.8,           // Capsule height
  isKinematic: true,     // Player-controlled
  friction: 0.5,
  restitution: 0.0       // No bounce
});
```

#### Static Obstacles
```javascript
this.physicsSystem.addStaticCollider(wallMesh, {
  friction: 0.8,
  restitution: 0.1
});
```

### Collision Callbacks
Collision events are automatically handled via the `handlePhysicsCollision()` method in RacalvinController:

```javascript
handlePhysicsCollision(event) {
  const { impactSpeed, impactType, direction } = event;
  
  switch (impactType) {
    case 'light':   // Soft bump
    case 'medium':  // Play hit animation
    case 'heavy':   // Strong knockback
    case 'ragdoll': // Activate ragdoll physics
  }
}
```

## Configuration

Configure physics thresholds in `DEFAULT_CONFIG` (RacalvinController.js):

```javascript
// Physics - Speed-based collision responses
enablePhysics: true,           // Enable/disable physics
lightImpactSpeed: 2.0,         // m/s - Light hit threshold
mediumImpactSpeed: 5.0,        // m/s - Medium hit threshold
heavyImpactSpeed: 8.0,         // m/s - Heavy hit/ragdoll threshold
```

## Animations

The system uses three impact animations from your Action-Adventure pack:

1. **Light Impact**: `sword and shield impact.fbx`
2. **Medium Impact**: `impact (2).fbx`
3. **Heavy Impact**: `impact (3).fbx`

These are automatically mapped in `GameConfig.js`:

```javascript
animations: {
  hitLight: "sword and shield impact.fbx",
  hitMedium: "impact (2).fbx",
  hitHeavy: "impact (3).fbx",
}
```

## Test Environment

The demo includes test obstacles for collision testing:
- 2 pillars (gray)
- 1 wall (gray)
- 1 box (brown)

**To test collisions:**
1. Run into obstacles at different speeds
2. Sprint into a wall to trigger ragdoll (>8 m/s)
3. Watch console for collision logs: `⚡ Collision: medium impact at 3.45 m/s`

## Performance

**Rapier.js advantages:**
- ✅ **Lightweight**: ~300KB (vs 1.5MB+ for Ammo.js)
- ✅ **Fast**: WASM-based, near-native performance
- ✅ **Modern**: Active development, excellent Three.js integration
- ✅ **Scalable**: Handles thousands of physics bodies

**Alternatives considered:**
- ❌ Cannon.js: Larger filesize, older API
- ❌ Ammo.js: Most powerful but 1.5MB+, complex API
- ❌ PhysX: No JS/WASM port yet

## API Reference

### PhysicsSystem Methods

#### `async init()`
Initialize Rapier physics engine (called automatically)

#### `addCharacter(mesh, options)`
Add character with capsule collider
- Returns: `{ rigidBody, collider }`

#### `addStaticCollider(mesh, options)`
Add static obstacle (walls, floors, etc.)
- Auto-detects shape from geometry type

#### `update(deltaTime)`
Step physics simulation (called every frame)

#### `activateRagdoll(character, impulseDirection)`
Manually activate ragdoll physics
- `character`: Three.js mesh with skeleton
- `impulseDirection`: Initial velocity vector

#### `deactivateRagdoll(character)`
Manually deactivate ragdoll and return to animation

#### `applyKnockback(mesh, direction, impactType)`
Apply impulse force to character
- `direction`: Vector3 knockback direction
- `impactType`: 'light', 'medium', 'heavy', or 'ragdoll'

#### `shouldActivateRagdoll(impactSpeed)`
Check if speed exceeds ragdoll threshold

## Troubleshooting

### "PhysicsSystem not initialized"
Make sure you're using `await` when calling `initializeSystems()`:
```javascript
await this.controller.initializeSystems(scene, camera, characterMesh);
```

### Collisions not detected
Ensure objects are added to physics system:
```javascript
this.physicsSystem.addStaticCollider(obstacle);
```

### Ragdoll not working
Check that your character mesh has a skeleton:
```javascript
character.traverse((child) => {
  if (child.isSkinnedMesh && child.skeleton) {
    console.log('Skeleton found:', child.skeleton.bones.length, 'bones');
  }
});
```

## Future Enhancements

Possible additions:
- [ ] Dynamic obstacles (moving platforms)
- [ ] Breakable objects
- [ ] Vehicle physics
- [ ] Fluid simulation (Rapier supports fluids!)
- [ ] Cloth physics
- [ ] Character controller with ground detection

## Credits

- **Physics Engine**: [Rapier.rs](https://rapier.rs) by Dimforge
- **Integration**: controllerGrudge team
- **Animations**: Mixamo Action-Adventure Pack

## References

- [Rapier.js Documentation](https://rapier.rs/docs/user_guides/javascript/getting_started_js)
- [Three.js Examples](https://threejs.org/examples/)
- [Physics Best Practices](https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_collision_detection)

---

**Need Help?** Check the console logs for detailed physics events and collision data.
