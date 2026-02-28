// Meta информация из ответов API
export interface MsMeta {
    href: string;
    type: string;
    mediaType: string;
    size?: number;
    limit?: number;
    offset?: number;
}

// Базовая сущность МойСклад
export interface MsEntity {
    meta: MsMeta;
    id: string;
    accountId: string;
    name: string;
    updated: string;
    archived?: boolean;
}

// Товар
export interface MsProduct extends MsEntity {
    code?: string;
    article?: string;
    description?: string;
    externalCode: string;
    pathName?: string;
    productFolder?: { meta: MsMeta };
    uom?: { meta: MsMeta };
    images?: { meta: MsMeta };
    minPrice?: { value: number; currency: { meta: MsMeta } };
    salePrices?: Array<{
        value: number;
        currency: { meta: MsMeta };
        priceType: { meta: MsMeta; name: string };
    }>;
    buyPrice?: { value: number; currency: { meta: MsMeta } };
    weight?: number;
    volume?: number;
    variantsCount?: number;
}

// Контрагент
export interface MsCounterparty extends MsEntity {
    companyType: 'legal' | 'entrepreneur' | 'individual';
    legalTitle?: string;
    inn?: string;
    kpp?: string;
    email?: string;
    phone?: string;
    actualAddress?: string;
    tags?: string[];
}

// Заказ покупателя
export interface MsCustomerOrder extends MsEntity {
    organization: { meta: MsMeta };
    agent: { meta: MsMeta };
    store?: { meta: MsMeta };
    state?: { meta: MsMeta; name: string };
    sum: number;
    moment: string;
    deliveryPlannedMoment?: string;
    positions?: { meta: MsMeta; rows?: MsOrderPosition[] };
}

// Позиция заказа
export interface MsOrderPosition {
    meta: MsMeta;
    id: string;
    quantity: number;
    price: number;
    discount: number;
    vat: number;
    assortment: { meta: MsMeta; name?: string };
}

// Остатки
export interface MsStockItem {
    meta: MsMeta;
    stock: number;
    reserve: number;
    quantity: number;
    name: string;
    code?: string;
    article?: string;
    price?: number;
    salePrice?: number;
}

// Dashboard
export interface MsDashboard {
    sales: {
        count: number;
        amount: number;
        movementAmount: number;
    };
    orders: {
        count: number;
        amount: number;
        movementAmount: number;
    };
    money: {
        balance: number;
        credit: number;
        debit: number;
    };
}

// Ответ списка
export interface MsListResponse<T> {
    meta: MsMeta;
    context?: { employee: { meta: MsMeta } };
    rows: T[];
}

// Ошибка API МойСклад
export interface MsApiError {
    errors: Array<{
        error: string;
        code: number;
        moreInfo?: string;
        parameter?: string;
    }>;
}
