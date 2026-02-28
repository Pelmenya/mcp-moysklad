import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MoySkladClient } from '../../src/api/client.js';
import { MoySkladError } from '../../src/utils/errors.js';

// Mock config
vi.mock('../../src/config.js', () => ({
  getConfig: () => ({
    token: 'test-token',
    baseUrl: 'https://api.moysklad.ru/api/remap/1.2',
  }),
  getAuthHeader: () => 'Bearer test-token',
}));

describe('MoySkladClient', () => {
  let client: MoySkladClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    client = new MoySkladClient();
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('request', () => {
    it('should make GET request with correct headers', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rows: [] }),
      });

      await client.request('entity/product');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.moysklad.ru/api/remap/1.2/entity/product',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
            'Accept': 'application/json;charset=utf-8',
          },
        })
      );
    });

    it('should append query params to URL', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rows: [] }),
      });

      const params = new URLSearchParams({ limit: '25', search: 'test' });
      await client.request('entity/product', { params });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.moysklad.ru/api/remap/1.2/entity/product?limit=25&search=test',
        expect.any(Object)
      );
    });

    it('should make POST request with body', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123' }),
      });

      const body = { name: 'Test Product' };
      await client.request('entity/product', { method: 'POST', body });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        })
      );
    });

    it('should throw MoySkladError on API error', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          errors: [{ error: 'Not found', code: 1002 }],
        }),
      });

      await expect(client.request('entity/product/invalid')).rejects.toThrow(MoySkladError);
    });

    it('should retry on rate limit (429)', async () => {
      // First call returns 429, second succeeds
      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Map([['Retry-After', '1']]),
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ rows: [] }),
        });

      const result = await client.request('entity/product');

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ rows: [] });
    });

    it('should retry on network error', async () => {
      fetchMock
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const result = await client.request('entity/product');

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ success: true });
    });

    it('should throw after max retries', async () => {
      fetchMock.mockRejectedValue(new Error('Persistent error'));

      await expect(client.request('entity/product')).rejects.toThrow(MoySkladError);
      expect(fetchMock).toHaveBeenCalledTimes(3); // MAX_RETRIES = 3
    });
  });

  describe('getList', () => {
    it('should return list response', async () => {
      const mockResponse = {
        meta: { size: 2, limit: 25, offset: 0 },
        rows: [{ id: '1' }, { id: '2' }],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getList('entity/product');

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getOne', () => {
    it('should return single entity', async () => {
      const mockProduct = { id: '123', name: 'Product' };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduct,
      });

      const result = await client.getOne('entity/product', '123');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.moysklad.ru/api/remap/1.2/entity/product/123',
        expect.any(Object)
      );
      expect(result).toEqual(mockProduct);
    });
  });

  describe('create', () => {
    it('should create entity', async () => {
      const newProduct = { name: 'New Product' };
      const createdProduct = { id: '456', name: 'New Product' };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => createdProduct,
      });

      const result = await client.create('entity/product', newProduct);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.moysklad.ru/api/remap/1.2/entity/product',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newProduct),
        })
      );
      expect(result).toEqual(createdProduct);
    });
  });

  describe('update', () => {
    it('should update entity', async () => {
      const updateData = { name: 'Updated Product' };
      const updatedProduct = { id: '123', name: 'Updated Product' };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedProduct,
      });

      const result = await client.update('entity/product', '123', updateData);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.moysklad.ru/api/remap/1.2/entity/product/123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
      expect(result).toEqual(updatedProduct);
    });
  });
});
