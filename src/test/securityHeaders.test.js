import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Security Headers Configuration (vercel.json)', () => {
  it('includes Strict-Transport-Security with includeSubDomains and preload', () => {
    const vercelConfigPath = path.resolve(process.cwd(), 'vercel.json');
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));

    const globalHeaders = vercelConfig.headers?.find((rule) => rule.source === '/(.*)')?.headers || [];
    const hstsHeader = globalHeaders.find(
      (h) => h.key.toLowerCase() === 'strict-transport-security',
    );

    expect(hstsHeader).toBeDefined();
    expect(hstsHeader.value).toContain('includeSubDomains');
    expect(hstsHeader.value).toContain('preload');
  });

  it('includes Cross-Origin-Opener-Policy set to same-origin', () => {
    const vercelConfigPath = path.resolve(process.cwd(), 'vercel.json');
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));

    const globalHeaders = vercelConfig.headers?.find((rule) => rule.source === '/(.*)')?.headers || [];
    const coopHeader = globalHeaders.find(
      (h) => h.key.toLowerCase() === 'cross-origin-opener-policy',
    );

    expect(coopHeader).toBeDefined();
    expect(coopHeader.value).toBe('same-origin');
  });
});
