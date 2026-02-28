import { describe, it, expect } from 'vitest';
import { normalizePagination, extractPaginationMeta } from '../../src/utils/pagination.js';

describe('normalizePagination', () => {
    it('should use default values when not provided', () => {
        const result = normalizePagination({});
        expect(result.limit).toBe(25);
        expect(result.offset).toBe(0);
    });

    it('should use provided values', () => {
        const result = normalizePagination({ limit: 50, offset: 100 });
        expect(result.limit).toBe(50);
        expect(result.offset).toBe(100);
    });

    it('should cap limit at 1000 without expand', () => {
        const result = normalizePagination({ limit: 2000 });
        expect(result.limit).toBe(1000);
    });

    it('should cap limit at 100 with expand', () => {
        const result = normalizePagination({ limit: 500 }, true);
        expect(result.limit).toBe(100);
    });

    it('should use default limit respecting expand cap', () => {
        const result = normalizePagination({}, true);
        expect(result.limit).toBe(25); // default is below 100, so it stays
    });

    it('should cap default limit when hasExpand and default exceeds', () => {
        // Default is 25, which is below 100, so no change
        const result = normalizePagination({ limit: 150 }, true);
        expect(result.limit).toBe(100);
    });
});

describe('extractPaginationMeta', () => {
    it('should extract pagination meta from response', () => {
        const meta = { size: 150, limit: 25, offset: 50 };
        const result = extractPaginationMeta(meta);

        expect(result.size).toBe(150);
        expect(result.limit).toBe(25);
        expect(result.offset).toBe(50);
        expect(result.hasMore).toBe(true); // 50 + 25 = 75 < 150
    });

    it('should detect no more pages', () => {
        const meta = { size: 50, limit: 25, offset: 25 };
        const result = extractPaginationMeta(meta);

        expect(result.hasMore).toBe(false); // 25 + 25 = 50 >= 50
    });

    it('should handle last page exactly', () => {
        const meta = { size: 100, limit: 25, offset: 75 };
        const result = extractPaginationMeta(meta);

        expect(result.hasMore).toBe(false); // 75 + 25 = 100 >= 100
    });

    it('should handle missing values with defaults', () => {
        const result = extractPaginationMeta({});

        expect(result.size).toBe(0);
        expect(result.limit).toBe(25);
        expect(result.offset).toBe(0);
        expect(result.hasMore).toBe(false);
    });

    it('should handle partial meta', () => {
        const result = extractPaginationMeta({ size: 100 });

        expect(result.size).toBe(100);
        expect(result.limit).toBe(25);
        expect(result.offset).toBe(0);
        expect(result.hasMore).toBe(true); // 0 + 25 = 25 < 100
    });
});
