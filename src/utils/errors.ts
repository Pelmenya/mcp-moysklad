import type { MsApiError } from '../api/types.js';

export class MoySkladError extends Error {
    constructor(
        message: string,
        public code?: number,
        public details?: string
    ) {
        super(message);
        this.name = 'MoySkladError';
    }
}

export function parseApiError(error: unknown): MoySkladError {
    if (error instanceof MoySkladError) {
        return error;
    }

    if (error instanceof Error) {
        return new MoySkladError(error.message);
    }

    return new MoySkladError('Неизвестная ошибка');
}

export function parseApiErrorResponse(data: MsApiError): MoySkladError {
    if (data.errors && data.errors.length > 0) {
        const firstError = data.errors[0];
        return new MoySkladError(firstError.error, firstError.code, firstError.moreInfo);
    }
    return new MoySkladError('Ошибка API МойСклад');
}

export function formatErrorForMcp(error: unknown): string {
    const msError = parseApiError(error);
    let message = `Ошибка: ${msError.message}`;
    if (msError.code) {
        message += ` (код: ${msError.code})`;
    }
    if (msError.details) {
        message += `\nПодробнее: ${msError.details}`;
    }
    return message;
}
