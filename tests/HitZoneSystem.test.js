import { describe, it, expect, beforeEach } from 'vitest';
import { HitZoneSystem } from '../src/systems/HitZoneSystem.js';

describe('HitZoneSystem', () => {
  let hitZones;
  
  beforeEach(() => {
    hitZones = new HitZoneSystem();
  });
  
  describe('Damage Multipliers', () => {
    it('should have correct head damage multiplier', () => {
      expect(hitZones.hitZones.HEAD.multiplier).toBe(1.5);
    });
    
    it('should have correct body damage multiplier', () => {
      expect(hitZones.hitZones.BODY.multiplier).toBe(1.0);
    });
    
    it('should have correct limbs damage multiplier', () => {
      expect(hitZones.hitZones.LIMBS.multiplier).toBe(0.5);
    });
  });
  
  describe('Bone Mapping', () => {
    it('should map head bones correctly', () => {
      expect(hitZones.boneToZone['head']).toBe('HEAD');
      expect(hitZones.boneToZone['neck']).toBe('HEAD');
      expect(hitZones.boneToZone['Head']).toBe('HEAD');
    });
    
    it('should map body bones correctly', () => {
      expect(hitZones.boneToZone['spine']).toBe('BODY');
      expect(hitZones.boneToZone['chest']).toBe('BODY');
      expect(hitZones.boneToZone['Torso']).toBe('BODY');
    });
    
    it('should map limb bones correctly', () => {
      expect(hitZones.boneToZone['hand']).toBe('LIMBS');
      expect(hitZones.boneToZone['foot']).toBe('LIMBS');
      expect(hitZones.boneToZone['LeftArm']).toBe('LIMBS');
    });
  });
  
  describe('getDamageMultiplier', () => {
    it('should return correct multiplier for head', () => {
      expect(hitZones.getDamageMultiplier('head')).toBe(1.5);
    });
    
    it('should return correct multiplier for spine', () => {
      expect(hitZones.getDamageMultiplier('spine')).toBe(1.0);
    });
    
    it('should return correct multiplier for hand', () => {
      expect(hitZones.getDamageMultiplier('hand')).toBe(0.5);
    });
    
    it('should default to BODY multiplier for unknown bones', () => {
      expect(hitZones.getDamageMultiplier('unknownbone')).toBe(1.0);
    });
  });
  
  describe('getHitZoneName', () => {
    it('should return zone name for head bones', () => {
      expect(hitZones.getHitZoneName('head')).toBe('Head');
    });
    
    it('should return zone name for body bones', () => {
      expect(hitZones.getHitZoneName('spine')).toBe('Body');
    });
    
    it('should return zone name for limb bones', () => {
      expect(hitZones.getHitZoneName('hand')).toBe('Limbs');
    });
  });
});
