# CLAUDE.md — MCP Server для МойСклад

## Обзор проекта

Это MCP (Model Context Protocol) сервер для интеграции AI-ассистентов (Claude, ChatGPT и др.) с ERP-системой МойСклад (moysklad.ru). Сервер предоставляет набор tools для работы с JSON API МойСклад 1.2 через стандартный MCP-протокол.

Цель — стать первым open-source MCP-сервером для МойСклад и опубликоваться в npm + реестрах MCP.

## Стек технологий

- **Runtime**: Node.js 20+
- **Язык**: TypeScript (strict mode)
- **MCP SDK**: `@modelcontextprotocol/sdk` (официальный SDK от Anthropic)
- **HTTP клиент**: встроенный fetch (Node.js 20+)
- **Сборка**: tsup (быстрый бандлер на esbuild)
- **Линтер**: ESLint + Prettier
- **Тесты**: vitest
- **Менеджер пакетов**: npm

## Архитектура

```
mcp-moysklad/
├── src/
│   ├── index.ts              # Точка входа, инициализация MCP сервера
│   ├── server.ts             # Конфигурация сервера, регистрация tools
│   ├── config.ts             # Конфигурация (env переменные, defaults)
│   ├── api/
│   │   ├── client.ts         # HTTP клиент для МойСклад API
│   │   ├── types.ts          # Типы ответов API МойСклад
│   │   └── endpoints.ts      # Константы эндпоинтов API
│   ├── tools/
│   │   ├── index.ts          # Реестр всех tools
│   │   ├── products.ts       # Tools: товары и модификации
│   │   ├── stock.ts          # Tools: остатки
│   │   ├── orders.ts         # Tools: заказы покупателей
│   │   ├── counterparties.ts # Tools: контрагенты
│   │   ├── documents.ts      # Tools: документы (отгрузки, приёмки)
│   │   └── reports.ts        # Tools: отчёты
│   └── utils/
│       ├── filters.ts        # Построение фильтров МойСклад
│       ├── pagination.ts     # Пагинация (limit, offset)
│       └── errors.ts         # Обработка ошибок API
├── tests/
│   ├── tools/                # Тесты для каждого tool
│   └── api/                  # Тесты API клиента
├── CLAUDE.md                 # Этот файл
├── README.md                 # Документация для пользователей
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

## API МойСклад — ключевая информация

### Базовый URL
```
https://api.moysklad.ru/api/remap/1.2/
```

### Авторизация
Два способа (поддерживаем оба):
1. **Bearer Token**: `Authorization: Bearer <token>` (предпочтительный)
2. **Basic Auth**: `Authorization: Basic <base64(login:password)>`

Конфигурация через переменные окружения:
- `MOYSKLAD_TOKEN` — Bearer токен (приоритетный)
- `MOYSKLAD_LOGIN` + `MOYSKLAD_PASSWORD` — Basic Auth (fallback)

### Основные эндпоинты
- `entity/product` — товары
- `entity/variant` — модификации
- `entity/counterparty` — контрагенты
- `entity/customerorder` — заказы покупателей
- `entity/demand` — отгрузки
- `entity/supply` — приёмки
- `entity/move` — перемещения
- `entity/organization` — юрлица
- `entity/store` — склады
- `report/stock/all` — остатки
- `report/profit/bylproduct` — прибыльность по товарам
- `report/dashboard` — показатели

### Формат фильтров
```
filter=name=iPhone;quantity>0;updated>=2024-01-01
```

Операторы: `=`, `!=`, `>`, `<`, `>=`, `<=`, `~` (like), `=~` (starts with), `~=` (ends with)

### Пагинация
- `limit` — максимум 1000 записей за запрос
- `offset` — смещение

### Развертывание вложенных сущностей
- `expand=agent,positions` — загрузить связанные сущности
- При expand лимит снижается до 100

### Формат ответа
```json
{
  "meta": {
    "href": "...",
    "type": "product",
    "size": 1500,
    "limit": 1000,
    "offset": 0
  },
  "rows": [...]
}
```

### Ограничения API
- Не более 45 запросов в 3 секунды на аккаунт
- Лимит 1000 записей за запрос
- При expand лимит 100 записей

## MCP протокол — ключевая информация

### Структура tool
Каждый tool описывается:
```typescript
{
  name: "moysklad_get_products",      // Уникальное имя (prefix: moysklad_)
  description: "Получить список товаров из МойСклад с возможностью фильтрации",
  inputSchema: {
    type: "object",
    properties: {
      search: { type: "string", description: "Поиск по наименованию" },
      limit: { type: "number", description: "Лимит записей (макс 1000)", default: 25 },
      offset: { type: "number", description: "Смещение для пагинации", default: 0 },
      // ...
    }
  }
}
```

### Формат ответа tool
```typescript
{
  content: [
    {
      type: "text",
      text: JSON.stringify(result, null, 2)
    }
  ]
}
```

### Обработка ошибок
При ошибке возвращаем `isError: true`:
```typescript
{
  content: [{ type: "text", text: "Ошибка: ..." }],
  isError: true
}
```

## Список tools — MVP (Фаза 1)

### Товары
- `moysklad_get_products` — список товаров (фильтры: name, article, archived)
- `moysklad_get_product` — товар по ID (с expand positions/images)

### Остатки
- `moysklad_get_stock` — остатки по всем складам
- `moysklad_get_stock_by_store` — остатки по конкретному складу

### Заказы
- `moysklad_get_orders` — список заказов (фильтры: status, agent, date range)
- `moysklad_get_order` — заказ по ID с позициями
- `moysklad_create_order` — создать заказ

### Контрагенты
- `moysklad_get_counterparties` — список контрагентов (поиск по имени, телефону)
- `moysklad_get_counterparty` — контрагент по ID

### Отчёты
- `moysklad_get_dashboard` — сводка: продажи, заказы, деньги

## Конвенции кода

### Именование
- Tools: `moysklad_<action>_<entity>` (snake_case)
- Файлы: kebab-case или camelCase (единообразно)
- Типы: PascalCase, префикс `Ms` для типов API (MsProduct, MsOrder)
- Интерфейсы: без префикса `I`

### Обработка ошибок
- Все вызовы API оборачиваем в try/catch
- Ошибки МойСклад (поле `errors[]`) парсим и возвращаем человекочитаемо
- Rate limit (429) — ждём и повторяем (retry с exponential backoff)

### Описания tools
- Description на русском языке (целевая аудитория — русскоязычные пользователи)
- Параметры описываем подробно, с примерами значений
- Указываем лимиты и ограничения в description

### Безопасность
- Токены НИКОГДА не логируем и не включаем в ответы
- Валидируем все входящие параметры через inputSchema
- Не доверяем входным данным — sanitize перед отправкой в API

## Команды разработки

```bash
npm run build      # Сборка
npm run dev        # Запуск в dev режиме с hot reload
npm run lint       # Линтер
npm run test       # Тесты
npm run start      # Запуск production
```

## Как запускать MCP сервер

### Через Claude Code
```bash
claude mcp add moysklad -- node dist/index.js
```

### Через npx (после публикации)
```json
{
  "mcpServers": {
    "moysklad": {
      "command": "npx",
      "args": ["-y", "mcp-moysklad"],
      "env": {
        "MOYSKLAD_TOKEN": "<token>"
      }
    }
  }
}
```

## Фазы разработки

### Фаза 1 — MVP
- [ ] Инициализация проекта (package.json, tsconfig, tsup)
- [ ] API клиент с авторизацией и retry
- [ ] 10 базовых tools (товары, остатки, заказы, контрагенты, дашборд)
- [ ] Обработка ошибок
- [ ] README с инструкцией по установке
- [ ] Публикация npm

### Фаза 2 — Расширение
- [ ] Документы: отгрузки, приёмки, перемещения, счета
- [ ] Создание/обновление сущностей (POST/PUT)
- [ ] Расширенные фильтры и сортировка
- [ ] Отчёты: прибыльность, обороты
- [ ] Вебхуки МойСклад

### Фаза 3 — Production
- [ ] Полное покрытие тестами
- [ ] CI/CD (GitHub Actions)
- [ ] Регистрация в MCP реестрах (Anthropic, LobeHub, Smithery)
- [ ] Документация с примерами использования
- [ ] Поддержка JSON-RPC batch запросов

## Контекст разработчика

Автор — Дмитрий, fullstack developer и Tech Lead. Стек: React, TypeScript, NestJS, PostgreSQL, Redis. Имеет опыт интеграции с API МойСклад в production-системе (CRM PROSTOR). Предпочитает чистый, типизированный код без лишних абстракций.

## Полезные ссылки

- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Spec](https://spec.modelcontextprotocol.io/)
- [API МойСклад 1.2 Docs](https://dev.moysklad.ru/doc/api/remap/1.2/)
- [OpenAPI Spec МойСклад](https://github.com/moysklad/api-remap-1.2-openapi-specification)
- [wmakeev/moysklad](https://github.com/wmakeev/moysklad)
