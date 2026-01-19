/**
 * Simple Test Version - Works without FBX files
 * Uses basic Three.js geometries to test the combat system
 */

import * as THREE from "three";
import { CombatSystem } from "./CombatSystem.js";

class SimpleCombatTest {
  constructor() {
    this.init();
  }

  init() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 8, 15);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(10, 20, 10);
    directional.castShadow = true;
    this.scene.add(directional);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(50, 50);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a3e,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Create player (capsule)
    this.player = this.createCharacter(0x4a90e2);
    this.player.position.set(0, 0, 0);
    this.scene.add(this.player);

    // Create enemies
    this.enemies = [];
    const enemyPositions = [
      [5, 0, 0],
      [-5, 0, 0],
      [0, 0, 7],
      [3, 0, 4],
      [-3, 0, 4],
    ];

    enemyPositions.forEach((pos) => {
      const enemy = this.createCharacter(0xe74c3c);
      enemy.position.set(...pos);
      this.scene.add(enemy);
      this.enemies.push(enemy);
    });

    // Combat system
    this.combatSystem = new CombatSystem(this.player, this.camera, this.scene, {
      detectionRadius: 10.0,
      traversalSpeed: 8.0,
      cameraShakeIntensity: 0.3,
    });

    // Register enemies
    this.enemies.forEach((enemy) => {
      this.combatSystem.registerEnemy(enemy, 100);
    });

    // Setup controls
    this.keys = {};
    this.input = { x: 0, y: 0 };
    this.setupControls();

    // UI
    this.setupUI();

    // Clock
    this.clock = new THREE.Clock();

    // Start
    this.animate();

    console.log("Simple combat test ready!");
    console.log(
      "Controls: WASD to move, SPACE to attack, 1-5 for specific attacks",
    );
  }

  createCharacter(color) {
    const group = new THREE.Group();

    // Body (capsule approximation)
    const bodyGeo = new THREE.CapsuleGeometry(0.5, 1.5, 8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.3,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.3);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = 2.3;
    head.castShadow = true;
    group.add(head);

    // Direction indicator
    const arrowGeo = new THREE.ConeGeometry(0.2, 0.5, 8);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    arrow.rotation.x = Math.PI / 2;
    arrow.position.set(0, 1, -0.8);
    group.add(arrow);

    return group;
  }

  setupControls() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;

      // Attack controls
      if (e.code === "Space") {
        this.combatSystem.attack("slash1");
      } else if (e.code === "Digit1") {
        this.combatSystem.attack("slash1");
      } else if (e.code === "Digit2") {
        this.combatSystem.attack("slash2");
      } else if (e.code === "Digit3") {
        this.combatSystem.attack("attack2");
      } else if (e.code === "Digit4") {
        this.combatSystem.attack("kick");
      } else if (e.code === "Digit5") {
        this.combatSystem.attack("charge");
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  setupUI() {
    const style = document.createElement("style");
    style.textContent = `
            body { margin: 0; overflow: hidden; font-family: Arial; }
            #hud { 
                position: fixed; 
                top: 0; 
                left: 0; 
                width: 100%; 
                height: 100%; 
                pointer-events: none; 
            }
            #combo {
                position: absolute;
                top: 20px;
                right: 20px;
                font-size: 48px;
                font-weight: bold;
                color: #ffcc00;
                text-shadow: 3px 3px 0 #000;
                display: none;
            }
            #info {
                position: absolute;
                bottom: 20px;
                left: 20px;
                color: #fff;
                font-size: 14px;
                background: rgba(0,0,0,0.7);
                padding: 15px;
                border-radius: 5px;
            }
            #fps {
                position: absolute;
                top: 10px;
                left: 10px;
                color: #0f0;
                font-family: monospace;
                background: rgba(0,0,0,0.5);
                padding: 5px 10px;
                border-radius: 5px;
            }
        `;
    document.head.appendChild(style);

    const hud = document.createElement("div");
    hud.id = "hud";
    hud.innerHTML = `
            <div id="combo"></div>
            <div id="fps">FPS: 60</div>
            <div id="info">
                <strong>SIMPLE COMBAT TEST</strong><br>
                WASD - Move<br>
                SPACE - Attack (auto-combo)<br>
                1-5 - Specific attacks<br>
                <br>
                <span style="color: #4a90e2;">■</span> You (Blue)<br>
                <span style="color: #e74c3c;">■</span> Enemies (Red)
            </div>
        `;
    document.body.appendChild(hud);

    // FPS counter
    let lastTime = performance.now();
    let frames = 0;
    setInterval(() => {
      const now = performance.now();
      const fps = Math.round((frames * 1000) / (now - lastTime));
      document.getElementById("fps").textContent = `FPS: ${fps}`;
      frames = 0;
      lastTime = now;
    }, 1000);

    this.fpsFrames = () => frames++;
  }

  updateInput() {
    this.input.x = 0;
    this.input.y = 0;

    if (this.keys["KeyW"]) this.input.y += 1;
    if (this.keys["KeyS"]) this.input.y -= 1;
    if (this.keys["KeyA"]) this.input.x -= 1;
    if (this.keys["KeyD"]) this.input.x += 1;

    this.combatSystem.setInput(this.input.x, this.input.y);
  }

  updateCamera() {
    const offset = new THREE.Vector3(0, 8, 15);
    const targetPos = this.player.position.clone().add(offset);
    this.camera.position.lerp(targetPos, 0.1);
    this.camera.lookAt(
      this.player.position.clone().add(new THREE.Vector3(0, 1, 0)),
    );
  }

  updateUI() {
    const uiData = this.combatSystem.getUIData();
    const comboEl = document.getElementById("combo");

    if (uiData.combo > 0) {
      comboEl.style.display = "block";
      comboEl.textContent = `${uiData.combo} HIT COMBO!`;
    } else {
      comboEl.style.display = "none";
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();

    this.updateInput();
    this.combatSystem.update(deltaTime);
    this.updateCamera();
    this.updateUI();

    this.renderer.render(this.scene, this.camera);
    this.fpsFrames();
  }
}

// Start when ready
window.addEventListener("DOMContentLoaded", () => {
  new SimpleCombatTest();
});

export default SimpleCombatTest;
