import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * HitZoneSystem - Manages hit detection with different damage multipliers for body parts
 * 
 * Damage Multipliers:
 * - Head: 1.5x damage
 * - Body: 1.0x damage (torso, spine)
 * - Limbs: 0.5x damage (arms, legs, hands, feet)
 */
export class HitZoneSystem {
  constructor() {
    this.hitZones = {
      HEAD: { multiplier: 1.5, name: 'Head' },
      BODY: { multiplier: 1.0, name: 'Body' },
      LIMBS: { multiplier: 0.5, name: 'Limbs' }
    };

    // Bone name mappings to hit zones
    this.boneToZone = {
      // Head
      'head': 'HEAD',
      'neck': 'HEAD',
      'Head': 'HEAD',
      'Neck': 'HEAD',
      
      // Body (torso/spine)
      'spine': 'BODY',
      'spine1': 'BODY',
      'spine2': 'BODY',
      'chest': 'BODY',
      'torso': 'BODY',
      'Spine': 'BODY',
      'Spine1': 'BODY',
      'Spine2': 'BODY',
      'Chest': 'BODY',
      'Torso': 'BODY',
      'Hips': 'BODY',
      'hips': 'BODY',
      
      // Arms (limbs)
      'shoulder': 'LIMBS',
      'upperarm': 'LIMBS',
      'lowerarm': 'LIMBS',
      'hand': 'LIMBS',
      'Shoulder': 'LIMBS',
      'UpperArm': 'LIMBS',
      'LowerArm': 'LIMBS',
      'Hand': 'LIMBS',
      'LeftShoulder': 'LIMBS',
      'RightShoulder': 'LIMBS',
      'LeftArm': 'LIMBS',
      'RightArm': 'LIMBS',
      'LeftForeArm': 'LIMBS',
      'RightForeArm': 'LIMBS',
      'LeftHand': 'LIMBS',
      'RightHand': 'LIMBS',
      
      // Legs (limbs)
      'upperleg': 'LIMBS',
      'lowerleg': 'LIMBS',
      'foot': 'LIMBS',
      'UpperLeg': 'LIMBS',
      'LowerLeg': 'LIMBS',
      'Foot': 'LIMBS',
      'LeftUpLeg': 'LIMBS',
      'RightUpLeg': 'LIMBS',
      'LeftLeg': 'LIMBS',
      'RightLeg': 'LIMBS',
      'LeftFoot': 'LIMBS',
      'RightFoot': 'LIMBS',
      'Thigh': 'LIMBS',
      'Calf': 'LIMBS',
      'thigh': 'LIMBS',
      'calf': 'LIMBS'
    };

    // Physics bodies for each zone (per character)
    this.characterHitZones = new Map(); // characterId -> { head, body, limbs[] }
  }

  /**
   * Create hit zone physics bodies for a character
   * @param {string} characterId - Unique ID for the character
   * @param {THREE.SkinnedMesh} mesh - Character mesh
   * @param {CANNON.World} physicsWorld - Physics world
   * @returns {Object} Hit zone bodies
   */
  createHitZones(characterId, mesh, physicsWorld) {
    const hitZoneBodies = {
      head: null,
      body: null,
      limbs: []
    };

    // Find bones in the skeleton
    const skeleton = mesh.skeleton;
    if (!skeleton) {
      console.warn('HitZoneSystem: Character has no skeleton');
      return hitZoneBodies;
    }

    const bones = skeleton.bones;

    // Create head hit zone
    const headBone = this.findBone(bones, ['head', 'Head', 'neck', 'Neck']);
    if (headBone) {
      hitZoneBodies.head = this.createSphereHitZone(headBone, 0.15, 'HEAD', physicsWorld);
    }

    // Create body hit zone (chest/torso)
    const spineBone = this.findBone(bones, ['spine2', 'Spine2', 'chest', 'Chest', 'spine1', 'Spine1']);
    if (spineBone) {
      hitZoneBodies.body = this.createCapsuleHitZone(spineBone, 0.3, 0.6, 'BODY', physicsWorld);
    }

    // Create limb hit zones
    const limbBones = [
      this.findBone(bones, ['LeftArm', 'leftarm', 'LeftUpperArm']),
      this.findBone(bones, ['RightArm', 'rightarm', 'RightUpperArm']),
      this.findBone(bones, ['LeftLeg', 'leftleg', 'LeftUpLeg']),
      this.findBone(bones, ['RightLeg', 'rightleg', 'RightUpLeg'])
    ];

    limbBones.forEach(bone => {
      if (bone) {
        const limbBody = this.createCapsuleHitZone(bone, 0.1, 0.4, 'LIMBS', physicsWorld);
        if (limbBody) {
          hitZoneBodies.limbs.push(limbBody);
        }
      }
    });

    // Store for this character
    this.characterHitZones.set(characterId, {
      mesh,
      bones: { headBone, spineBone, limbBones },
      bodies: hitZoneBodies
    });

    return hitZoneBodies;
  }

  /**
   * Find a bone by name (case-insensitive search)
   */
  findBone(bones, names) {
    for (const name of names) {
      const bone = bones.find(b => 
        b.name.toLowerCase() === name.toLowerCase() || 
        b.name.includes(name)
      );
      if (bone) return bone;
    }
    return null;
  }

  /**
   * Create a sphere hit zone (for head)
   */
  createSphereHitZone(bone, radius, zoneType, physicsWorld) {
    const shape = new CANNON.Sphere(radius);
    const body = new CANNON.Body({
      mass: 0, // Kinematic (moved by code)
      shape: shape,
      collisionResponse: false, // Don't physically respond, just detect
      isTrigger: true
    });

    body.userData = {
      type: 'hitzone',
      zone: zoneType,
      bone: bone,
      multiplier: this.hitZones[zoneType].multiplier
    };

    physicsWorld.addBody(body);
    return body;
  }

  /**
   * Create a capsule hit zone (for body/limbs)
   */
  createCapsuleHitZone(bone, radius, height, zoneType, physicsWorld) {
    // Cannon.js doesn't have capsule, use cylinder
    const shape = new CANNON.Cylinder(radius, radius, height, 8);
    const body = new CANNON.Body({
      mass: 0,
      shape: shape,
      collisionResponse: false,
      isTrigger: true
    });

    body.userData = {
      type: 'hitzone',
      zone: zoneType,
      bone: bone,
      multiplier: this.hitZones[zoneType].multiplier
    };

    physicsWorld.addBody(body);
    return body;
  }

  /**
   * Update hit zone positions to follow bones
   * @param {number} deltaTime
   */
  update(deltaTime) {
    this.characterHitZones.forEach((data, characterId) => {
      const { mesh, bones, bodies } = data;

      // Update head
      if (bones.headBone && bodies.head) {
        this.updateBodyFromBone(bodies.head, bones.headBone, mesh);
      }

      // Update body
      if (bones.spineBone && bodies.body) {
        this.updateBodyFromBone(bodies.body, bones.spineBone, mesh);
      }

      // Update limbs
      bodies.limbs.forEach((body, index) => {
        const bone = bones.limbBones[index];
        if (bone) {
          this.updateBodyFromBone(body, bone, mesh);
        }
      });
    });
  }

  /**
   * Update physics body position from bone world position
   */
  updateBodyFromBone(body, bone, mesh) {
    const worldPosition = new THREE.Vector3();
    bone.getWorldPosition(worldPosition);
    
    body.position.set(
      worldPosition.x,
      worldPosition.y,
      worldPosition.z
    );

    // Update rotation
    const worldQuaternion = new THREE.Quaternion();
    bone.getWorldQuaternion(worldQuaternion);
    body.quaternion.set(
      worldQuaternion.x,
      worldQuaternion.y,
      worldQuaternion.z,
      worldQuaternion.w
    );
  }

  /**
   * Perform raycast to detect hit and return damage multiplier
   * @param {THREE.Vector3} origin - Ray origin
   * @param {THREE.Vector3} direction - Ray direction
   * @param {number} distance - Max ray distance
   * @param {string} targetCharacterId - Target character ID
   * @returns {Object|null} { zone, multiplier, hitPoint } or null
   */
  raycastHit(origin, direction, distance, targetCharacterId) {
    const characterData = this.characterHitZones.get(targetCharacterId);
    if (!characterData) return null;

    const raycaster = new THREE.Raycaster(origin, direction.normalize(), 0, distance);
    
    // Check head first (priority: head > body > limbs)
    if (characterData.bodies.head) {
      const headHit = this.raycastBody(raycaster, characterData.bodies.head);
      if (headHit) {
        return {
          zone: 'HEAD',
          multiplier: this.hitZones.HEAD.multiplier,
          hitPoint: headHit,
          zoneName: this.hitZones.HEAD.name
        };
      }
    }

    // Check body
    if (characterData.bodies.body) {
      const bodyHit = this.raycastBody(raycaster, characterData.bodies.body);
      if (bodyHit) {
        return {
          zone: 'BODY',
          multiplier: this.hitZones.BODY.multiplier,
          hitPoint: bodyHit,
          zoneName: this.hitZones.BODY.name
        };
      }
    }

    // Check limbs
    for (const limbBody of characterData.bodies.limbs) {
      const limbHit = this.raycastBody(raycaster, limbBody);
      if (limbHit) {
        return {
          zone: 'LIMBS',
          multiplier: this.hitZones.LIMBS.multiplier,
          hitPoint: limbHit,
          zoneName: this.hitZones.LIMBS.name
        };
      }
    }

    return null;
  }

  /**
   * Raycast against a physics body (simplified)
   */
  raycastBody(raycaster, body) {
    // Create a temporary mesh for raycasting
    const position = new THREE.Vector3(body.position.x, body.position.y, body.position.z);
    const distance = raycaster.ray.origin.distanceTo(position);
    
    // Simple distance check (can be improved with actual shape intersection)
    const shape = body.shapes[0];
    let radius = 0.5;
    
    if (shape.type === CANNON.Shape.types.SPHERE) {
      radius = shape.radius;
    } else if (shape.type === CANNON.Shape.types.CYLINDER) {
      radius = shape.radiusTop;
    }

    if (distance <= radius + raycaster.far) {
      // Hit detected
      return position;
    }

    return null;
  }

  /**
   * Get damage multiplier for a bone name
   * @param {string} boneName
   * @returns {number} Multiplier
   */
  getDamageMultiplier(boneName) {
    const zone = this.boneToZone[boneName] || 'BODY';
    return this.hitZones[zone].multiplier;
  }

  /**
   * Get hit zone name from bone
   */
  getHitZoneName(boneName) {
    const zone = this.boneToZone[boneName] || 'BODY';
    return this.hitZones[zone].name;
  }

  /**
   * Remove character hit zones
   */
  removeCharacter(characterId, physicsWorld) {
    const data = this.characterHitZones.get(characterId);
    if (!data) return;

    // Remove all physics bodies
    if (data.bodies.head) physicsWorld.removeBody(data.bodies.head);
    if (data.bodies.body) physicsWorld.removeBody(data.bodies.body);
    data.bodies.limbs.forEach(body => physicsWorld.removeBody(body));

    this.characterHitZones.delete(characterId);
  }

  /**
   * Debug visualization
   */
  createDebugHelpers(scene) {
    const helpers = [];

    this.characterHitZones.forEach((data, characterId) => {
      const { bodies } = data;

      // Head helper (red)
      if (bodies.head) {
        const shape = bodies.head.shapes[0];
        const geometry = new THREE.SphereGeometry(shape.radius, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
          color: 0xff0000, 
          wireframe: true,
          transparent: true,
          opacity: 0.5
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.physicsBody = bodies.head;
        scene.add(mesh);
        helpers.push(mesh);
      }

      // Body helper (green)
      if (bodies.body) {
        const shape = bodies.body.shapes[0];
        const geometry = new THREE.CylinderGeometry(
          shape.radiusTop, 
          shape.radiusBottom, 
          shape.height, 
          8
        );
        const material = new THREE.MeshBasicMaterial({ 
          color: 0x00ff00, 
          wireframe: true,
          transparent: true,
          opacity: 0.5
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.physicsBody = bodies.body;
        scene.add(mesh);
        helpers.push(mesh);
      }

      // Limb helpers (blue)
      bodies.limbs.forEach(body => {
        const shape = body.shapes[0];
        const geometry = new THREE.CylinderGeometry(
          shape.radiusTop,
          shape.radiusBottom,
          shape.height,
          6
        );
        const material = new THREE.MeshBasicMaterial({ 
          color: 0x0000ff, 
          wireframe: true,
          transparent: true,
          opacity: 0.5
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.physicsBody = body;
        scene.add(mesh);
        helpers.push(mesh);
      });
    });

    return helpers;
  }

  /**
   * Update debug helpers
   */
  updateDebugHelpers(helpers) {
    helpers.forEach(helper => {
      const body = helper.userData.physicsBody;
      if (body) {
        helper.position.copy(body.position);
        helper.quaternion.copy(body.quaternion);
      }
    });
  }
}
