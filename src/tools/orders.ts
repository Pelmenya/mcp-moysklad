import { z } from 'zod';
import { getClient } from '../api/client.js';
import { ENDPOINTS } from '../api/endpoints.js';
import type { MsCustomerOrder } from '../api/types.js';
import { buildFilter, buildQueryParams, type FilterCondition } from '../utils/filters.js';
import { normalizePagination, extractPaginationMeta } from '../utils/pagination.js';
import { formatErrorForMcp } from '../utils/errors.js';

export const getOrdersSchema = z.object({
  search: z.string().optional().describe('Поиск по номеру заказа'),
  agentId: z.string().optional().describe('ID контрагента для фильтрации'),
  stateId: z.string().optional().describe('ID статуса заказа'),
  dateFrom: z.string().optional().describe('Дата начала периода (формат: YYYY-MM-DD)'),
  dateTo: z.string().optional().describe('Дата окончания периода (формат: YYYY-MM-DD)'),
  limit: z.number().min(1).max(1000).optional().describe('Лимит записей'),
  offset: z.number().min(0).optional().describe('Смещение для пагинации'),
});

export type GetOrdersInput = z.infer<typeof getOrdersSchema>;

export async function getOrders(input: GetOrdersInput) {
  try {
    const client = getClient();
    const pagination = normalizePagination(input);

    const filters: FilterCondition[] = [];
    if (input.agentId) {
      filters.push({
        field: 'agent',
        operator: '=',
        value: `https://api.moysklad.ru/api/remap/1.2/entity/counterparty/${input.agentId}`,
      });
    }
    if (input.stateId) {
      filters.push({
        field: 'state',
        operator: '=',
        value: `https://api.moysklad.ru/api/remap/1.2/entity/customerorder/metadata/states/${input.stateId}`,
      });
    }
    if (input.dateFrom) {
      filters.push({ field: 'moment', operator: '>=', value: `${input.dateFrom} 00:00:00` });
    }
    if (input.dateTo) {
      filters.push({ field: 'moment', operator: '<=', value: `${input.dateTo} 23:59:59` });
    }

    const params = buildQueryParams({
      filter: buildFilter(filters),
      limit: pagination.limit,
      offset: pagination.offset,
      search: input.search,
      order: 'moment,desc',
    });

    const response = await client.getList<MsCustomerOrder>(ENDPOINTS.customerorder, params);
    const paginationMeta = extractPaginationMeta(response.meta);

    return {
      success: true,
      data: {
        orders: response.rows.map((order) => ({
          id: order.id,
          name: order.name,
          moment: order.moment,
          sum: order.sum / 100, // копейки в рубли
          state: order.state?.name,
          deliveryPlannedMoment: order.deliveryPlannedMoment,
        })),
        pagination: paginationMeta,
      },
    };
  } catch (error) {
    return { success: false, error: formatErrorForMcp(error) };
  }
}

export const getOrderSchema = z.object({
  id: z.string().describe('ID заказа (UUID)'),
  expand: z.boolean().optional().describe('Загрузить позиции заказа (по умолчанию true)'),
});

export type GetOrderInput = z.infer<typeof getOrderSchema>;

export async function getOrder(input: GetOrderInput) {
  try {
    const client = getClient();

    const params = new URLSearchParams();
    if (input.expand !== false) {
      params.set('expand', 'positions,agent');
    }

    const order = await client.getOne<MsCustomerOrder>(ENDPOINTS.customerorder, input.id, params);

    return {
      success: true,
      data: {
        id: order.id,
        name: order.name,
        moment: order.moment,
        sum: order.sum / 100,
        state: order.state?.name,
        deliveryPlannedMoment: order.deliveryPlannedMoment,
        positions: order.positions?.rows?.map((pos) => ({
          id: pos.id,
          name: pos.assortment.name,
          quantity: pos.quantity,
          price: pos.price / 100,
          discount: pos.discount,
          sum: (pos.quantity * pos.price * (100 - pos.discount)) / 100 / 100,
        })),
      },
    };
  } catch (error) {
    return { success: false, error: formatErrorForMcp(error) };
  }
}

export const createOrderSchema = z.object({
  organizationId: z.string().describe('ID организации (юрлица)'),
  agentId: z.string().describe('ID контрагента (покупателя)'),
  storeId: z.string().optional().describe('ID склада'),
  positions: z
    .array(
      z.object({
        productId: z.string().describe('ID товара'),
        quantity: z.number().min(0.001).describe('Количество'),
        price: z
          .number()
          .optional()
          .describe('Цена в рублях (если не указана, берётся из карточки товара)'),
        discount: z.number().min(0).max(100).optional().describe('Скидка в процентах'),
      })
    )
    .min(1)
    .describe('Позиции заказа'),
  description: z.string().optional().describe('Комментарий к заказу'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export async function createOrder(input: CreateOrderInput) {
  try {
    const client = getClient();

    const orderData = {
      organization: {
        meta: {
          href: `https://api.moysklad.ru/api/remap/1.2/entity/organization/${input.organizationId}`,
          type: 'organization',
          mediaType: 'application/json',
        },
      },
      agent: {
        meta: {
          href: `https://api.moysklad.ru/api/remap/1.2/entity/counterparty/${input.agentId}`,
          type: 'counterparty',
          mediaType: 'application/json',
        },
      },
      ...(input.storeId && {
        store: {
          meta: {
            href: `https://api.moysklad.ru/api/remap/1.2/entity/store/${input.storeId}`,
            type: 'store',
            mediaType: 'application/json',
          },
        },
      }),
      positions: input.positions.map((pos) => ({
        assortment: {
          meta: {
            href: `https://api.moysklad.ru/api/remap/1.2/entity/product/${pos.productId}`,
            type: 'product',
            mediaType: 'application/json',
          },
        },
        quantity: pos.quantity,
        ...(pos.price !== undefined && { price: pos.price * 100 }), // рубли в копейки
        ...(pos.discount !== undefined && { discount: pos.discount }),
      })),
      ...(input.description && { description: input.description }),
    };

    const order = await client.create<MsCustomerOrder>(ENDPOINTS.customerorder, orderData);

    return {
      success: true,
      data: {
        id: order.id,
        name: order.name,
        moment: order.moment,
        sum: order.sum / 100,
      },
    };
  } catch (error) {
    return { success: false, error: formatErrorForMcp(error) };
  }
}
