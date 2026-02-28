# CLAUDE.md — MCP Server для МойСклад

## Обзор проекта

Это MCP (Model Context Protocol) сервер для интеграции AI-ассистентов (Claude, ChatGPT и др.) с ERP-системой МойСклад (moysklad.ru). Сервер предоставляет набор tools для работы с JSON API МойСклад 1.2 через стандартный MCP-протокол.

Цель — стать первым open-source MCP-сервером для МойСклад и опубликоваться в npm + реестрах MCP.

## Текущий статус

**MVP готов и протестирован на реальном API:**
- [x] 10 tools для работы с МойСклад
- [x] 117 тестов, покрытие 90%+
- [x] Husky + lint-staged для pre-commit проверок
- [x] ESLint 9 (strict, no-any) + Prettier
- [x] dotenv для .env файлов
- [x] Скрипт `test:api` для проверки на реальном API
- [x] Протестировано на бесплатном тарифе МойСклад

**Известные ограничения:**
- `report/dashboard` недоступен на бесплатном тарифе

## Стек технологий

- **Runtime**: Node.js 20+
- **Язык**: TypeScript 5.8 (strict mode, no-any)
- **MCP SDK**: `@modelcontextprotocol/sdk` 1.27 (McpServer API)
- **Валидация**: Zod
- **HTTP клиент**: встроенный fetch (Node.js 20+)
- **Сборка**: tsup (быстрый бандлер на esbuild)
- **Линтер**: ESLint 9 flat config + Prettier
- **Тесты**: Vitest + @vitest/coverage-v8
- **Git hooks**: Husky + lint-staged
- **Env**: dotenv

## Архитектура

```
mcp-moysklad/
├── src/
│   ├── index.ts              # Точка входа
│   ├── server.ts             # McpServer, регистрация tools
│   ├── config.ts             # Конфигурация (env, dotenv)
│   ├── api/
│   │   ├── client.ts         # HTTP клиент с retry и rate limit
│   │   ├── types.ts          # Типы API МойСклад
│   │   └── endpoints.ts      # Константы эндпоинтов
│   ├── tools/
│   │   ├── index.ts          # Реестр tools + типы ToolDefinition
│   │   ├── products.ts       # Товары (2 tools)
│   │   ├── stock.ts          # Остатки (2 tools)
│   │   ├── orders.ts         # Заказы (3 tools)
│   │   ├── counterparties.ts # Контрагенты (2 tools)
│   │   └── reports.ts        # Dashboard (1 tool)
│   └── utils/
│       ├── filters.ts        # Построение фильтров
│       ├── pagination.ts     # Пагинация
│       └── errors.ts         # Обработка ошибок
├── tests/                    # Тесты (117 штук)
├── scripts/
│   └── test-api.ts           # Тест с реальным API
├── .husky/                   # Git hooks
├── eslint.config.js          # ESLint 9 flat config
└── vitest.config.ts          # Конфиг тестов
```

## Команды разработки

```bash
npm run build         # Сборка
npm run dev           # Сборка с watch
npm run start         # Запуск MCP сервера
npm run lint          # Линтер
npm run lint:fix      # Линтер с автофиксом
npm run format        # Prettier
npm run test          # Тесты (watch)
npm run test:run      # Тесты (однократно)
npm run test:coverage # Тесты с coverage
npm run test:api      # Тест с реальным API (нужен .env)
```

## Roadmap

### Фаза 1.1 — Публикация
- [ ] Публикация в npm (`npm publish`)
- [ ] GitHub Actions для CI (lint + test на push/PR)
- [ ] Автопубликация npm при изменении version
- [ ] Регистрация в MCP реестрах:
  - [ ] [Smithery](https://smithery.ai/)
  - [ ] [Glama](https://glama.ai/mcp/servers)
  - [ ] [mcp.so](https://mcp.so/)
  - [ ] [LobeHub](https://lobehub.com/plugins)

### Фаза 2 — CRUD операции
Перейти от read-only к полноценному управлению данными.

- [ ] **Создание сущностей** (POST):
  - [ ] `moysklad_create_product` — создать товар
  - [ ] `moysklad_create_counterparty` — создать контрагента
- [ ] **Обновление сущностей** (PUT):
  - [ ] `moysklad_update_product` — обновить товар (цена, название, описание)
  - [ ] `moysklad_update_order` — изменить заказ (статус, позиции)
  - [ ] `moysklad_update_counterparty` — обновить контрагента
- [ ] **Удаление** (DELETE):
  - [ ] `moysklad_delete_product` — удалить товар
  - [ ] `moysklad_delete_order` — удалить заказ

### Фаза 3 — Документы
Работа с документооборотом.

- [ ] **Отгрузки** (`entity/demand`):
  - [ ] `moysklad_get_demands` — список отгрузок
  - [ ] `moysklad_get_demand` — отгрузка по ID
  - [ ] `moysklad_create_demand` — создать отгрузку из заказа
- [ ] **Приёмки** (`entity/supply`):
  - [ ] `moysklad_get_supplies` — список приёмок
  - [ ] `moysklad_create_supply` — создать приёмку
- [ ] **Перемещения** (`entity/move`):
  - [ ] `moysklad_create_move` — перемещение между складами
- [ ] **Счета** (`entity/invoiceout`):
  - [ ] `moysklad_create_invoice` — выставить счёт

### Фаза 4 — Справочники и аналитика
- [ ] **Справочники**:
  - [ ] `moysklad_get_stores` — список складов
  - [ ] `moysklad_get_organizations` — список юрлиц
  - [ ] `moysklad_get_currencies` — валюты
  - [ ] `moysklad_get_employees` — сотрудники
- [ ] **Расширенные отчёты**:
  - [ ] `moysklad_get_profit_by_product` — прибыльность по товарам
  - [ ] `moysklad_get_turnover` — обороты
  - [ ] `moysklad_get_stock_by_store` — остатки по складам (детализация)
- [ ] **Модификации товаров** (`entity/variant`):
  - [ ] `moysklad_get_variants` — список модификаций
  - [ ] `moysklad_create_variant` — создать модификацию (размер, цвет)

### Фаза 5 — Продвинутые фичи
- [ ] **Вебхуки МойСклад** — подписка на события (новый заказ, изменение остатков)
- [ ] **Batch-операции** — массовое создание/обновление (до 1000 сущностей)
- [ ] **Кэширование** — кэш справочников для ускорения
- [ ] **Мульти-аккаунт** — поддержка нескольких аккаунтов МойСклад
- [ ] **MCP Prompts** — интерактивные сценарии:
  - [ ] "Оформить заказ" — пошаговый wizard
  - [ ] "Инвентаризация" — сверка остатков
  - [ ] "Отчёт за период" — выбор дат и типа отчёта
- [ ] **MCP Resources** — подписка на данные МойСклад в реальном времени

### Идеи на будущее
- [ ] Интеграция с Telegram-ботом для уведомлений
- [ ] Экспорт в Excel/PDF через AI
- [ ] Голосовой интерфейс ("Алиса, покажи остатки")
- [ ] Синхронизация с 1С, Bitrix24, AmoCRM
- [ ] AI-аналитик: автоматические рекомендации по закупкам
- [ ] Прогнозирование спроса на основе истории продаж

## API МойСклад — справочник

### Базовый URL
```
https://api.moysklad.ru/api/remap/1.2/
```

### Авторизация
- **Bearer Token**: `Authorization: Bearer <token>` (рекомендуется)
- **Basic Auth**: `Authorization: Basic <base64(login:password)>`

### Основные эндпоинты
| Эндпоинт | Описание |
|----------|----------|
| `entity/product` | Товары |
| `entity/variant` | Модификации |
| `entity/counterparty` | Контрагенты |
| `entity/customerorder` | Заказы покупателей |
| `entity/demand` | Отгрузки |
| `entity/supply` | Приёмки |
| `entity/move` | Перемещения |
| `entity/invoiceout` | Счета покупателям |
| `entity/store` | Склады |
| `entity/organization` | Юрлица |
| `entity/employee` | Сотрудники |
| `report/stock/all` | Остатки |
| `report/profit/byproduct` | Прибыльность |
| `report/dashboard` | Показатели |

### Ограничения
- 45 запросов в 3 секунды
- 1000 записей за запрос (100 при expand)
- `report/dashboard` — только платные тарифы

## Конвенции кода

### Именование
- Tools: `moysklad_<action>_<entity>` (snake_case)
- Типы: PascalCase с префиксом `Ms` (MsProduct, MsOrder)
- Файлы: camelCase

### Правила
- Все вызовы API в try/catch
- Ошибки парсим в человекочитаемый формат
- Rate limit (429) — retry с backoff
- Токены никогда не логируем
- Описания tools на русском языке
- Отступы: 2 пробела
- Запрещён `any` — строгая типизация
- Версии зависимостей без `^` (фиксированные)

## Полезные ссылки

- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Spec](https://spec.modelcontextprotocol.io/)
- [API МойСклад 1.2](https://dev.moysklad.ru/doc/api/remap/1.2/)
- [OpenAPI МойСклад](https://github.com/moysklad/api-remap-1.2-openapi-specification)
