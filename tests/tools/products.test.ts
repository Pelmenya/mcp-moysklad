import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProducts, getProduct } from '../../src/tools/products.js';

// Mock the client
vi.mock('../../src/api/client.js', () => ({
  getClient: vi.fn(),
}));

import { getClient } from '../../src/api/client.js';

describe('products tools', () => {
  const mockClient = {
    getList: vi.fn(),
    getOne: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getClient).mockReturnValue(mockClient as any);
  });

  describe('getProducts', () => {
    it('should return list of products', async () => {
      mockClient.getList.mockResolvedValueOnce({
        meta: { size: 2, limit: 25, offset: 0 },
        rows: [
          {
            id: '1',
            name: 'Product 1',
            article: 'ART001',
            code: 'CODE1',
            description: 'Desc 1',
            archived: false,
            updated: '2024-01-01',
          },
          {
            id: '2',
            name: 'Product 2',
            article: 'ART002',
            code: 'CODE2',
            description: 'Desc 2',
            archived: false,
            updated: '2024-01-02',
          },
        ],
      });

      const result = await getProducts({});

      expect(result.success).toBe(true);
      expect(result.data?.products).toHaveLength(2);
      expect(result.data?.products[0]).toEqual({
        id: '1',
        name: 'Product 1',
        article: 'ART001',
        code: 'CODE1',
        description: 'Desc 1',
        archived: false,
        updated: '2024-01-01',
      });
    });

    it('should apply search filter', async () => {
      mockClient.getList.mockResolvedValueOnce({
        meta: { size: 0, limit: 25, offset: 0 },
        rows: [],
      });

      await getProducts({ search: 'iPhone' });

      expect(mockClient.getList).toHaveBeenCalledWith(
        'entity/product',
        expect.any(URLSearchParams)
      );

      const params = mockClient.getList.mock.calls[0][1] as URLSearchParams;
      expect(params.get('search')).toBe('iPhone');
    });

    it('should apply article filter', async () => {
      mockClient.getList.mockResolvedValueOnce({
        meta: { size: 0, limit: 25, offset: 0 },
        rows: [],
      });

      await getProducts({ article: 'ART001' });

      const params = mockClient.getList.mock.calls[0][1] as URLSearchParams;
      expect(params.get('filter')).toContain('article=ART001');
    });

    it('should include archived filter by default', async () => {
      mockClient.getList.mockResolvedValueOnce({
        meta: { size: 0, limit: 25, offset: 0 },
        rows: [],
      });

      await getProducts({});

      const params = mockClient.getList.mock.calls[0][1] as URLSearchParams;
      expect(params.get('filter')).toContain('archived=false');
    });

    it('should allow including archived products', async () => {
      mockClient.getList.mockResolvedValueOnce({
        meta: { size: 0, limit: 25, offset: 0 },
        rows: [],
      });

      await getProducts({ archived: true });

      const params = mockClient.getList.mock.calls[0][1] as URLSearchParams;
      expect(params.get('filter')).toContain('archived=true');
    });

    it('should apply pagination', async () => {
      mockClient.getList.mockResolvedValueOnce({
        meta: { size: 100, limit: 50, offset: 25 },
        rows: [],
      });

      await getProducts({ limit: 50, offset: 25 });

      const params = mockClient.getList.mock.calls[0][1] as URLSearchParams;
      expect(params.get('limit')).toBe('50');
      expect(params.get('offset')).toBe('25');
    });

    it('should return pagination meta', async () => {
      mockClient.getList.mockResolvedValueOnce({
        meta: { size: 100, limit: 25, offset: 0 },
        rows: [],
      });

      const result = await getProducts({});

      expect(result.data?.pagination).toEqual({
        size: 100,
        limit: 25,
        offset: 0,
        hasMore: true,
      });
    });

    it('should handle errors', async () => {
      mockClient.getList.mockRejectedValueOnce(new Error('Network error'));

      const result = await getProducts({});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('getProduct', () => {
    it('should return product by ID', async () => {
      mockClient.getOne.mockResolvedValueOnce({
        id: '123',
        name: 'iPhone 15',
        article: 'IP15',
        code: 'CODE123',
        description: 'Latest iPhone',
        archived: false,
        updated: '2024-01-15',
        salePrices: [
          {
            value: 9999900, // in kopeks
            priceType: { name: 'Розничная' },
          },
        ],
        buyPrice: { value: 7000000 },
        weight: 0.171,
        volume: 0.0001,
      });

      const result = await getProduct({ id: '123' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: '123',
        name: 'iPhone 15',
        article: 'IP15',
        code: 'CODE123',
        description: 'Latest iPhone',
        archived: false,
        updated: '2024-01-15',
        salePrices: [{ value: 99999, priceType: 'Розничная' }], // converted to rubles
        buyPrice: 70000, // converted to rubles
        weight: 0.171,
        volume: 0.0001,
      });
    });

    it('should handle product without prices', async () => {
      mockClient.getOne.mockResolvedValueOnce({
        id: '456',
        name: 'Simple Product',
        archived: false,
        updated: '2024-01-01',
      });

      const result = await getProduct({ id: '456' });

      expect(result.success).toBe(true);
      expect(result.data?.salePrices).toBeUndefined();
      expect(result.data?.buyPrice).toBeUndefined();
    });

    it('should handle errors', async () => {
      mockClient.getOne.mockRejectedValueOnce(new Error('Not found'));

      const result = await getProduct({ id: 'invalid' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not found');
    });
  });
});
