# Souls-Like Camera & Animation Improvements

## 🎮 Current Issues for Souls-Like Gameplay

### Camera Problems
1. ❌ Too much smoothing - feels sluggish
2. ❌ Camera distance too close
3. ❌ No collision detection with walls
4. ❌ Target lock doesn't adjust camera properly
5. ❌ No camera shake on attacks/hits

### Animation Timing Issues
1. ❌ Attack animations too fast (0.5-0.8s vs Souls 0.8-1.2s)
2. ❌ Roll too fast and spammable
3. ❌ No commitment to attacks (can cancel too early)
4. ❌ Hit stun too short
5. ❌ No animation root motion consideration

---

## 🔧 Recommended Changes

### 1. Camera Configuration

```javascript
// In DEFAULT_CONFIG
export const DEFAULT_CONFIG = {
  // Camera - Souls-like settings
  cameraDistance: 6.5,        // was 5 - move further back
  cameraHeight: 2.5,          // was 2 - raise slightly
  cameraPitch: 0.4,           // was 0.3 - look down more
  cameraSensitivity: 3.5,     // was 2.5 - faster response
  cameraSmoothing: 0.15,      // was 0.08 - MORE smoothing for that Souls feel
  minPitch: -0.5,             // was -0.8 - less looking down
  maxPitch: 1.4,              // was 1.2 - more looking up
  
  // Target lock camera
  targetLockDistance: 7.0,    // NEW - zoom out when locked
  targetLockHeight: 2.8,      // NEW - raise camera when locked
  targetLockSmoothing: 0.2,   // NEW - smooth lock transitions
  targetLockFocusOffset: 1.5, // NEW - look at chest, not feet
};
```

### 2. Animation Timing - Souls-Like Pacing

```javascript
// In AnimationController.js -> AnimationStates
export const AnimationStates = {
  // Locomotion - Keep responsive
  IDLE: { 
    name: 'idle', 
    duration: 1.0, 
    loop: true, 
    blendTime: 0.25,  // was 0.2 - slightly slower transition
    priority: 0 
  },
  
  WALK: { 
    name: 'walk', 
    duration: 1.2, 
    loop: true, 
    blendTime: 0.35,  // was 0.3 - smoother blending
    priority: 0 
  },
  
  RUN: { 
    name: 'run', 
    duration: 0.8, 
    loop: true, 
    blendTime: 0.25,  // was 0.2
    priority: 0 
  },
  
  // Combat - SLOWER and more committed
  ATTACK_1: { 
    name: 'attack_1', 
    duration: 0.9,    // was 0.6 - MUCH SLOWER
    loop: false, 
    blendTime: 0.05,  // was 0.1 - FAST startup
    priority: 3 
  },
  
  ATTACK_2: { 
    name: 'attack_2', 
    duration: 1.0,    // was 0.7 - SLOWER
    loop: false, 
    blendTime: 0.05,
    priority: 3 
  },
  
  ATTACK_3: { 
    name: 'attack_3', 
    duration: 1.3,    // was 0.8 - MUCH SLOWER (finisher)
    loop: false, 
    blendTime: 0.08,
    priority: 3 
  },
  
  HEAVY_ATTACK: { 
    name: 'heavy_attack', 
    duration: 1.5,    // was 1.2 - SLOWER
    loop: false, 
    blendTime: 0.2,   // was 0.15 - slower startup
    priority: 3 
  },
  
  // Defense
  BLOCK_IDLE: { 
    name: 'block_idle', 
    duration: 1.0, 
    loop: true, 
    blendTime: 0.2,   // was 0.15 - faster block startup
    priority: 2 
  },
  
  // Roll - Souls-like timing
  ROLL: { 
    name: 'roll', 
    duration: 0.7,    // was 0.5 - SLOWER
    loop: false, 
    blendTime: 0.05,  // was 0.1 - FAST startup for i-frames
    priority: 3 
  },
  
  // Hit reactions - MORE impact
  HIT_REACT: { 
    name: 'hit_react', 
    duration: 0.6,    // was 0.4 - LONGER stagger
    loop: false, 
    blendTime: 0.02,  // was 0.05 - INSTANT reaction
    priority: 5 
  },
};
```

### 3. Attack Database - Souls-Like Timing

```javascript
export const ATTACK_DATABASE = {
  LIGHT_1: {
    name: 'Light Attack 1',
    animation: 'ATTACK_1',
    duration: 0.9,          // was 0.6
    hitFrame: 0.45,         // was 0.35 - later hit
    recoveryFrame: 0.65,    // NEW - when you can roll/move
    damage: 10,
    range: 2.5,
    hitStun: 0.5,           // was 0.3 - MORE stun
    cameraShake: 0.4,       // was 0.3 - MORE shake
    effectColor: 0xFFAA00,
    comboWindow: 0.25,      // was 0.4 - TIGHTER window
    canComboInto: ['LIGHT_2', 'HEAVY_1'],
    movementLock: true,
    staminaCost: 10,        // NEW
  },
  
  LIGHT_2: {
    name: 'Light Attack 2',
    animation: 'ATTACK_2',
    duration: 1.0,          // was 0.7
    hitFrame: 0.5,          // was 0.40
    recoveryFrame: 0.7,
    damage: 12,
    range: 2.5,
    hitStun: 0.55,          // was 0.35
    cameraShake: 0.5,       // was 0.4
    effectColor: 0xFFAA00,
    comboWindow: 0.3,       // was 0.45
    canComboInto: ['LIGHT_3', 'HEAVY_1'],
    movementLock: true,
    staminaCost: 12,
  },
  
  LIGHT_3: {
    name: 'Light Attack 3 (Finisher)',
    animation: 'ATTACK_3',
    duration: 1.3,          // was 0.9
    hitFrame: 0.65,         // was 0.50 - MUCH later
    recoveryFrame: 1.0,
    damage: 20,
    range: 3.0,
    hitStun: 0.8,           // was 0.6 - LONG stagger
    cameraShake: 1.0,       // was 0.7 - BIG shake
    effectColor: 0xFF3300,
    comboWindow: 0,
    canComboInto: [],
    movementLock: true,
    staminaCost: 18,
  },
  
  HEAVY_1: {
    name: 'Heavy Attack',
    animation: 'HEAVY_ATTACK',
    duration: 1.5,          // was 1.2
    hitFrame: 0.75,         // was 0.60 - VERY late hit
    recoveryFrame: 1.1,
    damage: 35,
    range: 3.5,
    hitStun: 1.0,           // was 0.8 - MASSIVE stagger
    cameraShake: 1.5,       // was 1.0 - HUGE shake
    effectColor: 0xFF0000,
    comboWindow: 0,
    canComboInto: [],
    movementLock: true,
    staminaCost: 30,
  },
};
```

### 4. Movement & Roll Configuration

```javascript
// In DEFAULT_CONFIG
export const DEFAULT_CONFIG = {
  // Movement - Souls-like feel
  maxSpeed: 7,              // was 8 - slightly slower sprint
  walkSpeed: 3.0,           // was 3.2 - slower walk
  acceleration: 20,         // was 25 - less snappy
  deceleration: 18,         // was 15 - more momentum
  
  // Roll - Souls-like i-frames
  rollSpeed: 10,            // was 12 - slower
  rollDuration: 0.7,        // was 0.5 - LONGER
  rollCooldown: 1.2,        // was 0.8 - MORE cooldown (can't spam)
  rollIframes: 0.35,        // was 0.4 - i-frames at START
  rollStaminaCost: 25,      // NEW - costs stamina
  
  // Combat feel
  attackDuration: 0.9,      // was 0.5 - matches animation
  attackCooldown: 0.8,      // was 1.0 - slightly faster recovery
  comboCooldown: 2.0,       // was 1.5 - LONGER reset
  
  // Hit reactions
  hitReactDuration: 0.6,    // was 0.4 - LONGER stagger
  hitKnockbackStrength: 3,  // NEW - push back more
  
  // Turn speed - Souls-like commitment
  turnSpeedFast: Math.PI * 0.8,     // was Math.PI - SLOWER
  turnSpeedNormal: Math.PI / 2.5,   // was Math.PI / 2
  turnSpeedAttack: Math.PI / 4,     // NEW - limited turn during attacks
};
```

---

## 🎥 Camera System Improvements

### 1. Add Camera Collision Detection

```javascript
// NEW METHOD - Add to RacalvinController
updateCameraCollision(delta) {
  const char = this.character;
  const { cameraDistance, cameraHeight } = this.config;
  
  // Calculate ideal camera position
  const cameraYaw = this.camera.yaw;
  const cameraPitch = this.camera.pitch;
  
  const cameraOffset = new THREE.Vector3(
    Math.sin(cameraYaw) * Math.cos(cameraPitch) * cameraDistance,
    Math.sin(cameraPitch) * cameraDistance + cameraHeight,
    Math.cos(cameraYaw) * Math.cos(cameraPitch) * cameraDistance
  );
  
  const idealPos = char.position.clone().add(cameraOffset);
  
  // Raycast from character to camera
  const direction = new THREE.Vector3()
    .subVectors(idealPos, char.position)
    .normalize();
  
  this.raycaster.set(char.position, direction);
  const intersects = this.raycaster.intersectObjects(this.wallLayers, true);
  
  if (intersects.length > 0) {
    const hitDistance = intersects[0].distance;
    if (hitDistance < cameraDistance) {
      // Pull camera closer to avoid wall
      const safeDistance = hitDistance - 0.5; // 0.5 buffer
      this.camera.distance = Math.max(safeDistance, 1.0);
    }
  } else {
    // Lerp back to ideal distance
    this.camera.distance = THREE.MathUtils.lerp(
      this.camera.distance,
      cameraDistance,
      0.1
    );
  }
}
```

### 2. Target Lock Camera Adjustment

```javascript
// MODIFY updateCameraPosition method
updateCameraPosition(delta) {
  const char = this.character;
  const { cameraSmoothing, targetLockSmoothing } = this.config;
  
  let focusPoint = char.position.clone();
  let distance = this.camera.distance;
  let height = this.config.cameraHeight;
  
  // Adjust for target lock
  if (char.lockedTarget && char.lockedTarget.position) {
    // Focus between player and target
    const toTarget = new THREE.Vector3()
      .subVectors(char.lockedTarget.position, char.position);
    focusPoint.add(toTarget.multiplyScalar(0.3)); // 30% toward target
    
    // Zoom out and raise camera when locked
    distance = this.config.targetLockDistance || distance;
    height = this.config.targetLockHeight || height;
    
    // Raise focus point to chest level
    focusPoint.y += this.config.targetLockFocusOffset || 1.5;
  }
  
  // Calculate camera position
  const yaw = this.camera.yaw;
  const pitch = this.camera.pitch;
  
  const cameraOffset = new THREE.Vector3(
    Math.sin(yaw) * Math.cos(pitch) * distance,
    Math.sin(pitch) * distance + height,
    Math.cos(yaw) * Math.cos(pitch) * distance
  );
  
  this.camera.goalPosition.copy(focusPoint).add(cameraOffset);
  this.camera.goalFocus.copy(focusPoint);
  
  // Smooth interpolation (slower when locked)
  const smoothing = char.lockedTarget ? targetLockSmoothing : cameraSmoothing;
  
  this.camera.position.lerp(this.camera.goalPosition, smoothing);
  this.camera.focus.lerp(this.camera.goalFocus, smoothing);
}
```

### 3. Camera Shake System

```javascript
// ADD to character state
this.character = {
  // ... existing properties ...
  cameraShake: {
    intensity: 0,
    duration: 0,
    elapsed: 0
  }
};

// NEW METHOD - Add to RacalvinController
applyCameraShake(intensity, duration = 0.3) {
  this.character.cameraShake = {
    intensity: intensity,
    duration: duration,
    elapsed: 0
  };
}

// MODIFY updateCameraPosition to apply shake
updateCameraPosition(delta) {
  // ... existing code ...
  
  // Apply camera shake
  if (this.character.cameraShake.elapsed < this.character.cameraShake.duration) {
    const shake = this.character.cameraShake;
    shake.elapsed += delta;
    
    const progress = shake.elapsed / shake.duration;
    const currentIntensity = shake.intensity * (1 - progress);
    
    // Random offset
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * currentIntensity,
      (Math.random() - 0.5) * currentIntensity,
      (Math.random() - 0.5) * currentIntensity
    );
    
    this.camera.position.add(offset);
  }
}
```

---

## ⚔️ Combat Improvements

### 1. Animation Commitment (Can't Cancel)

```javascript
// MODIFY updateMovement
updateMovement(delta, groundHeight) {
  const char = this.character;
  
  // Lock movement during attacks (after hit frame)
  if (char.attackTimer > 0) {
    const attackData = ATTACK_DATABASE[`LIGHT_${char.attackCombo}`];
    if (attackData) {
      const progress = 1 - (char.attackTimer / attackData.duration);
      
      // Can only move after recovery frame
      if (progress < (attackData.recoveryFrame / attackData.duration)) {
        char.forwardVel *= 0.9; // Slow down, don't stop instantly
        return; // Skip normal movement
      }
    }
  }
  
  // ... rest of movement code ...
}
```

### 2. Limited Rotation During Attacks

```javascript
// In updateMovement, during attacks:
if (char.attackTimer > 0) {
  // Limit rotation speed during attacks
  const attackTurnSpeed = this.config.turnSpeedAttack || Math.PI / 4;
  
  if (char.intendedMag > 0.1) {
    let angleDiff = char.intendedYaw - char.faceAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    // Limited turn rate during attacks
    const maxTurn = attackTurnSpeed * delta;
    if (Math.abs(angleDiff) < maxTurn) {
      char.faceAngle = char.intendedYaw;
    } else {
      char.faceAngle += Math.sign(angleDiff) * maxTurn;
    }
  }
}
```

### 3. Roll i-Frames at Start (Souls-like)

```javascript
// MODIFY updateRoll
updateRoll(delta, groundHeight) {
  const char = this.character;
  const { rollSpeed, rollIframes, rollDuration } = this.config;
  
  char.rollTimer -= delta;
  
  // i-frames at START of roll (Souls-like)
  const rollProgress = 1 - (char.rollTimer / rollDuration);
  
  if (rollProgress < (rollIframes / rollDuration)) {
    char.isInvulnerable = true;
  } else {
    char.isInvulnerable = false;
  }
  
  // Speed curve - fast at start, slow at end
  const speedMultiplier = 1.5 - (rollProgress * 0.8);
  const speed = rollSpeed * speedMultiplier;
  
  // ... rest of roll code ...
}
```

---

## 📋 Implementation Checklist

### Camera
- [ ] Increase camera distance to 6.5
- [ ] Add camera collision detection
- [ ] Implement target lock camera adjustment
- [ ] Add camera shake system
- [ ] Tune camera smoothing (increase to 0.15)

### Animation Timing
- [ ] Slow down attack animations (0.9s, 1.0s, 1.3s)
- [ ] Adjust hit frames to later in animation
- [ ] Add recovery frames to attacks
- [ ] Increase blend times for smoother feel
- [ ] Extend hit reaction duration to 0.6s

### Combat Feel
- [ ] Lock movement during attack recovery
- [ ] Limit rotation during attacks
- [ ] Increase roll duration to 0.7s
- [ ] Add roll cooldown (1.2s - can't spam)
- [ ] Move i-frames to start of roll
- [ ] Increase hit stun durations

### Polish
- [ ] Add camera shake on hits
- [ ] Implement heavier hit reactions
- [ ] Add momentum to movement (slower accel/decel)
- [ ] Tighten combo windows
- [ ] Add stamina system (optional)

---

## 🎯 Key Souls-Like Principles

1. **Commitment** - Actions can't be cancelled, you commit to attacks
2. **Weight** - Slower animations, more impact, camera shake
3. **Precision** - Tighter timing windows, deliberate inputs
4. **Camera** - Slightly distant, smooth, adjusts for lock-on
5. **i-Frames** - Roll invincibility at START, not throughout
6. **Recovery** - Clear recovery periods after attacks

---

**Apply these changes incrementally and test the feel!**
