export interface PaginationParams {
    limit?: number;
    offset?: number;
}

export interface PaginationMeta {
    size: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}

export function normalizePagination(
    params: PaginationParams,
    hasExpand = false
): Required<PaginationParams> {
    const maxLimit = hasExpand ? 100 : 1000;
    const defaultLimit = 25;

    return {
        limit: Math.min(params.limit ?? defaultLimit, maxLimit),
        offset: params.offset ?? 0,
    };
}

export function extractPaginationMeta(meta: {
    size?: number;
    limit?: number;
    offset?: number;
}): PaginationMeta {
    const size = meta.size ?? 0;
    const limit = meta.limit ?? 25;
    const offset = meta.offset ?? 0;

    return {
        size,
        limit,
        offset,
        hasMore: offset + limit < size,
    };
}
