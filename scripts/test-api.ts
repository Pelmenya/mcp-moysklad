import 'dotenv/config';
import { getConfig } from '../src/config.js';
import { MoySkladClient } from '../src/api/client.js';
import { ENDPOINTS } from '../src/api/endpoints.js';

async function testAuth() {
    const token = process.env.MOYSKLAD_TOKEN || process.env.MOY_SKLAD_API_KEY || '';
    const baseUrl = 'https://api.moysklad.ru/api/remap/1.2';

    console.log('🔐 Тестирование форматов авторизации...\n');

    // Вариант 1: Bearer token
    console.log('1️⃣ Bearer token...');
    try {
        const res = await fetch(`${baseUrl}/entity/employee`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            console.log('   ✅ Bearer работает!\n');
            return 'bearer';
        }
        console.log(`   ❌ ${res.status}: ${(await res.json()).errors?.[0]?.error || 'Ошибка'}`);
    } catch (e) {
        console.log(`   ❌ ${(e as Error).message}`);
    }

    // Вариант 2: Basic с токеном как паролем
    console.log('2️⃣ Basic (admin:token)...');
    try {
        const basic = Buffer.from(`admin:${token}`).toString('base64');
        const res = await fetch(`${baseUrl}/entity/employee`, {
            headers: { Authorization: `Basic ${basic}` },
        });
        if (res.ok) {
            console.log('   ✅ Basic с токеном работает!\n');
            return 'basic-token';
        }
        console.log(`   ❌ ${res.status}: ${(await res.json()).errors?.[0]?.error || 'Ошибка'}`);
    } catch (e) {
        console.log(`   ❌ ${(e as Error).message}`);
    }

    // Вариант 3: X-Lognex-Access-Token header
    console.log('3️⃣ X-Lognex-Access-Token header...');
    try {
        const res = await fetch(`${baseUrl}/entity/employee`, {
            headers: { 'X-Lognex-Access-Token': token },
        });
        if (res.ok) {
            console.log('   ✅ X-Lognex-Access-Token работает!\n');
            return 'x-lognex';
        }
        console.log(`   ❌ ${res.status}: ${(await res.json()).errors?.[0]?.error || 'Ошибка'}`);
    } catch (e) {
        console.log(`   ❌ ${(e as Error).message}`);
    }

    console.log('\n❌ Ни один формат не работает. Проверь токен в МойСклад.\n');
    return null;
}

async function testApi() {
    console.log('🔍 Тестирование API МойСклад\n');

    // Сначала определим рабочий формат авторизации
    const authFormat = await testAuth();
    if (!authFormat) {
        process.exit(1);
    }

    try {
        const config = getConfig();
        const tokenPreview = config.token
            ? `${config.token.slice(0, 8)}...${config.token.slice(-4)} (${config.token.length} символов)`
            : 'НЕТ ТОКЕНА';
        console.log('✅ Конфиг загружен');
        console.log(`   Токен: ${tokenPreview}`);
        console.log(`   Формат авторизации: ${authFormat}\n`);

        const client = new MoySkladClient(config);

        // 1. Dashboard
        console.log('📊 Dashboard...');
        try {
            const dashboard = await client.request(ENDPOINTS.dashboard);
            console.log('   Продажи сегодня:', dashboard.sales?.count ?? 0);
            console.log('   Заказы сегодня:', dashboard.orders?.count ?? 0);
            console.log('   Баланс:', (dashboard.money?.balance ?? 0) / 100, 'руб.\n');
        } catch (e) {
            console.log('   ❌ Ошибка:', (e as Error).message, '\n');
        }

        // 2. Товары
        console.log('📦 Товары (первые 5)...');
        try {
            const products = await client.getList(
                ENDPOINTS.product,
                new URLSearchParams({ limit: '5' })
            );
            console.log('   Всего товаров:', products.meta?.size ?? 0);
            products.rows?.slice(0, 5).forEach((p: { name: string; article?: string }) => {
                console.log(`   - ${p.name} (арт: ${p.article || '-'})`);
            });
            console.log();
        } catch (e) {
            console.log('   ❌ Ошибка:', (e as Error).message, '\n');
        }

        // 3. Остатки
        console.log('📈 Остатки (первые 5)...');
        try {
            const stock = await client.getList(
                ENDPOINTS.stockAll,
                new URLSearchParams({ limit: '5' })
            );
            console.log('   Позиций с остатками:', stock.meta?.size ?? 0);
            stock.rows?.slice(0, 5).forEach((s: { name: string; stock?: number }) => {
                console.log(`   - ${s.name}: ${s.stock ?? 0} шт.`);
            });
            console.log();
        } catch (e) {
            console.log('   ❌ Ошибка:', (e as Error).message, '\n');
        }

        // 4. Контрагенты
        console.log('👥 Контрагенты (первые 5)...');
        try {
            const counterparties = await client.getList(
                ENDPOINTS.counterparty,
                new URLSearchParams({ limit: '5' })
            );
            console.log('   Всего контрагентов:', counterparties.meta?.size ?? 0);
            counterparties.rows?.slice(0, 5).forEach((c: { name: string; phone?: string }) => {
                console.log(`   - ${c.name} (тел: ${c.phone || '-'})`);
            });
            console.log();
        } catch (e) {
            console.log('   ❌ Ошибка:', (e as Error).message, '\n');
        }

        // 5. Заказы
        console.log('🛒 Заказы (последние 5)...');
        try {
            const orders = await client.getList(
                ENDPOINTS.customerorder,
                new URLSearchParams({ limit: '5', order: 'moment,desc' })
            );
            console.log('   Всего заказов:', orders.meta?.size ?? 0);
            orders.rows
                ?.slice(0, 5)
                .forEach((o: { name: string; sum?: number; moment?: string }) => {
                    const sum = (o.sum ?? 0) / 100;
                    const date = o.moment ? new Date(o.moment).toLocaleDateString('ru') : '-';
                    console.log(`   - ${o.name} | ${sum} руб. | ${date}`);
                });
            console.log();
        } catch (e) {
            console.log('   ❌ Ошибка:', (e as Error).message, '\n');
        }

        // 6. Организации
        console.log('🏢 Организации...');
        try {
            const orgs = await client.getList(
                ENDPOINTS.organization,
                new URLSearchParams({ limit: '5' })
            );
            console.log('   Всего организаций:', orgs.meta?.size ?? 0);
            orgs.rows?.slice(0, 5).forEach((o: { name: string; inn?: string }) => {
                console.log(`   - ${o.name} (ИНН: ${o.inn || '-'})`);
            });
            console.log();
        } catch (e) {
            console.log('   ❌ Ошибка:', (e as Error).message, '\n');
        }

        // 7. Склады
        console.log('🏭 Склады...');
        try {
            const stores = await client.getList(
                ENDPOINTS.store,
                new URLSearchParams({ limit: '5' })
            );
            console.log('   Всего складов:', stores.meta?.size ?? 0);
            stores.rows?.slice(0, 5).forEach((s: { name: string; address?: string }) => {
                console.log(`   - ${s.name} (${s.address || '-'})`);
            });
            console.log();
        } catch (e) {
            console.log('   ❌ Ошибка:', (e as Error).message, '\n');
        }

        console.log('✅ Тестирование завершено!');
    } catch (error) {
        console.error('❌ Критическая ошибка:', (error as Error).message);
        process.exit(1);
    }
}

testApi();
