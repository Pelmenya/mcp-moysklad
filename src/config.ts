export interface Config {
  token?: string;
  login?: string;
  password?: string;
  baseUrl: string;
}

export function getConfig(): Config {
  const token = process.env.MOYSKLAD_TOKEN;
  const login = process.env.MOYSKLAD_LOGIN;
  const password = process.env.MOYSKLAD_PASSWORD;

  if (!token && (!login || !password)) {
    throw new Error(
      'Требуется указать MOYSKLAD_TOKEN или MOYSKLAD_LOGIN + MOYSKLAD_PASSWORD'
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
