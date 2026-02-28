import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getConfig, getAuthHeader } from '../src/config.js';

describe('config', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('getConfig', () => {
        it('should return config with token', () => {
            process.env.MOYSKLAD_TOKEN = 'test-token-123';

            const config = getConfig();

            expect(config.token).toBe('test-token-123');
            expect(config.baseUrl).toBe('https://api.moysklad.ru/api/remap/1.2');
        });

        it('should return config with login/password', () => {
            process.env.MOYSKLAD_LOGIN = 'admin@company';
            process.env.MOYSKLAD_PASSWORD = 'secret123';

            const config = getConfig();

            expect(config.login).toBe('admin@company');
            expect(config.password).toBe('secret123');
        });

        it('should throw error when no credentials provided', () => {
            delete process.env.MOYSKLAD_TOKEN;
            delete process.env.MOY_SKLAD_API_KEY;
            delete process.env.MOYSKLAD_LOGIN;
            delete process.env.MOYSKLAD_PASSWORD;

            expect(() => getConfig()).toThrow(
                'Требуется указать MOYSKLAD_TOKEN (или MOY_SKLAD_API_KEY) или MOYSKLAD_LOGIN + MOYSKLAD_PASSWORD'
            );
        });

        it('should throw error when only login provided', () => {
            process.env.MOYSKLAD_LOGIN = 'admin@company';
            delete process.env.MOYSKLAD_PASSWORD;
            delete process.env.MOYSKLAD_TOKEN;
            delete process.env.MOY_SKLAD_API_KEY;

            expect(() => getConfig()).toThrow();
        });

        it('should throw error when only password provided', () => {
            delete process.env.MOYSKLAD_LOGIN;
            process.env.MOYSKLAD_PASSWORD = 'secret123';
            delete process.env.MOYSKLAD_TOKEN;
            delete process.env.MOY_SKLAD_API_KEY;

            expect(() => getConfig()).toThrow();
        });
    });

    describe('getAuthHeader', () => {
        it('should return Bearer header when token is set', () => {
            const config = {
                token: 'my-token',
                baseUrl: 'https://api.moysklad.ru/api/remap/1.2',
            };

            const header = getAuthHeader(config);

            expect(header).toBe('Bearer my-token');
        });

        it('should return Basic header when login/password are set', () => {
            const config = {
                login: 'admin@company',
                password: 'secret123',
                baseUrl: 'https://api.moysklad.ru/api/remap/1.2',
            };

            const header = getAuthHeader(config);

            const expectedBase64 = Buffer.from('admin@company:secret123').toString('base64');
            expect(header).toBe(`Basic ${expectedBase64}`);
        });

        it('should prefer token over login/password', () => {
            const config = {
                token: 'my-token',
                login: 'admin@company',
                password: 'secret123',
                baseUrl: 'https://api.moysklad.ru/api/remap/1.2',
            };

            const header = getAuthHeader(config);

            expect(header).toBe('Bearer my-token');
        });
    });
});
