import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithRetry } from '../lib/apiRetry';

describe('fetchWithRetry', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return response on successful fetch', async () => {
    const mockResponse = { ok: true, json: async () => ({ success: true }) };
    globalThis.fetch.mockResolvedValueOnce(mockResponse);

    const result = await fetchWithRetry('/api/test');
    expect(result).toBe(mockResponse);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on 503 status code', async () => {
    const mockErrorResponse = { ok: false, status: 503 };
    const mockSuccessResponse = { ok: true, json: async () => ({ success: true }) };

    globalThis.fetch.mockResolvedValueOnce(mockErrorResponse);
    globalThis.fetch.mockResolvedValueOnce(mockSuccessResponse);

    const result = await fetchWithRetry('/api/test', {}, { maxRetries: 3, initialDelayMs: 10 });
    expect(result).toBe(mockSuccessResponse);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('should not retry on 404 status code', async () => {
    const mockResponse = { ok: false, status: 404 };
    globalThis.fetch.mockResolvedValueOnce(mockResponse);

    const result = await fetchWithRetry('/api/test', {}, { maxRetries: 3 });
    expect(result).toBe(mockResponse);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('should throw on network error after max retries', async () => {
    const networkError = new TypeError('Failed to fetch');
    globalThis.fetch.mockRejectedValue(networkError);

    await expect(fetchWithRetry('/api/test', {}, { maxRetries: 2, initialDelayMs: 10 })).rejects.toThrow(
      'Failed to fetch',
    );

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});
