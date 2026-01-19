/**
 * AnimationController.js - State-based animation system for Three.js
 * Handles animation transitions, blending, and state management
 */

import * as THREE from 'three';

/**
 * Animation state definitions with timing data
 */
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
  WALK_BACK: { 
    name: 'walk_back', 
    duration: 1.5, 
    loop: true, 
    blendTime: 0.35,  // was 0.3
    priority: 0 
  },
  
  // Combat - SLOWER and more committed (Souls-like)
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
  BLOCK_HIT: { 
    name: 'block_hit', 
    duration: 0.3, 
    loop: false, 
    blendTime: 0.05,
    priority: 4 
  },
  
  // Mobility
  ROLL: { 
    name: 'roll', 
    duration: 0.7,    // was 0.5 - SLOWER (Souls-like)
    loop: false, 
    blendTime: 0.05,  // was 0.1 - FAST startup for i-frames
    priority: 3 
  },
  JUMP: { 
    name: 'jump', 
    duration: 0.4, 
    loop: false, 
    blendTime: 0.1,
    priority: 2 
  },
  FALL: { 
    name: 'fall', 
    duration: 0.6, 
    loop: true, 
    blendTime: 0.2,
    priority: 2 
  },
  LAND: { 
    name: 'land', 
    duration: 0.3, 
    loop: false, 
    blendTime: 0.1,
    priority: 2 
  },
  
  // Hit Reactions - MORE impact
  HIT_REACT: { 
    name: 'hit_react', 
    duration: 0.6,    // was 0.4 - LONGER stagger
    loop: false, 
    blendTime: 0.02,  // was 0.05 - INSTANT reaction
    priority: 5 
  },
  
  // Ranged Weapons
  AIM_IDLE: {
    name: 'aim_idle',
    duration: 1.0,
    loop: true,
    blendTime: 0.3,  // Smooth transition to aiming
    priority: 1
  },
  AIM_WALK: {
    name: 'aim_walk',
    duration: 1.2,
    loop: true,
    blendTime: 0.25,
    priority: 1
  },
  SHOOT: {
    name: 'shoot',
    duration: 0.5,   // Quick shot animation
    loop: false,
    blendTime: 0.05,
    priority: 3
  },
  RELOAD: {
    name: 'reload',
    duration: 2.0,   // Matches reload time
    loop: false,
    blendTime: 0.15,
    priority: 3
  },
  DRAW_RANGED: {
    name: 'draw_ranged',
    duration: 0.8,   // Equip bow/gun
    loop: false,
    blendTime: 0.2,
    priority: 2
  },
  HOLSTER_RANGED: {
    name: 'holster_ranged',
    duration: 0.6,   // Put away ranged weapon
    loop: false,
    blendTime: 0.2,
    priority: 2
  },
};

/**
 * AnimationController - Manages character animation state and transitions
 */
export class AnimationController {
  constructor(mixer, animationClips = []) {
    this.mixer = mixer;
    this.animations = new Map(); // state name -> AnimationAction
    this.currentState = null;
    this.previousState = null;
    this.stateStartTime = 0;
    this.transitionDuration = 0;
    
    // Animation event callbacks
    this.onAnimationComplete = null;
    this.onAnimationLoop = null;
    
    // Load animations if provided
    if (animationClips.length > 0) {
      this.loadAnimations(animationClips);
    }
  }
  
  /**
   * Load animation clips into the controller
   * @param {THREE.AnimationClip[]} clips - Array of animation clips
   */
  loadAnimations(clips) {
    clips.forEach(clip => {
      const action = this.mixer.clipAction(clip);
      
      // Set up event listeners
      action.clampWhenFinished = true;
      
      // Store action mapped to state name (try to match state names)
      const stateName = this.findMatchingStateName(clip.name);
      if (stateName) {
        this.animations.set(stateName, action);
        console.log(`✓ Loaded animation: ${clip.name} -> ${stateName}`);
      } else {
        // Store with original name if no match
        this.animations.set(clip.name, action);
        console.log(`⚠ Loaded animation: ${clip.name} (no state match)`);
      }
    });
    
    console.log(`AnimationController: Loaded ${this.animations.size} animations`);
  }
  
  /**
   * Try to match clip name to a state name
   */
  findMatchingStateName(clipName) {
    const normalized = clipName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    for (const stateName in AnimationStates) {
      const stateNameNormalized = AnimationStates[stateName].name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      
      if (normalized.includes(stateNameNormalized) || 
          stateNameNormalized.includes(normalized)) {
        return stateName;
      }
    }
    
    return null;
  }
  
  /**
   * Manually register an animation with a state name
   * @param {string} stateName - State name from AnimationStates
   * @param {THREE.AnimationClip} clip - Animation clip
   */
  registerAnimation(stateName, clip) {
    const action = this.mixer.clipAction(clip);
    action.clampWhenFinished = true;
    this.animations.set(stateName, action);
    console.log(`✓ Registered: ${stateName} -> ${clip.name}`);
  }
  
  /**
   * Transition to a new animation state
   * @param {string} stateName - State name from AnimationStates
   * @param {number} overrideBlendTime - Optional custom blend time
   */
  transitionTo(stateName, overrideBlendTime = null) {
    // Validate state exists
    const state = AnimationStates[stateName];
    if (!state) {
      console.error(`Animation state "${stateName}" not found in AnimationStates`);
      return false;
    }
    
    // Get animation action
    const newAction = this.animations.get(stateName);
    if (!newAction) {
      console.warn(`Animation action for "${stateName}" not loaded. Available:`, 
        Array.from(this.animations.keys()));
      return false;
    }
    
    // Already in this state - don't retrigger
    if (this.currentState === stateName) {
      return false;
    }
    
    const blendTime = overrideBlendTime !== null ? overrideBlendTime : state.blendTime;
    
    // Fade out previous animation
    if (this.currentState) {
      const prevAction = this.animations.get(this.currentState);
      if (prevAction) {
        prevAction.fadeOut(blendTime);
      }
    }
    
    // Fade in new animation
    newAction
      .reset()
      .setEffectiveTimeScale(1.0)
      .setEffectiveWeight(1.0)
      .setLoop(state.loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity)
      .fadeIn(blendTime)
      .play();
    
    // Update state tracking
    this.previousState = this.currentState;
    this.currentState = stateName;
    this.stateStartTime = performance.now() / 1000;
    this.transitionDuration = blendTime;
    
    console.log(`Animation: ${this.previousState || 'none'} -> ${stateName} (blend: ${blendTime.toFixed(2)}s)`);
    
    return true;
  }
  
  /**
   * Check if current animation has finished (for non-looping animations)
   */
  isCurrentAnimationFinished() {
    if (!this.currentState) return true;
    
    const state = AnimationStates[this.currentState];
    if (state.loop) return false;
    
    const action = this.animations.get(this.currentState);
    if (!action) return true;
    
    // Check if action is finished
    return !action.isRunning() || action.time >= action.getClip().duration;
  }
  
  /**
   * Get progress of current animation (0-1)
   */
  getCurrentAnimationProgress() {
    if (!this.currentState) return 0;
    
    const action = this.animations.get(this.currentState);
    if (!action) return 0;
    
    const clip = action.getClip();
    return Math.min(action.time / clip.duration, 1.0);
  }
  
  /**
   * Get time remaining in current animation (seconds)
   */
  getCurrentAnimationTimeRemaining() {
    if (!this.currentState) return 0;
    
    const action = this.animations.get(this.currentState);
    if (!action) return 0;
    
    const clip = action.getClip();
    return Math.max(0, clip.duration - action.time);
  }
  
  /**
   * Check if we're in the transition period
   */
  isTransitioning() {
    const elapsed = (performance.now() / 1000) - this.stateStartTime;
    return elapsed < this.transitionDuration;
  }
  
  /**
   * Set animation speed multiplier
   * @param {number} speed - Speed multiplier (1.0 = normal)
   */
  setAnimationSpeed(speed) {
    if (this.currentState) {
      const action = this.animations.get(this.currentState);
      if (action) {
        action.setEffectiveTimeScale(speed);
      }
    }
  }
  
  /**
   * Get current animation speed multiplier
   */
  getAnimationSpeed() {
    if (this.currentState) {
      const action = this.animations.get(this.currentState);
      if (action) {
        return action.getEffectiveTimeScale();
      }
    }
    return 1.0;
  }
  
  /**
   * Stop all animations
   */
  stopAll() {
    this.animations.forEach((action) => {
      action.stop();
    });
    this.currentState = null;
    this.previousState = null;
  }
  
  /**
   * Pause current animation
   */
  pause() {
    if (this.currentState) {
      const action = this.animations.get(this.currentState);
      if (action) {
        action.paused = true;
      }
    }
  }
  
  /**
   * Resume current animation
   */
  resume() {
    if (this.currentState) {
      const action = this.animations.get(this.currentState);
      if (action) {
        action.paused = false;
      }
    }
  }
  
  /**
   * Update the animation mixer
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    this.mixer.update(deltaTime);
    
    // Check for animation completion
    if (this.currentState && !AnimationStates[this.currentState].loop) {
      if (this.isCurrentAnimationFinished() && this.onAnimationComplete) {
        this.onAnimationComplete(this.currentState);
      }
    }
  }
  
  /**
   * Get debug information about current animation state
   */
  getDebugInfo() {
    return {
      currentState: this.currentState,
      previousState: this.previousState,
      progress: this.getCurrentAnimationProgress(),
      timeRemaining: this.getCurrentAnimationTimeRemaining(),
      isTransitioning: this.isTransitioning(),
      isFinished: this.isCurrentAnimationFinished(),
      loadedAnimations: Array.from(this.animations.keys()),
    };
  }
}

/**
 * Attack data configuration for combat timing
 */
export const ATTACK_DATABASE = {
  LIGHT_1: {
    name: 'Light Attack 1',
    animation: 'ATTACK_1',
    duration: 0.9,          // was 0.6 - SLOWER
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
    duration: 1.0,          // was 0.7 - SLOWER
    hitFrame: 0.5,          // was 0.40 - later
    recoveryFrame: 0.7,
    damage: 12,
    range: 2.5,
    hitStun: 0.55,          // was 0.35 - MORE stun
    cameraShake: 0.5,       // was 0.4 - MORE shake
    effectColor: 0xFFAA00,
    comboWindow: 0.3,       // was 0.45 - TIGHTER
    canComboInto: ['LIGHT_3', 'HEAVY_1'],
    movementLock: true,
    staminaCost: 12,
  },
  
  LIGHT_3: {
    name: 'Light Attack 3 (Finisher)',
    animation: 'ATTACK_3',
    duration: 1.3,          // was 0.9 - SLOWER
    hitFrame: 0.65,         // was 0.50 - MUCH later
    recoveryFrame: 1.0,
    damage: 20,
    range: 3.0,
    hitStun: 0.8,           // was 0.6 - LONG stagger
    cameraShake: 1.0,       // was 0.7 - BIG shake
    effectColor: 0xFF3300,
    comboWindow: 0,         // ends combo
    canComboInto: [],
    movementLock: true,
    staminaCost: 18,
  },
  
  HEAVY_1: {
    name: 'Heavy Attack',
    animation: 'HEAVY_ATTACK',
    duration: 1.5,          // was 1.2 - SLOWER
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

export default AnimationController;
