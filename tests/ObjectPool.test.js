import { describe, it, expect, beforeEach } from 'vitest';
import { ObjectPool } from '../src/utils/ObjectPool.js';

describe('ObjectPool', () => {
  let pool;
  let factory;
  let createdObjects;
  
  beforeEach(() => {
    createdObjects = [];
    factory = () => {
      const obj = { id: createdObjects.length };
      createdObjects.push(obj);
      return obj;
    };
    pool = new ObjectPool(factory, 5, 10);
  });
  
  describe('Initialization', () => {
    it('should pre-populate pool with initial size', () => {
      expect(createdObjects.length).toBe(5);
      expect(pool.getStats().available).toBe(5);
    });
    
    it('should have zero active objects initially', () => {
      expect(pool.getStats().active).toBe(0);
    });
  });
  
  describe('acquire', () => {
    it('should return object from pool', () => {
      const obj = pool.acquire();
      expect(obj).toBeDefined();
      expect(obj.id).toBeGreaterThanOrEqual(0);
    });
    
    it('should decrease available count', () => {
      pool.acquire();
      expect(pool.getStats().available).toBe(4);
    });
    
    it('should increase active count', () => {
      pool.acquire();
      expect(pool.getStats().active).toBe(1);
    });
    
    it('should create new object if pool is empty', () => {
      // Acquire all 5
      for (let i = 0; i < 5; i++) {
        pool.acquire();
      }
      expect(createdObjects.length).toBe(5);
      
      // Acquire 6th - should create new
      pool.acquire();
      expect(createdObjects.length).toBe(6);
    });
  });
  
  describe('release', () => {
    it('should return object to pool', () => {
      const obj = pool.acquire();
      pool.release(obj);
      expect(pool.getStats().available).toBe(5);
      expect(pool.getStats().active).toBe(0);
    });
    
    it('should allow object to be reused', () => {
      const obj1 = pool.acquire();
      pool.release(obj1);
      const obj2 = pool.acquire();
      expect(obj2).toBe(obj1); // Same object reused
    });
    
    it('should track reuse rate', () => {
      const obj = pool.acquire();
      pool.release(obj);
      pool.acquire(); // Reused
      const stats = pool.getStats();
      expect(stats.reused).toBe(1);
    });
  });
  
  describe('releaseAll', () => {
    it('should release all active objects', () => {
      pool.acquire();
      pool.acquire();
      pool.acquire();
      expect(pool.getStats().active).toBe(3);
      
      pool.releaseAll();
      expect(pool.getStats().active).toBe(0);
    });
  });
  
  describe('clear', () => {
    it('should clear entire pool', () => {
      pool.acquire();
      pool.clear();
      expect(pool.getStats().available).toBe(0);
      expect(pool.getStats().active).toBe(0);
    });
  });
  
  describe('Max size limit', () => {
    it('should respect max size', () => {
      // Acquire and release 15 objects (max is 10)
      const objects = [];
      for (let i = 0; i < 15; i++) {
        objects.push(pool.acquire());
      }
      
      objects.forEach(obj => pool.release(obj));
      
      // Should only keep 10 in pool
      expect(pool.getStats().available).toBeLessThanOrEqual(10);
    });
  });
});
