/**
 * GameConfig.js - Centralized configuration for reusable game systems
 *
 * This file allows you to quickly configure the game for different projects
 * without modifying core system code.
 */

export const GAME_CONFIG = {
  // Project info
  projectName: "Warrior Combat Demo",
  version: "1.0.0",

  // File paths (customize for your project)
  paths: {
    characterModel:
      "/models/RacalvinDaWarrior/Meshy_AI_Orc_Warlord_Render_1220104017_texture_fbx.fbx",
    weapon: "../My project/Assets/Editor/ThreeExporter/racsknife.glb",
    animations: "/models/RacalvinDaWarrior/", // Base path for animations
    textures: "./textures/", // Optional textures folder
  },

  // Character controller settings
  character: {
    maxSpeed: 3.5,      // Reduced - matches animation better
    walkSpeed: 1.6,     // Slower walk for sync
    acceleration: 12,   // Smoother acceleration
    deceleration: 20,   // Controlled stopping

    jumpVelocity: 10,
    doubleJumpMultiplier: 1.3,
    tripleJumpMultiplier: 1.7,

    rollSpeed: 12,
    rollDuration: 0.5,
    rollCooldown: 0.8,

    attackDuration: 0.5,
    attackCooldown: 1.0,
    comboCooldown: 1.5,
  },

  // Camera settings
  camera: {
    distance: 5,
    height: 2,
    pitch: 0.3,
    sensitivity: 2.5,
    smoothing: 0.08,
    minPitch: -0.8,
    maxPitch: 1.2,
  },

  // Target lock settings
  targetLock: {
    enabled: true,
    range: 15,
    angle: Math.PI / 3, // ~60 degrees
    switchCooldown: 0.3,
    circleRadius: 0.5,
    circleColor: 0xff0000,
    healthBarHeight: 2.5,
  },

  // Weapon settings
  weapon: {
    enabled: true,
    boneName: null, // Auto-detect if null
    boneKeywords: ["right", "hand"], // For auto-detection
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: -Math.PI / 2, y: 0, z: 0 },
    scale: { x: 0.01, y: 0.01, z: 0.01 },
    useFallback: true, // Create simple sword if load fails
  },

  // Combat settings
  combat: {
    detectionRadius: 12.0,
    traversalSpeed: 9.0,
    comboWindow: 0.7,

    attacks: {
      slash1: { damage: 15, range: 2.5, color: "#ff6b6b" },
      slash2: { damage: 20, range: 2.8, color: "#ff9966" },
      attack2: { damage: 25, range: 3.0, color: "#ffcc00" },
      kick: { damage: 18, range: 2.2, color: "#ff3333" },
      charge: { damage: 35, range: 4.0, color: "#00ccff" },
    },

    effects: {
      particles: true,
      shockwave: true,
      cameraShake: true,
      swordTrail: true,
      trailColor: "#88ccff",
    },
  },

  // Animation mappings (customize for your FBX files)
  animations: {
    // Idle variations (randomly cycle for natural feel)
    idle: "sword and shield idle.fbx",
    idle2: "sword and shield idle (2).fbx",
    idle3: "sword and shield idle (3).fbx",
    idle4: "sword and shield idle (4).fbx",
    
    // Locomotion
    walk: "sword and shield walk.fbx",
    walkBack: "sword and shield walk (2).fbx",
    run: "sword and shield run.fbx",
    jump: "sword and shield jump.fbx",
    fall: "sword and shield jump (2).fbx", // Falling pose
    turnLeft: "sword and shield turn.fbx",
    turnRight: "sword and shield turn (2).fbx",

    // Combat
    slash1: "sword and shield slash.fbx",
    slash2: "sword and shield slash (2).fbx",
    slash3: "sword and shield slash (3).fbx",
    attack2: "sword and shield attack.fbx",
    kick: "sword and shield kick.fbx",

    // Defense
    block: "sword and shield block.fbx",
    blockIdle: "sword and shield block idle.fbx",
    strafeLeft: "sword and shield strafe.fbx",
    strafeRight: "sword and shield strafe (2).fbx",

    // Evasion - Using crouching animations as rolls
    turn180: "sword and shield 180 turn.fbx",
    rollLeft: "sword and shield crouching.fbx",      // Left dodge roll
    rollRight: "sword and shield crouching (2).fbx",  // Right dodge roll
    rollForward: "sword and shield crouching (3).fbx", // Forward roll
    rollBack: "sword and shield crouch.fbx",           // Back roll
    
    // Transitions
    land: "sword and shield impact.fbx",     // Landing from jump
    fallToRoll: "sword and shield crouch.fbx", // Blend from fall to roll
    
    // Hit reactions (physics-based collision responses)
    hitLight: "sword and shield impact.fbx",      // Light impact (<2 m/s)
    hitMedium: "impact (2).fbx",                  // Medium impact (2-5 m/s)
    hitHeavy: "impact (3).fbx",                   // Heavy impact (5-8 m/s)
    // Ragdoll at >8 m/s uses physics bones
    
    impact: "sword and shield impact.fbx",
    death: "sword and shield death.fbx",
  },

  // Enemy settings
  enemies: {
    count: 5,
    maxHealth: 100,
    spawnRadius: 10,
    spawnHeight: 0.5,
    size: { width: 0.6, height: 2, depth: 0.6 },
    color: 0xff0000,
  },

  // Scene settings
  scene: {
    backgroundColor: 0x87ceeb,
    fog: { enabled: true, color: 0x87ceeb, near: 10, far: 100 },

    ground: {
      size: 100,
      color: 0x228b22,
      receiveShadow: true,
    },

    lighting: {
      ambient: { color: 0x404040, intensity: 0.5 },
      directional: {
        color: 0xffffff,
        intensity: 1.0,
        position: { x: 50, y: 100, z: 50 },
        castShadow: true,
      },
      hemisphere: {
        enabled: true,
        skyColor: 0x87ceeb,
        groundColor: 0x8b7355,
        intensity: 0.3,
      },
    },
  },

  // Post-processing effects
  postProcessing: {
    enabled: true,
    bloom: {
      enabled: true,
      strength: 0.3,
      radius: 0.4,
      threshold: 0.85,
    },
    // Additional free effects (Three.js built-in)
    fxaa: {
      enabled: false, // Fast Approximate Anti-Aliasing
    },
    ssao: {
      enabled: false, // Screen Space Ambient Occlusion
      kernelRadius: 8,
      minDistance: 0.005,
      maxDistance: 0.1,
    },
    outline: {
      enabled: false, // Outline effect for locked targets
      edgeStrength: 3.0,
      edgeGlow: 0.0,
      edgeThickness: 1.0,
      pulsePeriod: 0,
      visibleEdgeColor: "#ffffff",
      hiddenEdgeColor: "#190a05",
    },
  },

  // Controls customization
  controls: {
    keyboard: {
      forward: ["KeyW", "ArrowUp"],
      back: ["KeyS", "ArrowDown"],
      turnLeft: ["KeyA", "ArrowLeft"],
      turnRight: ["KeyD", "ArrowRight"],
      jump: ["Space"],
      roll: ["ShiftLeft", "ShiftRight"],
      interact: ["KeyE", "KeyF"],
      targetLock: ["KeyZ"],
      targetCycle: ["KeyX"],
    },
    mouse: {
      attack: 0, // Left button
      block: 2, // Right button
    },
    gamepad: {
      enabled: true,
      deadzone: 0.15,
    },
  },

  // Performance settings
  performance: {
    maxParticles: 100,
    particleLifetime: 1.0,
    shadowMapSize: 2048,
    antialias: true,
    maxFPS: 60,
    adaptiveQuality: true, // Automatically reduce quality if FPS drops
    minFPS: 30, // Minimum acceptable FPS before quality reduction
    frustumCulling: true, // Enable frustum culling (best practice)
    objectCulling: true, // Cull objects outside camera view
  },

  // Debug settings
  debug: {
    showFPS: true,
    showControls: true,
    showBones: false,
    logAnimations: true,
    logTargetLock: true,
  },
};

/**
 * Helper function to deep merge configs
 * Allows you to override specific settings without replacing entire objects
 */
export function mergeConfig(baseConfig, overrides) {
  const merged = { ...baseConfig };

  for (const key in overrides) {
    if (
      overrides[key] &&
      typeof overrides[key] === "object" &&
      !Array.isArray(overrides[key])
    ) {
      merged[key] = mergeConfig(baseConfig[key] || {}, overrides[key]);
    } else {
      merged[key] = overrides[key];
    }
  }

  return merged;
}

/**
 * Example: Create a custom config for a different project
 */
export function createCustomConfig(overrides) {
  return mergeConfig(GAME_CONFIG, overrides);
}

/**
 * Preset configurations for common game types
 */
export const PRESETS = {
  // Slow-paced adventure game
  adventure: {
    character: {
      maxSpeed: 6,
      walkSpeed: 2.5,
    },
    camera: {
      distance: 7,
      smoothing: 0.15,
    },
    combat: {
      detectionRadius: 8.0,
      traversalSpeed: 5.0,
    },
  },

  // Fast-paced action game
  action: {
    character: {
      maxSpeed: 12,
      walkSpeed: 5,
      rollSpeed: 15,
    },
    camera: {
      distance: 4,
      smoothing: 0.05,
    },
    combat: {
      detectionRadius: 15.0,
      traversalSpeed: 12.0,
      comboWindow: 0.5,
    },
  },

  // Stealth game
  stealth: {
    character: {
      maxSpeed: 5,
      walkSpeed: 2,
    },
    camera: {
      distance: 6,
      height: 1.5,
    },
    targetLock: {
      range: 20,
      angle: Math.PI / 4,
    },
  },
};

/**
 * Validate configuration
 * Checks for common mistakes and missing required fields
 */
export function validateConfig(config) {
  const errors = [];
  const warnings = [];

  // Check required paths
  if (!config.paths?.characterModel) {
    errors.push("Missing character model path");
  }

  if (config.weapon?.enabled && !config.paths?.weapon) {
    warnings.push("Weapon enabled but no weapon path specified");
  }

  // Check numeric ranges
  if (config.character?.maxSpeed <= 0) {
    errors.push("Character maxSpeed must be positive");
  }

  if (config.camera?.distance <= 0) {
    errors.push("Camera distance must be positive");
  }

  // Check target lock
  if (config.targetLock?.enabled && config.targetLock?.range <= 0) {
    errors.push("Target lock range must be positive");
  }

  // Return validation result
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
