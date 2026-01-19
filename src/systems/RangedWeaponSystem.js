import * as THREE from 'three';

/**
 * RangedWeaponSystem - Handles ranged weapon aiming, shooting, and auto-aim
 * 
 * Features:
 * - RMB to aim (ADS - Aim Down Sights)
 * - Auto-aim to chest when target locked
 * - Crosshair UI
 * - Camera adjustments while aiming
 * - Projectile/raycast shooting
 */
export class RangedWeaponSystem {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    
    // Aiming state
    this.isAiming = false;
    this.aimTransition = 0;  // 0-1, smooth transition
    this.aimSpeed = 8;  // Speed of aim transition
    
    // Weapon stats
    this.currentWeapon = {
      type: 'bow',  // bow, crossbow, gun, magic
      damage: 15,
      range: 50,
      accuracy: 0.95,  // 0-1, affects spread
      fireRate: 1.0,   // Shots per second
      reloadTime: 2.0,
      ammo: 10,
      maxAmmo: 10,
      projectileSpeed: 30  // units/second
    };
    
    // Shooting cooldown
    this.shootCooldown = 0;
    this.reloadTimer = 0;
    this.isReloading = false;
    
    // Auto-aim settings
    this.autoAimEnabled = true;
    this.autoAimStrength = 0.8;  // 0-1, how much to pull toward target
    this.autoAimRadius = 2.0;    // World units, sticky aim radius
    
    // Camera settings for aiming
    this.aimCameraOffset = {
      distance: -2.0,    // Zoom in when aiming
      height: 0.5,       // Raise camera slightly
      fov: -10          // Reduce FOV for "zoom" effect
    };
    
    // Crosshair
    this.crosshair = this.createCrosshair();
    
    // Hit markers
    this.hitMarkers = [];
    
    // Projectiles (for bow/magic)
    this.projectiles = [];
  }

  /**
   * Create crosshair UI element
   */
  createCrosshair() {
    const crosshair = document.createElement('div');
    crosshair.id = 'ranged-crosshair';
    crosshair.style.position = 'fixed';
    crosshair.style.top = '50%';
    crosshair.style.left = '50%';
    crosshair.style.transform = 'translate(-50%, -50%)';
    crosshair.style.width = '4px';
    crosshair.style.height = '4px';
    crosshair.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    crosshair.style.borderRadius = '50%';
    crosshair.style.pointerEvents = 'none';
    crosshair.style.zIndex = '1000';
    crosshair.style.display = 'none';
    crosshair.style.boxShadow = '0 0 3px rgba(0, 0, 0, 0.8)';
    
    // Add crosshair lines
    const lines = ['top', 'bottom', 'left', 'right'];
    lines.forEach(dir => {
      const line = document.createElement('div');
      line.style.position = 'absolute';
      line.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
      line.style.boxShadow = '0 0 2px rgba(0, 0, 0, 0.8)';
      
      if (dir === 'top' || dir === 'bottom') {
        line.style.width = '2px';
        line.style.height = '8px';
        line.style.left = '50%';
        line.style.transform = 'translateX(-50%)';
        line.style[dir] = dir === 'top' ? '-12px' : '-12px';
      } else {
        line.style.width = '8px';
        line.style.height = '2px';
        line.style.top = '50%';
        line.style.transform = 'translateY(-50%)';
        line.style[dir] = dir === 'left' ? '-12px' : '-12px';
      }
      
      crosshair.appendChild(line);
    });
    
    document.body.appendChild(crosshair);
    return crosshair;
  }

  /**
   * Update aiming state
   */
  update(deltaTime, controller, isAimButtonPressed) {
    const char = controller.character;
    
    // Update aiming state
    if (isAimButtonPressed && !this.isReloading) {
      this.isAiming = true;
    } else {
      this.isAiming = false;
    }
    
    // Smooth aim transition
    if (this.isAiming) {
      this.aimTransition = Math.min(1, this.aimTransition + deltaTime * this.aimSpeed);
    } else {
      this.aimTransition = Math.max(0, this.aimTransition - deltaTime * this.aimSpeed);
    }
    
    // Show/hide crosshair
    if (this.aimTransition > 0.1) {
      this.crosshair.style.display = 'block';
      this.updateCrosshairPosition(controller);
    } else {
      this.crosshair.style.display = 'none';
    }
    
    // Update cooldowns
    if (this.shootCooldown > 0) {
      this.shootCooldown -= deltaTime;
    }
    
    if (this.isReloading) {
      this.reloadTimer -= deltaTime;
      if (this.reloadTimer <= 0) {
        this.finishReload();
      }
    }
    
    // Update projectiles
    this.updateProjectiles(deltaTime);
    
    // Update hit markers
    this.updateHitMarkers(deltaTime);
  }

  /**
   * Update crosshair position (auto-aim when locked)
   */
  updateCrosshairPosition(controller) {
    const char = controller.character;
    
    if (char.combatMode && char.lockedTarget && this.autoAimEnabled) {
      // Auto-aim to target's chest
      const targetPosition = char.lockedTarget.position.clone();
      targetPosition.y += 1.5;  // Chest height
      
      // Project to screen space
      const screenPos = this.worldToScreen(targetPosition, controller.camera);
      
      if (screenPos) {
        // Lerp crosshair toward target
        const currentX = parseFloat(this.crosshair.style.left) || 50;
        const currentY = parseFloat(this.crosshair.style.top) || 50;
        
        const targetX = screenPos.x;
        const targetY = screenPos.y;
        
        const lerpSpeed = this.autoAimStrength;
        const newX = currentX + (targetX - currentX) * lerpSpeed;
        const newY = currentY + (targetY - currentY) * lerpSpeed;
        
        this.crosshair.style.left = `${newX}%`;
        this.crosshair.style.top = `${newY}%`;
      }
    } else {
      // Center crosshair
      this.crosshair.style.left = '50%';
      this.crosshair.style.top = '50%';
    }
  }

  /**
   * Convert world position to screen percentage
   */
  worldToScreen(worldPos, camera) {
    const vector = worldPos.clone();
    vector.project(camera);
    
    // Check if in front of camera
    if (vector.z > 1) return null;
    
    const x = (vector.x + 1) / 2 * 100;
    const y = (-vector.y + 1) / 2 * 100;
    
    return { x, y };
  }

  /**
   * Shoot weapon
   */
  shoot(controller, targetableObjects = []) {
    if (this.shootCooldown > 0) return false;
    if (this.isReloading) return false;
    if (this.currentWeapon.ammo <= 0) {
      this.startReload();
      return false;
    }
    
    const char = controller.character;
    
    // Consume ammo
    this.currentWeapon.ammo--;
    
    // Set cooldown
    this.shootCooldown = 1.0 / this.currentWeapon.fireRate;
    
    // Determine shoot direction
    let shootDirection = new THREE.Vector3();
    let origin = char.position.clone();
    origin.y += 1.5;  // Shoot from chest height
    
    if (char.combatMode && char.lockedTarget && this.isAiming) {
      // Auto-aim at target's chest
      const targetPos = char.lockedTarget.position.clone();
      targetPos.y += 1.5;
      shootDirection.subVectors(targetPos, origin).normalize();
    } else {
      // Shoot in camera direction
      const cameraForward = new THREE.Vector3(0, 0, -1);
      cameraForward.applyQuaternion(controller.camera.quaternion);
      shootDirection.copy(cameraForward);
    }
    
    // Apply accuracy/spread
    const spread = (1 - this.currentWeapon.accuracy) * 0.1;
    shootDirection.x += (Math.random() - 0.5) * spread;
    shootDirection.y += (Math.random() - 0.5) * spread;
    shootDirection.z += (Math.random() - 0.5) * spread;
    shootDirection.normalize();
    
    // Perform hit detection
    let hitResult = null;
    
    if (this.currentWeapon.type === 'gun' || this.currentWeapon.type === 'crossbow') {
      // Instant hit (raycast)
      hitResult = this.performRaycast(origin, shootDirection, targetableObjects);
    } else {
      // Projectile (bow, magic)
      this.createProjectile(origin, shootDirection);
    }
    
    // Create muzzle flash effect (optional)
    this.createMuzzleFlash(origin);
    
    // Camera recoil (optional)
    this.applyCameraRecoil(controller);
    
    return hitResult;
  }

  /**
   * Perform raycast for instant hit weapons
   */
  performRaycast(origin, direction, targetableObjects) {
    const raycaster = new THREE.Raycaster(origin, direction, 0, this.currentWeapon.range);
    
    // Check against targetable objects
    const intersects = raycaster.intersectObjects(targetableObjects, true);
    
    if (intersects.length > 0) {
      const hit = intersects[0];
      
      // Create hit marker
      this.createHitMarker(hit.point);
      
      return {
        hit: true,
        target: hit.object,
        point: hit.point,
        distance: hit.distance,
        damage: this.currentWeapon.damage
      };
    }
    
    return null;
  }

  /**
   * Create projectile for bow/magic weapons
   */
  createProjectile(origin, direction) {
    // Create visual projectile (arrow, fireball, etc.)
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const projectile = new THREE.Mesh(geometry, material);
    
    projectile.position.copy(origin);
    projectile.userData.velocity = direction.clone().multiplyScalar(this.currentWeapon.projectileSpeed);
    projectile.userData.lifetime = this.currentWeapon.range / this.currentWeapon.projectileSpeed;
    projectile.userData.damage = this.currentWeapon.damage;
    
    this.scene.add(projectile);
    this.projectiles.push(projectile);
  }

  /**
   * Update projectiles
   */
  updateProjectiles(deltaTime) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      
      // Move projectile
      const velocity = projectile.userData.velocity;
      projectile.position.addScaledVector(velocity, deltaTime);
      
      // Apply gravity
      velocity.y -= 9.8 * deltaTime;
      
      // Update lifetime
      projectile.userData.lifetime -= deltaTime;
      
      if (projectile.userData.lifetime <= 0) {
        // Remove expired projectile
        this.scene.remove(projectile);
        this.projectiles.splice(i, 1);
      }
      
      // TODO: Check collision with targets
    }
  }

  /**
   * Start reload
   */
  startReload() {
    if (this.isReloading) return;
    if (this.currentWeapon.ammo === this.currentWeapon.maxAmmo) return;
    
    this.isReloading = true;
    this.reloadTimer = this.currentWeapon.reloadTime;
  }

  /**
   * Finish reload
   */
  finishReload() {
    this.currentWeapon.ammo = this.currentWeapon.maxAmmo;
    this.isReloading = false;
    this.reloadTimer = 0;
  }

  /**
   * Create hit marker effect
   */
  createHitMarker(position) {
    const geometry = new THREE.RingGeometry(0.1, 0.15, 16);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xff0000, 
      side: THREE.DoubleSide,
      transparent: true
    });
    const marker = new THREE.Mesh(geometry, material);
    
    marker.position.copy(position);
    marker.lookAt(this.camera.position);
    marker.userData.lifetime = 0.5;
    
    this.scene.add(marker);
    this.hitMarkers.push(marker);
  }

  /**
   * Update hit markers
   */
  updateHitMarkers(deltaTime) {
    for (let i = this.hitMarkers.length - 1; i >= 0; i--) {
      const marker = this.hitMarkers[i];
      
      marker.userData.lifetime -= deltaTime;
      marker.material.opacity = marker.userData.lifetime / 0.5;
      
      if (marker.userData.lifetime <= 0) {
        this.scene.remove(marker);
        this.hitMarkers.splice(i, 1);
      }
    }
  }

  /**
   * Create muzzle flash effect
   */
  createMuzzleFlash(position) {
    // TODO: Add particle effect for muzzle flash
  }

  /**
   * Apply camera recoil
   */
  applyCameraRecoil(controller) {
    // Small upward camera kick
    const recoilStrength = 0.05;
    controller.camera.pitch -= recoilStrength;
  }

  /**
   * Get camera offset when aiming
   */
  getAimCameraOffset() {
    return {
      distance: this.aimCameraOffset.distance * this.aimTransition,
      height: this.aimCameraOffset.height * this.aimTransition,
      fov: this.aimCameraOffset.fov * this.aimTransition
    };
  }

  /**
   * Switch weapon type
   */
  switchWeapon(weaponType) {
    const weapons = {
      bow: {
        type: 'bow',
        damage: 15,
        range: 50,
        accuracy: 0.9,
        fireRate: 1.0,
        reloadTime: 0,
        ammo: Infinity,
        maxAmmo: Infinity,
        projectileSpeed: 30
      },
      crossbow: {
        type: 'crossbow',
        damage: 25,
        range: 60,
        accuracy: 0.95,
        fireRate: 0.5,
        reloadTime: 2.5,
        ammo: 1,
        maxAmmo: 1,
        projectileSpeed: 50
      },
      gun: {
        type: 'gun',
        damage: 20,
        range: 100,
        accuracy: 0.85,
        fireRate: 3.0,
        reloadTime: 2.0,
        ammo: 12,
        maxAmmo: 12,
        projectileSpeed: Infinity  // Instant
      },
      magic: {
        type: 'magic',
        damage: 30,
        range: 40,
        accuracy: 1.0,
        fireRate: 0.8,
        reloadTime: 0,
        ammo: Infinity,
        maxAmmo: Infinity,
        projectileSpeed: 20
      }
    };
    
    if (weapons[weaponType]) {
      this.currentWeapon = weapons[weaponType];
      this.isReloading = false;
      this.reloadTimer = 0;
    }
  }

  /**
   * Cleanup
   */
  dispose() {
    if (this.crosshair && this.crosshair.parentNode) {
      this.crosshair.parentNode.removeChild(this.crosshair);
    }
    
    // Remove all projectiles
    this.projectiles.forEach(p => this.scene.remove(p));
    this.projectiles = [];
    
    // Remove all hit markers
    this.hitMarkers.forEach(m => this.scene.remove(m));
    this.hitMarkers = [];
  }

  /**
   * Get UI data for HUD
   */
  getUIData() {
    return {
      isAiming: this.isAiming,
      aimTransition: this.aimTransition,
      ammo: this.currentWeapon.ammo,
      maxAmmo: this.currentWeapon.maxAmmo,
      isReloading: this.isReloading,
      reloadProgress: this.isReloading ? 
        1 - (this.reloadTimer / this.currentWeapon.reloadTime) : 1,
      weaponType: this.currentWeapon.type
    };
  }
}
