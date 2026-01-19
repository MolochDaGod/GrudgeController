/**
 * RacalvinController.js - Modular character controller for Three.js games
 * Supports tank controls, combat, swimming, ledge climbing, rolling, and more
 * Integrated: AudioSystem, ParticleSystem, HitZoneSystem, RangedWeaponSystem, AnimationMapper
 */

import * as THREE from "three";
import { AudioSystem } from './AudioSystem.js';
import { ParticleSystem } from './ParticleSystem.js';
import { HitZoneSystem } from './HitZoneSystem.js';
import { RangedWeaponSystem } from './RangedWeaponSystem.js';
import { AnimationMapper } from './AnimationMapper.js';
import { PhysicsSystem } from './PhysicsSystem.js';

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

export const DEFAULT_CONFIG = {
  // Movement - Realistic physics synced to animation
  maxSpeed: 3.5,            // Run speed - reduced to match animation
  walkSpeed: 1.6,           // Walk speed - slower for better sync
  acceleration: 12,         // Slower acceleration for smooth start
  deceleration: 20,         // Fast stop but not instant

  // Turn speed - Responsive but grounded
  turnSpeedFast: Math.PI * 1.2,     // Faster turning - more responsive
  turnSpeedNormal: Math.PI * 0.8,   // Normal turning
  turnSpeedSlow: Math.PI / 3,
  turnSpeedAttack: Math.PI / 4,     // Limited turn during attacks
  turnSpeedWater: DEG2RAD * 60,

  tiltSpeed: DEG2RAD * 37.5,
  tiltMax: DEG2RAD * 12,

  gravity: 25,
  jumpVelocity: 8,              // Reduced from 10 - more grounded
  doubleJumpMultiplier: 1.3,
  tripleJumpMultiplier: 1.7,
  jumpForwardBoost: 0.5,        // Forward momentum on jump
  airControl: 0.3,              // Air control multiplier (0-1)
  coyoteTime: 0.15,             // Grace period after leaving ground (150ms)
  jumpBufferTime: 0.1,          // Input buffer window (100ms)

  swimSpeed: 5,
  swimAccel: 8,
  swimFriction: 3,
  wadeDepth: 0.5,
  swimDepth: 1.2,

  // Camera - Souls-like settings
  cameraDistance: 6.5,        // was 5 - move further back
  cameraHeight: 2.5,          // was 2 - raise slightly
  cameraPitch: 0.4,           // was 0.3 - look down more
  cameraSensitivity: 3.5,     // was 2.5 - faster response
  cameraSmoothing: 0.15,      // was 0.08 - MORE smoothing for Souls feel
  minPitch: -0.5,             // was -0.8 - less looking down
  maxPitch: 1.4,              // was 1.2 - more looking up
  
  // Target lock camera
  targetLockDistance: 7.0,    // NEW - zoom out when locked
  targetLockHeight: 2.8,      // NEW - raise camera when locked
  targetLockSmoothing: 0.2,   // NEW - smooth lock transitions
  targetLockFocusOffset: 1.5, // NEW - look at chest, not feet

  // Roll - Match animation distance
  rollSpeed: 6,             // Realistic roll distance (was 10 - too far)
  rollDuration: 0.7,        // Match animation timing
  rollCooldown: 1.2,        // Souls-like cooldown
  rollIframes: 0.35,        // I-frames at start
  rollStaminaCost: 25,      // Stamina cost

  ledgeGrabRange: 0.8,
  ledgeClimbSpeed: 3,

  // Combat feel
  attackDuration: 0.9,      // was 0.5 - matches animation
  attackCooldown: 0.8,      // was 1.0 - slightly faster recovery
  comboCooldown: 2.0,       // was 1.5 - LONGER reset

  // Hit reactions
  hitReactDuration: 0.6,    // was 0.4 - LONGER stagger
  hitKnockbackStrength: 3,  // NEW - push back more
  
  // Physics - Speed-based collision responses
  enablePhysics: true,      // NEW - Enable Rapier physics engine
  lightImpactSpeed: 2.0,    // m/s - Threshold for light hit
  mediumImpactSpeed: 5.0,   // m/s - Threshold for medium hit
  heavyImpactSpeed: 8.0,    // m/s - Threshold for heavy hit/ragdoll

  // Target lock settings
  targetLockRange: 15,
  targetLockAngle: Math.PI / 3,
  targetSwitchCooldown: 0.3,

  // Collision settings
  characterRadius: 0.5,
  combatRange: 2.5,
  minCombatRange: 1.5,
  
  // Combo system
  comboQueueWindow: 0.2,    // NEW - time before hit where combo can be queued
  attackQueueEnabled: true,  // NEW - allow buffering attack inputs
};

export class RacalvinController {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.character = {
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      forwardVel: 0,
      sideVel: 0,

      faceAngle: 0,
      intendedYaw: 0,
      intendedMag: 0,

      bodyTilt: 0,
      headTurn: 0,

      isGrounded: true,
      isJumping: false,
      isFalling: false,
      isLanding: false,
      landingTimer: 0,
      isInvulnerable: false,

      jumpCount: 0,
      jumpComboTimer: 0,
      lastLandTime: 0,
      jumpStartVelocity: 0,
      coyoteTimer: 0,              // Time since left ground
      jumpBufferTimer: 0,          // Time jump was pressed while airborne

      attackCombo: 0,
      attackTimer: 0,
      attackCooldown: 0,

      rollTimer: 0,
      rollCooldown: 0,
      rollDirection: new THREE.Vector3(),
      rollType: "forward", // 'forward', 'left', 'right'

      // Double-tap detection
      lastKeyTapTime: { a: 0, d: 0 },
      doubleTapWindow: 0.3, // 300ms window for double tap

      hitReactTimer: 0,
      hitDirection: "front",

      isHanging: false,
      hangLedge: null,
      hangNormal: null,
      climbProgress: 0,

      isSwimming: false,
      isWading: false,
      swimDepth: 0,

      isSliding: false,
      slideAngle: 0,

      isBlocking: false,
      isWalkingBack: false,
      isTurning: false,
      turn180Timer: 0,

      wallContact: null,
      wallNormal: null,

      state: "idle",
      prevState: "idle",
      stateTime: 0,
      idleVariation: 1,           // Which idle animation (1-4)
      idleVariationTimer: 0,      // Time until next idle change
      
      // Fall-to-roll system
      canRollOnLanding: false,    // True if falling from height
      fallDistance: 0,            // Track fall height
      fallStartY: 0,              // Y position when fall started

      // Target lock
      lockedTarget: null,
      targetLockCooldown: 0,
      combatMode: false,  // true when target locked (enables strafing)
      
      // Camera shake
      cameraShake: {
        intensity: 0,
        duration: 0,
        elapsed: 0
      },
    };

    this.camera = {
      position: new THREE.Vector3(
        0,
        this.config.cameraHeight,
        this.config.cameraDistance,
      ),
      focus: new THREE.Vector3(),
      goalPosition: new THREE.Vector3(),
      goalFocus: new THREE.Vector3(),
      yaw: 0,
      pitch: this.config.cameraPitch,
      distance: this.config.cameraDistance,
      mode: "behind",
    };

    this.input = this.createEmptyInput();
    this.prevInput = this.createEmptyInput();

    this.keys = new Set();
    this.mouseButtons = new Set();
    this.mouseMovement = { x: 0, y: 0 };
    this.isPointerLocked = false;
    this.useExternalInput = false;

    this.raycaster = new THREE.Raycaster();
    this.groundLayers = [];
    this.wallLayers = [];
    this.ledgeLayers = [];

    // Weapon attachment
    this.weaponModel = null;
    this.weaponBone = null;
    
    // Animation controller (optional, set via setAnimationController)
    this.animationController = null;
    
    // Production systems (integrated)
    this.audioSystem = null;
    this.particleSystem = null;
    this.hitZoneSystem = null;
    this.rangedWeaponSystem = null;
    this.animationMapper = null;
    this.physicsSystem = null;  // NEW - Rapier.js physics engine
    
    // Enemies list for combat
    this.enemies = [];
    
    // Physics state
    this.physicsInitialized = false;
    this.characterMesh = null;
  }

  createEmptyInput() {
    return {
      moveX: 0,
      moveY: 0,
      turnLeft: false,
      turnRight: false,
      shift: false,
      cameraX: 0,
      cameraY: 0,
      jump: false,
      attack: false,
      block: false,
      roll: false,
      rollLeft: false,
      rollRight: false,
      interact: false,
      targetLock: false,
      targetCycle: false,
      cUp: false,
      cDown: false,
      cLeft: false,
      cRight: false,
    };
  }

  setGroundLayers(layers) {
    this.groundLayers = layers;
  }

  setWallLayers(layers) {
    this.wallLayers = layers;
  }

  setLedgeLayers(layers) {
    this.ledgeLayers = layers;
  }
  
  /**
   * Set animation controller for automatic animation management
   * @param {AnimationController} animController - AnimationController instance
   */
  setAnimationController(animController) {
    this.animationController = animController;
  }
  
  /**
   * Initialize production systems (audio, particles, hit zones, ranged weapons, physics)
   * Call this after creating the controller
   * @param {THREE.Scene} scene - Three.js scene
   * @param {THREE.Camera} camera - Three.js camera
   * @param {Object} characterMesh - Character mesh/group for hit zones
   */
  async initializeSystems(scene, camera, characterMesh) {
    this.characterMesh = characterMesh;
    
    // Audio system with 3D spatial audio
    this.audioSystem = new AudioSystem(camera);
    console.log('✓ AudioSystem initialized');
    
    // Particle system for combat effects
    this.particleSystem = new ParticleSystem(scene);
    console.log('✓ ParticleSystem initialized');
    
    // Hit zone system for location-based damage
    if (characterMesh) {
      this.hitZoneSystem = new HitZoneSystem(characterMesh);
      console.log('✓ HitZoneSystem initialized');
    }
    
    // Ranged weapon system
    this.rangedWeaponSystem = new RangedWeaponSystem(scene, camera);
    console.log('✓ RangedWeaponSystem initialized');
    
    // Animation mapper for 50+ animations
    this.animationMapper = new AnimationMapper();
    console.log('✓ AnimationMapper initialized');
    
    // Physics system with Rapier.js
    if (this.config.enablePhysics) {
      this.physicsSystem = new PhysicsSystem({
        lightImpactSpeed: this.config.lightImpactSpeed,
        mediumImpactSpeed: this.config.mediumImpactSpeed,
        heavyImpactSpeed: this.config.heavyImpactSpeed,
        ragdollThreshold: this.config.heavyImpactSpeed,
      });
      
      await this.physicsSystem.init();
      
      // Add character to physics
      if (characterMesh) {
        this.physicsSystem.addCharacter(characterMesh, {
          mass: 70,
          radius: this.config.characterRadius,
          height: 1.8,
          isKinematic: true // Player controlled
        });
        
        // Setup collision callback
        characterMesh.userData.onCollision = (event) => this.handlePhysicsCollision(event);
      }
      
      console.log('✓ PhysicsSystem initialized with Rapier.js');
      this.physicsInitialized = true;
    }
    
    console.log('🎮 All production systems initialized!');
  }
  
  /**
   * Register an enemy for combat/targeting
   * @param {Object} enemy - Enemy object with position, health, etc.
   */
  registerEnemy(enemy) {
    this.enemies.push(enemy);
    // HitZoneSystem integration requires physics world, skip for now
    // Can be added when physics world is available
  }
  
  /**
   * Unregister an enemy (e.g., when defeated)
   * @param {Object} enemy - Enemy object
   */
  unregisterEnemy(enemy) {
    const index = this.enemies.indexOf(enemy);
    if (index > -1) {
      this.enemies.splice(index, 1);
    }
  }

  setInput(input) {
    this.useExternalInput = true;
    Object.assign(this.input, input);
  }

  setExternalInputMode(enabled) {
    this.useExternalInput = enabled;
  }

  setupInputListeners(container) {
    window.addEventListener("keydown", (e) => {
      const key = e.code.toLowerCase();
      const now = performance.now() / 1000;

      // Double-tap detection for A and D
      if (key === "keya") {
        if (
          now - this.character.lastKeyTapTime.a <
          this.character.doubleTapWindow
        ) {
          this.input.rollLeft = true;
          this.character.lastKeyTapTime.a = 0; // Reset to prevent triple tap
        } else {
          this.character.lastKeyTapTime.a = now;
        }
      } else if (key === "keyd") {
        if (
          now - this.character.lastKeyTapTime.d <
          this.character.doubleTapWindow
        ) {
          this.input.rollRight = true;
          this.character.lastKeyTapTime.d = 0; // Reset to prevent triple tap
        } else {
          this.character.lastKeyTapTime.d = now;
        }
      }

      this.keys.add(key);
    });

    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.code.toLowerCase());
    });

    container.addEventListener("mousedown", (e) => {
      this.mouseButtons.add(e.button);
    });

    container.addEventListener("mouseup", (e) => {
      this.mouseButtons.delete(e.button);
    });

    container.addEventListener("mousemove", (e) => {
      if (this.isPointerLocked) {
        this.mouseMovement.x += e.movementX;
        this.mouseMovement.y += e.movementY;
      }
    });

    container.addEventListener("click", () => {
      if (!this.isPointerLocked) {
        container.requestPointerLock();
      }
    });

    document.addEventListener("pointerlockchange", () => {
      this.isPointerLocked = document.pointerLockElement === container;
    });
  }

  updateInputFromKeyboard() {
    const shift = this.keys.has("shiftleft") || this.keys.has("shiftright");
    const aKey = this.keys.has("keya") || this.keys.has("arrowleft");
    const dKey = this.keys.has("keyd") || this.keys.has("arrowright");
    const qKey = this.keys.has("keyq");
    const eKey = this.keys.has("keye");

    let moveY = 0;
    if (this.keys.has("keyw") || this.keys.has("arrowup")) moveY = 1;
    if (this.keys.has("keys") || this.keys.has("arrowdown")) moveY = -1;

    const isBlocking = this.mouseButtons.has(2);

    // Q/E for strafing, A/D for turning
    this.input.moveX = qKey ? -1 : eKey ? 1 : 0;
    this.input.moveY = moveY;
    this.input.turnLeft = aKey;
    this.input.turnRight = dKey;
    this.input.shift = shift;
    this.input.jump = this.keys.has("space");
    this.input.attack = this.mouseButtons.has(0);
    this.input.block = isBlocking;
    this.input.roll = shift && moveY !== 0;
    this.input.rollLeft = false; // Will be set by double-tap detection
    this.input.rollRight = false; // Will be set by double-tap detection
    this.input.interact = this.keys.has("keyf");
    this.input.targetLock = this.keys.has("tab"); // Tab for lock-on
    this.input.targetCycle = this.keys.has("keyx"); // X for cycle targets

    this.input.cUp = this.keys.has("keyi");
    this.input.cDown = this.keys.has("keyk");
    this.input.cLeft = this.keys.has("keyj");
    this.input.cRight = this.keys.has("keyl");

    const mouseSensitivity = 0.002;
    this.input.cameraX = this.mouseMovement.x * mouseSensitivity;
    this.input.cameraY = this.mouseMovement.y * mouseSensitivity;
    this.mouseMovement.x = 0;
    this.mouseMovement.y = 0;
  }

  update(delta, groundHeight = 0, waterLevel, targetableObjects = []) {
    this.prevInput = { ...this.input };

    if (!this.useExternalInput) {
      this.updateInputFromKeyboard();
    }

    this.updateTargetLock(targetableObjects);
    this.handleCollisions(targetableObjects); // Check collisions with targets
    this.updateCamera(delta);
    this.calculateIntendedDirection();

    const char = this.character;
    char.stateTime += delta;

    if (char.targetLockCooldown > 0) {
      char.targetLockCooldown -= delta;
    }

    if (waterLevel !== undefined && char.position.y < waterLevel) {
      this.updateSwimming(delta, waterLevel, groundHeight);
    } else {
      char.isSwimming = false;
      char.isWading = false;
      char.swimDepth = 0;

      if (char.isHanging) {
        this.updateHanging(delta);
      } else if (char.rollTimer > 0) {
        this.updateRoll(delta, groundHeight);
      } else if (char.hitReactTimer > 0) {
        this.updateHitReaction(delta, groundHeight);
      } else {
        this.updateMovement(delta, groundHeight);
      }
    }

    this.updateBodyTilt(delta);
    this.updateCameraPosition(delta);
    this.updateState();
    
    // Update physics system
    if (this.physicsInitialized && this.physicsSystem) {
      this.physicsSystem.update(delta);
    }
    
    // Update animation state based on controller state
    this.updateAnimationState();
    
    // Update animation mixer if animation controller is set
    if (this.animationController) {
      this.animationController.update(delta);
    }
  }

  /**
   * Handle physics-based collision events
   * Called automatically by PhysicsSystem when collision occurs
   * @param {Object} event - Collision event from PhysicsSystem
   */
  handlePhysicsCollision(event) {
    const { impactSpeed, impactType, direction } = event;
    const char = this.character;
    
    // Ignore collisions during roll (i-frames) or if already in hit state
    if (char.isInvulnerable || char.hitReactTimer > 0) return;
    
    console.log(`⚡ Collision: ${impactType} impact at ${impactSpeed.toFixed(2)} m/s`);
    
    // Determine hit animation and response based on impact type
    switch (impactType) {
      case 'light':
        // Light bump - no animation, just slight pushback
        char.forwardVel *= 0.7;
        break;
        
      case 'medium':
        // Medium impact - play light hit animation
        this.applyHit('front', 0); // Uses existing hit system
        char.hitReactTimer = 0.3; // Shorter stagger
        
        // Apply knockback
        if (this.physicsSystem) {
          this.physicsSystem.applyKnockback(this.characterMesh, direction, 'medium');
        }
        break;
        
      case 'heavy':
        // Heavy impact - play medium hit animation
        this.applyHit('front', 0);
        char.hitReactTimer = this.config.hitReactDuration; // Full stagger
        
        // Apply strong knockback
        if (this.physicsSystem) {
          this.physicsSystem.applyKnockback(this.characterMesh, direction, 'heavy');
        }
        break;
        
      case 'ragdoll':
        // Extreme impact - activate ragdoll physics
        if (this.physicsSystem && this.characterMesh) {
          console.log('💥 Ragdoll activated!');
          this.physicsSystem.activateRagdoll(
            this.characterMesh,
            direction.multiplyScalar(impactSpeed * 0.5)
          );
          
          // Lock controls during ragdoll
          char.hitReactTimer = this.physicsSystem.config.ragdollDuration;
          char.isInvulnerable = true;
        }
        break;
    }
  }

  handleCollisions(targetableObjects) {
    const char = this.character;
    const { characterRadius, minCombatRange, combatRange } = this.config;

    for (const obj of targetableObjects) {
      if (!obj.position) continue;

      const toTarget = new THREE.Vector3().subVectors(
        obj.position,
        char.position,
      );
      const distance = toTarget.length();
      toTarget.y = 0; // Only check horizontal distance
      const horizontalDist = toTarget.length();

      // Target collision radius (assuming targets are roughly same size)
      const targetRadius = 0.5;
      const minDist = characterRadius + targetRadius;

      // If too close, push character back
      if (horizontalDist < minDist && horizontalDist > 0.01) {
        const pushBack = new THREE.Vector3().copy(toTarget).normalize();
        pushBack.multiplyScalar(-(minDist - horizontalDist));
        char.position.x += pushBack.x;
        char.position.z += pushBack.z;

        // Stop forward velocity when colliding
        if (char.forwardVel > 0) {
          const moveDir = new THREE.Vector3(
            Math.sin(char.faceAngle),
            0,
            Math.cos(char.faceAngle),
          );
          const dot = moveDir.dot(toTarget.normalize());
          if (dot > 0) {
            // Moving toward target
            char.forwardVel *= 0.5;
          }
        }
      }

      // Maintain combat range when locked on
      if (char.lockedTarget === obj && !char.rollTimer) {
        if (horizontalDist < minCombatRange) {
          // Push away from target to maintain range
          const pushBack = new THREE.Vector3().copy(toTarget).normalize();
          pushBack.multiplyScalar(-(minCombatRange - horizontalDist) * 0.5);
          char.position.x += pushBack.x;
          char.position.z += pushBack.z;
        }
      }
    }
  }

  updateTargetLock(targetableObjects) {
    const char = this.character;

    // Toggle target lock
    if (
      this.input.targetLock &&
      !this.prevInput.targetLock &&
      char.targetLockCooldown <= 0
    ) {
      if (char.lockedTarget) {
        char.lockedTarget = null;
        char.combatMode = false;  // Exit combat mode
      } else {
        char.lockedTarget = this.findNearestTarget(targetableObjects);
        if (char.lockedTarget) {
          char.combatMode = true;  // Enter combat mode
        }
      }
      char.targetLockCooldown = this.config.targetSwitchCooldown;
    }

    // Cycle targets
    if (
      this.input.targetCycle &&
      !this.prevInput.targetCycle &&
      char.lockedTarget &&
      char.targetLockCooldown <= 0
    ) {
      char.lockedTarget = this.findNextTarget(
        targetableObjects,
        char.lockedTarget,
      );
      char.targetLockCooldown = this.config.targetSwitchCooldown;
    }

    // Validate current target is still in range
    if (char.lockedTarget) {
      const distance = char.position.distanceTo(char.lockedTarget.position);
      if (distance > this.config.targetLockRange) {
        char.lockedTarget = null;
        char.combatMode = false;  // Exit combat mode if target lost
      }
    }
  }

  findNearestTarget(targetableObjects) {
    const char = this.character;
    let nearest = null;
    let nearestDist = Infinity;

    const forward = new THREE.Vector3(
      Math.sin(char.faceAngle),
      0,
      Math.cos(char.faceAngle),
    );

    for (const obj of targetableObjects) {
      if (!obj.position) continue;

      const toTarget = new THREE.Vector3().subVectors(
        obj.position,
        char.position,
      );
      const distance = toTarget.length();

      if (distance > this.config.targetLockRange) continue;

      toTarget.normalize();
      const angle = forward.angleTo(toTarget);

      if (angle > this.config.targetLockAngle) continue;

      if (distance < nearestDist) {
        nearestDist = distance;
        nearest = obj;
      }
    }

    return nearest;
  }

  findNextTarget(targetableObjects, currentTarget) {
    const validTargets = targetableObjects.filter((obj) => {
      if (!obj.position || obj === currentTarget) return false;
      const distance = this.character.position.distanceTo(obj.position);
      return distance <= this.config.targetLockRange;
    });

    if (validTargets.length === 0) return currentTarget;

    validTargets.sort((a, b) => {
      const distA = this.character.position.distanceTo(a.position);
      const distB = this.character.position.distanceTo(b.position);
      return distA - distB;
    });

    return validTargets[0];
  }

  calculateIntendedDirection() {
    const { moveX, moveY } = this.input;
    const char = this.character;

    // Calculate input magnitude
    const inputMag = Math.sqrt(moveX * moveX + moveY * moveY);
    char.intendedMag = Math.min(inputMag, 1.0);

    if (inputMag > 0.1) {
      // Calculate movement angle relative to camera
      const stickAngle = Math.atan2(moveX, moveY);
      
      if (char.combatMode && char.lockedTarget) {
        // COMBAT MODE: Strafe around target (A/D circle, W/S forward/back)
        // Character always faces target, movement is relative to target
        char.intendedYaw = this.camera.yaw + stickAngle + Math.PI;
        char.isWalkingBack = moveY < 0;
        
        // Force character to face target
        const toTarget = new THREE.Vector3().subVectors(
          char.lockedTarget.position,
          char.position
        );
        toTarget.y = 0;  // Keep on horizontal plane
        toTarget.normalize();
        char.faceAngle = Math.atan2(toTarget.x, toTarget.z);
      } else if (char.isBlocking) {
        // When blocking (non-combat), allow circle strafing
        char.intendedYaw = this.camera.yaw + stickAngle + Math.PI;
        char.isWalkingBack = moveY < 0;
      } else {
        // Normal movement: W moves away from camera
        char.intendedYaw = this.camera.yaw + stickAngle + Math.PI;
        
        // Determine if walking backward (S key, moveY < 0)
        char.isWalkingBack = moveY < -0.1;
      }
    }
  }

  updateCamera(delta) {
    const { cameraSensitivity, minPitch, maxPitch } = this.config;
    const char = this.character;

    // Only allow free-look when RMB (block) is held
    if (this.input.block) {
      // Free-look mode with RMB
      this.camera.yaw -= this.input.cameraX * cameraSensitivity;
      this.camera.pitch += this.input.cameraY * cameraSensitivity;
    } else {
      // Auto-follow behind character
      // Smoothly rotate camera to follow character's facing direction
      const targetYaw = char.faceAngle + Math.PI; // Behind character
      let yawDiff = targetYaw - this.camera.yaw;
      
      // Normalize angle difference
      while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
      while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
      
      // Smooth camera rotation to follow character
      const followSpeed = 3.0; // How fast camera follows
      this.camera.yaw += yawDiff * followSpeed * delta;
    }

    // Keyboard camera controls (always available)
    const cButtonSpeed = DEG2RAD * 45;
    if (this.input.cLeft && !this.prevInput.cLeft)
      this.camera.yaw += cButtonSpeed;
    if (this.input.cRight && !this.prevInput.cRight)
      this.camera.yaw -= cButtonSpeed;
    if (this.input.cUp && !this.prevInput.cUp)
      this.camera.pitch -= DEG2RAD * 15;
    if (this.input.cDown && !this.prevInput.cDown)
      this.camera.pitch += DEG2RAD * 15;

    this.camera.pitch = Math.max(
      minPitch,
      Math.min(maxPitch, this.camera.pitch),
    );

    while (this.camera.yaw > Math.PI) this.camera.yaw -= Math.PI * 2;
    while (this.camera.yaw < -Math.PI) this.camera.yaw += Math.PI * 2;
  }

  updateMovement(delta, groundHeight) {
    const {
      maxSpeed,
      walkSpeed,
      acceleration,
      deceleration,
      turnSpeedFast,
      turnSpeedNormal,
      gravity,
      jumpVelocity,
      doubleJumpMultiplier,
      tripleJumpMultiplier,
      attackDuration,
      attackCooldown,
      comboCooldown,
      rollSpeed,
      rollDuration,
      rollCooldown,
    } = this.config;

    const char = this.character;
    const now = performance.now();
    const JUMP_COMBO_WINDOW = 400;

    const wasGrounded = char.isGrounded;
    char.isGrounded = char.position.y <= groundHeight + 0.05;
    
    // Coyote time - allow jump shortly after leaving ground
    if (wasGrounded && !char.isGrounded) {
      char.coyoteTimer = this.config.coyoteTime;
    }
    if (char.coyoteTimer > 0) {
      char.coyoteTimer -= delta;
    }

    if (char.isGrounded && !wasGrounded) {
      char.velocity.y = 0;
      char.position.y = groundHeight;
      char.isJumping = false;
      char.isFalling = false;
      
      // Calculate fall distance
      char.fallDistance = char.fallStartY - char.position.y;
      
      // Check if player pressed roll during fall (fall-to-roll)
      if (char.canRollOnLanding && this.input.roll && char.fallDistance > 2) {
        // Execute roll on landing instead of normal landing
        char.rollTimer = rollDuration;
        char.rollCooldown = rollCooldown;
        char.isInvulnerable = true;
        char.isLanding = false;
        
        // Roll in movement direction or forward
        if (char.intendedMag > 0.1) {
          char.rollDirection.set(
            Math.sin(char.intendedYaw),
            0,
            Math.cos(char.intendedYaw),
          );
        } else {
          char.rollDirection.set(
            Math.sin(char.faceAngle),
            0,
            Math.cos(char.faceAngle),
          );
        }
      } else {
        // Normal landing
        if (Math.abs(char.velocity.y) > 5) {
          char.isLanding = true;
          char.landingTimer = 0.4; // Heavy landing duration
        } else {
          char.isLanding = true;
          char.landingTimer = 0.2; // Light landing duration
        }
      }
      
      char.canRollOnLanding = false;
      char.fallDistance = 0;
      char.lastLandTime = now;
    }

    if (char.isGrounded && now - char.lastLandTime > JUMP_COMBO_WINDOW) {
      char.jumpCount = 0;
    }

    if (char.attackCooldown > 0) char.attackCooldown -= delta;
    if (char.attackTimer > 0) char.attackTimer -= delta;
    if (char.rollCooldown > 0) char.rollCooldown -= delta;
    if (char.landingTimer > 0) {
      char.landingTimer -= delta;
      if (char.landingTimer <= 0) {
        char.isLanding = false;
      }
    }
    
    // Jump buffer - remember jump input
    if (char.jumpBufferTimer > 0) {
      char.jumpBufferTimer -= delta;
    }

    // Jump buffer - store jump input when airborne
    if (this.input.jump && !this.prevInput.jump) {
      char.jumpBufferTimer = this.config.jumpBufferTime;
    }
    
    // Jump - Improved with forward momentum, air control, coyote time, and buffer
    const canJump = (char.isGrounded || char.coyoteTimer > 0) && char.attackTimer <= 0 && !char.isLanding;
    const wantsToJump = (this.input.jump && !this.prevInput.jump) || char.jumpBufferTimer > 0;
    
    if (wantsToJump && canJump) {
      char.jumpBufferTimer = 0; // Consume buffer
      char.coyoteTimer = 0; // Consume coyote time
      
      if (char.isGrounded || char.coyoteTimer > 0) {
        const timeSinceLand = now - char.lastLandTime;
        const canCombo =
          timeSinceLand < JUMP_COMBO_WINDOW && char.jumpCount > 0;

        if (canCombo && char.jumpCount === 1) {
          char.velocity.y = jumpVelocity * doubleJumpMultiplier;
          char.jumpCount = 2;
        } else if (canCombo && char.jumpCount === 2) {
          char.velocity.y = jumpVelocity * tripleJumpMultiplier;
          char.jumpCount = 3;
        } else {
          char.velocity.y = jumpVelocity;
          char.jumpCount = 1;
        }
        
        // Preserve forward momentum and add jump boost
        char.jumpStartVelocity = char.forwardVel;
        if (char.intendedMag > 0.1) {
          char.forwardVel += this.config.jumpForwardBoost;
        }
        
        char.isJumping = true;
        char.isGrounded = false;
        char.isLanding = false;
        char.landingTimer = 0;
      }
    }

    // Attack - Must wait for animation to complete (1.5s minimum)
    if (this.input.attack && !this.prevInput.attack && char.attackTimer <= 0) {
      if (char.isGrounded && char.rollTimer <= 0) {
        // Minimum 1.5 second duration per attack for full animation
        const ANIMATION_DURATION = 1.5;
        
        // Set attack timer - blocks ALL input during animation
        char.attackTimer = ANIMATION_DURATION;
        
        // Advance combo if within combo window
        if (char.attackCooldown > 0 && char.attackCombo < 3) {
          char.attackCombo += 1;
        } else {
          char.attackCombo = 1; // Start new combo
        }
        
        // Reset combo after finisher, otherwise keep combo open
        if (char.attackCombo === 3) {
          char.attackCooldown = comboCooldown; // Longer cooldown after full combo
        } else {
          char.attackCooldown = attackCooldown; // Short window to continue combo
        }
        
        // Lunge forward in facing direction based on combo
        const lungeForceMod = [0, 3, 3.5, 5]; // Index 0 unused, 1-3 are combo steps
        char.forwardVel = lungeForceMod[char.attackCombo];
      }
    }

    char.isBlocking =
      this.input.block &&
      char.isGrounded &&
      char.attackTimer <= 0 &&
      char.rollTimer <= 0;

    // Roll
    if (this.input.roll && !this.prevInput.roll && char.rollCooldown <= 0) {
      if (char.isGrounded && char.attackTimer <= 0) {
        char.rollTimer = rollDuration;
        char.rollCooldown = rollCooldown;
        char.isInvulnerable = true;

        if (char.intendedMag > 0.1) {
          char.rollDirection.set(
            Math.sin(char.intendedYaw),
            0,
            Math.cos(char.intendedYaw),
          );
        } else {
          char.rollDirection.set(
            Math.sin(char.faceAngle),
            0,
            Math.cos(char.faceAngle),
          );
        }
      }
    }

    // 180 turn
    if (
      this.input.shift &&
      this.input.turnRight &&
      !this.prevInput.turnRight &&
      char.turn180Timer <= 0
    ) {
      char.turn180Timer = 0.4;
      char.isTurning = true;
    }

    if (char.turn180Timer > 0) {
      char.turn180Timer -= delta;
      char.faceAngle += (Math.PI / 0.4) * delta;
      while (char.faceAngle > Math.PI) char.faceAngle -= Math.PI * 2;

      if (char.turn180Timer <= 0) {
        char.turn180Timer = 0;
        char.isTurning = false;
      }
    }

    // During attack, decelerate to stop quickly
    if (char.attackTimer > 0 && char.isGrounded) {
      // Aggressive deceleration during attack to stop sliding
      char.forwardVel = Math.max(0, char.forwardVel - deceleration * 2.0 * delta);
      
      // Snap to zero when very slow
      if (char.forwardVel < 0.5) {
        char.forwardVel = 0;
      }
    }

    // Movement - Restrict during landing recovery
    if (
      char.isGrounded &&
      char.attackTimer <= 0 &&
      !char.isBlocking &&
      char.turn180Timer <= 0 &&
      !char.isLanding
    ) {
      char.isTurning = this.input.turnLeft || this.input.turnRight;

      if (this.input.turnLeft) {
        char.faceAngle += turnSpeedNormal * delta;
      }
      if (this.input.turnRight && !this.input.shift) {
        char.faceAngle -= turnSpeedNormal * delta;
      }

      while (char.faceAngle > Math.PI) char.faceAngle -= Math.PI * 2;
      while (char.faceAngle < -Math.PI) char.faceAngle += Math.PI * 2;

      if (char.intendedMag > 0.1) {
        // Rotate character to face intended direction
        let angleDiff = char.intendedYaw - char.faceAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        const turnRate = turnSpeedFast * delta;
        if (Math.abs(angleDiff) < turnRate) {
          char.faceAngle = char.intendedYaw;
        } else {
          char.faceAngle += Math.sign(angleDiff) * turnRate;
        }

        const isRunning = char.intendedMag > 0.8 && !char.isWalkingBack;
        const targetSpeed = isRunning ? maxSpeed : walkSpeed;

        if (char.isWalkingBack) {
          char.forwardVel -= acceleration * delta;
          if (char.forwardVel < -walkSpeed * 0.6) {
            char.forwardVel = -walkSpeed * 0.6;
          }
        } else {
          char.forwardVel += acceleration * delta;
          if (char.forwardVel > targetSpeed * char.intendedMag) {
            char.forwardVel = targetSpeed * char.intendedMag;
          }
        }
      } else {
        // Aggressive friction when no input - stop sliding immediately
        if (char.forwardVel > 0) {
          char.forwardVel = Math.max(0, char.forwardVel - deceleration * delta);
        } else if (char.forwardVel < 0) {
          char.forwardVel = Math.min(0, char.forwardVel + deceleration * delta);
        }
        
        // Extra damping for near-zero velocities (snap to stop)
        if (Math.abs(char.forwardVel) < 0.1) {
          char.forwardVel = 0;
        }
      }
    } else if (char.isLanding && char.isGrounded) {
      // During landing, apply strong deceleration
      if (char.forwardVel > 0) {
        char.forwardVel = Math.max(0, char.forwardVel - deceleration * 1.5 * delta);
      } else if (char.forwardVel < 0) {
        char.forwardVel = Math.min(0, char.forwardVel + deceleration * 1.5 * delta);
      }
    } else if ((char.isBlocking || this.input.moveX !== 0) && char.isGrounded) {
      // When blocking, locked on, or using Q/E - allow strafing
      if (char.intendedMag > 0.1 || this.input.moveX !== 0) {
        let angleDiff = char.intendedYaw - char.faceAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // Calculate strafe velocity (Q/E keys or movement relative to facing)
        if (this.input.moveX !== 0) {
          char.sideVel = this.input.moveX * walkSpeed * 0.7;
        } else {
          char.sideVel = Math.sin(angleDiff) * walkSpeed * 0.7;
        }
        
        // Forward/back movement during strafe
        if (this.input.moveY > 0.1) {
          char.forwardVel += acceleration * delta * 0.8;
          if (char.forwardVel > walkSpeed * 0.6) {
            char.forwardVel = walkSpeed * 0.6;
          }
        } else if (this.input.moveY < -0.1) {
          char.forwardVel -= acceleration * delta * 0.8;
          if (char.forwardVel < -walkSpeed * 0.6) {
            char.forwardVel = -walkSpeed * 0.6;
          }
        } else {
          // Decelerate forward velocity when only strafing
          if (char.forwardVel > 0) {
            char.forwardVel = Math.max(0, char.forwardVel - deceleration * delta);
          } else if (char.forwardVel < 0) {
            char.forwardVel = Math.min(0, char.forwardVel + deceleration * delta);
          }
        }

        // Face locked target while strafing
        if (char.lockedTarget && char.lockedTarget.position) {
          const toTarget = new THREE.Vector3().subVectors(
            char.lockedTarget.position,
            char.position,
          );
          char.faceAngle = Math.atan2(toTarget.x, toTarget.z);
        }
      } else {
        char.sideVel = 0;
      }
    } else if (!char.isGrounded) {
      // Track fall for fall-to-roll mechanic
      if (!char.isJumping && char.velocity.y < -2) {
        if (char.fallStartY === 0) {
          char.fallStartY = char.position.y;
        }
        char.canRollOnLanding = true; // Enable fall-to-roll
      }
      
      // Air control - subtle directional influence
      if (char.intendedMag > 0.1) {
        const airControl = this.config.airControl;
        const intendedDYaw = char.intendedYaw - char.faceAngle;
        
        // Reduced air control for more realistic physics
        char.forwardVel +=
          airControl * Math.cos(intendedDYaw) * char.intendedMag * delta;
        char.faceAngle +=
          airControl * 0.6 * Math.sin(intendedDYaw) * char.intendedMag * delta;
      }
      
      // Air friction - maintain momentum better
      char.forwardVel *= Math.pow(0.985, delta * 60);
    }

    // Apply velocity with additional friction multiplier
    const frictionMultiplier = 1.0; // Can reduce for more slide, increase for less
    char.velocity.x = Math.sin(char.faceAngle) * char.forwardVel * frictionMultiplier;
    char.velocity.z = Math.cos(char.faceAngle) * char.forwardVel * frictionMultiplier;

    if (char.isBlocking) {
      const strafeAngle = char.faceAngle + Math.PI / 2;
      char.velocity.x += Math.sin(strafeAngle) * char.sideVel;
      char.velocity.z += Math.cos(strafeAngle) * char.sideVel;
    }

    if (!char.isGrounded) {
      char.velocity.y -= gravity * delta;
      char.isFalling = char.velocity.y < -1;
    }

    char.position.x += char.velocity.x * delta;
    char.position.y += char.velocity.y * delta;
    char.position.z += char.velocity.z * delta;

    if (char.position.y < groundHeight) {
      char.position.y = groundHeight;
      char.velocity.y = 0;
      char.isGrounded = true;
    }
  }

  updateRoll(delta, groundHeight) {
    const char = this.character;
    const { rollSpeed, rollIframes, rollDuration } = this.config;

    char.rollTimer -= delta;

    if (char.rollTimer < rollDuration - rollIframes) {
      char.isInvulnerable = false;
    }

    const rollProgress = 1 - char.rollTimer / rollDuration;
    const speed = rollSpeed * (1 - rollProgress * 0.5);

    char.velocity.x = char.rollDirection.x * speed;
    char.velocity.z = char.rollDirection.z * speed;

    char.position.x += char.velocity.x * delta;
    char.position.z += char.velocity.z * delta;

    char.faceAngle = Math.atan2(char.rollDirection.x, char.rollDirection.z);

    if (char.rollTimer <= 0) {
      char.rollTimer = 0;
      char.isInvulnerable = false;
      char.forwardVel = 0;
    }
  }
  
  /**
   * Update animation state based on controller state
   * Priority system: Hit > Roll > Attack > Airborne > Block > Locomotion
   */
  updateAnimationState() {
    if (!this.animationController) return;
    
    const char = this.character;
    
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
      const attackNum = (char.attackCombo % 3) || 3;
      this.animationController.transitionTo(`ATTACK_${attackNum}`);
      return;
    }
    
    // 4. Airborne states
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

  updateHitReaction(delta, groundHeight) {
    const char = this.character;
    const { gravity } = this.config;

    char.hitReactTimer -= delta;

    const knockbackSpeed =
      5 * (char.hitReactTimer / this.config.hitReactDuration);

    let knockbackAngle = char.faceAngle;
    switch (char.hitDirection) {
      case "front":
        knockbackAngle += Math.PI;
        break;
      case "back":
        break;
      case "left":
        knockbackAngle -= Math.PI / 2;
        break;
      case "right":
        knockbackAngle += Math.PI / 2;
        break;
    }

    char.velocity.x = Math.sin(knockbackAngle) * knockbackSpeed;
    char.velocity.z = Math.cos(knockbackAngle) * knockbackSpeed;

    if (!char.isGrounded) {
      char.velocity.y -= gravity * delta;
    }

    char.position.x += char.velocity.x * delta;
    char.position.y += char.velocity.y * delta;
    char.position.z += char.velocity.z * delta;

    if (char.position.y < groundHeight) {
      char.position.y = groundHeight;
      char.velocity.y = 0;
      char.isGrounded = true;
    }

    if (char.hitReactTimer <= 0) {
      char.hitReactTimer = 0;
    }
  }

  updateHanging(delta) {
    const char = this.character;
    const { ledgeClimbSpeed } = this.config;

    if (!char.hangLedge || !char.hangNormal) {
      char.isHanging = false;
      return;
    }

    if (this.input.moveY > 0.5) {
      char.climbProgress += ledgeClimbSpeed * delta;
      if (char.climbProgress >= 1) {
        const climbOffset = new THREE.Vector3()
          .copy(char.hangNormal)
          .multiplyScalar(-0.5);
        char.position.copy(char.hangLedge).add(climbOffset);
        char.position.y = char.hangLedge.y + 0.1;
        char.isHanging = false;
        char.hangLedge = null;
        char.hangNormal = null;
        char.climbProgress = 0;
        char.isGrounded = true;
      }
    } else if (this.input.moveY < -0.5) {
      char.isHanging = false;
      char.hangLedge = null;
      char.hangNormal = null;
      char.climbProgress = 0;
      char.velocity.y = -2;
    }

    if (this.input.moveX !== 0 && char.hangLedge && char.hangNormal) {
      const shimmy = new THREE.Vector3()
        .crossVectors(char.hangNormal, new THREE.Vector3(0, 1, 0))
        .normalize()
        .multiplyScalar(this.input.moveX * 2 * delta);
      char.hangLedge.add(shimmy);
      char.position.x = char.hangLedge.x + char.hangNormal.x * 0.3;
      char.position.z = char.hangLedge.z + char.hangNormal.z * 0.3;
    }

    if (this.input.jump && !this.prevInput.jump) {
      char.isHanging = false;
      char.velocity.y = this.config.jumpVelocity * 0.7;
      char.velocity.x = -char.hangNormal.x * 5;
      char.velocity.z = -char.hangNormal.z * 5;
      char.hangLedge = null;
      char.hangNormal = null;
      char.climbProgress = 0;
    }
  }

  updateSwimming(delta, waterLevel, groundHeight) {
    const char = this.character;
    const {
      swimSpeed,
      swimAccel,
      swimFriction,
      wadeDepth,
      swimDepth,
      turnSpeedWater,
      gravity,
    } = this.config;

    const depth = waterLevel - char.position.y;
    char.swimDepth = depth;

    if (depth < wadeDepth) {
      char.isWading = true;
      char.isSwimming = false;
    } else if (depth > swimDepth) {
      char.isSwimming = true;
      char.isWading = false;
    } else {
      char.isWading = true;
      char.isSwimming = false;
    }

    if (char.isSwimming) {
      if (char.intendedMag > 0.1) {
        let angleDiff = char.intendedYaw - char.faceAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const maxTurn = turnSpeedWater * delta;
        if (Math.abs(angleDiff) < maxTurn) {
          char.faceAngle = char.intendedYaw;
        } else {
          char.faceAngle += Math.sign(angleDiff) * maxTurn;
        }

        char.forwardVel = Math.min(
          char.forwardVel + swimAccel * delta,
          swimSpeed,
        );
      } else {
        char.forwardVel *= Math.pow(0.1, delta);
      }

      char.forwardVel = Math.max(0, char.forwardVel - swimFriction * delta);

      char.velocity.x = Math.sin(char.faceAngle) * char.forwardVel;
      char.velocity.z = Math.cos(char.faceAngle) * char.forwardVel;

      const targetY = waterLevel - 0.3;
      const vertDiff = targetY - char.position.y;
      char.velocity.y += vertDiff * 4 * delta;

      if (this.input.jump && !this.prevInput.jump && depth < 1) {
        char.velocity.y = this.config.jumpVelocity * 0.8;
      }

      char.velocity.y *= Math.pow(0.5, delta);
    } else {
      const speedMod = char.isWading ? 0.6 : 1;
      if (char.intendedMag > 0.1) {
        let angleDiff = char.intendedYaw - char.faceAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const turnSpeed = this.config.turnSpeedNormal * speedMod;
        const maxTurn = turnSpeed * delta;
        if (Math.abs(angleDiff) < maxTurn) {
          char.faceAngle = char.intendedYaw;
        } else {
          char.faceAngle += Math.sign(angleDiff) * maxTurn;
        }

        char.forwardVel += this.config.acceleration * speedMod * delta;
        if (char.forwardVel > this.config.walkSpeed * speedMod) {
          char.forwardVel = this.config.walkSpeed * speedMod;
        }
      } else {
        char.forwardVel = Math.max(
          0,
          char.forwardVel - this.config.deceleration * delta,
        );
      }

      char.velocity.x = Math.sin(char.faceAngle) * char.forwardVel;
      char.velocity.z = Math.cos(char.faceAngle) * char.forwardVel;

      if (char.position.y > groundHeight + 0.05) {
        char.velocity.y -= gravity * 0.5 * delta;
      } else {
        char.velocity.y = 0;
        char.isGrounded = true;
      }
    }

    char.position.x += char.velocity.x * delta;
    char.position.y += char.velocity.y * delta;
    char.position.z += char.velocity.z * delta;

    if (char.position.y < groundHeight) {
      char.position.y = groundHeight;
      char.velocity.y = 0;
    }
  }

  updateBodyTilt(delta) {
    const char = this.character;
    const { tiltSpeed, tiltMax } = this.config;

    let targetTilt = 0;

    if (char.forwardVel > 1 && char.isGrounded) {
      let angleDiff = char.intendedYaw - char.faceAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      const turnStrength = Math.min(1, Math.abs(angleDiff) / (Math.PI / 4));
      targetTilt =
        Math.sign(angleDiff) *
        tiltMax *
        turnStrength *
        (char.forwardVel / this.config.maxSpeed);
    }

    const tiltDiff = targetTilt - char.bodyTilt;
    char.bodyTilt +=
      Math.sign(tiltDiff) * Math.min(Math.abs(tiltDiff), tiltSpeed * delta);
  }

  updateCameraPosition(delta) {
    const char = this.character;
    const { cameraDistance, cameraHeight, cameraSmoothing } = this.config;

    const offset = new THREE.Vector3(
      cameraDistance * Math.sin(this.camera.yaw) * Math.cos(this.camera.pitch),
      cameraDistance * Math.sin(this.camera.pitch) + cameraHeight,
      cameraDistance * Math.cos(this.camera.yaw) * Math.cos(this.camera.pitch),
    );

    this.camera.goalFocus.copy(char.position).add(new THREE.Vector3(0, 1.5, 0));
    this.camera.goalPosition.copy(char.position).add(offset);

    this.camera.position.lerp(this.camera.goalPosition, cameraSmoothing);
    this.camera.focus.lerp(this.camera.goalFocus, cameraSmoothing);
  }

  updateState() {
    const char = this.character;
    const prev = char.state;

    if (char.hitReactTimer > 0) {
      char.state = `hit_${char.hitDirection}`;
    } else if (char.rollTimer > 0) {
      char.state = this.getRollDirectionState();
    } else if (char.isHanging) {
      if (char.climbProgress > 0) {
        char.state = "climb_up";
      } else if (this.input.moveX < 0) {
        char.state = "shimmy_left";
      } else if (this.input.moveX > 0) {
        char.state = "shimmy_right";
      } else {
        char.state = "hang";
      }
    } else if (char.isSwimming) {
      char.state = char.forwardVel > 0.5 ? "swim" : "swim_idle";
    } else if (char.isWading) {
      char.state = "wade";
    } else if (char.attackTimer > 0) {
      char.state = `attack${char.attackCombo}`;
    } else if (char.isBlocking) {
      if (this.input.moveX < 0) {
        char.state = "strafe_left";
      } else if (this.input.moveX > 0) {
        char.state = "strafe_right";
      } else {
        char.state = "block";
      }
    } else if (this.input.moveX !== 0 && char.isGrounded && !char.isLanding) {
      // Q/E strafing without blocking
      if (this.input.moveX < 0) {
        char.state = "strafe_left";
      } else {
        char.state = "strafe_right";
      }
    } else if (char.turn180Timer > 0) {
      char.state = "turn_180";
    } else if (char.isSliding) {
      char.state = "slide";
    } else if (char.isLanding && char.isGrounded) {
      // Landing state - character recovering from fall
      char.state = "land";
    } else if (!char.isGrounded) {
      if (char.isJumping) {
        // Rising phase of jump
        if (char.velocity.y > 0) {
          if (char.jumpCount === 3) char.state = "triple_jump";
          else if (char.jumpCount === 2) char.state = "double_jump";
          else char.state = "jump";
        } else {
          // Peak/falling phase of jump
          char.state = "fall";
        }
      } else if (char.isFalling) {
        char.state = "fall";
      }
    } else {
      if (char.forwardVel > this.config.walkSpeed + 0.5) {
        char.state = "run";
      } else if (char.forwardVel > 0.5) {
        char.state = "walk";
      } else if (char.forwardVel < -0.1) {
        char.state = "walk_back";
      } else if (char.isTurning && this.input.turnLeft) {
        char.state = "turn_left";
      } else if (char.isTurning && this.input.turnRight) {
        char.state = "turn_right";
      } else {
        // Idle with variations
        if (char.state !== "idle" || char.stateTime === 0) {
          // Just entered idle, pick a random variation
          char.idleVariation = Math.floor(Math.random() * 4) + 1; // 1-4
          char.idleVariationTimer = 3 + Math.random() * 4; // 3-7 seconds
        } else if (char.idleVariationTimer > 0) {
          char.idleVariationTimer -= delta;
          if (char.idleVariationTimer <= 0) {
            // Time to change idle variation
            char.idleVariation = Math.floor(Math.random() * 4) + 1;
            char.idleVariationTimer = 3 + Math.random() * 4;
          }
        }
        
        // Set idle state with variation number
        if (char.idleVariation === 1) {
          char.state = "idle";
        } else {
          char.state = `idle${char.idleVariation}`;
        }
      }
    }

    if (char.state !== prev) {
      char.prevState = prev;
      char.stateTime = 0;
    }
  }

  applyHit(direction, damage = 0) {
    const char = this.character;

    if (char.isInvulnerable || char.hitReactTimer > 0) return;

    char.hitDirection = direction;
    char.hitReactTimer = this.config.hitReactDuration;
    char.attackTimer = 0;
    char.rollTimer = 0;
  }

  tryGrabLedge(ledgePosition, ledgeNormal) {
    const char = this.character;

    if (char.isGrounded || char.isSwimming || char.velocity.y > 0) return false;

    const toledge = new THREE.Vector3().subVectors(
      ledgePosition,
      char.position,
    );
    if (toledge.length() > this.config.ledgeGrabRange) return false;

    char.isHanging = true;
    char.hangLedge = ledgePosition.clone();
    char.hangNormal = ledgeNormal.clone().normalize();
    char.climbProgress = 0;
    char.velocity.set(0, 0, 0);

    char.faceAngle = Math.atan2(-ledgeNormal.x, -ledgeNormal.z);

    char.position.x = ledgePosition.x + ledgeNormal.x * 0.3;
    char.position.y = ledgePosition.y - 1.5;
    char.position.z = ledgePosition.z + ledgeNormal.z * 0.3;

    return true;
  }

  setPosition(x, y, z) {
    this.character.position.set(x, y, z);
    this.character.velocity.set(0, 0, 0);
    this.character.forwardVel = 0;
    this.character.isGrounded = true;
  }

  applyToCamera(camera) {
    camera.position.copy(this.camera.position);
    camera.lookAt(this.camera.focus);
  }

  applyToCharacter(model) {
    const char = this.character;

    model.position.copy(char.position);
    model.rotation.y = char.faceAngle;

    if (model.children[0]) {
      model.children[0].rotation.z = char.bodyTilt;
    }
  }

  getAnimationName() {
    const animMap = {
      idle: "Idle",
      walk: "Walk",
      walk_back: "Walk",
      run: "Run",
      turn_left: "Idle",
      turn_right: "Idle",
      turn_180: "Turn180",
      jump: "Jump",
      double_jump: "Jump",
      triple_jump: "Jump",
      fall: "Fall",
      land: "Idle",
      attack1: "Attack",
      attack2: "Attack2",
      attack3: "Attack3",
      block: "Block",
      block_hit: "Block",
      strafe_left: "StrafeLeft",
      strafe_right: "StrafeRight",
      roll_forward: "Roll",
      roll_back: "Roll",
      roll_left: "RollLeft",
      roll_right: "RollRight",
      slide: "Roll",
      slide_back: "Roll",
      hang: "Idle",
      shimmy_left: "Walk",
      shimmy_right: "Walk",
      climb_up: "Jump",
      climb_down: "Fall",
      swim: "Run",
      swim_idle: "Idle",
      wade: "Walk",
      dive: "Fall",
      hit_front: "HitFront",
      hit_back: "HitBack",
      hit_left: "HitLeft",
      hit_right: "HitRight",
      death: "Death",
    };
    return animMap[this.character.state] || "Idle";
  }

  getRollDirectionState() {
    const char = this.character;
    const rollAngle = Math.atan2(char.rollDirection.x, char.rollDirection.z);
    let angleDiff = rollAngle - char.faceAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    if (Math.abs(angleDiff) < Math.PI / 4) return "roll_forward";
    if (Math.abs(angleDiff) > (Math.PI * 3) / 4) return "roll_back";
    if (angleDiff > 0) return "roll_right";
    return "roll_left";
  }

  getLockedTarget() {
    return this.character.lockedTarget;
  }

  clearTargetLock() {
    this.character.lockedTarget = null;
  }
}
