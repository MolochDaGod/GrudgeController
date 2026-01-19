# 🎮 Souls-Like Controls & Animation Reference Sheet

## 📋 Quick Reference Table

| Button/Input | Action | Animation Used | Duration | Stamina | Can Cancel | Recovery | Notes |
|--------------|--------|----------------|----------|---------|------------|----------|-------|
| **Left Stick** | Movement | Walk/Run/Sprint | N/A | 0 | Yes | N/A | Camera-relative direction |
| **Right Stick** | Camera Rotate | N/A | N/A | 0 | Yes | N/A | Free camera control |
| **Space/A** | Roll | Roll | 0.7s | 25 | No | 1.2s | I-frames: 0-0.35s |
| **LMB/RT** | Light Attack 1 | Attack_1 | 0.9s | 10 | No (until 0.65s) | 0.65-0.9s | Combo window: 0.25s |
| **LMB/RT** (2nd) | Light Attack 2 | Attack_2 | 1.0s | 12 | No (until 0.7s) | 0.7-1.0s | Combo window: 0.3s |
| **LMB/RT** (3rd) | Light Attack 3 | Attack_3 | 1.3s | 18 | No (until 1.0s) | 1.0-1.3s | Finisher |
| **RMB/LT** | Heavy Attack | Heavy_Attack | 1.5s | 30 | No (until 1.1s) | 1.1-1.5s | High damage |
| **Shift** | Sprint | Sprint | N/A | 0 | Yes | N/A | Hold to sprint |
| **Left Ctrl** | Block | Block_Idle | N/A | 0 | Yes | N/A | Hold to block |
| **Tab** | Target Lock | N/A | N/A | 0 | Yes | N/A | Toggle lock-on |

---

## 🎯 Complete Control Mapping

### Movement Controls

#### **Left Stick / WASD**
- **Action:** Character Movement
- **Type:** Continuous Input
- **Animations Triggered:**
  - `Walk` - Speed < 3.0 units/s
  - `Run` - Speed 3.0-7.0 units/s
  - `Sprint` - Speed > 7.0 units/s (with Shift held)
- **Properties:**
  - Max Speed: 7.0 units/s
  - Walk Speed: 3.0 units/s
  - Sprint Speed: 10.0 units/s
  - Acceleration: 20 units/s²
  - Deceleration: 18 units/s²
- **Stamina Cost:** 0 (normal movement), 5/s (sprinting)
- **Can Cancel:** Yes (any action)
- **Notes:** 
  - Movement is camera-relative (W = away from camera)
  - Character rotates smoothly toward movement direction
  - Turn speed: π * 0.8 rad/s (fast), π / 2.5 rad/s (normal)

---

### Camera Controls

#### **Right Stick / Mouse Move**
- **Action:** Camera Rotation
- **Type:** Continuous Input
- **Properties:**
  - Sensitivity: 3.5
  - Smoothing: 0.15
  - Distance: 6.5 units
  - Height Offset: 2.5 units
  - Pitch Angle: 0.4 rad (~23°)
  - Pitch Range: -0.3 to 1.2 rad
  - Yaw: Full 360° rotation
- **Notes:**
  - Camera follows character with smooth interpolation
  - No collision detection (yet - see SOULS_LIKE_IMPROVEMENTS.md)

#### **Tab**
- **Action:** Target Lock Toggle
- **Type:** Binary Toggle
- **Camera Changes When Locked:**
  - Distance: 7.0 units
  - Height: 2.8 units
  - Smoothing: 0.2
  - Focus Offset: 1.5 units above target
- **Notes:**
  - Locks camera to nearest enemy
  - Automatically tracks target
  - Press Tab again to unlock

---

### Combat Controls - Attacks

#### **LMB / RT (Light Attack 1)**
- **Action:** Light Attack (Combo Starter)
- **Animation:** `Attack_1`
- **Duration:** 0.9s
- **Blend Time:** 0.05s (in), 0.1s (out)
- **Hit Frame:** 0.45s (50% through animation)
- **Recovery Frame:** 0.65s (72% through)
- **Combo Window:** 0.25s (after hit frame)
- **Stamina Cost:** 10
- **Damage:** 1.0x
- **Hit Stun:** 0.5s
- **Knockback:** 2 units
- **Camera Shake:** 0.4 intensity
- **Can Cancel:** No (committed until 0.65s)
- **Cancel Options After Recovery:**
  - Roll (Space)
  - Block (Ctrl)
  - Combo into Attack 2 (press during combo window)
- **Movement:** Limited rotation (π/4 rad/s max)
- **Notes:**
  - Fast startup
  - Can queue next attack during combo window
  - Attack queuing enabled (0.2s queue window)

#### **LMB / RT (Light Attack 2)**
- **Action:** Light Attack Combo #2
- **Animation:** `Attack_2`
- **Duration:** 1.0s
- **Blend Time:** 0.05s (in), 0.1s (out)
- **Hit Frame:** 0.5s
- **Recovery Frame:** 0.7s
- **Combo Window:** 0.3s
- **Stamina Cost:** 12
- **Damage:** 1.2x
- **Hit Stun:** 0.55s
- **Knockback:** 2.5 units
- **Camera Shake:** 0.5 intensity
- **Can Cancel:** No (committed until 0.7s)
- **Cancel Options After Recovery:**
  - Roll (Space)
  - Block (Ctrl)
  - Combo into Attack 3 (press during combo window)
- **Movement:** Limited rotation (π/4 rad/s max)
- **Requirements:** Must come after Attack 1

#### **LMB / RT (Light Attack 3 - Finisher)**
- **Action:** Light Attack Combo Finisher
- **Animation:** `Attack_3`
- **Duration:** 1.3s
- **Blend Time:** 0.08s (in), 0.15s (out)
- **Hit Frame:** 0.65s
- **Recovery Frame:** 1.0s
- **Combo Window:** None (finisher)
- **Stamina Cost:** 18
- **Damage:** 1.8x
- **Hit Stun:** 0.8s
- **Knockback:** 4 units
- **Camera Shake:** 1.0 intensity
- **Can Cancel:** No (fully committed until 1.0s)
- **Cancel Options After Recovery:**
  - Roll (Space)
  - Block (Ctrl)
  - New Attack (after recovery)
- **Movement:** Minimal rotation only
- **Requirements:** Must come after Attack 2
- **Notes:**
  - Longest animation
  - Highest damage in light combo
  - Long recovery
  - Cannot continue combo

#### **RMB / LT (Heavy Attack)**
- **Action:** Heavy Attack (Charged)
- **Animation:** `Heavy_Attack`
- **Duration:** 1.5s
- **Blend Time:** 0.2s (in), 0.2s (out)
- **Hit Frame:** 0.75s
- **Recovery Frame:** 1.1s
- **Combo Window:** None (standalone)
- **Stamina Cost:** 30
- **Damage:** 2.5x
- **Hit Stun:** 1.0s
- **Knockback:** 6 units
- **Camera Shake:** 1.5 intensity
- **Can Cancel:** No (fully committed until 1.1s)
- **Cancel Options After Recovery:**
  - Roll (Space)
  - Block (Ctrl)
  - New Attack (after recovery)
- **Movement:** Locked (no rotation during windup)
- **Notes:**
  - Longest startup
  - Highest single-hit damage
  - High stamina cost
  - Can be used at any time (not part of light combo)
  - Best for openings/punishes

---

### Combat Controls - Defense

#### **Space / A (Roll)**
- **Action:** Dodge Roll
- **Animation:** `Roll`
- **Duration:** 0.7s
- **Blend Time:** 0.05s (in), 0.1s (out)
- **I-Frame Duration:** 0.35s (0.0s-0.35s)
- **Roll Speed:** 10 units/s
- **Roll Distance:** ~7 units
- **Stamina Cost:** 25
- **Cooldown:** 1.2s
- **Can Cancel:** No (fully committed for 0.7s)
- **Cancel Options After:**
  - Any action (no recovery)
- **Direction:** Based on movement input
  - Forward: W held
  - Backward: S held
  - Left: A held
  - Right: D held
  - Backward (no input): Default when no direction
- **Notes:**
  - Invincible during first 50% (I-frames)
  - Cannot roll if stamina < 25
  - Main defensive tool
  - Can roll out of most recovery frames

#### **Left Ctrl / LB (Block)**
- **Action:** Raise Shield/Guard
- **Animation:** `Block_Idle` (hold)
- **Stamina Cost:** 0 (passive), varies on hit
- **Damage Reduction:** 80%
- **Stamina Drain on Hit:**
  - Light Attack: 15 stamina
  - Heavy Attack: 40 stamina
  - Guard Break if stamina depleted
- **Movement Speed:** 50% (1.5 units/s)
- **Turn Speed:** 75% normal
- **Can Cancel:** Yes (release button)
- **Cancel Options:**
  - Release to return to idle
  - Roll (recommended)
- **Notes:**
  - Hold to maintain block
  - Cannot attack while blocking
  - Stamina regenerates slower while blocking (50% rate)
  - Guard break = vulnerable for 1.0s

---

### Locomotion Animations

#### **Idle**
- **Animation:** `Idle`
- **Blend Time:** 0.3s
- **Trigger:** No input, grounded, not in action
- **Loop:** Yes
- **Notes:** Default state

#### **Walk**
- **Animation:** `Walk`
- **Blend Time:** 0.2s
- **Trigger:** Speed 0.1-3.0 units/s
- **Speed Sync:** Yes (animation speed matches movement)
- **Loop:** Yes

#### **Run**
- **Animation:** `Run`
- **Blend Time:** 0.15s
- **Trigger:** Speed 3.0-7.0 units/s
- **Speed Sync:** Yes
- **Loop:** Yes
- **Notes:** Default movement speed

#### **Sprint**
- **Animation:** `Sprint`
- **Blend Time:** 0.2s
- **Trigger:** Shift held + Speed > 7.0 units/s
- **Speed Sync:** Yes
- **Loop:** Yes
- **Stamina Drain:** 5/s
- **Max Duration:** Until stamina depleted
- **Notes:** Faster than run but costs stamina

#### **Jump**
- **Animation:** `Jump`
- **Duration:** Variable (until grounded)
- **Blend Time:** 0.1s (in), 0.15s (out - land)
- **Jump Height:** ~3 units
- **Jump Speed:** 8 units/s initial vertical velocity
- **Air Control:** 60% of ground control
- **Stamina Cost:** 15
- **Can Cancel:** No (until grounded)
- **Notes:**
  - Gravity: -25 units/s²
  - Cannot jump if stamina < 15

---

### Hit Reactions

#### **Hit React Light**
- **Animation:** `Hit_React`
- **Duration:** 0.6s
- **Blend Time:** 0.02s (instant)
- **Trigger:** Taking damage (< 50% max HP)
- **Knockback:** Varies by attack
- **Can Cancel:** No (stunned)
- **Notes:**
  - Overrides all other actions
  - Player loses control temporarily
  - Animation priority: Highest

#### **Hit React Heavy**
- **Animation:** `Hit_React_Heavy`
- **Duration:** 1.0s
- **Blend Time:** 0.02s
- **Trigger:** Taking heavy damage (> 50% max HP)
- **Knockback:** 2x normal
- **Can Cancel:** No (stunned)
- **Notes:**
  - Longer stun than light hit
  - Can lead to combo punishment

#### **Death**
- **Animation:** `Death`
- **Duration:** 3.0s
- **Blend Time:** 0.3s
- **Trigger:** HP <= 0
- **Can Cancel:** No
- **Notes:**
  - Game over state
  - Respawn after animation

---

## ⚙️ Animation System Details

### Animation Priority System

**Order (Highest → Lowest):**
1. **Death** (Priority: 1000)
2. **Hit React** (Priority: 900)
3. **Roll** (Priority: 800)
4. **Heavy Attack** (Priority: 700)
5. **Light Attack 3** (Priority: 650)
6. **Light Attack 2** (Priority: 625)
7. **Light Attack 1** (Priority: 600)
8. **Jump** (Priority: 500)
9. **Block** (Priority: 400)
10. **Sprint** (Priority: 300)
11. **Run** (Priority: 200)
12. **Walk** (Priority: 100)
13. **Idle** (Priority: 0)

### Blend Times

| From State | To State | Blend Time | Notes |
|------------|----------|------------|-------|
| Idle | Walk | 0.2s | Smooth acceleration |
| Walk | Run | 0.15s | Speed transition |
| Run | Sprint | 0.2s | Stamina check |
| Any Locomotion | Attack | 0.05s | Instant response |
| Attack | Attack (combo) | 0.05s | Fast combo flow |
| Any | Roll | 0.05s | Emergency dodge |
| Any | Hit React | 0.02s | Instant reaction |
| Attack | Idle | 0.1s | Recovery smoothing |
| Roll | Idle | 0.1s | Stand up |

### Animation Commitment

**Fully Committed (Cannot Cancel):**
- All attacks until recovery frame
- Roll (entire duration)
- Hit reactions
- Death

**Partially Committed:**
- Jump (can control in air slightly)

**Non-Committed (Can Cancel Anytime):**
- Idle, Walk, Run, Sprint
- Block (release anytime)

---

## 🎮 Combo System

### Light Attack Combo Chain

```
Light 1 (0.9s) → Light 2 (1.0s) → Light 3 (1.3s)
   ↓                ↓                ↓
Stamina: 10      Stamina: 12      Stamina: 18
Damage: 1.0x     Damage: 1.2x     Damage: 1.8x
Total: 40 stamina, 4.0x damage, 3.2s duration
```

**Combo Windows:**
- Light 1 → Light 2: 0.25s window (at 0.45-0.7s)
- Light 2 → Light 3: 0.3s window (at 0.5-0.8s)

**Breaking Combo:**
- Wait too long between attacks
- Get hit
- Roll
- Block

### Attack Queueing

- **Queue Window:** 0.2s
- **How it works:**
  - Press attack button during queue window
  - Next attack executes automatically after recovery
  - No button mashing required
- **Enabled:** Yes (by default)

---

## 🔋 Stamina System

### Stamina Pool
- **Max Stamina:** 100
- **Regen Rate:** 20/s (normal)
- **Regen Delay:** 1.0s after use
- **Regen Rate (Blocking):** 10/s (50% rate)

### Stamina Costs

| Action | Cost | Type |
|--------|------|------|
| Light Attack 1 | 10 | Instant |
| Light Attack 2 | 12 | Instant |
| Light Attack 3 | 18 | Instant |
| Heavy Attack | 30 | Instant |
| Roll | 25 | Instant |
| Jump | 15 | Instant |
| Sprint | 5/s | Continuous |
| Block Hit (Light) | 15 | Per hit |
| Block Hit (Heavy) | 40 | Per hit |

### Stamina Management

**Cannot Perform Action if:**
- Current stamina < action cost

**Stamina Break:**
- Stamina reaches 0
- Cannot attack, roll, or sprint
- Can only walk and block (risky)
- Regeneration paused for 2.0s

---

## 🎯 Target Lock System

### Targeting

#### **Tab (Target Lock Toggle)**
- **Action:** Lock onto nearest enemy
- **Range:** 15 units
- **Angle:** 60° cone in front
- **Target Indicator:** Red reticle
- **Camera Behavior:**
  - Distance: 7.0 units
  - Height: 2.8 units
  - Smoothing: 0.2
  - Focuses on target center + 1.5 units up

### While Locked

**Movement:**
- Character always faces target
- Strafing enabled (A/D)
- Forward/Back relative to target

**Camera:**
- Locked to target
- Right stick rotates around target
- Cannot free-look

**Attacks:**
- Automatically aim at target
- Attacks home slightly toward target

**Breaking Lock:**
- Press Tab again
- Target dies
- Target goes out of range (> 20 units)
- Target goes behind obstacle (optional)

---

## 📊 Hit Detection & Damage

### Hit Detection System

**Method:** Raycasting in front of character
- **Range:** 2.5 units
- **Arc Width:** 60° cone
- **Hit Check Timing:** At "Hit Frame" of animation
- **Multi-Hit:** Single target per attack

### Damage Calculation

```javascript
finalDamage = baseDamage * attackMultiplier * (1 - defenseReduction)
```

**Example:**
- Base Damage: 10
- Light Attack 1: 10 * 1.0 = 10 damage
- Light Attack 2: 10 * 1.2 = 12 damage
- Light Attack 3: 10 * 1.8 = 18 damage
- Heavy Attack: 10 * 2.5 = 25 damage

**With Blocking:**
- Block Reduction: 80%
- Blocked Light 1: 10 * 1.0 * 0.2 = 2 damage

### Hit Effects

| Attack | Damage | Hit Stun | Knockback | Camera Shake |
|--------|--------|----------|-----------|--------------|
| Light 1 | 1.0x | 0.5s | 2 units | 0.4 |
| Light 2 | 1.2x | 0.55s | 2.5 units | 0.5 |
| Light 3 | 1.8x | 0.8s | 4 units | 1.0 |
| Heavy | 2.5x | 1.0s | 6 units | 1.5 |

**Camera Shake:**
- Intensity: 0.0-2.0
- Duration: 0.2s
- Frequency: 20 Hz

---

## 🎨 Visual Feedback

### Hit Effects

**On Hit:**
1. Camera shake (intensity varies)
2. Hit sound (impact_1, impact_2, impact_3)
3. Hit particle effect (blood spray, sparks, etc.)
4. Damage number popup
5. Enemy hit reaction animation

**On Block:**
1. Reduced camera shake (50%)
2. Block sound (shield_block)
3. Spark particle effect
4. Stamina drain visual (yellow bar)

**On Miss:**
1. Whoosh sound (swing_1, swing_2)
2. No hit effects

### UI Feedback

**Stamina Bar:**
- Color: Yellow/Gold
- Position: Bottom center
- Drains on use
- Flashes red when < 25 (can't roll)
- Regenerates automatically

**Health Bar:**
- Color: Red
- Position: Top left
- Drains on damage
- Flashes when low (< 30%)

**Target Lock Indicator:**
- Red reticle on enemy
- Red dot on screen edge if off-screen
- Pulsates when target attacks

---

## 🕹️ Controller vs Keyboard

### Keyboard & Mouse
| Action | Key |
|--------|-----|
| Move Forward | W |
| Move Backward | S |
| Move Left | A |
| Move Right | D |
| Light Attack | LMB |
| Heavy Attack | RMB |
| Roll | Space |
| Block | Left Ctrl |
| Sprint | Left Shift |
| Jump | (not bound) |
| Target Lock | Tab |
| Camera Rotate | Mouse Move |

### Gamepad (Xbox Layout)
| Action | Button |
|--------|--------|
| Move | Left Stick |
| Camera | Right Stick |
| Light Attack | RT |
| Heavy Attack | LT |
| Roll | A |
| Block | LB |
| Sprint | RB (hold) |
| Jump | B |
| Target Lock | Right Stick Click |

---

## 🧪 Testing Commands

### Debug Overlays

```javascript
// In browser console
controller.debug = true;  // Show debug info
controller.showHitboxes = true;  // Show attack ranges
controller.showStats = true;  // Show performance
```

### Character State

```javascript
// Check current animation
controller.animationController.getCurrentState();

// Check stamina
controller.character.stamina;

// Force animation
controller.animationController.playAnimation('Attack_1');
```

### Camera Control

```javascript
// Adjust camera distance
controller.config.cameraDistance = 8.0;

// Adjust camera height
controller.config.cameraHeight = 3.0;

// Reset camera
controller.resetCamera();
```

---

## 📚 Animation File Naming

### Required Animation Files

Your FBX files should match these names:

**Locomotion:**
- `Idle.fbx`
- `Walk.fbx`
- `Run.fbx`
- `Sprint.fbx`
- `Jump.fbx` (optional)

**Combat - Attacks:**
- `Attack_1.fbx` (Light attack 1)
- `Attack_2.fbx` (Light attack 2)
- `Attack_3.fbx` (Light attack 3/finisher)
- `Heavy_Attack.fbx`

**Combat - Defense:**
- `Roll.fbx` ⚠️ **Need to verify this exists**
- `Block_Idle.fbx`
- `Block_Impact.fbx` (optional)

**Reactions:**
- `Hit_React.fbx`
- `Hit_React_Heavy.fbx` (optional)
- `Death.fbx`

**Missing/Unknown:**
- Roll animation - needs verification ⚠️

---

## 🔧 Configuration Values

### From RacalvinController DEFAULT_CONFIG

```javascript
{
  // Camera
  cameraDistance: 6.5,
  cameraHeight: 2.5,
  cameraPitch: 0.4,
  cameraSensitivity: 3.5,
  cameraSmoothing: 0.15,
  targetLockDistance: 7.0,
  targetLockHeight: 2.8,
  targetLockSmoothing: 0.2,
  targetLockFocusOffset: 1.5,
  
  // Movement
  maxSpeed: 7,
  walkSpeed: 3.0,
  sprintSpeed: 10,
  acceleration: 20,
  deceleration: 18,
  turnSpeedFast: Math.PI * 0.8,
  turnSpeedNormal: Math.PI / 2.5,
  turnSpeedAttack: Math.PI / 4,
  
  // Roll
  rollDuration: 0.7,
  rollCooldown: 1.2,
  rollSpeed: 10,
  rollIFrames: 0.35,
  rollStaminaCost: 25,
  
  // Combat
  attackDuration: 0.9,
  attackCooldown: 0.8,
  comboCooldown: 2.0,
  comboQueueWindow: 0.2,
  attackQueueEnabled: true,
  
  // Hit Reactions
  hitReactDuration: 0.6,
  hitKnockbackStrength: 3,
  
  // Stamina
  maxStamina: 100,
  staminaRegenRate: 20,
  staminaRegenDelay: 1.0
}
```

---

## 🎯 Next Steps

1. **Verify Roll Animation Exists**
   - Check `Roll.fbx` in animation folder
   - If missing, need to create or import

2. **Install Recommended Packages**
   ```bash
   npm install cannon-es stats.js tweakpane
   ```

3. **Implement Physics Collisions**
   - See `RECOMMENDED_PACKAGES.md`
   - Integrate Cannon.js

4. **Implement Camera Shake**
   - See `SOULS_LIKE_IMPROVEMENTS.md`
   - Already partially added to config

5. **Test and Tune Values**
   - Use Tweakpane for live adjustments
   - Test combat feel
   - Adjust timings as needed

---

## 📝 Notes

- All timing values are Souls-like tuned (slower, more deliberate)
- Stamina costs balanced for resource management gameplay
- Attack commitment enforces player decision-making
- Camera system supports both free and locked playstyles
- Animation priority prevents unrealistic state transitions

**Last Updated:** Based on Souls-like improvements applied to `RacalvinController.js` and `AnimationController.js`
