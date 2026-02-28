import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getStock, getStockByStore } from '../../src/tools/stock.js';

vi.mock('../../src/api/client.js', () => ({
    getClient: vi.fn(),
}));

import { getClient } from '../../src/api/client.js';

describe('stock tools', () => {
    const mockClient = {
        getList: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getClient).mockReturnValue(mockClient as any);
    });

    describe('getStock', () => {
        it('should return stock items', async () => {
            mockClient.getList.mockResolvedValueOnce({
                meta: { size: 2, limit: 25, offset: 0 },
                rows: [
                    {
                        name: 'Product 1',
                        code: 'P001',
                        article: 'ART001',
                        stock: 100,
                        reserve: 10,
                        salePrice: 99900, // kopeks
                    },
                    {
                        name: 'Product 2',
                        code: 'P002',
                        article: 'ART002',
                        stock: 50,
                        reserve: 0,
                        salePrice: 149900,
                    },
                ],
            });

            const result = await getStock({});

            expect(result.success).toBe(true);
            expect(result.data?.items).toHaveLength(2);
            expect(result.data?.items[0]).toEqual({
                name: 'Product 1',
                code: 'P001',
                article: 'ART001',
                stock: 100,
                reserve: 10,
                available: 90,
                salePrice: 999, // converted to rubles
            });
        });

        it('should apply search filter', async () => {
            mockClient.getList.mockResolvedValueOnce({
                meta: { size: 0, limit: 25, offset: 0 },
                rows: [],
            });

            await getStock({ search: 'iPhone' });

            const params = mockClient.getList.mock.calls[0][1] as URLSearchParams;
            expect(params.get('search')).toBe('iPhone');
        });

        it('should apply stockMode filter', async () => {
            mockClient.getList.mockResolvedValueOnce({
                meta: { size: 0, limit: 25, offset: 0 },
                rows: [],
            });

            await getStock({ stockMode: 'positiveOnly' });

            const params = mockClient.getList.mock.calls[0][1] as URLSearchParams;
            expect(params.get('stockMode')).toBe('positiveOnly');
        });

        it('should handle items without salePrice', async () => {
            mockClient.getList.mockResolvedValueOnce({
                meta: { size: 1, limit: 25, offset: 0 },
                rows: [
                    {
                        name: 'Product',
                        stock: 10,
                        reserve: 0,
                    },
                ],
            });

            const result = await getStock({});

            expect(result.data?.items[0].salePrice).toBeUndefined();
        });

        it('should handle errors', async () => {
            mockClient.getList.mockRejectedValueOnce(new Error('API Error'));

            const result = await getStock({});

            expect(result.success).toBe(false);
            expect(result.error).toContain('API Error');
        });
    });

    describe('getStockByStore', () => {
        it('should return stock for specific store', async () => {
            mockClient.getList.mockResolvedValueOnce({
                meta: { size: 1, limit: 25, offset: 0 },
                rows: [
                    {
                        name: 'Product 1',
                        code: 'P001',
                        article: 'ART001',
                        stock: 50,
                        reserve: 5,
                    },
                ],
            });

            const result = await getStockByStore({ storeId: 'store-uuid-123' });

            expect(result.success).toBe(true);
            expect(result.data?.storeId).toBe('store-uuid-123');
            expect(result.data?.items[0]).toEqual({
                name: 'Product 1',
                code: 'P001',
                article: 'ART001',
                stock: 50,
                reserve: 5,
                available: 45,
            });
        });

        it('should filter by store ID', async () => {
            mockClient.getList.mockResolvedValueOnce({
                meta: { size: 0, limit: 25, offset: 0 },
                rows: [],
            });

            await getStockByStore({ storeId: 'store-uuid-123' });

            const params = mockClient.getList.mock.calls[0][1] as URLSearchParams;
            expect(params.get('filter')).toContain(
                'store=https://api.moysklad.ru/api/remap/1.2/entity/store/store-uuid-123'
            );
        });

        it('should apply search filter', async () => {
            mockClient.getList.mockResolvedValueOnce({
                meta: { size: 0, limit: 25, offset: 0 },
                rows: [],
            });

            await getStockByStore({ storeId: 'store-123', search: 'test' });

            const params = mockClient.getList.mock.calls[0][1] as URLSearchParams;
            expect(params.get('search')).toBe('test');
        });

        it('should handle errors', async () => {
            mockClient.getList.mockRejectedValueOnce(new Error('Store not found'));

            const result = await getStockByStore({ storeId: 'invalid' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Store not found');
        });
    });
});
