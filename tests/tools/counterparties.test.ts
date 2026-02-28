import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCounterparties, getCounterparty } from '../../src/tools/counterparties.js';

vi.mock('../../src/api/client.js', () => ({
    getClient: vi.fn(),
}));

import { getClient } from '../../src/api/client.js';

describe('counterparties tools', () => {
    const mockClient = {
        getList: vi.fn(),
        getOne: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getClient).mockReturnValue(mockClient as any);
    });

    describe('getCounterparties', () => {
        it('should return list of counterparties', async () => {
            mockClient.getList.mockResolvedValueOnce({
                meta: { size: 2, limit: 25, offset: 0 },
                rows: [
                    {
                        id: '1',
                        name: 'ООО Рога и Копыта',
                        companyType: 'legal',
                        legalTitle: 'Общество с ограниченной ответственностью "Рога и Копыта"',
                        inn: '7701234567',
                        phone: '+7 (495) 123-45-67',
                        email: 'info@rogakopyta.ru',
                        tags: ['VIP', 'Постоянный'],
                    },
                    {
                        id: '2',
                        name: 'ИП Иванов',
                        companyType: 'entrepreneur',
                        inn: '770112345678',
                        phone: '+7 (916) 123-45-67',
                        email: 'ivanov@mail.ru',
                        tags: [],
                    },
                ],
            });

            const result = await getCounterparties({});

            expect(result.success).toBe(true);
            expect(result.data?.counterparties).toHaveLength(2);
            expect(result.data?.counterparties[0]).toEqual({
                id: '1',
                name: 'ООО Рога и Копыта',
                companyType: 'legal',
                legalTitle: 'Общество с ограниченной ответственностью "Рога и Копыта"',
                inn: '7701234567',
                phone: '+7 (495) 123-45-67',
                email: 'info@rogakopyta.ru',
                tags: ['VIP', 'Постоянный'],
            });
        });

        it('should apply search filter', async () => {
            mockClient.getList.mockResolvedValueOnce({
                meta: { size: 0, limit: 25, offset: 0 },
                rows: [],
            });

            await getCounterparties({ search: 'Иванов' });

            const params = mockClient.getList.mock.calls[0][1] as URLSearchParams;
            expect(params.get('search')).toBe('Иванов');
        });

        it('should filter by companyType', async () => {
            mockClient.getList.mockResolvedValueOnce({
                meta: { size: 0, limit: 25, offset: 0 },
                rows: [],
            });

            await getCounterparties({ companyType: 'legal' });

            const params = mockClient.getList.mock.calls[0][1] as URLSearchParams;
            expect(params.get('filter')).toContain('companyType=legal');
        });

        it('should exclude archived by default', async () => {
            mockClient.getList.mockResolvedValueOnce({
                meta: { size: 0, limit: 25, offset: 0 },
                rows: [],
            });

            await getCounterparties({});

            const params = mockClient.getList.mock.calls[0][1] as URLSearchParams;
            expect(params.get('filter')).toContain('archived=false');
        });

        it('should include archived when specified', async () => {
            mockClient.getList.mockResolvedValueOnce({
                meta: { size: 0, limit: 25, offset: 0 },
                rows: [],
            });

            await getCounterparties({ archived: true });

            const params = mockClient.getList.mock.calls[0][1] as URLSearchParams;
            expect(params.get('filter')).toContain('archived=true');
        });

        it('should handle errors', async () => {
            mockClient.getList.mockRejectedValueOnce(new Error('Network error'));

            const result = await getCounterparties({});

            expect(result.success).toBe(false);
            expect(result.error).toContain('Network error');
        });
    });

    describe('getCounterparty', () => {
        it('should return counterparty by ID', async () => {
            mockClient.getOne.mockResolvedValueOnce({
                id: '123',
                name: 'ООО Тест',
                companyType: 'legal',
                legalTitle: 'ООО "Тест"',
                inn: '7701234567',
                kpp: '770101001',
                phone: '+7 (495) 123-45-67',
                email: 'test@test.ru',
                actualAddress: 'г. Москва, ул. Тестовая, д. 1',
                tags: ['Тестовый'],
                updated: '2024-01-15',
            });

            const result = await getCounterparty({ id: '123' });

            expect(result.success).toBe(true);
            expect(result.data).toEqual({
                id: '123',
                name: 'ООО Тест',
                companyType: 'legal',
                legalTitle: 'ООО "Тест"',
                inn: '7701234567',
                kpp: '770101001',
                phone: '+7 (495) 123-45-67',
                email: 'test@test.ru',
                actualAddress: 'г. Москва, ул. Тестовая, д. 1',
                tags: ['Тестовый'],
                updated: '2024-01-15',
            });
        });

        it('should handle counterparty without optional fields', async () => {
            mockClient.getOne.mockResolvedValueOnce({
                id: '456',
                name: 'Физлицо',
                companyType: 'individual',
                updated: '2024-01-01',
            });

            const result = await getCounterparty({ id: '456' });

            expect(result.success).toBe(true);
            expect(result.data?.inn).toBeUndefined();
            expect(result.data?.kpp).toBeUndefined();
        });

        it('should handle errors', async () => {
            mockClient.getOne.mockRejectedValueOnce(new Error('Not found'));

            const result = await getCounterparty({ id: 'invalid' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Not found');
        });
    });
});
