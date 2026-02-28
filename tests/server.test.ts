import { describe, it, expect, vi } from 'vitest';
import { tools } from '../src/tools/index.js';

// Mock config to prevent errors
vi.mock('../src/config.js', () => ({
    getConfig: () => ({
        token: 'test-token',
        baseUrl: 'https://api.moysklad.ru/api/remap/1.2',
    }),
    getAuthHeader: () => 'Bearer test-token',
}));

describe('Tools Registry', () => {
    it('should have 10 tools registered', () => {
        const toolNames = Object.keys(tools);
        expect(toolNames).toHaveLength(10);
    });

    it('should have all expected tools', () => {
        const toolNames = Object.keys(tools);

        expect(toolNames).toContain('moysklad_get_products');
        expect(toolNames).toContain('moysklad_get_product');
        expect(toolNames).toContain('moysklad_get_stock');
        expect(toolNames).toContain('moysklad_get_stock_by_store');
        expect(toolNames).toContain('moysklad_get_counterparties');
        expect(toolNames).toContain('moysklad_get_counterparty');
        expect(toolNames).toContain('moysklad_get_orders');
        expect(toolNames).toContain('moysklad_get_order');
        expect(toolNames).toContain('moysklad_create_order');
        expect(toolNames).toContain('moysklad_get_dashboard');
    });

    it('should have description for each tool', () => {
        Object.entries(tools).forEach(([name, tool]) => {
            expect(tool.description, `Tool ${name} should have description`).toBeDefined();
            expect(typeof tool.description).toBe('string');
            expect(tool.description.length).toBeGreaterThan(0);
        });
    });

    it('should have schema for each tool', () => {
        Object.entries(tools).forEach(([name, tool]) => {
            expect(tool.schema, `Tool ${name} should have schema`).toBeDefined();
            expect(tool.schema._def).toBeDefined(); // Zod schema check
        });
    });

    it('should have handler for each tool', () => {
        Object.entries(tools).forEach(([name, tool]) => {
            expect(tool.handler, `Tool ${name} should have handler`).toBeDefined();
            expect(typeof tool.handler).toBe('function');
        });
    });

    it('should follow naming convention', () => {
        Object.keys(tools).forEach((name) => {
            expect(name.startsWith('moysklad_'), `Tool ${name} should start with moysklad_`).toBe(
                true
            );
        });
    });

    describe('Tool descriptions should be in Russian', () => {
        it('should have Russian descriptions', () => {
            Object.entries(tools).forEach(([name, tool]) => {
                // Check for Cyrillic characters
                const hasCyrillic = /[а-яА-ЯёЁ]/.test(tool.description);
                expect(hasCyrillic, `Tool ${name} should have Russian description`).toBe(true);
            });
        });
    });
});

describe('Tool Schemas Validation', () => {
    it('moysklad_get_products schema should validate correctly', () => {
        const schema = tools.moysklad_get_products.schema;

        // Valid inputs
        expect(schema.safeParse({}).success).toBe(true);
        expect(schema.safeParse({ search: 'iPhone' }).success).toBe(true);
        expect(schema.safeParse({ limit: 50, offset: 0 }).success).toBe(true);
        expect(schema.safeParse({ archived: true }).success).toBe(true);

        // Invalid inputs
        expect(schema.safeParse({ limit: -1 }).success).toBe(false);
        expect(schema.safeParse({ limit: 2000 }).success).toBe(false);
        expect(schema.safeParse({ offset: -1 }).success).toBe(false);
    });

    it('moysklad_get_product schema should require id', () => {
        const schema = tools.moysklad_get_product.schema;

        expect(schema.safeParse({}).success).toBe(false);
        expect(schema.safeParse({ id: '123' }).success).toBe(true);
    });

    it('moysklad_get_stock schema should validate stockMode', () => {
        const schema = tools.moysklad_get_stock.schema;

        expect(schema.safeParse({}).success).toBe(true);
        expect(schema.safeParse({ stockMode: 'all' }).success).toBe(true);
        expect(schema.safeParse({ stockMode: 'positiveOnly' }).success).toBe(true);
        expect(schema.safeParse({ stockMode: 'invalid' }).success).toBe(false);
    });

    it('moysklad_get_counterparties schema should validate companyType', () => {
        const schema = tools.moysklad_get_counterparties.schema;

        expect(schema.safeParse({}).success).toBe(true);
        expect(schema.safeParse({ companyType: 'legal' }).success).toBe(true);
        expect(schema.safeParse({ companyType: 'entrepreneur' }).success).toBe(true);
        expect(schema.safeParse({ companyType: 'individual' }).success).toBe(true);
        expect(schema.safeParse({ companyType: 'invalid' }).success).toBe(false);
    });

    it('moysklad_create_order schema should require fields', () => {
        const schema = tools.moysklad_create_order.schema;

        // Missing required fields
        expect(schema.safeParse({}).success).toBe(false);

        // Valid minimal input
        expect(
            schema.safeParse({
                organizationId: 'org-123',
                agentId: 'agent-456',
                positions: [{ productId: 'prod-789', quantity: 1 }],
            }).success
        ).toBe(true);

        // Empty positions
        expect(
            schema.safeParse({
                organizationId: 'org-123',
                agentId: 'agent-456',
                positions: [],
            }).success
        ).toBe(false);

        // Invalid quantity
        expect(
            schema.safeParse({
                organizationId: 'org-123',
                agentId: 'agent-456',
                positions: [{ productId: 'prod-789', quantity: 0 }],
            }).success
        ).toBe(false);
    });
});
