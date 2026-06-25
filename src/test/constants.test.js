import { describe, it, expect } from 'vitest';
import { SUPPORTED_ROLES, SERVICE_FEE_RATE } from '../lib/constants';

describe('constants', () => {
  it('should have SUPPORTED_ROLES defined', () => {
    expect(SUPPORTED_ROLES).toBeDefined();
    expect(SUPPORTED_ROLES.CLIENT).toBe('client');
    expect(SUPPORTED_ROLES.OWNER).toBe('owner');
    expect(SUPPORTED_ROLES.MANAGEMENT).toBe('management');
  });

  it('should have SERVICE_FEE_RATE defined', () => {
    expect(SERVICE_FEE_RATE).toBe(0.12);
  });
});
