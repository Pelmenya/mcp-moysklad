export type FilterOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | '~' | '=~' | '~=';

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean;
}

export function buildFilter(conditions: FilterCondition[]): string {
  if (conditions.length === 0) return '';

  return conditions
    .map((c) => {
      const value = typeof c.value === 'string' ? c.value : String(c.value);
      return `${c.field}${c.operator}${value}`;
    })
    .join(';');
}

export function buildQueryParams(params: {
  filter?: string;
  limit?: number;
  offset?: number;
  expand?: string;
  search?: string;
  order?: string;
}): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (params.filter) {
    searchParams.set('filter', params.filter);
  }
  if (params.limit !== undefined) {
    searchParams.set('limit', String(Math.min(params.limit, 1000)));
  }
  if (params.offset !== undefined) {
    searchParams.set('offset', String(params.offset));
  }
  if (params.expand) {
    searchParams.set('expand', params.expand);
  }
  if (params.search) {
    searchParams.set('search', params.search);
  }
  if (params.order) {
    searchParams.set('order', params.order);
  }

  return searchParams;
}
