import { describe, it, expect } from 'vitest';
import {
  MoySkladError,
  parseApiError,
  parseApiErrorResponse,
  formatErrorForMcp,
} from '../../src/utils/errors.js';

describe('MoySkladError', () => {
  it('should create error with message', () => {
    const error = new MoySkladError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('MoySkladError');
  });

  it('should create error with code and details', () => {
    const error = new MoySkladError('Test error', 1001, 'More info');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe(1001);
    expect(error.details).toBe('More info');
  });
});

describe('parseApiError', () => {
  it('should return MoySkladError as is', () => {
    const original = new MoySkladError('Original');
    const result = parseApiError(original);
    expect(result).toBe(original);
  });

  it('should wrap Error into MoySkladError', () => {
    const original = new Error('Standard error');
    const result = parseApiError(original);
    expect(result).toBeInstanceOf(MoySkladError);
    expect(result.message).toBe('Standard error');
  });

  it('should handle unknown errors', () => {
    const result = parseApiError('string error');
    expect(result).toBeInstanceOf(MoySkladError);
    expect(result.message).toBe('Неизвестная ошибка');
  });

  it('should handle null/undefined', () => {
    expect(parseApiError(null).message).toBe('Неизвестная ошибка');
    expect(parseApiError(undefined).message).toBe('Неизвестная ошибка');
  });
});

describe('parseApiErrorResponse', () => {
  it('should parse API error response', () => {
    const apiResponse = {
      errors: [
        {
          error: 'Доступ запрещён',
          code: 1001,
          moreInfo: 'https://dev.moysklad.ru/doc/api/remap/1.2/#error_1001',
        },
      ],
    };
    const result = parseApiErrorResponse(apiResponse);
    expect(result.message).toBe('Доступ запрещён');
    expect(result.code).toBe(1001);
    expect(result.details).toBe('https://dev.moysklad.ru/doc/api/remap/1.2/#error_1001');
  });

  it('should handle empty errors array', () => {
    const apiResponse = { errors: [] };
    const result = parseApiErrorResponse(apiResponse);
    expect(result.message).toBe('Ошибка API МойСклад');
  });

  it('should handle error without moreInfo', () => {
    const apiResponse = {
      errors: [{ error: 'Ошибка', code: 1002 }],
    };
    const result = parseApiErrorResponse(apiResponse);
    expect(result.message).toBe('Ошибка');
    expect(result.code).toBe(1002);
    expect(result.details).toBeUndefined();
  });
});

describe('formatErrorForMcp', () => {
  it('should format error with message only', () => {
    const error = new MoySkladError('Test error');
    const result = formatErrorForMcp(error);
    expect(result).toBe('Ошибка: Test error');
  });

  it('should format error with code', () => {
    const error = new MoySkladError('Test error', 1001);
    const result = formatErrorForMcp(error);
    expect(result).toBe('Ошибка: Test error (код: 1001)');
  });

  it('should format error with code and details', () => {
    const error = new MoySkladError('Test error', 1001, 'See docs');
    const result = formatErrorForMcp(error);
    expect(result).toBe('Ошибка: Test error (код: 1001)\nПодробнее: See docs');
  });

  it('should handle non-MoySkladError', () => {
    const result = formatErrorForMcp(new Error('Regular error'));
    expect(result).toBe('Ошибка: Regular error');
  });
});
