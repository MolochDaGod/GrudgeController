# Animation & Controller Best Practices Guide

## Core Principles

### 1. **Separation of Concerns**
- **Controller handles movement logic** - Input determines velocity and position
- **Animations are cosmetic** - They visualize the state, not control it
- **State machine manages transitions** - Blend between animations based on controller state

### 2. **Animation-Driven vs. Physics-Driven Movement**

❌ **WRONG: Root Motion (Animation controls position)**
```javascript
// Animation moves the character
mixer.update(deltaTime);
character.position.copy(animationRoot.position); // BAD!
```

✅ **CORRECT: Physics-Driven (Input controls position)**
```javascript
// Input moves character
character.velocity.x = input.x * speed;
character.position.add(velocity * deltaTime);

// Animation just visualizes current state
selectAnimation(character.state);
mixer.update(deltaTime);
```

---

## Animation State Machine Architecture

### State Definition
```javascript
const AnimationStates = {
  // Locomotion
  IDLE: { name: 'idle', duration: 1.0, loop: true, blendTime: 0.2 },
  WALK: { name: 'walk', duration: 1.2, loop: true, blendTime: 0.3 },
  RUN: { name: 'run', duration: 0.8, loop: true, blendTime: 0.2 },
  WALK_BACK: { name: 'walk_back', duration: 1.5, loop: true, blendTime: 0.3 },
  
  // Combat
  ATTACK_1: { name: 'attack_1', duration: 0.6, loop: false, blendTime: 0.1 },
  ATTACK_2: { name: 'attack_2', duration: 0.7, loop: false, blendTime: 0.1 },
  ATTACK_3: { name: 'attack_3', duration: 0.8, loop: false, blendTime: 0.1 },
  
  // Defense
  BLOCK_IDLE: { name: 'block_idle', duration: 1.0, loop: true, blendTime: 0.15 },
  BLOCK_HIT: { name: 'block_hit', duration: 0.3, loop: false, blendTime: 0.05 },
  
  // Mobility
  ROLL: { name: 'roll', duration: 0.5, loop: false, blendTime: 0.1 },
  JUMP: { name: 'jump', duration: 0.4, loop: false, blendTime: 0.1 },
  FALL: { name: 'fall', duration: 0.6, loop: true, blendTime: 0.2 },
  LAND: { name: 'land', duration: 0.3, loop: false, blendTime: 0.1 },
};
```

### State Machine Implementation

```javascript
class AnimationController {
  constructor(mixer, animations) {
    this.mixer = mixer;
    this.animations = new Map(); // name -> AnimationAction
    this.currentState = null;
    this.previousState = null;
    this.stateStartTime = 0;
    this.transitionDuration = 0;
    
    // Load all animations
    animations.forEach(clip => {
      const action = mixer.clipAction(clip);
      this.animations.set(clip.name, action);
    });
  }
  
  /**
   * Transition to new state with proper blending
   */
  transitionTo(stateName, overrideBlendTime = null) {
    const state = AnimationStates[stateName];
    if (!state) {
      console.error(`Animation state ${stateName} not found`);
      return;
    }
    
    const newAction = this.animations.get(state.name);
    if (!newAction) {
      console.error(`Animation action ${state.name} not found`);
      return;
    }
    
    // Already in this state
    if (this.currentState === stateName) return;
    
    // Stop previous animation
    if (this.currentState) {
      const prevAction = this.animations.get(
        AnimationStates[this.currentState].name
      );
      const blendTime = overrideBlendTime || state.blendTime;
      prevAction.fadeOut(blendTime);
    }
    
    // Start new animation
    newAction
      .reset()
      .setLoop(state.loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity)
      .fadeIn(overrideBlendTime || state.blendTime)
      .play();
    
    this.previousState = this.currentState;
    this.currentState = stateName;
    this.stateStartTime = performance.now() / 1000;
    
    console.log(`Animation: ${this.previousState} -> ${stateName}`);
  }
  
  /**
   * Check if current animation has finished (for non-looping animations)
   */
  isCurrentAnimationFinished() {
    if (!this.currentState) return true;
    
    const state = AnimationStates[this.currentState];
    if (state.loop) return false;
    
    const elapsed = (performance.now() / 1000) - this.stateStartTime;
    return elapsed >= state.duration;
  }
  
  /**
   * Get progress of current animation (0-1)
   */
  getCurrentAnimationProgress() {
    if (!this.currentState) return 0;
    
    const state = AnimationStates[this.currentState];
    const elapsed = (performance.now() / 1000) - this.stateStartTime;
    return Math.min(elapsed / state.duration, 1.0);
  }
  
  update(deltaTime) {
    this.mixer.update(deltaTime);
  }
}
```

---

## Integration with RacalvinController

### Modified Controller Update Loop

```javascript
update(deltaTime) {
  // 1. PROCESS INPUT
  this.processInput();
  
  // 2. UPDATE CONTROLLER STATE (Physics/Logic)
  this.updateTargetLock(deltaTime);
  this.updateMovement(deltaTime);
  this.updateCombat(deltaTime);
  
  // 3. SELECT ANIMATION BASED ON STATE
  this.updateAnimationState();
  
  // 4. UPDATE ANIMATION MIXER
  this.animationController.update(deltaTime);
  
  // 5. UPDATE CAMERA
  this.updateCamera(deltaTime);
}

updateAnimationState() {
  const char = this.character;
  
  // Priority system: check in order of importance
  
  // 1. Hit reactions (highest priority)
  if (char.hitReactTimer > 0) {
    this.animationController.transitionTo('HIT_REACT');
    return;
  }
  
  // 2. Rolling
  if (char.rollTimer > 0) {
    this.animationController.transitionTo('ROLL');
    return;
  }
  
  // 3. Attacking
  if (char.attackTimer > 0) {
    const attackNum = char.attackCombo % 3 || 3;
    this.animationController.transitionTo(`ATTACK_${attackNum}`);
    return;
  }
  
  // 4. Airborne
  if (!char.isGrounded) {
    if (char.velocity.y > 1) {
      this.animationController.transitionTo('JUMP');
    } else if (char.velocity.y < -1) {
      this.animationController.transitionTo('FALL');
    }
    return;
  }
  
  // 5. Blocking
  if (char.isBlocking) {
    this.animationController.transitionTo('BLOCK_IDLE');
    return;
  }
  
  // 6. Locomotion (lowest priority)
  const speed = Math.abs(char.forwardVel);
  
  if (speed < 0.1) {
    this.animationController.transitionTo('IDLE');
  } else if (char.isWalkingBack) {
    this.animationController.transitionTo('WALK_BACK');
  } else if (speed > 6) {
    this.animationController.transitionTo('RUN');
  } else {
    this.animationController.transitionTo('WALK');
  }
}
```

---

## Target Lock System with Raycasting

### Enhanced Target Detection

```javascript
/**
 * Find target using camera-based raycasting
 */
findTargetWithRaycast() {
  const char = this.character;
  
  // Option 1: Center screen raycast (most precise)
  const screenCenter = new THREE.Vector2(0, 0);
  this.raycaster.setFromCamera(screenCenter, this.camera);
  
  // Option 2: Character forward raycast (for melee range)
  const forward = new THREE.Vector3(
    Math.sin(char.faceAngle),
    0,
    Math.cos(char.faceAngle)
  );
  const origin = char.position.clone().add(new THREE.Vector3(0, 1, 0));
  this.raycaster.set(origin, forward);
  
  // Filter targetable enemies
  const targetableObjects = this.enemies
    .filter(e => e.isAttackable && e.health > 0)
    .map(e => e.mesh);
  
  const intersects = this.raycaster.intersectObjects(targetableObjects, true);
  
  if (intersects.length > 0) {
    // Find root enemy object
    let targetMesh = intersects[0].object;
    while (targetMesh.parent && !this.enemies.find(e => e.mesh === targetMesh)) {
      targetMesh = targetMesh.parent;
    }
    
    return this.enemies.find(e => e.mesh === targetMesh);
  }
  
  return null;
}

/**
 * Update character rotation to face locked target
 */
updateTargetFacing(deltaTime) {
  const char = this.character;
  
  if (!char.lockedTarget || !char.lockedTarget.position) return;
  
  // Calculate angle to target
  const toTarget = new THREE.Vector3()
    .subVectors(char.lockedTarget.position, char.position);
  const targetAngle = Math.atan2(toTarget.x, toTarget.z);
  
  // Smooth rotation toward target
  let angleDiff = targetAngle - char.faceAngle;
  
  // Normalize angle difference
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  
  // Apply rotation with smooth turn rate
  const turnSpeed = this.config.targetLockTurnSpeed || Math.PI * 3;
  const maxTurn = turnSpeed * deltaTime;
  
  if (Math.abs(angleDiff) < maxTurn) {
    char.faceAngle = targetAngle;
  } else {
    char.faceAngle += Math.sign(angleDiff) * maxTurn;
  }
  
  // Keep character facing target during strafing
  if (char.isBlocking || char.lockedTarget) {
    // Allow strafing without changing face direction
    const strafeInput = this.input.moveX;
    if (Math.abs(strafeInput) > 0.1) {
      // Strafe perpendicular to target direction
      const strafeAngle = char.faceAngle + Math.PI / 2;
      char.sideVel = strafeInput * this.config.walkSpeed * 0.7;
    }
  }
}
```

---

## Attack System with Target Lock

### Attack Execution Flow

```javascript
executeAttack() {
  const char = this.character;
  
  // 1. Find or use locked target
  let target = char.lockedTarget;
  if (!target) {
    target = this.findTargetWithRaycast();
  }
  
  if (!target) {
    console.log('No target found');
    return;
  }
  
  // 2. Check if within attack range
  const distance = char.position.distanceTo(target.position);
  const attackData = this.getAttackData(char.attackCombo);
  
  if (distance > attackData.range) {
    // Traverse toward target first
    this.startTraversal(target, attackData.range - 0.5);
    return;
  }
  
  // 3. Face target instantly when attacking
  const toTarget = new THREE.Vector3()
    .subVectors(target.position, char.position);
  char.faceAngle = Math.atan2(toTarget.x, toTarget.z);
  
  // 4. Set attack state
  char.attackTimer = attackData.duration;
  char.isAttacking = true;
  char.currentAttackTarget = target;
  
  // 5. Animation will be selected in updateAnimationState()
  
  // 6. Schedule damage application at hit frame
  const hitFrame = attackData.hitFrame || 0.3; // 30% through animation
  setTimeout(() => {
    this.applyAttackDamage(target, attackData);
  }, hitFrame * attackData.duration * 1000);
}

applyAttackDamage(target, attackData) {
  if (!target || target.health <= 0) return;
  
  // Check if still in range (player might have moved)
  const distance = this.character.position.distanceTo(target.position);
  if (distance > attackData.range) {
    console.log('Attack missed - out of range');
    return;
  }
  
  // Apply damage
  target.health -= attackData.damage;
  target.isStunned = true;
  target.stunTimer = attackData.hitStun || 0.3;
  
  // Visual feedback
  this.createHitEffect(target.position, attackData.effectColor);
  this.shakeCamera(attackData.cameraShake || 0.5);
  
  console.log(`Hit! Damage: ${attackData.damage}, Target HP: ${target.health}`);
}
```

---

## Attack Data Configuration

```javascript
const ATTACK_DATABASE = {
  LIGHT_1: {
    name: 'Light Attack 1',
    animation: 'ATTACK_1',
    duration: 0.6,
    hitFrame: 0.35, // 35% through animation (0.21s)
    damage: 10,
    range: 2.5,
    hitStun: 0.3,
    cameraShake: 0.3,
    effectColor: 0xFFAA00,
    comboWindow: 0.4, // Time after hit to input next attack
    canComboInto: ['LIGHT_2', 'HEAVY_1'],
  },
  
  LIGHT_2: {
    name: 'Light Attack 2',
    animation: 'ATTACK_2',
    duration: 0.7,
    hitFrame: 0.40,
    damage: 12,
    range: 2.5,
    hitStun: 0.35,
    cameraShake: 0.4,
    effectColor: 0xFFAA00,
    comboWindow: 0.45,
    canComboInto: ['LIGHT_3', 'HEAVY_2'],
  },
  
  LIGHT_3: {
    name: 'Light Attack 3 (Finisher)',
    animation: 'ATTACK_3',
    duration: 0.9,
    hitFrame: 0.50,
    damage: 20,
    range: 3.0,
    hitStun: 0.6,
    cameraShake: 0.7,
    effectColor: 0xFF3300,
    comboWindow: 0, // Ends combo
    canComboInto: [],
  },
  
  HEAVY_1: {
    name: 'Heavy Attack',
    animation: 'HEAVY_ATTACK',
    duration: 1.2,
    hitFrame: 0.60,
    damage: 35,
    range: 3.5,
    hitStun: 0.8,
    cameraShake: 1.0,
    effectColor: 0xFF0000,
    comboWindow: 0,
    canComboInto: [],
  },
};
```

---

## Combo System

```javascript
updateCombatInput(deltaTime) {
  const char = this.character;
  
  // Attack input
  if (this.input.attack && !this.prevInput.attack) {
    if (char.attackTimer > 0) {
      // Already attacking - queue combo
      if (this.canCombo()) {
        char.comboQueued = true;
      }
    } else if (char.attackCooldown <= 0) {
      // Start new attack
      this.startAttack();
    }
  }
  
  // Handle queued combo
  if (char.comboQueued && this.isInComboWindow()) {
    char.comboQueued = false;
    char.attackCombo = (char.attackCombo % 3) + 1;
    this.executeAttack();
  }
  
  // Reset combo if window expired
  if (!this.isInComboWindow() && !char.isAttacking) {
    char.attackCombo = 0;
  }
}

isInComboWindow() {
  const char = this.character;
  if (char.attackTimer <= 0) return false;
  
  const attackData = this.getAttackData(char.attackCombo);
  const progress = 1 - (char.attackTimer / attackData.duration);
  const comboStartFrame = attackData.hitFrame + 0.1;
  
  return progress >= comboStartFrame;
}

canCombo() {
  const char = this.character;
  const currentAttack = this.getAttackData(char.attackCombo);
  return currentAttack.comboWindow > 0;
}
```

---

## Configuration Updates for RacalvinController

```javascript
// Add to DEFAULT_CONFIG
export const DEFAULT_CONFIG = {
  // ... existing config ...
  
  // Target Lock
  targetLockTurnSpeed: Math.PI * 3, // Fast turn toward target
  targetLockStrafeSpeed: 0.7, // Multiplier for strafe speed
  
  // Combat
  comboQueueWindow: 0.2, // Time before hit where combo can be queued
  attackQueueEnabled: true, // Allow buffering attack inputs
  
  // Animation Blending
  animationBlendTimes: {
    idle: 0.2,
    locomotion: 0.3,
    combat: 0.1,
    hit: 0.05,
  },
};
```

---

## Complete Implementation Checklist

### Phase 1: Animation System
- [ ] Create `AnimationController` class
- [ ] Define all animation states with durations
- [ ] Implement state transition system with blend times
- [ ] Add animation progress tracking
- [ ] Test animation blending visually

### Phase 2: Input-Driven Movement
- [ ] Remove any root motion from animations
- [ ] Ensure controller calculates velocity from input
- [ ] Add animation selection based on velocity/state
- [ ] Test movement feels responsive

### Phase 3: Target Lock System
- [ ] Implement raycasting for target detection
- [ ] Add target lock toggle (Z key)
- [ ] Add target cycle (X key)
- [ ] Implement smooth rotation toward target
- [ ] Add strafe movement when locked

### Phase 4: Combat Integration
- [ ] Create attack database with timing data
- [ ] Implement damage application at hit frames
- [ ] Add combo system with input buffering
- [ ] Face target when attacking
- [ ] Test attack range and hit detection

### Phase 5: Polish
- [ ] Add camera shake on hits
- [ ] Add hit effects/particles
- [ ] Tune animation blend times
- [ ] Balance attack timings
- [ ] Add sound effects

---

## Testing Procedure

1. **Movement Test**: Walk in all directions, verify animations blend smoothly
2. **Combat Test**: Execute 3-hit combo, verify timing and damage
3. **Target Lock Test**: Lock onto enemy, strafe around them
4. **Combo Test**: Queue attacks during combo window
5. **Range Test**: Attack from various distances, verify traversal
6. **Polish Test**: Check camera shake, effects, overall feel

---

## Common Pitfalls to Avoid

❌ Animations controlling position (root motion in gameplay)
❌ Instant animation transitions (no blending)
❌ Attack damage applied at animation start (should be at hit frame)
❌ No combo queuing (feels unresponsive)
❌ Character doesn't face target when attacking
❌ Movement during attack animations
❌ No visual feedback on hits

✅ Input controls position
✅ Smooth animation blending
✅ Damage at visual hit frame
✅ Input buffering/queuing
✅ Auto-aim on attack start
✅ Lock movement during attacks
✅ Camera shake + effects

---

**Next Step**: Implement `AnimationController` class and integrate with `RacalvinController.update()`
