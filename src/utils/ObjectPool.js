/**
 * ObjectPool - Reusable object pooling for performance
 * 
 * Prevents garbage collection overhead by reusing objects instead of
 * constantly creating and destroying them.
 * 
 * @example
 * const pool = new ObjectPool(() => new THREE.Mesh(geometry, material), 100);
 * const obj = pool.acquire();
 * // Use object...
 * pool.release(obj);
 */
export class ObjectPool {
  /**
   * @param {Function} factory - Function that creates new objects
   * @param {number} initialSize - Initial pool size
   * @param {number} maxSize - Maximum pool size (0 = unlimited)
   */
  constructor(factory, initialSize = 10, maxSize = 0) {
    this.factory = factory;
    this.maxSize = maxSize;
    this.pool = [];
    this.activeObjects = new Set();
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
    
    this.stats = {
      created: initialSize,
      acquired: 0,
      released: 0,
      reused: 0
    };
  }
  
  /**
   * Get an object from the pool
   * @returns {*} Object from pool or newly created
   */
  acquire() {
    this.stats.acquired++;
    
    let obj;
    if (this.pool.length > 0) {
      obj = this.pool.pop();
      this.stats.reused++;
    } else {
      obj = this.factory();
      this.stats.created++;
    }
    
    this.activeObjects.add(obj);
    return obj;
  }
  
  /**
   * Return an object to the pool
   * @param {*} obj - Object to return
   */
  release(obj) {
    if (!this.activeObjects.has(obj)) {
      console.warn('ObjectPool: Releasing object not from this pool');
      return;
    }
    
    this.activeObjects.delete(obj);
    
    // Check max size
    if (this.maxSize === 0 || this.pool.length < this.maxSize) {
      this.pool.push(obj);
      this.stats.released++;
    }
  }
  
  /**
   * Release all active objects
   */
  releaseAll() {
    for (const obj of this.activeObjects) {
      this.release(obj);
    }
  }
  
  /**
   * Clear the entire pool
   */
  clear() {
    this.pool = [];
    this.activeObjects.clear();
  }
  
  /**
   * Get pool statistics
   */
  getStats() {
    return {
      ...this.stats,
      available: this.pool.length,
      active: this.activeObjects.size,
      total: this.pool.length + this.activeObjects.size,
      reuseRate: this.stats.acquired > 0 ? 
        (this.stats.reused / this.stats.acquired * 100).toFixed(1) + '%' : '0%'
    };
  }
}

/**
 * Specialized pool for Three.js objects with proper disposal
 */
export class ThreeObjectPool extends ObjectPool {
  constructor(factory, initialSize = 10, maxSize = 0) {
    super(factory, initialSize, maxSize);
    this.disposalCallbacks = [];
  }
  
  /**
   * Add a disposal callback for proper cleanup
   * @param {Function} callback - Function to call on dispose
   */
  addDisposalCallback(callback) {
    this.disposalCallbacks.push(callback);
  }
  
  /**
   * Release and dispose Three.js object properly
   */
  release(obj) {
    // Reset object state
    if (obj.position) obj.position.set(0, 0, 0);
    if (obj.rotation) obj.rotation.set(0, 0, 0);
    if (obj.scale) obj.scale.set(1, 1, 1);
    if (obj.visible !== undefined) obj.visible = false;
    
    super.release(obj);
  }
  
  /**
   * Clear and dispose all objects
   */
  dispose() {
    // Dispose all objects
    const allObjects = [...this.pool, ...this.activeObjects];
    
    for (const obj of allObjects) {
      // Call disposal callbacks
      for (const callback of this.disposalCallbacks) {
        callback(obj);
      }
      
      // Standard Three.js disposal
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    }
    
    this.clear();
  }
}

/**
 * Pool manager for multiple pools
 */
export class PoolManager {
  constructor() {
    this.pools = new Map();
  }
  
  /**
   * Create a new pool
   */
  createPool(name, factory, initialSize = 10, maxSize = 0, isThree = false) {
    const PoolClass = isThree ? ThreeObjectPool : ObjectPool;
    const pool = new PoolClass(factory, initialSize, maxSize);
    this.pools.set(name, pool);
    return pool;
  }
  
  /**
   * Get a pool by name
   */
  getPool(name) {
    return this.pools.get(name);
  }
  
  /**
   * Acquire from a named pool
   */
  acquire(poolName) {
    const pool = this.pools.get(poolName);
    if (!pool) {
      console.error(`PoolManager: Pool not found: ${poolName}`);
      return null;
    }
    return pool.acquire();
  }
  
  /**
   * Release to a named pool
   */
  release(poolName, obj) {
    const pool = this.pools.get(poolName);
    if (!pool) {
      console.error(`PoolManager: Pool not found: ${poolName}`);
      return;
    }
    pool.release(obj);
  }
  
  /**
   * Get all pool stats
   */
  getAllStats() {
    const stats = {};
    for (const [name, pool] of this.pools.entries()) {
      stats[name] = pool.getStats();
    }
    return stats;
  }
  
  /**
   * Dispose all pools
   */
  disposeAll() {
    for (const pool of this.pools.values()) {
      if (pool.dispose) pool.dispose();
      else pool.clear();
    }
    this.pools.clear();
  }
}
