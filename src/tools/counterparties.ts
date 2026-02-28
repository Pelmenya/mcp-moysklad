import { z } from 'zod';
import { getClient } from '../api/client.js';
import { ENDPOINTS } from '../api/endpoints.js';
import type { MsCounterparty } from '../api/types.js';
import { buildFilter, buildQueryParams, type FilterCondition } from '../utils/filters.js';
import { normalizePagination, extractPaginationMeta } from '../utils/pagination.js';
import { formatErrorForMcp } from '../utils/errors.js';

export const getCounterpartiesSchema = z.object({
  search: z.string().optional().describe('Поиск по наименованию, ИНН, телефону, email'),
  companyType: z
    .enum(['legal', 'entrepreneur', 'individual'])
    .optional()
    .describe('Тип контрагента: legal - юрлицо, entrepreneur - ИП, individual - физлицо'),
  tag: z.string().optional().describe('Фильтр по тегу'),
  archived: z.boolean().optional().describe('Включать архивных (по умолчанию false)'),
  limit: z.number().min(1).max(1000).optional().describe('Лимит записей'),
  offset: z.number().min(0).optional().describe('Смещение для пагинации'),
});

export type GetCounterpartiesInput = z.infer<typeof getCounterpartiesSchema>;

export async function getCounterparties(input: GetCounterpartiesInput) {
  try {
    const client = getClient();
    const pagination = normalizePagination(input);

    const filters: FilterCondition[] = [];
    if (input.companyType) {
      filters.push({ field: 'companyType', operator: '=', value: input.companyType });
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

    const response = await client.getList<MsCounterparty>(ENDPOINTS.counterparty, params);
    const paginationMeta = extractPaginationMeta(response.meta);

    return {
      success: true,
      data: {
        counterparties: response.rows.map((cp) => ({
          id: cp.id,
          name: cp.name,
          companyType: cp.companyType,
          legalTitle: cp.legalTitle,
          inn: cp.inn,
          phone: cp.phone,
          email: cp.email,
          tags: cp.tags,
        })),
        pagination: paginationMeta,
      },
    };
  } catch (error) {
    return { success: false, error: formatErrorForMcp(error) };
  }
}

export const getCounterpartySchema = z.object({
  id: z.string().describe('ID контрагента (UUID)'),
});

export type GetCounterpartyInput = z.infer<typeof getCounterpartySchema>;

export async function getCounterparty(input: GetCounterpartyInput) {
  try {
    const client = getClient();
    const cp = await client.getOne<MsCounterparty>(ENDPOINTS.counterparty, input.id);

    return {
      success: true,
      data: {
        id: cp.id,
        name: cp.name,
        companyType: cp.companyType,
        legalTitle: cp.legalTitle,
        inn: cp.inn,
        kpp: cp.kpp,
        phone: cp.phone,
        email: cp.email,
        actualAddress: cp.actualAddress,
        tags: cp.tags,
        updated: cp.updated,
      },
    };
  } catch (error) {
    return { success: false, error: formatErrorForMcp(error) };
  }
}
