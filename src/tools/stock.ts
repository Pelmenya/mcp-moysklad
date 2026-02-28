import { z } from 'zod';
import { getClient } from '../api/client.js';
import { ENDPOINTS } from '../api/endpoints.js';
import type { MsStockItem, MsListResponse } from '../api/types.js';
import { buildQueryParams } from '../utils/filters.js';
import { normalizePagination, extractPaginationMeta } from '../utils/pagination.js';
import { formatErrorForMcp } from '../utils/errors.js';

export const getStockSchema = z.object({
  search: z.string().optional().describe('Поиск по наименованию товара'),
  stockMode: z.enum(['all', 'positiveOnly', 'negativeOnly', 'empty', 'nonEmpty'])
    .optional()
    .describe('Режим остатков: all - все, positiveOnly - положительные, negativeOnly - отрицательные'),
  limit: z.number().min(1).max(1000).optional().describe('Лимит записей (макс 1000, по умолчанию 25)'),
  offset: z.number().min(0).optional().describe('Смещение для пагинации'),
});

export type GetStockInput = z.infer<typeof getStockSchema>;

export async function getStock(input: GetStockInput) {
  try {
    const client = getClient();
    const pagination = normalizePagination(input);

    const params = buildQueryParams({
      limit: pagination.limit,
      offset: pagination.offset,
      search: input.search,
    });

    if (input.stockMode) {
      params.set('stockMode', input.stockMode);
    }

    const response = await client.getList<MsStockItem>(ENDPOINTS.stockAll, params);
    const paginationMeta = extractPaginationMeta(response.meta);

    return {
      success: true,
      data: {
        items: response.rows.map((item) => ({
          name: item.name,
          code: item.code,
          article: item.article,
          stock: item.stock,
          reserve: item.reserve,
          available: item.stock - item.reserve,
          salePrice: item.salePrice ? item.salePrice / 100 : undefined,
        })),
        pagination: paginationMeta,
      },
    };
  } catch (error) {
    return { success: false, error: formatErrorForMcp(error) };
  }
}

export const getStockByStoreSchema = z.object({
  storeId: z.string().describe('ID склада (UUID)'),
  search: z.string().optional().describe('Поиск по наименованию товара'),
  limit: z.number().min(1).max(1000).optional().describe('Лимит записей'),
  offset: z.number().min(0).optional().describe('Смещение для пагинации'),
});

export type GetStockByStoreInput = z.infer<typeof getStockByStoreSchema>;

export async function getStockByStore(input: GetStockByStoreInput) {
  try {
    const client = getClient();
    const pagination = normalizePagination(input);

    const params = buildQueryParams({
      limit: pagination.limit,
      offset: pagination.offset,
      search: input.search,
    });

    params.set('filter', `store=https://api.moysklad.ru/api/remap/1.2/entity/store/${input.storeId}`);

    const response = await client.getList<MsStockItem>(ENDPOINTS.stockByStore, params);
    const paginationMeta = extractPaginationMeta(response.meta);

    return {
      success: true,
      data: {
        storeId: input.storeId,
        items: response.rows.map((item) => ({
          name: item.name,
          code: item.code,
          article: item.article,
          stock: item.stock,
          reserve: item.reserve,
          available: item.stock - item.reserve,
        })),
        pagination: paginationMeta,
      },
    };
  } catch (error) {
    return { success: false, error: formatErrorForMcp(error) };
  }
}
