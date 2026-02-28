import { getProducts, getProductsSchema, getProduct, getProductSchema } from './products.js';
import { getStock, getStockSchema, getStockByStore, getStockByStoreSchema } from './stock.js';
import {
    getCounterparties,
    getCounterpartiesSchema,
    getCounterparty,
    getCounterpartySchema,
} from './counterparties.js';
import {
    getOrders,
    getOrdersSchema,
    getOrder,
    getOrderSchema,
    createOrder,
    createOrderSchema,
} from './orders.js';
import { getDashboard, getDashboardSchema } from './reports.js';

export interface ToolResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export type ToolHandler = (input: unknown) => Promise<ToolResult>;

export interface ToolDefinition {
    description: string;
    schema: import('zod').ZodObject<import('zod').ZodRawShape>;
    handler: ToolHandler;
}

export const tools: Record<string, ToolDefinition> = {
    moysklad_get_products: {
        description: 'Получить список товаров из МойСклад с возможностью фильтрации и поиска',
        schema: getProductsSchema,
        handler: getProducts,
    },
    moysklad_get_product: {
        description: 'Получить детальную информацию о товаре по ID',
        schema: getProductSchema,
        handler: getProduct,
    },
    moysklad_get_stock: {
        description: 'Получить остатки товаров по всем складам',
        schema: getStockSchema,
        handler: getStock,
    },
    moysklad_get_stock_by_store: {
        description: 'Получить остатки товаров по конкретному складу',
        schema: getStockByStoreSchema,
        handler: getStockByStore,
    },
    moysklad_get_counterparties: {
        description: 'Получить список контрагентов с возможностью поиска по имени, ИНН, телефону',
        schema: getCounterpartiesSchema,
        handler: getCounterparties,
    },
    moysklad_get_counterparty: {
        description: 'Получить детальную информацию о контрагенте по ID',
        schema: getCounterpartySchema,
        handler: getCounterparty,
    },
    moysklad_get_orders: {
        description:
            'Получить список заказов покупателей с фильтрацией по дате, контрагенту, статусу',
        schema: getOrdersSchema,
        handler: getOrders,
    },
    moysklad_get_order: {
        description: 'Получить детальную информацию о заказе с позициями по ID',
        schema: getOrderSchema,
        handler: getOrder,
    },
    moysklad_create_order: {
        description: 'Создать новый заказ покупателя в МойСклад',
        schema: createOrderSchema,
        handler: createOrder,
    },
    moysklad_get_dashboard: {
        description: 'Получить сводку показателей: продажи, заказы, деньги за сегодня',
        schema: getDashboardSchema,
        handler: getDashboard,
    },
};

export type ToolName = keyof typeof tools;
