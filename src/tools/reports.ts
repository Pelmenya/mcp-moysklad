import { z } from 'zod';
import { getClient } from '../api/client.js';
import { ENDPOINTS } from '../api/endpoints.js';
import type { MsDashboard } from '../api/types.js';
import { formatErrorForMcp } from '../utils/errors.js';

export const getDashboardSchema = z.object({});

export type GetDashboardInput = z.infer<typeof getDashboardSchema>;

export async function getDashboard(_input: GetDashboardInput) {
    try {
        const client = getClient();
        const dashboard = await client.request<MsDashboard>(ENDPOINTS.dashboard);

        return {
            success: true,
            data: {
                sales: {
                    count: dashboard.sales.count,
                    amount: dashboard.sales.amount / 100, // копейки в рубли
                    movementAmount: dashboard.sales.movementAmount / 100,
                },
                orders: {
                    count: dashboard.orders.count,
                    amount: dashboard.orders.amount / 100,
                    movementAmount: dashboard.orders.movementAmount / 100,
                },
                money: {
                    balance: dashboard.money.balance / 100,
                    credit: dashboard.money.credit / 100,
                    debit: dashboard.money.debit / 100,
                },
            },
        };
    } catch (error) {
        return { success: false, error: formatErrorForMcp(error) };
    }
}
