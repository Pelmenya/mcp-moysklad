import { z } from 'zod';
import { getClient } from '../api/client.js';
import { ENDPOINTS } from '../api/endpoints.js';
import type { MsProduct } from '../api/types.js';
import { buildFilter, buildQueryParams, type FilterCondition } from '../utils/filters.js';
import { normalizePagination, extractPaginationMeta } from '../utils/pagination.js';
import { formatErrorForMcp } from '../utils/errors.js';

export const getProductsSchema = z.object({
  search: z.string().optional().describe('Поиск по наименованию товара'),
  article: z.string().optional().describe('Фильтр по артикулу'),
  archived: z.boolean().optional().describe('Включать архивные товары (по умолчанию false)'),
  limit: z
    .number()
    .min(1)
    .max(1000)
    .optional()
    .describe('Лимит записей (макс 1000, по умолчанию 25)'),
  offset: z.number().min(0).optional().describe('Смещение для пагинации'),
});

export type GetProductsInput = z.infer<typeof getProductsSchema>;

export async function getProducts(input: GetProductsInput) {
  try {
    const client = getClient();
    const pagination = normalizePagination(input);

    const filters: FilterCondition[] = [];
    if (input.article) {
      filters.push({ field: 'article', operator: '=', value: input.article });
    }
    if (input.archived !== undefined) {
      filters.push({ field: 'archived', operator: '=', value: input.archived });
    } else {
      filters.push({ field: 'archived', operator: '=', value: false });
    }

    const params = buildQueryParams({
      filter: buildFilter(filters),
      limit: pagination.limit,
      offset: pagination.offset,
      search: input.search,
    });

    const response = await client.getList<MsProduct>(ENDPOINTS.product, params);
    const paginationMeta = extractPaginationMeta(response.meta);

    return {
      success: true,
      data: {
        products: response.rows.map((p) => ({
          id: p.id,
          name: p.name,
          article: p.article,
          code: p.code,
          description: p.description,
          archived: p.archived,
          updated: p.updated,
        })),
        pagination: paginationMeta,
      },
    };
  } catch (error) {
    return { success: false, error: formatErrorForMcp(error) };
  }
}

export const getProductSchema = z.object({
  id: z.string().describe('ID товара (UUID)'),
});

export type GetProductInput = z.infer<typeof getProductSchema>;

export async function getProduct(input: GetProductInput) {
  try {
    const client = getClient();
    const product = await client.getOne<MsProduct>(ENDPOINTS.product, input.id);

    return {
      success: true,
      data: {
        id: product.id,
        name: product.name,
        article: product.article,
        code: product.code,
        description: product.description,
        archived: product.archived,
        updated: product.updated,
        salePrices: product.salePrices?.map((sp) => ({
          value: sp.value / 100, // копейки в рубли
          priceType: sp.priceType.name,
        })),
        buyPrice: product.buyPrice ? product.buyPrice.value / 100 : undefined,
        weight: product.weight,
        volume: product.volume,
      },
    };
  } catch (error) {
    return { success: false, error: formatErrorForMcp(error) };
  }
}
