import { getConfig, getAuthHeader, type Config } from '../config.js';
import { MoySkladError, parseApiErrorResponse } from '../utils/errors.js';
import type { MsApiError, MsListResponse } from './types.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export class MoySkladClient {
  private config: Config;
  private authHeader: string;

  constructor() {
    this.config = getConfig();
    this.authHeader = getAuthHeader(this.config);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: unknown;
      params?: URLSearchParams;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, params } = options;

    let url = `${this.config.baseUrl}/${endpoint}`;
    if (params && params.toString()) {
      url += `?${params.toString()}`;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Authorization': this.authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json;charset=utf-8',
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        // Rate limit - ждём и повторяем
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : RETRY_DELAY_MS * (attempt + 1);
          await this.sleep(delay);
          continue;
        }

        const data: unknown = await response.json();

        if (!response.ok) {
          throw parseApiErrorResponse(data as MsApiError);
        }

        return data as T;
      } catch (error) {
        if (error instanceof MoySkladError) {
          throw error;
        }
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < MAX_RETRIES - 1) {
          await this.sleep(RETRY_DELAY_MS * (attempt + 1));
        }
      }
    }

    throw new MoySkladError(
      lastError?.message ?? 'Не удалось выполнить запрос после нескольких попыток'
    );
  }

  async getList<T>(
    endpoint: string,
    params?: URLSearchParams
  ): Promise<MsListResponse<T>> {
    return this.request<MsListResponse<T>>(endpoint, { params });
  }

  async getOne<T>(endpoint: string, id: string, params?: URLSearchParams): Promise<T> {
    return this.request<T>(`${endpoint}/${id}`, { params });
  }

  async create<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: data });
  }

  async update<T>(endpoint: string, id: string, data: unknown): Promise<T> {
    return this.request<T>(`${endpoint}/${id}`, { method: 'PUT', body: data });
  }
}

// Singleton instance
let clientInstance: MoySkladClient | null = null;

export function getClient(): MoySkladClient {
  if (!clientInstance) {
    clientInstance = new MoySkladClient();
  }
  return clientInstance;
}
