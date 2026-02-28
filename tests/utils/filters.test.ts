import { describe, it, expect } from 'vitest';
import { buildFilter, buildQueryParams, type FilterCondition } from '../../src/utils/filters.js';

describe('buildFilter', () => {
  it('should return empty string for empty conditions', () => {
    expect(buildFilter([])).toBe('');
  });

  it('should build single condition', () => {
    const conditions: FilterCondition[] = [
      { field: 'name', operator: '=', value: 'iPhone' },
    ];
    expect(buildFilter(conditions)).toBe('name=iPhone');
  });

  it('should build multiple conditions with semicolon', () => {
    const conditions: FilterCondition[] = [
      { field: 'name', operator: '=', value: 'iPhone' },
      { field: 'quantity', operator: '>', value: 0 },
    ];
    expect(buildFilter(conditions)).toBe('name=iPhone;quantity>0');
  });

  it('should handle different operators', () => {
    const testCases: Array<{ op: FilterCondition['operator']; expected: string }> = [
      { op: '=', expected: 'field=value' },
      { op: '!=', expected: 'field!=value' },
      { op: '>', expected: 'field>value' },
      { op: '<', expected: 'field<value' },
      { op: '>=', expected: 'field>=value' },
      { op: '<=', expected: 'field<=value' },
      { op: '~', expected: 'field~value' },
      { op: '=~', expected: 'field=~value' },
      { op: '~=', expected: 'field~=value' },
    ];

    testCases.forEach(({ op, expected }) => {
      const conditions: FilterCondition[] = [{ field: 'field', operator: op, value: 'value' }];
      expect(buildFilter(conditions)).toBe(expected);
    });
  });

  it('should handle boolean values', () => {
    const conditions: FilterCondition[] = [
      { field: 'archived', operator: '=', value: false },
    ];
    expect(buildFilter(conditions)).toBe('archived=false');
  });

  it('should handle numeric values', () => {
    const conditions: FilterCondition[] = [
      { field: 'quantity', operator: '>=', value: 100 },
    ];
    expect(buildFilter(conditions)).toBe('quantity>=100');
  });
});

describe('buildQueryParams', () => {
  it('should return empty params for empty input', () => {
    const params = buildQueryParams({});
    expect(params.toString()).toBe('');
  });

  it('should set filter param', () => {
    const params = buildQueryParams({ filter: 'name=test' });
    expect(params.get('filter')).toBe('name=test');
  });

  it('should set limit param', () => {
    const params = buildQueryParams({ limit: 50 });
    expect(params.get('limit')).toBe('50');
  });

  it('should cap limit at 1000', () => {
    const params = buildQueryParams({ limit: 2000 });
    expect(params.get('limit')).toBe('1000');
  });

  it('should set offset param', () => {
    const params = buildQueryParams({ offset: 100 });
    expect(params.get('offset')).toBe('100');
  });

  it('should set expand param', () => {
    const params = buildQueryParams({ expand: 'positions,agent' });
    expect(params.get('expand')).toBe('positions,agent');
  });

  it('should set search param', () => {
    const params = buildQueryParams({ search: 'iphone' });
    expect(params.get('search')).toBe('iphone');
  });

  it('should set order param', () => {
    const params = buildQueryParams({ order: 'name,asc' });
    expect(params.get('order')).toBe('name,asc');
  });

  it('should combine multiple params', () => {
    const params = buildQueryParams({
      filter: 'archived=false',
      limit: 25,
      offset: 0,
      search: 'test',
    });
    expect(params.get('filter')).toBe('archived=false');
    expect(params.get('limit')).toBe('25');
    expect(params.get('offset')).toBe('0');
    expect(params.get('search')).toBe('test');
  });
});
