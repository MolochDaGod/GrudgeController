import * as THREE from 'three';
import { ThreeObjectPool } from '../utils/ObjectPool.js';

/**
 * ParticleSystem - Efficient particle effects for combat and environment
 * 
 * Features:
 * - Object pooling for performance
 * - Multiple particle types (blood, sparks, dust, magic)
 * - Physics simulation (gravity, velocity, drag)
 * - GPU instancing for large particle counts
 * 
 * @example
 * const particles = new ParticleSystem(scene);
 * particles.emit('blood', position, { count: 10, speed: 5 });
 */
export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.emitters = new Map();
    this.activeParticles = [];
    
    // Particle pools
    this.pools = {
      blood: null,
      sparks: null,
      dust: null,
      magic: null,
      impact: null
    };
    
    this.initialize();
  }
  
  /**
   * Initialize particle system and pools
   */
  initialize() {
    // Create particle pools
    this.createParticlePool('blood', () => this.createBloodParticle(), 50);
    this.createParticlePool('sparks', () => this.createSparkParticle(), 100);
    this.createParticlePool('dust', () => this.createDustParticle(), 30);
    this.createParticlePool('magic', () => this.createMagicParticle(), 50);
    this.createParticlePool('impact', () => this.createImpactParticle(), 40);
  }
  
  /**
   * Create a particle pool
   */
  createParticlePool(name, factory, size) {
    this.pools[name] = new ThreeObjectPool(factory, size, size * 2);
  }
  
  /**
   * Create blood particle
   */
  createBloodParticle() {
    const geometry = new THREE.SphereGeometry(0.05, 4, 4);
    const material = new THREE.MeshBasicMaterial({
      color: 0x8B0000,
      transparent: true,
      opacity: 1
    });
    const particle = new THREE.Mesh(geometry, material);
    particle.userData = {
      velocity: new THREE.Vector3(),
      lifetime: 0,
      maxLifetime: 1.0,
      type: 'blood'
    };
    return particle;
  }
  
  /**
   * Create spark particle (metal hits)
   */
  createSparkParticle() {
    const geometry = new THREE.BoxGeometry(0.02, 0.02, 0.1);
    const material = new THREE.MeshBasicMaterial({
      color: 0xFFAA00,
      transparent: true,
      opacity: 1
    });
    const particle = new THREE.Mesh(geometry, material);
    particle.userData = {
      velocity: new THREE.Vector3(),
      lifetime: 0,
      maxLifetime: 0.5,
      type: 'spark'
    };
    return particle;
  }
  
  /**
   * Create dust particle
   */
  createDustParticle() {
    const geometry = new THREE.PlaneGeometry(0.2, 0.2);
    const material = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const particle = new THREE.Mesh(geometry, material);
    particle.userData = {
      velocity: new THREE.Vector3(),
      lifetime: 0,
      maxLifetime: 1.5,
      type: 'dust'
    };
    return particle;
  }
  
  /**
   * Create magic particle
   */
  createMagicParticle() {
    const geometry = new THREE.SphereGeometry(0.1, 6, 6);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00FFFF,
      transparent: true,
      opacity: 1,
      emissive: 0x00FFFF,
      emissiveIntensity: 1
    });
    const particle = new THREE.Mesh(geometry, material);
    particle.userData = {
      velocity: new THREE.Vector3(),
      lifetime: 0,
      maxLifetime: 2.0,
      type: 'magic'
    };
    return particle;
  }
  
  /**
   * Create impact particle
   */
  createImpactParticle() {
    const geometry = new THREE.RingGeometry(0.1, 0.2, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide
    });
    const particle = new THREE.Mesh(geometry, material);
    particle.userData = {
      velocity: new THREE.Vector3(),
      lifetime: 0,
      maxLifetime: 0.3,
      type: 'impact'
    };
    return particle;
  }
  
  /**
   * Emit particles
   * @param {string} type - Particle type
   * @param {THREE.Vector3} position - Emission position
   * @param {Object} config - Emission configuration
   */
  emit(type, position, config = {}) {
    const pool = this.pools[type];
    if (!pool) {
      console.warn(`ParticleSystem: Unknown particle type: ${type}`);
      return;
    }
    
    const defaultConfig = {
      count: 10,
      speed: 3,
      spread: Math.PI / 4,
      direction: new THREE.Vector3(0, 1, 0),
      gravity: -9.8,
      drag: 0.98,
      lifetime: null, // Use particle's maxLifetime
      color: null,
      scale: 1
    };
    
    const emitConfig = { ...defaultConfig, ...config };
    
    for (let i = 0; i < emitConfig.count; i++) {
      const particle = pool.acquire();
      if (!particle) continue;
      
      // Set position
      particle.position.copy(position);
      particle.visible = true;
      
      // Set velocity
      const angle = (Math.random() - 0.5) * emitConfig.spread;
      const speed = emitConfig.speed * (0.8 + Math.random() * 0.4);
      
      particle.userData.velocity.copy(emitConfig.direction)
        .applyAxisAngle(new THREE.Vector3(1, 0, 0), angle)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2)
        .multiplyScalar(speed);
      
      // Set lifetime
      particle.userData.lifetime = 0;
      if (emitConfig.lifetime) {
        particle.userData.maxLifetime = emitConfig.lifetime;
      }
      
      // Set color
      if (emitConfig.color) {
        particle.material.color.setHex(emitConfig.color);
      }
      
      // Set scale
      particle.scale.setScalar(emitConfig.scale);
      
      // Store config
      particle.userData.gravity = emitConfig.gravity;
      particle.userData.drag = emitConfig.drag;
      
      // Add to scene and active list
      this.scene.add(particle);
      this.activeParticles.push({ particle, pool });
    }
  }
  
  /**
   * Emit blood spray (for hit effects)
   */
  emitBlood(position, direction, intensity = 1) {
    this.emit('blood', position, {
      count: Math.floor(5 * intensity),
      speed: 4 * intensity,
      spread: Math.PI / 3,
      direction: direction,
      gravity: -15
    });
  }
  
  /**
   * Emit sparks (for metal hits, blocks)
   */
  emitSparks(position, direction, count = 10) {
    this.emit('sparks', position, {
      count,
      speed: 6,
      spread: Math.PI / 4,
      direction: direction,
      gravity: -5,
      lifetime: 0.4
    });
  }
  
  /**
   * Emit dust cloud (for rolls, falls)
   */
  emitDust(position, count = 5) {
    this.emit('dust', position, {
      count,
      speed: 1,
      spread: Math.PI,
      direction: new THREE.Vector3(0, 1, 0),
      gravity: -1,
      drag: 0.95
    });
  }
  
  /**
   * Emit magic effect
   */
  emitMagic(position, color = 0x00FFFF, count = 20) {
    this.emit('magic', position, {
      count,
      speed: 2,
      spread: Math.PI * 2,
      direction: new THREE.Vector3(0, 1, 0),
      gravity: -2,
      color: color,
      scale: 1.5
    });
  }
  
  /**
   * Emit impact ring
   */
  emitImpact(position, normal = new THREE.Vector3(0, 1, 0)) {
    this.emit('impact', position, {
      count: 1,
      speed: 0,
      direction: normal,
      gravity: 0
    });
  }
  
  /**
   * Update all particles
   * @param {number} deltaTime - Time since last frame
   */
  update(deltaTime) {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const { particle, pool } = this.activeParticles[i];
      const userData = particle.userData;
      
      // Update lifetime
      userData.lifetime += deltaTime;
      
      // Check if expired
      if (userData.lifetime >= userData.maxLifetime) {
        this.scene.remove(particle);
        pool.release(particle);
        this.activeParticles.splice(i, 1);
        continue;
      }
      
      // Update physics
      userData.velocity.y += userData.gravity * deltaTime;
      userData.velocity.multiplyScalar(userData.drag);
      
      particle.position.addScaledVector(userData.velocity, deltaTime);
      
      // Update opacity (fade out)
      const lifePercent = userData.lifetime / userData.maxLifetime;
      particle.material.opacity = 1 - lifePercent;
      
      // Scale impact particles
      if (userData.type === 'impact') {
        const scale = 1 + lifePercent * 2;
        particle.scale.setScalar(scale);
      }
      
      // Rotate sparks
      if (userData.type === 'spark') {
        particle.rotation.z += deltaTime * 10;
      }
    }
  }
  
  /**
   * Clear all particles
   */
  clear() {
    for (const { particle, pool } of this.activeParticles) {
      this.scene.remove(particle);
      pool.release(particle);
    }
    this.activeParticles = [];
  }
  
  /**
   * Get particle system stats
   */
  getStats() {
    const poolStats = {};
    for (const [name, pool] of Object.entries(this.pools)) {
      if (pool) poolStats[name] = pool.getStats();
    }
    
    return {
      activeParticles: this.activeParticles.length,
      pools: poolStats
    };
  }
  
  /**
   * Dispose particle system
   */
  dispose() {
    this.clear();
    
    for (const pool of Object.values(this.pools)) {
      if (pool) pool.dispose();
    }
  }
}
