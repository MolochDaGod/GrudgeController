import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

/**
 * PhysicsSystem - Handles physics simulation, collision detection, and ragdoll mechanics
 * Uses Rapier.js for high-performance WASM-based physics
 */
export class PhysicsSystem {
    constructor(config = {}) {
        this.config = {
            gravity: config.gravity || { x: 0, y: -9.81, z: 0 },
            // Speed-based collision thresholds (m/s)
            lightImpactSpeed: 2.0,
            mediumImpactSpeed: 5.0,
            heavyImpactSpeed: 8.0,
            // Collision response parameters
            lightKnockback: 0.3,
            mediumKnockback: 1.5,
            heavyKnockback: 3.0,
            // Ragdoll parameters
            ragdollThreshold: 8.0, // Speed at which ragdoll activates
            ragdollDuration: 2.0, // Seconds
            blendToRagdollTime: 0.15, // Smooth transition
            ...config
        };

        this.world = null;
        this.rapier = null;
        this.initialized = false;
        
        // Physics bodies registry
        this.bodies = new Map(); // Three.js mesh -> Rapier rigid body
        this.colliders = new Map(); // Three.js mesh -> Rapier collider
        
        // Collision tracking
        this.collisionEvents = [];
        this.activeCollisions = new Set();
        
        // Ragdoll state
        this.ragdollBodies = new Map(); // Character -> ragdoll bones
        this.activeRagdolls = new Set();
    }

    /**
     * Initialize Rapier physics engine
     */
    async init() {
        if (this.initialized) return;
        
        try {
            // Initialize Rapier WASM module
            this.rapier = await RAPIER.init();
            
            // Create physics world with gravity
            const gravity = new RAPIER.Vector3(
                this.config.gravity.x,
                this.config.gravity.y,
                this.config.gravity.z
            );
            this.world = new RAPIER.World(gravity);
            
            // Enable continuous collision detection
            this.world.integrationParameters.allowedLinearError = 0.001;
            
            this.initialized = true;
            console.log('✅ PhysicsSystem initialized with Rapier.js');
        } catch (error) {
            console.error('❌ Failed to initialize PhysicsSystem:', error);
            throw error;
        }
    }

    /**
     * Add a character to physics simulation
     * @param {THREE.Object3D} mesh - Character mesh
     * @param {Object} options - Physics properties
     */
    addCharacter(mesh, options = {}) {
        if (!this.initialized) {
            console.warn('PhysicsSystem not initialized');
            return null;
        }

        const {
            mass = 70, // kg (average human)
            radius = 0.4, // Capsule radius
            height = 1.8, // Capsule height
            isKinematic = true, // Player-controlled
            friction = 0.5,
            restitution = 0.0 // No bounce
        } = options;

        // Create capsule rigid body
        const rigidBodyDesc = isKinematic
            ? RAPIER.RigidBodyDesc.kinematicPositionBased()
            : RAPIER.RigidBodyDesc.dynamic();

        const position = mesh.position;
        rigidBodyDesc.setTranslation(position.x, position.y, position.z);
        
        const rigidBody = this.world.createRigidBody(rigidBodyDesc);

        // Create capsule collider (better for character controllers)
        const colliderDesc = RAPIER.ColliderDesc.capsule(height / 2 - radius, radius)
            .setMass(mass)
            .setFriction(friction)
            .setRestitution(restitution)
            .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

        const collider = this.world.createCollider(colliderDesc, rigidBody);

        // Store references
        this.bodies.set(mesh, rigidBody);
        this.colliders.set(mesh, collider);

        // Track velocity for collision detection
        mesh.userData.physicsVelocity = new THREE.Vector3();
        mesh.userData.lastPosition = position.clone();

        return { rigidBody, collider };
    }

    /**
     * Add static collision geometry (walls, floors, obstacles)
     * @param {THREE.Object3D} mesh - Static mesh
     */
    addStaticCollider(mesh, options = {}) {
        if (!this.initialized) return null;

        const {
            friction = 0.7,
            restitution = 0.1
        } = options;

        // Create static rigid body
        const position = mesh.position;
        const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed()
            .setTranslation(position.x, position.y, position.z);
        
        const rigidBody = this.world.createRigidBody(rigidBodyDesc);

        // Determine collider shape based on geometry
        let colliderDesc;
        
        if (mesh.geometry.type === 'BoxGeometry') {
            const box = new THREE.Box3().setFromObject(mesh);
            const size = new THREE.Vector3();
            box.getSize(size);
            colliderDesc = RAPIER.ColliderDesc.cuboid(
                size.x / 2, size.y / 2, size.z / 2
            );
        } else if (mesh.geometry.type === 'PlaneGeometry') {
            // Use thin box for planes
            colliderDesc = RAPIER.ColliderDesc.cuboid(10, 0.1, 10);
        } else if (mesh.geometry.type === 'CylinderGeometry') {
            const radius = mesh.geometry.parameters.radiusTop || 0.5;
            const height = mesh.geometry.parameters.height || 1;
            colliderDesc = RAPIER.ColliderDesc.cylinder(height / 2, radius);
        } else {
            // Default to box collider
            const box = new THREE.Box3().setFromObject(mesh);
            const size = new THREE.Vector3();
            box.getSize(size);
            colliderDesc = RAPIER.ColliderDesc.cuboid(
                size.x / 2 || 0.5, size.y / 2 || 0.5, size.z / 2 || 0.5
            );
        }

        colliderDesc
            .setFriction(friction)
            .setRestitution(restitution);

        const collider = this.world.createCollider(colliderDesc, rigidBody);

        this.bodies.set(mesh, rigidBody);
        this.colliders.set(mesh, collider);

        return { rigidBody, collider };
    }

    /**
     * Update physics simulation and sync with Three.js scene
     * @param {number} deltaTime - Time step in seconds
     */
    update(deltaTime) {
        if (!this.initialized) return;

        // Step physics simulation
        this.world.step();

        // Update velocities for all tracked meshes
        this.updateVelocities(deltaTime);

        // Process collision events
        this.processCollisions();

        // Update ragdolls
        this.updateRagdolls(deltaTime);

        // Sync rigid bodies to Three.js meshes
        this.syncBodies();
    }

    /**
     * Calculate velocity for collision detection
     */
    updateVelocities(deltaTime) {
        if (deltaTime <= 0) return;

        for (const [mesh, rigidBody] of this.bodies) {
            if (!mesh.userData.physicsVelocity) continue;

            const currentPos = mesh.position;
            const lastPos = mesh.userData.lastPosition;

            // Calculate velocity (m/s)
            mesh.userData.physicsVelocity.subVectors(currentPos, lastPos).divideScalar(deltaTime);

            // Update last position
            mesh.userData.lastPosition.copy(currentPos);
        }
    }

    /**
     * Process collision events and trigger appropriate responses
     */
    processCollisions() {
        this.collisionEvents = [];

        // Get collision events from Rapier
        this.world.forEachColliderHandle((handle) => {
            const collider = this.world.getCollider(handle);
            
            // Check for active collisions
            this.world.contactsWith(collider, (otherCollider) => {
                this.handleCollision(collider, otherCollider);
            });
        });
    }

    /**
     * Handle individual collision between two colliders
     */
    handleCollision(collider1, collider2) {
        // Find corresponding meshes
        let mesh1 = null, mesh2 = null;

        for (const [mesh, collider] of this.colliders) {
            if (collider.handle === collider1.handle) mesh1 = mesh;
            if (collider.handle === collider2.handle) mesh2 = mesh;
        }

        if (!mesh1 || !mesh2) return;

        // Get velocities
        const velocity1 = mesh1.userData.physicsVelocity || new THREE.Vector3();
        const velocity2 = mesh2.userData.physicsVelocity || new THREE.Vector3();

        // Calculate relative impact speed
        const relativeVelocity = new THREE.Vector3().subVectors(velocity1, velocity2);
        const impactSpeed = relativeVelocity.length();

        // Create collision event
        const collisionEvent = {
            mesh1,
            mesh2,
            impactSpeed,
            impactType: this.getImpactType(impactSpeed),
            timestamp: performance.now(),
            direction: relativeVelocity.normalize()
        };

        this.collisionEvents.push(collisionEvent);

        // Notify meshes of collision
        this.notifyCollision(mesh1, collisionEvent);
    }

    /**
     * Determine impact type based on speed
     */
    getImpactType(speed) {
        if (speed < this.config.lightImpactSpeed) {
            return 'light';
        } else if (speed < this.config.mediumImpactSpeed) {
            return 'medium';
        } else if (speed < this.config.heavyImpactSpeed) {
            return 'heavy';
        } else {
            return 'ragdoll';
        }
    }

    /**
     * Notify mesh of collision event
     */
    notifyCollision(mesh, collisionEvent) {
        // Call custom collision handler if exists
        if (mesh.userData.onCollision) {
            mesh.userData.onCollision(collisionEvent);
        }

        // Store latest collision
        mesh.userData.lastCollision = collisionEvent;
    }

    /**
     * Apply knockback force to character
     * @param {THREE.Object3D} mesh - Character mesh
     * @param {THREE.Vector3} direction - Knockback direction
     * @param {string} impactType - 'light', 'medium', 'heavy', or 'ragdoll'
     */
    applyKnockback(mesh, direction, impactType) {
        const rigidBody = this.bodies.get(mesh);
        if (!rigidBody) return;

        let magnitude;
        switch (impactType) {
            case 'light':
                magnitude = this.config.lightKnockback;
                break;
            case 'medium':
                magnitude = this.config.mediumKnockback;
                break;
            case 'heavy':
            case 'ragdoll':
                magnitude = this.config.heavyKnockback;
                break;
            default:
                magnitude = 0;
        }

        // Apply impulse
        const impulse = new RAPIER.Vector3(
            direction.x * magnitude,
            direction.y * magnitude * 0.5, // Reduced vertical knockback
            direction.z * magnitude
        );

        if (rigidBody.bodyType() === RAPIER.RigidBodyType.Dynamic) {
            rigidBody.applyImpulse(impulse, true);
        }
    }

    /**
     * Activate ragdoll physics for character
     * @param {THREE.Object3D} character - Character with skeleton
     * @param {THREE.Vector3} impulseDirection - Initial impulse
     */
    activateRagdoll(character, impulseDirection = new THREE.Vector3()) {
        if (this.activeRagdolls.has(character)) return;

        // Find skeleton
        let skeleton = null;
        character.traverse((child) => {
            if (child.isSkinnedMesh && child.skeleton) {
                skeleton = child.skeleton;
            }
        });

        if (!skeleton) {
            console.warn('No skeleton found for ragdoll');
            return;
        }

        const ragdollBones = [];

        // Create rigid body for each bone
        skeleton.bones.forEach((bone) => {
            // Skip small/insignificant bones
            if (bone.name.includes('finger') || bone.name.includes('toe')) {
                return;
            }

            // Get bone world position
            const worldPos = new THREE.Vector3();
            bone.getWorldPosition(worldPos);

            // Create dynamic rigid body
            const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
                .setTranslation(worldPos.x, worldPos.y, worldPos.z)
                .setLinvel(impulseDirection.x, impulseDirection.y, impulseDirection.z);

            const rigidBody = this.world.createRigidBody(rigidBodyDesc);

            // Create capsule collider for bone
            const colliderDesc = RAPIER.ColliderDesc.capsule(0.1, 0.05)
                .setMass(1.0)
                .setFriction(0.8)
                .setRestitution(0.1);

            const collider = this.world.createCollider(colliderDesc, rigidBody);

            ragdollBones.push({
                bone,
                rigidBody,
                collider,
                originalPosition: bone.position.clone(),
                originalRotation: bone.quaternion.clone()
            });
        });

        // Store ragdoll
        this.ragdollBodies.set(character, ragdollBones);
        this.activeRagdolls.add(character);

        // Set ragdoll timer
        character.userData.ragdollTimer = this.config.ragdollDuration;
        character.userData.ragdollActive = true;

        console.log(`🎪 Ragdoll activated for character with ${ragdollBones.length} bones`);
    }

    /**
     * Deactivate ragdoll and return to animation
     */
    deactivateRagdoll(character) {
        if (!this.activeRagdolls.has(character)) return;

        const ragdollBones = this.ragdollBodies.get(character);
        
        if (ragdollBones) {
            // Remove physics bodies
            ragdollBones.forEach(({ rigidBody, collider }) => {
                this.world.removeCollider(collider, false);
                this.world.removeRigidBody(rigidBody);
            });

            // Restore bone transforms
            ragdollBones.forEach(({ bone, originalPosition, originalRotation }) => {
                bone.position.copy(originalPosition);
                bone.quaternion.copy(originalRotation);
            });
        }

        this.ragdollBodies.delete(character);
        this.activeRagdolls.delete(character);
        character.userData.ragdollActive = false;

        console.log('🎪 Ragdoll deactivated');
    }

    /**
     * Update ragdoll physics
     */
    updateRagdolls(deltaTime) {
        for (const character of this.activeRagdolls) {
            // Update ragdoll timer
            if (character.userData.ragdollTimer !== undefined) {
                character.userData.ragdollTimer -= deltaTime;

                if (character.userData.ragdollTimer <= 0) {
                    this.deactivateRagdoll(character);
                    continue;
                }
            }

            // Sync bones with physics bodies
            const ragdollBones = this.ragdollBodies.get(character);
            if (ragdollBones) {
                ragdollBones.forEach(({ bone, rigidBody }) => {
                    const translation = rigidBody.translation();
                    const rotation = rigidBody.rotation();

                    bone.position.set(translation.x, translation.y, translation.z);
                    bone.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
                });
            }
        }
    }

    /**
     * Sync Rapier rigid bodies to Three.js meshes
     */
    syncBodies() {
        for (const [mesh, rigidBody] of this.bodies) {
            // Skip if ragdoll is active
            if (this.activeRagdolls.has(mesh)) continue;

            // Kinematic bodies are controlled by code, not physics
            if (rigidBody.bodyType() === RAPIER.RigidBodyType.KinematicPositionBased) {
                // Update physics body from mesh position
                rigidBody.setNextKinematicTranslation(mesh.position);
            } else if (rigidBody.bodyType() === RAPIER.RigidBodyType.Dynamic) {
                // Update mesh from physics body
                const translation = rigidBody.translation();
                mesh.position.set(translation.x, translation.y, translation.z);

                const rotation = rigidBody.rotation();
                mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
            }
        }
    }

    /**
     * Remove mesh from physics simulation
     */
    removeBody(mesh) {
        const collider = this.colliders.get(mesh);
        const rigidBody = this.bodies.get(mesh);

        if (collider) {
            this.world.removeCollider(collider, false);
            this.colliders.delete(mesh);
        }

        if (rigidBody) {
            this.world.removeRigidBody(rigidBody);
            this.bodies.delete(mesh);
        }

        // Remove ragdoll if active
        if (this.activeRagdolls.has(mesh)) {
            this.deactivateRagdoll(mesh);
        }
    }

    /**
     * Get latest collision events
     */
    getCollisionEvents() {
        return this.collisionEvents;
    }

    /**
     * Check if character should enter ragdoll state
     */
    shouldActivateRagdoll(impactSpeed) {
        return impactSpeed >= this.config.ragdollThreshold;
    }

    /**
     * Cleanup physics world
     */
    destroy() {
        if (this.world) {
            this.world.free();
            this.world = null;
        }

        this.bodies.clear();
        this.colliders.clear();
        this.ragdollBodies.clear();
        this.activeRagdolls.clear();
        this.initialized = false;
    }
}
