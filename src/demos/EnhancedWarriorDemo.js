/**
 * Enhanced Warrior Combat Demo - Modular and Reusable
 * Features: Target Lock System, Weapon System, RacalvinController
 */

import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { RacalvinController, DEFAULT_CONFIG } from "../systems/RacalvinController.js";
import { GAME_CONFIG, validateConfig } from "../config/GameConfig.js";

class WarriorCombatDemo {
  constructor(customConfig = {}) {
    // Merge custom config with defaults
    this.config = { ...GAME_CONFIG, ...customConfig };

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
    this.setupController();
    this.setupControls();
    this.setupUI();

    this.animate();
    console.log("✓ Demo ready! Press Z to lock target, X to cycle targets");
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
  }


  setupController() {
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
    
    // Initialize all integrated production systems
    this.controller.initializeSystems(this.scene, this.camera, this.warrior);
    
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
      Shift - Run / Roll<br>
      Space - Jump<br>
      <br>
      <strong>Combat:</strong><br>
      Left Click - Attack<br>
      Right Click - Block<br>
      Z - Lock Target<br>
      X - Cycle Targets<br>
      <br>
      <strong>Dodge Rolls:</strong><br>
      Double-tap A - Roll Left<br>
      Double-tap D - Roll Right<br>
      Shift + W - Roll Forward<br>
      <br>
      <strong>Camera:</strong><br>
      Mouse - Look Around<br>
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

  playAnimation(name, crossfadeDuration = 0.2) {
    const anim = this.animations.get(name);
    if (!anim || anim === this.currentAnimation) return;

    if (this.currentAnimation) {
      anim.reset();
      anim.crossFadeFrom(this.currentAnimation, crossfadeDuration, true);
    }

    anim.play();
    this.currentAnimation = anim;

    // Adjust animation speed based on movement for walk/run animations
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

        // Make character face locked target
        const lockedTarget = this.controller.getLockedTarget();
        if (lockedTarget && lockedTarget.position) {
          const targetPos = lockedTarget.position.clone();
          targetPos.y = this.warrior.position.y; // Keep same height
          this.warrior.lookAt(targetPos);
        }

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
          const health = `${lockedTarget.currentHealth}/${lockedTarget.maxHealth}`;
          console.log(`🎯 Target locked: Health ${health}`);
        }

        // Update target health in UI
        if (this.enemies) {
          this.enemies.forEach((enemy) => {
            this.targetLockSystem.setTargetHealth(
              enemy,
              enemy.currentHealth || enemy.userData.health,
              enemy.maxHealth || enemy.userData.maxHealth,
            );
          });
        }
      }
    }

    // Update animation mixer with proper time scale
    if (this.warriorMixer) {
      this.warriorMixer.update(delta);
    }

    // Update target lock indicators
    if (this.targetLockSystem) {
      this.targetLockSystem.update();
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
      Idle: "idle",
      Walk: "walk",
      Run: "run",
      Jump: "jump",
      Attack: "slash1",
      Attack2: "slash2",
      Attack3: "attack2",
      Block: "block",
      BlockIdle: "blockIdle",
      StrafeLeft: "strafeLeft",
      StrafeRight: "strafeRight",
      Turn180: "turn180",
      Roll: "rollForward",
      RollLeft: "rollLeft",
      RollRight: "rollRight",
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
export default WarriorCombatDemo;

// Auto-start the demo
const demo = new WarriorCombatDemo();

// Expose for debugging
window.demo = demo;
