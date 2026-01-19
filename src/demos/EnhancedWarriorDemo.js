/**
 * Enhanced Warrior Combat Demo - Modular and Reusable
 * Features: Target Lock System, Weapon System, RacalvinController
 */

import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import {
  RacalvinController,
  DEFAULT_CONFIG,
} from "../systems/RacalvinController.js";
import { GAME_CONFIG, validateConfig } from "../config/GameConfig.js";
import { AnimationDebugUI } from "../ui/AnimationDebugUI.js";
import { TargetLockSystem } from "../systems/TargetLockSystem.js";

export class EnhancedWarriorDemo {
  constructor(config = {}) {
    // Merge configs
    this.config = { ...DEFAULT_CONFIG, ...GAME_CONFIG, ...config };
    
    // Validate configuration
    const validation = validateConfig(this.config);
    if (!validation.valid) {
      console.error("Configuration errors:", validation.errors);
      validation.warnings.forEach((w) => console.warn(w));
    }

    // Core systems
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;

    // Character
    this.warrior = null;
    this.warriorMixer = null;
    this.animations = new Map();
    this.currentAnimation = null;

    // Controller with integrated systems
    this.controller = null;
    
    // Target lock system
    this.targetLockSystem = null;

    // Enemies
    this.enemies = [];

    // Utilities
    this.clock = new THREE.Clock();
    this.fps = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = 0;

    // Animation state
    this.lastAnimationSpeed = 1.0;
    this.animationFrameId = null;

    // Animation debug UI
    this.animDebugUI = null;

    this.init();
  }

  async init() {
    console.log(
      `🎮 Initializing ${this.config.projectName} v${this.config.version}`,
    );

    this.setupScene();
    this.setupLights();
    this.setupCamera();
    this.setupRenderer();
    this.setupPostProcessing();

    await this.loadWarrior();
    
    this.createEnemies();
    this.setupEnvironment();
    this.setupTargetLock();
    await this.setupController();
    this.setupControls();
    this.setupUI();
    
    // Add obstacles to physics after controller is initialized
    if (this.controller.physicsSystem && this.obstacles) {
      this.obstacles.forEach(obstacle => {
        this.controller.physicsSystem.addStaticCollider(obstacle, {
          friction: 0.8,
          restitution: 0.1
        });
      });
      console.log('✓ Obstacles added to physics system');
    }

    this.animate();
    
    // Create animation debug UI
    this.animDebugUI = new AnimationDebugUI(this);
    
    console.log("✓ Demo ready! Press Tab to lock target, X to cycle targets");
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.config.scene.backgroundColor);

    if (this.config.scene.fog.enabled) {
      this.scene.fog = new THREE.Fog(
        this.config.scene.fog.color,
        this.config.scene.fog.near,
        this.config.scene.fog.far,
      );
    }
  }

  setupLights() {
    const lighting = this.config.scene.lighting;

    // Ambient light
    const ambient = new THREE.AmbientLight(
      lighting.ambient.color,
      lighting.ambient.intensity,
    );
    this.scene.add(ambient);

    // Directional light
    const directional = new THREE.DirectionalLight(
      lighting.directional.color,
      lighting.directional.intensity,
    );
    directional.position.set(
      lighting.directional.position.x,
      lighting.directional.position.y,
      lighting.directional.position.z,
    );

    if (lighting.directional.castShadow) {
      directional.castShadow = true;
      directional.shadow.mapSize.width = this.config.performance.shadowMapSize;
      directional.shadow.mapSize.height = this.config.performance.shadowMapSize;
      directional.shadow.camera.left = -50;
      directional.shadow.camera.right = 50;
      directional.shadow.camera.top = 50;
      directional.shadow.camera.bottom = -50;
    }

    this.scene.add(directional);

    // Hemisphere light
    if (lighting.hemisphere.enabled) {
      const hemisphere = new THREE.HemisphereLight(
        lighting.hemisphere.skyColor,
        lighting.hemisphere.groundColor,
        lighting.hemisphere.intensity,
      );
      this.scene.add(hemisphere);
    }
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 6, 12);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.config.performance.antialias,
      powerPreference: "high-performance",
      stencil: false, // Performance optimization
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Best practices for color management
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    document.body.appendChild(this.renderer.domElement);

    window.addEventListener("resize", () => this.onWindowResize(), false);
  }

  setupPostProcessing() {
    if (!this.config.postProcessing.enabled) return;

    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    if (this.config.postProcessing.bloom.enabled) {
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        this.config.postProcessing.bloom.strength,
        this.config.postProcessing.bloom.radius,
        this.config.postProcessing.bloom.threshold,
      );
      this.composer.addPass(bloomPass);
    }
  }

  async loadWarrior() {
    const loader = new FBXLoader();
    const modelPath = this.config.paths.characterModel;

    console.log("📦 Loading warrior model:", modelPath);

    try {
      this.warrior = await new Promise((resolve, reject) => {
        loader.load(
          modelPath,
          (fbx) => resolve(fbx),
          (progress) => {
            const percent = ((progress.loaded / progress.total) * 100).toFixed(
              0,
            );
            console.log(`  Loading: ${percent}%`);
          },
          (error) => reject(error),
        );
      });

      this.warrior.scale.set(0.01, 0.01, 0.01);
      this.warrior.position.set(0, 0, 0);

      // Enable shadows
      this.warrior.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.scene.add(this.warrior);

      // Setup animation mixer
      this.warriorMixer = new THREE.AnimationMixer(this.warrior);

      // Load animations
      await this.loadAnimations();

      console.log(`✓ Warrior loaded with ${this.animations.size} animations`);
    } catch (error) {
      console.error("✗ Failed to load warrior:", error);
      this.createFallbackWarrior();
    }
  }

  async loadAnimations() {
    const loader = new FBXLoader();
    const animPath = this.config.paths.animations;
    const animConfigs = this.config.animations;

    let loadedCount = 0;

    for (const [name, filename] of Object.entries(animConfigs)) {
      const fullPath = animPath + filename;

      try {
        const animFBX = await new Promise((resolve, reject) => {
          loader.load(
            fullPath,
            (fbx) => resolve(fbx),
            undefined,
            (error) => resolve(null), // Don't reject, just resolve null
          );
        });

        if (animFBX && animFBX.animations.length > 0) {
          const action = this.warriorMixer.clipAction(animFBX.animations[0]);
          action.setLoop(THREE.LoopRepeat);
          action.clampWhenFinished = true;

          this.animations.set(name, action);
          loadedCount++;

          if (this.config.debug.logAnimations) {
            console.log(`  ✓ ${name}: ${filename}`);
          }

          // Play idle by default
          if (name === "idle") {
            action.play();
            this.currentAnimation = action;
          }
        }
      } catch (error) {
        if (this.config.debug.logAnimations) {
          console.warn(`  ⚠ Could not load ${name}`);
        }
      }
    }

    console.log(`✓ Loaded ${loadedCount} animations`);
  }


  createFallbackWarrior() {
    const geometry = new THREE.CapsuleGeometry(0.5, 2, 8, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0x4a90e2 });
    this.warrior = new THREE.Mesh(geometry, material);
    this.warrior.position.set(0, 1, 0);
    this.warrior.castShadow = true;
    this.scene.add(this.warrior);

    this.warriorMixer = new THREE.AnimationMixer(this.warrior);
    console.log("⚠ Created fallback warrior (capsule)");
  }

  createEnemies() {
    const enemyConfig = this.config.enemies;
    const count = enemyConfig.count;

    console.log(`🎯 Creating ${count} enemies`);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = enemyConfig.spawnRadius;

      const geometry = new THREE.BoxGeometry(
        enemyConfig.size.width,
        enemyConfig.size.height,
        enemyConfig.size.depth,
      );
      const material = new THREE.MeshStandardMaterial({
        color: enemyConfig.color,
        emissive: 0x440000,
        emissiveIntensity: 0.3,
      });

      const enemy = new THREE.Mesh(geometry, material);
      enemy.position.set(
        Math.cos(angle) * radius,
        enemyConfig.spawnHeight,
        Math.sin(angle) * radius,
      );
      enemy.castShadow = true;
      enemy.receiveShadow = true;

      // Add collision boundary (for visualization and physics)
      enemy.userData.collisionRadius = enemyConfig.size.width * 0.8;
      enemy.userData.isCollidable = true;

      this.scene.add(enemy);
      
      // Add health data for combat
      enemy.userData.health = enemyConfig.maxHealth;
      enemy.userData.maxHealth = enemyConfig.maxHealth;
      enemy.userData.isDead = false;
      
      this.enemies.push(enemy);
    }

    console.log(`✓ ${count} enemies created`);
  }

  setupEnvironment() {
    const groundConfig = this.config.scene.ground;

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(
      groundConfig.size,
      groundConfig.size,
    );
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: groundConfig.color,
      roughness: 0.8,
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = groundConfig.receiveShadow;
    this.scene.add(ground);

    // Grid helper
    const gridHelper = new THREE.GridHelper(
      groundConfig.size,
      50,
      0x444444,
      0x222222,
    );
    this.scene.add(gridHelper);
    
    // Add test obstacles for collision physics
    this.createTestObstacles();
  }
  
  createTestObstacles() {
    console.log('🚧 Creating test obstacles for physics...');
    
    // Create some walls/pillars to test collision
    const obstacles = [
      // Pillar 1
      { pos: [5, 1, 0], size: [1, 2, 1], color: 0x555555 },
      // Pillar 2
      { pos: [-5, 1, 0], size: [1, 2, 1], color: 0x555555 },
      // Wall
      { pos: [0, 1, -8], size: [8, 2, 0.5], color: 0x666666 },
      // Box obstacle
      { pos: [3, 0.5, 5], size: [1, 1, 1], color: 0x8B4513 },
    ];
    
    this.obstacles = [];
    
    obstacles.forEach(({ pos, size, color }) => {
      const geometry = new THREE.BoxGeometry(...size);
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.7,
        metalness: 0.3
      });
      
      const obstacle = new THREE.Mesh(geometry, material);
      obstacle.position.set(...pos);
      obstacle.castShadow = true;
      obstacle.receiveShadow = true;
      
      this.scene.add(obstacle);
      this.obstacles.push(obstacle);
    });
    
    console.log(`✓ Created ${this.obstacles.length} test obstacles`);
  }


  setupTargetLock() {
    // Create target lock system
    this.targetLockSystem = new TargetLockSystem(this.scene, this.camera, {
      optimalDistance: 2.5,
      minDistance: 1.5,
      maxDistance: 4.0,
      softColliderRadius: 2.0
    });
    
    console.log("🎯 Target lock system initialized");
  }
  
  async setupController() {
    // Create controller with config
    this.controller = new RacalvinController({
      ...this.config.character,
      ...this.config.camera,
      ...this.config.targetLock,
    });

    // Set initial position
    this.controller.setPosition(0, 0, 0);

    // Setup input listeners
    this.controller.setupInputListeners(this.renderer.domElement);
    
    // Initialize all integrated production systems (async for physics)
    await this.controller.initializeSystems(this.scene, this.camera, this.warrior);
    
    // Register enemies for combat
    this.enemies.forEach(enemy => {
      this.controller.registerEnemy({
        mesh: enemy,
        position: enemy.position,
        currentHealth: enemy.userData.health,
        maxHealth: enemy.userData.maxHealth,
        isDead: enemy.userData.isDead
      });
    });
    
    // Add enemies to physics system
    if (this.controller.physicsSystem) {
      this.enemies.forEach(enemy => {
        this.controller.physicsSystem.addStaticCollider(enemy, {
          friction: 0.7,
          restitution: 0.2
        });
      });
    }

    console.log("🎮 Controller initialized with all production systems");
  }

  setupControls() {
    // Already handled by controller.setupInputListeners
    // This method kept for compatibility
  }

  setupUI() {
    if (!this.config.debug.showControls) return;

    const controlsDiv = document.createElement("div");
    controlsDiv.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      color: white;
      font-family: monospace;
      font-size: 14px;
      background: rgba(0,0,0,0.7);
      padding: 15px;
      border-radius: 8px;
      line-height: 1.6;
    `;

    controlsDiv.innerHTML = `
      <strong>${this.config.projectName}</strong><br>
      <br>
      <strong>Movement:</strong><br>
      W/S - Forward/Back<br>
      A/D - Turn Left/Right<br>
      Q/E - Strafe Left/Right<br>
      Shift - Run / Roll<br>
      Space - Jump<br>
      <br>
      <strong>Combat:</strong><br>
      Left Click - Attack<br>
      Right Click (Hold) - Block<br>
      Tab - Lock Target<br>
      X - Cycle Targets<br>
      F - Interact<br>
      <br>
      <strong>Dodge Rolls:</strong><br>
      Double-tap A - Roll Left<br>
      Double-tap D - Roll Right<br>
      Shift + W - Roll Forward<br>
      <br>
      <strong>Camera:</strong><br>
      Mouse (Hold RMB) - Free Look<br>
      I/K - Pitch Up/Down<br>
      J/L - Turn Left/Right<br>
    `;

    document.body.appendChild(controlsDiv);

    // FPS counter
    if (this.config.debug.showFPS) {
      this.fpsDiv = document.createElement("div");
      this.fpsDiv.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        color: #00ff00;
        font-family: monospace;
        font-size: 16px;
        background: rgba(0,0,0,0.7);
        padding: 10px;
        border-radius: 5px;
      `;
      document.body.appendChild(this.fpsDiv);
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    if (this.composer) {
      this.composer.setSize(window.innerWidth, window.innerHeight);
      // Update all passes with new size
      this.composer.passes.forEach((pass) => {
        if (pass.setSize) {
          pass.setSize(window.innerWidth, window.innerHeight);
        }
      });
    }
  }

  playAnimation(name, crossfadeDuration = null) {
    const anim = this.animations.get(name);
    if (!anim) return;
    
    // Don't interrupt same animation
    if (anim === this.currentAnimation) {
      // Still update animation speed for locomotion
      if (name === "walk" || name === "run") {
        const char = this.controller?.character;
        if (char) {
          const speedRatio =
            Math.abs(char.forwardVel) /
            (name === "run"
              ? this.config.character.maxSpeed
              : this.config.character.walkSpeed);
          anim.timeScale = Math.max(0.5, Math.min(speedRatio * 1.2, 2.0));
        }
      }
      return;
    }

    // Dynamic crossfade duration based on animation type
    if (crossfadeDuration === null) {
      // Locomotion blends quickly, combat actions slower
      if (["idle", "walk", "run", "strafeLeft", "strafeRight"].includes(name)) {
        crossfadeDuration = 0.2; // Fast blend for locomotion
      } else if (["slash1", "slash2", "attack2", "kick", "block"].includes(name)) {
        crossfadeDuration = 0.1; // Quick snap for attacks
      } else {
        crossfadeDuration = 0.3; // Default
      }
    }

    // Crossfade from previous animation
    if (this.currentAnimation) {
      anim.reset();
      anim.crossFadeFrom(this.currentAnimation, crossfadeDuration, true);
    }

    // Configure animation playback based on type
    // Block animations should play once and hold, others loop
    if (name === "block" || name === "blockIdle") {
      anim.setLoop(THREE.LoopOnce);
      anim.clampWhenFinished = true; // Hold at last frame
    } else if (["slash1", "slash2", "attack2", "kick"].includes(name)) {
      anim.setLoop(THREE.LoopOnce);
      anim.clampWhenFinished = true; // Hold at end of attack
    } else {
      anim.setLoop(THREE.LoopRepeat); // Loop locomotion
      anim.clampWhenFinished = false;
    }
    anim.play();
    this.currentAnimation = anim;

    // Adjust animation speed based on movement for locomotion
    if (name === "walk" || name === "run") {
      const char = this.controller?.character;
      if (char) {
        const speedRatio =
          Math.abs(char.forwardVel) /
          (name === "run"
            ? this.config.character.maxSpeed
            : this.config.character.walkSpeed);
        anim.timeScale = Math.max(0.5, Math.min(speedRatio * 1.2, 2.0));
      }
    } else {
      anim.timeScale = 1.0;
    }
  }

  updateFPS() {
    this.frameCount++;
    const now = performance.now();

    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;

      if (this.fpsDiv) {
        this.fpsDiv.textContent = `FPS: ${this.fps}`;
      }
    }
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    // Update controller
    if (this.controller) {
      this.controller.update(delta, 0, undefined, this.enemies);

      // Apply controller to warrior
      if (this.warrior) {
        this.controller.applyToCharacter(this.warrior);

        // Make character face locked target (controller handles this internally)
        // Don't override rotation here - it breaks movement animation sync

        // Play appropriate animation
        const animName = this.controller.getAnimationName();
        const mappedAnim = this.getMappedAnimation(animName);
        if (mappedAnim) {
          this.playAnimation(mappedAnim);
        }
      }

      // Update camera
      this.controller.applyToCamera(this.camera);

      // Update target lock system
      if (this.targetLockSystem) {
        const lockedTarget = this.controller.getLockedTarget();
        this.targetLockSystem.setActiveTarget(lockedTarget);

        if (lockedTarget && this.config.debug.logTargetLock) {
          const currentHP = lockedTarget.currentHealth ?? lockedTarget.userData?.health ?? 100;
          const maxHP = lockedTarget.maxHealth ?? lockedTarget.userData?.maxHealth ?? 100;
          console.log(`🎯 Target locked: Health ${currentHP}/${maxHP}`);
        }

        // Update target health in UI
        if (this.enemies) {
          this.enemies.forEach((enemy) => {
            // Health is stored in userData
            const currentHealth = enemy.userData?.health ?? 100;
            const maxHealth = enemy.userData?.maxHealth ?? 100;
            this.targetLockSystem.setTargetHealth(
              enemy,
              currentHealth,
              maxHealth,
            );
          });
        }
      }
    }

    // Update animation mixer with proper time scale
    if (this.warriorMixer) {
      this.warriorMixer.update(delta);
    }

      // Update target lock indicators with player position
      if (this.targetLockSystem) {
        const playerPos = this.controller.getPosition();
        this.targetLockSystem.update(delta, playerPos);
        
        // Apply soft collider if target is locked
        const lockedTarget = this.controller.getLockedTarget();
        if (lockedTarget && lockedTarget.position) {
          const pushForce = this.targetLockSystem.calculateSoftCollider(
            playerPos,
            lockedTarget.position
          );
          
          // Apply gentle push/pull to maintain optimal distance
          if (pushForce.lengthSq() > 0.001) {
            this.controller.character.position.x += pushForce.x * delta;
            this.controller.character.position.z += pushForce.z * delta;
          }
        }
      }

    // Update combat system
    if (this.combatSystem) {
      this.combatSystem.update(delta, this.enemies);
    }

    // Update FPS
    this.updateFPS();

    // Render
    if (this.composer && this.config.postProcessing.enabled) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  getMappedAnimation(controllerState) {
    // Map controller state to loaded animations
    const stateMap = {
      idle: "idle",
      idle2: "idle2",
      idle3: "idle3",
      idle4: "idle4",
      Idle: "idle",
      walk: "walk",
      Walk: "walk",
      walk_back: "walkBack",
      run: "run",
      Run: "run",
      jump: "jump",
      Jump: "jump",
      double_jump: "jump",
      triple_jump: "jump",
      fall: "fall", // Falling animation
      land: "land", // Landing animation
      Land: "land",
      attack1: "slash1", // LMB Combo: Slash 1
      Attack: "slash1",
      attack2: "slash2", // LMB Combo: Slash 2
      Attack2: "slash2",
      attack3: "attack2", // LMB Combo: Finisher
      Attack3: "attack2",
      jump_attack: "attack2", // Special: Jump AOE (second half of attack2 anim)
      kick: "kick",
      block: "block",
      Block: "block",
      block_hit: "block",
      BlockIdle: "blockIdle",
      strafe_left: "strafeLeft",
      StrafeLeft: "strafeLeft",
      strafe_right: "strafeRight",
      StrafeRight: "strafeRight",
      turn_left: "turnLeft",
      turn_right: "turnRight",
      turn_180: "turn180",
      Turn180: "turn180",
      roll_forward: "rollForward",
      Roll: "rollForward",
      roll_left: "rollLeft",
      RollLeft: "rollLeft",
      roll_right: "rollRight",
      RollRight: "rollRight",
      roll_back: "rollForward",
      death: "death",
      Death: "death",
    };

    return stateMap[controllerState] || "idle";
  }

  dispose() {
    // Stop animation loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Clean up systems
    if (this.targetLockSystem) {
      this.targetLockSystem.clear();
    }

    if (this.weaponSystem) {
      this.weaponSystem.dispose();
    }

    if (this.combatSystem) {
      // Dispose combat system effects
      if (this.combatSystem.effects) {
        this.combatSystem.effects.forEach((effect) => {
          if (effect.mesh) {
            if (effect.mesh.geometry) effect.mesh.geometry.dispose();
            if (effect.mesh.material) effect.mesh.material.dispose();
            this.scene.remove(effect.mesh);
          }
        });
      }
      if (this.combatSystem.trails) {
        this.combatSystem.trails.forEach((trail) => {
          if (trail.mesh) {
            if (trail.mesh.geometry) trail.mesh.geometry.dispose();
            if (trail.mesh.material) trail.mesh.material.dispose();
            this.scene.remove(trail.mesh);
          }
        });
      }
    }

    // Dispose animation mixer
    if (this.warriorMixer) {
      this.warriorMixer.stopAllAction();
      this.warriorMixer.uncacheRoot(this.warrior);
    }

    // Dispose scene objects
    this.scene.traverse((obj) => {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((mat) => {
            if (mat.map) mat.map.dispose();
            if (mat.normalMap) mat.normalMap.dispose();
            if (mat.roughnessMap) mat.roughnessMap.dispose();
            if (mat.metalnessMap) mat.metalnessMap.dispose();
            mat.dispose();
          });
        } else {
          if (obj.material.map) obj.material.map.dispose();
          if (obj.material.normalMap) obj.material.normalMap.dispose();
          if (obj.material.roughnessMap) obj.material.roughnessMap.dispose();
          if (obj.material.metalnessMap) obj.material.metalnessMap.dispose();
          obj.material.dispose();
        }
      }
    });

    // Dispose post-processing
    if (this.composer) {
      this.composer.passes.forEach((pass) => {
        if (pass.dispose) pass.dispose();
      });
      this.composer.renderTarget1.dispose();
      this.composer.renderTarget2.dispose();
    }

    // Dispose renderer
    this.renderer.dispose();
    this.renderer.forceContextLoss();

    // Remove DOM elements
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    console.log("✓ Demo disposed - all resources cleaned up");
  }
}

// Export the class
export default EnhancedWarriorDemo;

// Auto-start the demo
const demo = new EnhancedWarriorDemo();

// Expose for debugging
window.demo = demo;
