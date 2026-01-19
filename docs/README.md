# Attack Motion System for Three.js

Converted from Unity Freeflow Combat System to Three.js

## 📁 Files Exported

### Models & Animations (FBX)

Located in: `E:\Gamewithall\Grudge Strat\Exported_FBX_Models\`

**Character Models:**

- `Armature.fbx` - Main character rig
- `Frank.fbx` - Parkour character
- `Character.fbx`, `Character2.fbx` - Combat characters
- `Dummy.fbx`, `Dummy2.fbx` - Training dummies

**Attack Animations:**

- `Punch.fbx` - Basic punch attack
- `Kick.fbx` - Basic kick attack
- `Roundhouse Kick.fbx` - Roundhouse kick
- `Back Kick.fbx` - Back kick attack

**Traversal Animations:**

- `Jump Spin.fbx`, `Jump Spin 2.fbx` - Spinning jump attacks
- `Side Flip.fbx` - Side flip traversal
- `Spin.fbx` - Spinning movement

**Locomotion Animations:**

- `Stand--Idle.anim.fbx` - Idle stance
- `Locomotion--Walk_N.anim.fbx` - Walking
- `Locomotion--Run_N.anim.fbx` - Running
- `Jump--Jump.anim.fbx`, `Jump--InAir.anim.fbx` - Jump animations

**Environment Models:**

- Various boxes, ramps, stairs, walls, tunnels

---

## 🎮 AttackMotionSystem.js

### Features

✅ **Target Detection** - Automatic enemy detection within radius  
✅ **Smart Targeting** - Best target selection based on input direction  
✅ **Attack Combos** - Chain attacks with randomization option  
✅ **Traversal System** - Smooth movement to targets  
✅ **Animation Blending** - Crossfade between animations  
✅ **Camera-Relative Input** - Input relative to camera direction  
✅ **Customizable** - Extensive configuration options  

### Quick Start

```javascript
import { AttackMotionSystem } from './AttackMotionSystem.js';

// Create attack system
const attackSystem = new AttackMotionSystem(playerMesh, camera, {
    detectionRadius: 10.0,
    traversalTime: 0.5,
    randomizeAttackAnim: true,
    mixer: animationMixer
});

// Add animations
attackSystem.addAttackAnimation('Punch', punchAction, 2.0);
attackSystem.addAttackAnimation('Kick', kickAction, 2.5);
attackSystem.addTraversalAnimation('Jump Spin', jumpSpinAction);
attackSystem.setIdleAnimation(idleAction);

// Register enemies
attackSystem.registerEnemy(enemyMesh, true);

// In your game loop
function update(deltaTime) {
    attackSystem.setInput(xInput, yInput); // -1 to 1
    attackSystem.update(deltaTime);
    
    if (attackButtonPressed) {
        attackSystem.attack();
    }
}
```

### Configuration Options

```javascript
{
    detectionRadius: 10.0,              // Enemy detection range
    traversalTime: 0.5,                 // Time to move to enemy
    idleAnimName: 'Idle',               // Idle animation name
    randomizeAttackAnim: false,         // Random attack selection
    randomizeTraversalAnim: false,      // Random traversal selection
    useTraversalAnimations: false,      // Enable traversal anims
    applyTraversalAnimDistance: 5.0,    // Min distance for traversal
    maintainYPosition: true,            // Lock Y during traversal
    attackTransitionSpeed: 0.3,         // Animation blend speed
    traversalTransitionSpeed: 0.3,      // Traversal blend speed
    mixer: null                         // THREE.AnimationMixer
}
```

### API Reference

#### Methods

**`addAttackAnimation(name, action, attackDistance)`**

- Add an attack animation to the system
- `name`: String identifier
- `action`: THREE.AnimationAction
- `attackDistance`: Distance to stop at (meters)

**`addTraversalAnimation(name, action)`**

- Add a traversal/movement animation
- Used when moving between distant enemies

**`setIdleAnimation(action)`**

- Set the default idle animation

**`registerEnemy(enemyMesh, isAttackable)`**

- Register an enemy for targeting
- `enemyMesh`: THREE.Mesh
- `isAttackable`: Boolean

**`removeEnemy(enemyMesh)`**

- Remove an enemy from targeting system

**`setInput(x, y)`**

- Set directional input
- `x`: Horizontal (-1 to 1)
- `y`: Vertical (-1 to 1)

**`attack()`**

- Execute attack on nearest valid target
- Call when player presses attack button

**`update(deltaTime)`**

- Update system state
- Call every frame in render loop

**`stopAttacking()`**

- Force stop current attack
- Returns to idle state

**`visualizeDetectionRadius(scene)`**

- Debug helper - shows detection sphere
- Returns wire sphere mesh

#### Properties (Read-only)

- `currentTarget` - Currently targeted enemy
- `isTraversing` - Is player moving to enemy
- `isAttacking` - Is attack animation playing

---

## 🎯 How It Works

### 1. Target Detection

```
Player presses attack → System scans within detectionRadius
→ Filters attackable enemies → Raycasts to check line of sight
→ Selects best target based on input direction
```

### 2. Traversal

```
Target found → Look at target → Start lerp movement
→ Play traversal animation (if far enough)
→ Move towards enemy over traversalTime
```

### 3. Attack Execution

```
Within attackDistance → Stop traversal
→ Play attack animation → Wait for animation complete
→ Return to idle → Check for combo/next enemy
```

### 4. Combo System

```
During attack → Store new input/target as "nextEnemy"
→ After current attack finishes → Auto-attack nextEnemy
→ Creates fluid combo chains
```

---

## 📋 Animation Mapping

| Unity Animation | FBX File | Recommended Distance |
|----------------|----------|---------------------|
| Punch | `Punch.fbx` | 2.0m |
| Kick | `Kick.fbx` | 2.2m |
| Roundhouse Kick | `Roundhouse Kick.fbx` | 2.5m |
| Back Kick | `Back Kick.fbx` | 2.8m |
| Jump Spin | `Jump Spin.fbx` | Traversal |
| Side Flip | `Side Flip.fbx` | Traversal |
| Spin | `Spin.fbx` | Traversal |

---

## 🎨 Integration Tips

### With Existing Character Controller

```javascript
// Disable movement during attacks
if (attackSystem.isAttacking || attackSystem.isTraversing) {
    characterController.enabled = false;
} else {
    characterController.enabled = true;
}
```

### With Physics

```javascript
// Disable physics during combat
if (attackSystem.isAttacking) {
    playerRigidbody.isKinematic = true;
} else {
    playerRigidbody.isKinematic = false;
}
```

### Camera-Relative Controls

The system automatically handles camera-relative input. Just pass raw WASD values:

```javascript
attackSystem.setInput(
    (keys.d ? 1 : 0) - (keys.a ? 1 : 0),  // x
    (keys.w ? 1 : 0) - (keys.s ? 1 : 0)   // y
);
```

---

## 🐛 Troubleshooting

**Enemies not detected?**

- Check `detectionRadius` value
- Ensure enemies are registered with `registerEnemy()`
- Verify enemy `isAttackable` is `true`

**Animations not playing?**

- Ensure `mixer` is passed in options
- Check that AnimationActions are created correctly
- Verify `mixer.update(deltaTime)` is called each frame

**Player not moving to enemy?**

- Check `traversalTime` isn't too small
- Ensure `attackDistance` < `detectionRadius`
- Verify target is valid and attackable

**Combos not working?**

- Input must be provided during attack
- New target must be within detection radius
- System queues next attack automatically

---

## 📦 Dependencies

```json
{
    "dependencies": {
        "three": "^0.160.0"
    }
}
```

---

## 🚀 Next Steps

1. Load your FBX models into Three.js
2. Set up AnimationMixer for your character
3. Initialize AttackMotionSystem
4. Load and add attack/traversal animations
5. Register enemies
6. Call `attack()` on input
7. Call `update()` every frame

See `ExampleUsage.js` for complete implementation!

---

## 📄 License

Converted from Unity Freeflow Combat System  
Original Unity scripts © Freeflow Combat package  
Three.js implementation for educational/personal use
