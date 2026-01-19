/**
 * TargetLockSystem.js - Visual target lock indicators with optimal attack distance
 */

import * as THREE from "three";

export class TargetLockSystem {
  constructor(scene, camera, config = {}) {
    this.scene = scene;
    this.camera = camera;
    
    // Configuration
    this.config = {
      indicatorRadius: 0.8,          // Red circle radius
      indicatorColor: 0xff0000,      // Red color
      optimalDistance: 2.5,          // Optimal attack range
      minDistance: 1.5,              // Minimum distance (too close)
      maxDistance: 4.0,              // Maximum distance (too far)
      softColliderRadius: 2.0,       // Soft push radius
      softColliderStrength: 0.3,     // Push force multiplier
      indicatorHeight: 0.1,          // Height above ground
      healthBarHeight: 2.5,
      healthBarWidth: 1.0,
      ...config
    };
    
    // Active target
    this.activeTarget = null;
    this.targetIndicators = new Map(); // Map of enemy -> indicator objects
  }
  
  /**
   * Create visual indicator for a target
   */
  createIndicator(target) {
    const group = new THREE.Group();
    
    // Red circle on ground
    const geometry = new THREE.RingGeometry(
      this.config.indicatorRadius * 0.8,
      this.config.indicatorRadius,
      32
    );
    const material = new THREE.MeshBasicMaterial({
      color: this.config.indicatorColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    });
    
    const circle = new THREE.Mesh(geometry, material);
    circle.rotation.x = -Math.PI / 2;
    circle.position.y = this.config.indicatorHeight;
    group.add(circle);
    
    // Pulsing animation data
    circle.userData.pulseTime = 0;
    
    // Distance indicator lines (show optimal range)
    const linesMaterial = new THREE.LineBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.5
    });
    
    // Create 4 lines pointing inward
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const x1 = Math.cos(angle) * this.config.indicatorRadius;
      const z1 = Math.sin(angle) * this.config.indicatorRadius;
      const x2 = Math.cos(angle) * this.config.indicatorRadius * 0.6;
      const z2 = Math.sin(angle) * this.config.indicatorRadius * 0.6;
      
      const points = [
        new THREE.Vector3(x1, 0.15, z1),
        new THREE.Vector3(x2, 0.15, z2)
      ];
      
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeometry, linesMaterial);
      group.add(line);
    }
    
    // Health bar
    const healthBarGroup = new THREE.Group();
    healthBarGroup.position.y = this.config.healthBarHeight;
    
    // Background
    const bgGeometry = new THREE.PlaneGeometry(this.config.healthBarWidth, 0.1);
    const bgMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.7,
      depthTest: false
    });
    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    healthBarGroup.add(bgMesh);
    
    // Health fill
    const fillGeometry = new THREE.PlaneGeometry(this.config.healthBarWidth, 0.08);
    const fillMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      depthTest: false
    });
    const fillMesh = new THREE.Mesh(fillGeometry, fillMaterial);
    fillMesh.position.z = 0.001; // Slightly in front
    healthBarGroup.add(fillMesh);
    
    healthBarGroup.userData.fillMesh = fillMesh;
    healthBarGroup.userData.fillMaterial = fillMaterial;
    group.add(healthBarGroup);
    
    this.scene.add(group);
    return group;
  }
  
  /**
   * Set the currently locked target
   */
  setActiveTarget(target) {
    // Remove old indicator
    if (this.activeTarget && this.targetIndicators.has(this.activeTarget)) {
      const indicator = this.targetIndicators.get(this.activeTarget);
      this.scene.remove(indicator);
      this.targetIndicators.delete(this.activeTarget);
    }
    
    this.activeTarget = target;
    
    // Create new indicator
    if (target) {
      const indicator = this.createIndicator(target);
      this.targetIndicators.set(target, indicator);
    }
  }
  
  /**
   * Update target health display
   */
  setTargetHealth(target, current, max) {
    if (!this.targetIndicators.has(target)) return;
    
    const indicator = this.targetIndicators.get(target);
    const healthBar = indicator.children.find(child => child.userData.fillMesh);
    
    if (healthBar) {
      const fillMesh = healthBar.userData.fillMesh;
      const fillMaterial = healthBar.userData.fillMaterial;
      const healthPercent = Math.max(0, Math.min(1, current / max));
      
      // Scale health bar
      fillMesh.scale.x = healthPercent;
      fillMesh.position.x = -(this.config.healthBarWidth * (1 - healthPercent)) / 2;
      
      // Color based on health
      if (healthPercent > 0.6) {
        fillMaterial.color.setHex(0x00ff00); // Green
      } else if (healthPercent > 0.3) {
        fillMaterial.color.setHex(0xffff00); // Yellow
      } else {
        fillMaterial.color.setHex(0xff0000); // Red
      }
    }
  }
  
  /**
   * Calculate soft collider push force to maintain optimal distance
   * Returns a Vector3 push force to apply to player
   */
  calculateSoftCollider(playerPos, targetPos) {
    const toTarget = new THREE.Vector3().subVectors(targetPos, playerPos);
    toTarget.y = 0; // Only horizontal
    const distance = toTarget.length();
    
    if (distance < 0.01) return new THREE.Vector3();
    
    toTarget.normalize();
    
    // If too close, push away
    if (distance < this.config.minDistance) {
      const pushStrength = (this.config.minDistance - distance) * this.config.softColliderStrength;
      return toTarget.multiplyScalar(-pushStrength);
    }
    
    // If within soft collider but outside optimal, gentle push
    if (distance < this.config.softColliderRadius && distance < this.config.optimalDistance) {
      const pushStrength = (this.config.optimalDistance - distance) * (this.config.softColliderStrength * 0.3);
      return toTarget.multiplyScalar(-pushStrength);
    }
    
    // If too far from optimal range, gentle pull
    if (distance > this.config.optimalDistance && distance < this.config.maxDistance) {
      const pullStrength = (distance - this.config.optimalDistance) * (this.config.softColliderStrength * 0.2);
      return toTarget.multiplyScalar(pullStrength);
    }
    
    return new THREE.Vector3();
  }
  
  /**
   * Get distance quality indicator
   * Returns: "optimal", "close", "far", "too_far"
   */
  getDistanceQuality(playerPos, targetPos) {
    const distance = playerPos.distanceTo(targetPos);
    
    if (distance < this.config.minDistance) return "too_close";
    if (distance >= this.config.minDistance && distance <= this.config.optimalDistance + 0.3) return "optimal";
    if (distance > this.config.optimalDistance + 0.3 && distance <= this.config.maxDistance) return "far";
    return "too_far";
  }
  
  /**
   * Update indicators
   */
  update(delta = 0.016, playerPos = null) {
    this.targetIndicators.forEach((indicator, target) => {
      if (!target.position) return;
      
      // Position indicator at target
      indicator.position.copy(target.position);
      
      // Pulse animation
      const circle = indicator.children[0];
      if (circle) {
        circle.userData.pulseTime = (circle.userData.pulseTime || 0) + delta * 2;
        const pulse = Math.sin(circle.userData.pulseTime) * 0.1 + 1;
        circle.scale.set(pulse, pulse, pulse);
        circle.material.opacity = 0.5 + Math.sin(circle.userData.pulseTime) * 0.2;
      }
      
      // Make health bar face camera
      const healthBar = indicator.children.find(child => child.userData.fillMesh);
      if (healthBar && this.camera) {
        healthBar.lookAt(this.camera.position);
      }
      
      // Update indicator color based on distance quality
      if (playerPos) {
        const quality = this.getDistanceQuality(playerPos, target.position);
        
        if (circle) {
          switch (quality) {
            case "optimal":
              circle.material.color.setHex(0x00ff00); // Green - optimal
              break;
            case "close":
            case "far":
              circle.material.color.setHex(0xffff00); // Yellow - okay
              break;
            case "too_close":
            case "too_far":
              circle.material.color.setHex(0xff0000); // Red - bad
              break;
          }
        }
      }
    });
  }
  
  /**
   * Clear all indicators
   */
  clear() {
    this.targetIndicators.forEach((indicator) => {
      this.scene.remove(indicator);
    });
    this.targetIndicators.clear();
    this.activeTarget = null;
  }
}
