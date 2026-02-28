import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrders, getOrder, createOrder } from '../../src/tools/orders.js';

vi.mock('../../src/api/client.js', () => ({
  getClient: vi.fn(),
}));

import { getClient } from '../../src/api/client.js';

describe('orders tools', () => {
  const mockClient = {
    getList: vi.fn(),
    getOne: vi.fn(),
    create: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getClient).mockReturnValue(mockClient as any);
  });

  describe('getOrders', () => {
    it('should return list of orders', async () => {
      mockClient.getList.mockResolvedValueOnce({
        meta: { size: 2, limit: 25, offset: 0 },
        rows: [
          {
            id: '1',
            name: '00001',
            moment: '2024-01-15 10:00:00',
            sum: 1000000, // kopeks
            state: { name: 'Новый' },
            deliveryPlannedMoment: '2024-01-20',
          },
          {
            id: '2',
            name: '00002',
            moment: '2024-01-16 11:00:00',
            sum: 2500000,
            state: { name: 'Подтвержден' },
          },
        ],
      });

      const result = await getOrders({});

      expect(result.success).toBe(true);
      expect(result.data?.orders).toHaveLength(2);
      expect(result.data?.orders[0]).toEqual({
        id: '1',
        name: '00001',
        moment: '2024-01-15 10:00:00',
        sum: 10000, // converted to rubles
        state: 'Новый',
        deliveryPlannedMoment: '2024-01-20',
      });
    });

    it('should filter by agentId', async () => {
      mockClient.getList.mockResolvedValueOnce({
        meta: { size: 0, limit: 25, offset: 0 },
        rows: [],
      });

      await getOrders({ agentId: 'agent-uuid-123' });

      const params = mockClient.getList.mock.calls[0][1] as URLSearchParams;
      expect(params.get('filter')).toContain('agent=https://api.moysklad.ru/api/remap/1.2/entity/counterparty/agent-uuid-123');
    });

    it('should filter by stateId', async () => {
      mockClient.getList.mockResolvedValueOnce({
        meta: { size: 0, limit: 25, offset: 0 },
        rows: [],
      });

      await getOrders({ stateId: 'state-uuid-123' });

      const params = mockClient.getList.mock.calls[0][1] as URLSearchParams;
      expect(params.get('filter')).toContain('state=https://api.moysklad.ru/api/remap/1.2/entity/customerorder/metadata/states/state-uuid-123');
    });

    it('should filter by date range', async () => {
      mockClient.getList.mockResolvedValueOnce({
        meta: { size: 0, limit: 25, offset: 0 },
        rows: [],
      });

      await getOrders({ dateFrom: '2024-01-01', dateTo: '2024-01-31' });

      const params = mockClient.getList.mock.calls[0][1] as URLSearchParams;
      const filter = params.get('filter');
      expect(filter).toContain('moment>=2024-01-01 00:00:00');
      expect(filter).toContain('moment<=2024-01-31 23:59:59');
    });

    it('should order by moment desc', async () => {
      mockClient.getList.mockResolvedValueOnce({
        meta: { size: 0, limit: 25, offset: 0 },
        rows: [],
      });

      await getOrders({});

      const params = mockClient.getList.mock.calls[0][1] as URLSearchParams;
      expect(params.get('order')).toBe('moment,desc');
    });

    it('should handle errors', async () => {
      mockClient.getList.mockRejectedValueOnce(new Error('API Error'));

      const result = await getOrders({});

      expect(result.success).toBe(false);
      expect(result.error).toContain('API Error');
    });
  });

  describe('getOrder', () => {
    it('should return order with positions', async () => {
      mockClient.getOne.mockResolvedValueOnce({
        id: '123',
        name: '00001',
        moment: '2024-01-15 10:00:00',
        sum: 1500000,
        state: { name: 'Новый' },
        deliveryPlannedMoment: '2024-01-20',
        positions: {
          rows: [
            {
              id: 'pos1',
              assortment: { name: 'iPhone 15' },
              quantity: 2,
              price: 9999900, // kopeks
              discount: 10,
            },
          ],
        },
      });

      const result = await getOrder({ id: '123' });

      expect(result.success).toBe(true);
      expect(result.data?.positions).toHaveLength(1);
      expect(result.data?.positions?.[0]).toEqual({
        id: 'pos1',
        name: 'iPhone 15',
        quantity: 2,
        price: 99999, // rubles
        discount: 10,
        sum: 179998.2, // (2 * 99999 * 0.9)
      });
    });

    it('should expand positions by default', async () => {
      mockClient.getOne.mockResolvedValueOnce({
        id: '123',
        name: '00001',
        moment: '2024-01-15',
        sum: 0,
      });

      await getOrder({ id: '123' });

      const params = mockClient.getOne.mock.calls[0][2] as URLSearchParams;
      expect(params.get('expand')).toBe('positions,agent');
    });

    it('should not expand when disabled', async () => {
      mockClient.getOne.mockResolvedValueOnce({
        id: '123',
        name: '00001',
        moment: '2024-01-15',
        sum: 0,
      });

      await getOrder({ id: '123', expand: false });

      const params = mockClient.getOne.mock.calls[0][2] as URLSearchParams;
      expect(params.get('expand')).toBeNull();
    });

    it('should handle errors', async () => {
      mockClient.getOne.mockRejectedValueOnce(new Error('Not found'));

      const result = await getOrder({ id: 'invalid' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not found');
    });
  });

  describe('createOrder', () => {
    it('should create order with positions', async () => {
      mockClient.create.mockResolvedValueOnce({
        id: 'new-order-123',
        name: '00003',
        moment: '2024-01-20 12:00:00',
        sum: 9999900,
      });

      const result = await createOrder({
        organizationId: 'org-123',
        agentId: 'agent-456',
        positions: [
          { productId: 'product-789', quantity: 1, price: 99999 },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: 'new-order-123',
        name: '00003',
        moment: '2024-01-20 12:00:00',
        sum: 99999,
      });
    });

    it('should send correct request body', async () => {
      mockClient.create.mockResolvedValueOnce({
        id: 'new',
        name: '00001',
        moment: '2024-01-20',
        sum: 0,
      });

      await createOrder({
        organizationId: 'org-123',
        agentId: 'agent-456',
        storeId: 'store-789',
        positions: [
          { productId: 'prod-1', quantity: 2, price: 1000, discount: 5 },
        ],
        description: 'Test order',
      });

      const body = mockClient.create.mock.calls[0][1];

      expect(body.organization.meta.href).toContain('organization/org-123');
      expect(body.agent.meta.href).toContain('counterparty/agent-456');
      expect(body.store.meta.href).toContain('store/store-789');
      expect(body.positions[0].assortment.meta.href).toContain('product/prod-1');
      expect(body.positions[0].quantity).toBe(2);
      expect(body.positions[0].price).toBe(100000); // converted to kopeks
      expect(body.positions[0].discount).toBe(5);
      expect(body.description).toBe('Test order');
    });

    it('should handle order without optional fields', async () => {
      mockClient.create.mockResolvedValueOnce({
        id: 'new',
        name: '00001',
        moment: '2024-01-20',
        sum: 0,
      });

      await createOrder({
        organizationId: 'org-123',
        agentId: 'agent-456',
        positions: [
          { productId: 'prod-1', quantity: 1 },
        ],
      });

      const body = mockClient.create.mock.calls[0][1];

      expect(body.store).toBeUndefined();
      expect(body.description).toBeUndefined();
      expect(body.positions[0].price).toBeUndefined();
      expect(body.positions[0].discount).toBeUndefined();
    });

    it('should handle errors', async () => {
      mockClient.create.mockRejectedValueOnce(new Error('Validation error'));

      const result = await createOrder({
        organizationId: 'org-123',
        agentId: 'agent-456',
        positions: [{ productId: 'prod-1', quantity: 1 }],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation error');
    });
  });
});
