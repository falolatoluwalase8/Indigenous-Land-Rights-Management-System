import { describe, it, expect, beforeEach } from 'vitest';

// Mock the Clarity contract interactions
const mockUsageRights = new Map();
const mockAdmin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
let currentSender = mockAdmin;

// Activity constants
const ACTIVITY_AGRICULTURE = 1;
const ACTIVITY_HUNTING = 2;
const ACTIVITY_FISHING = 3;
const ACTIVITY_LOGGING = 4;
const ACTIVITY_MINING = 5;
const ACTIVITY_TOURISM = 6;

// Mock contract functions
const usageRights = {
  setUsageRights: (territoryId, activityType, permitted, restrictions) => {
    if (currentSender !== mockAdmin) {
      return { err: 403 };
    }
    
    const key = `${territoryId}-${activityType}`;
    mockUsageRights.set(key, {
      permitted,
      restrictions,
      updatedAt: 123 // Mock block height
    });
    return { ok: true };
  },
  
  getUsageRights: (territoryId, activityType) => {
    const key = `${territoryId}-${activityType}`;
    return mockUsageRights.get(key) || null;
  },
  
  isActivityPermitted: (territoryId, activityType) => {
    const key = `${territoryId}-${activityType}`;
    const rights = mockUsageRights.get(key);
    return rights ? rights.permitted : false;
  }
};

describe('Usage Rights Contract', () => {
  beforeEach(() => {
    mockUsageRights.clear();
    currentSender = mockAdmin;
  });
  
  it('should set usage rights for a territory', () => {
    const territoryId = 1;
    const activityType = ACTIVITY_HUNTING;
    const permitted = true;
    const restrictions = 'Seasonal hunting only, no endangered species';
    
    const result = usageRights.setUsageRights(territoryId, activityType, permitted, restrictions);
    expect(result).toHaveProperty('ok');
    expect(result.ok).toBe(true);
    
    const rights = usageRights.getUsageRights(territoryId, activityType);
    expect(rights).not.toBeNull();
    expect(rights.permitted).toBe(permitted);
    expect(rights.restrictions).toBe(restrictions);
  });
  
  it('should check if activity is permitted', () => {
    // Set up two different activities
    usageRights.setUsageRights(1, ACTIVITY_HUNTING, true, 'Allowed');
    usageRights.setUsageRights(1, ACTIVITY_MINING, false, 'Not allowed');
    
    // Check permissions
    expect(usageRights.isActivityPermitted(1, ACTIVITY_HUNTING)).toBe(true);
    expect(usageRights.isActivityPermitted(1, ACTIVITY_MINING)).toBe(false);
    
    // Activity not set should return false
    expect(usageRights.isActivityPermitted(1, ACTIVITY_FISHING)).toBe(false);
  });
  
  it('should not allow non-admin to set usage rights', () => {
    currentSender = 'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // Different address
    
    const result = usageRights.setUsageRights(1, ACTIVITY_HUNTING, true, 'Test');
    expect(result).toHaveProperty('err');
    expect(result.err).toBe(403);
  });
});
