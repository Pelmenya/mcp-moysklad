import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Загружаем .env из директории проекта, а не из cwd
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

export interface Config {
    token?: string;
    login?: string;
    password?: string;
    baseUrl: string;
}

export function getConfig(): Config {
    // Поддержка разных имён переменных
    const token = process.env.MOYSKLAD_TOKEN || process.env.MOY_SKLAD_API_KEY;
    const login = process.env.MOYSKLAD_LOGIN;
    const password = process.env.MOYSKLAD_PASSWORD;

    if (!token && (!login || !password)) {
        throw new Error(
            'Требуется указать MOYSKLAD_TOKEN (или MOY_SKLAD_API_KEY) или MOYSKLAD_LOGIN + MOYSKLAD_PASSWORD'
        );
    }

    return {
        token,
        login,
        password,
        baseUrl: 'https://api.moysklad.ru/api/remap/1.2',
    };
}

export function getAuthHeader(config: Config): string {
    if (config.token) {
        return `Bearer ${config.token}`;
    }
    const credentials = Buffer.from(`${config.login}:${config.password}`).toString('base64');
    return `Basic ${credentials}`;
}
