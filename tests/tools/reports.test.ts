import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDashboard } from '../../src/tools/reports.js';

vi.mock('../../src/api/client.js', () => ({
  getClient: vi.fn(),
}));

import { getClient } from '../../src/api/client.js';

describe('reports tools', () => {
  const mockClient = {
    request: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getClient).mockReturnValue(mockClient as any);
  });

  describe('getDashboard', () => {
    it('should return dashboard data', async () => {
      mockClient.request.mockResolvedValueOnce({
        sales: {
          count: 150,
          amount: 1500000000, // kopeks
          movementAmount: 50000000,
        },
        orders: {
          count: 200,
          amount: 2000000000,
          movementAmount: 100000000,
        },
        money: {
          balance: 500000000,
          credit: 100000000,
          debit: 50000000,
        },
      });

      const result = await getDashboard({});

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        sales: {
          count: 150,
          amount: 15000000, // converted to rubles
          movementAmount: 500000,
        },
        orders: {
          count: 200,
          amount: 20000000,
          movementAmount: 1000000,
        },
        money: {
          balance: 5000000,
          credit: 1000000,
          debit: 500000,
        },
      });
    });

    it('should call correct endpoint', async () => {
      mockClient.request.mockResolvedValueOnce({
        sales: { count: 0, amount: 0, movementAmount: 0 },
        orders: { count: 0, amount: 0, movementAmount: 0 },
        money: { balance: 0, credit: 0, debit: 0 },
      });

      await getDashboard({});

      expect(mockClient.request).toHaveBeenCalledWith('report/dashboard');
    });

    it('should handle errors', async () => {
      mockClient.request.mockRejectedValueOnce(new Error('Unauthorized'));

      const result = await getDashboard({});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });

    it('should handle zero values', async () => {
      mockClient.request.mockResolvedValueOnce({
        sales: { count: 0, amount: 0, movementAmount: 0 },
        orders: { count: 0, amount: 0, movementAmount: 0 },
        money: { balance: 0, credit: 0, debit: 0 },
      });

      const result = await getDashboard({});

      expect(result.success).toBe(true);
      expect(result.data?.sales.amount).toBe(0);
      expect(result.data?.money.balance).toBe(0);
    });
  });
});
