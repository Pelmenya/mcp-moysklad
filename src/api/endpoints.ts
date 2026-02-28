export const ENDPOINTS = {
  // Сущности
  product: 'entity/product',
  variant: 'entity/variant',
  counterparty: 'entity/counterparty',
  customerorder: 'entity/customerorder',
  demand: 'entity/demand',
  supply: 'entity/supply',
  move: 'entity/move',
  organization: 'entity/organization',
  store: 'entity/store',

  // Отчёты
  stockAll: 'report/stock/all',
  stockByStore: 'report/stock/bystore',
  profitByProduct: 'report/profit/byproduct',
  dashboard: 'report/dashboard',
} as const;

export type EndpointKey = keyof typeof ENDPOINTS;
