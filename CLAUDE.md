# CLAUDE.md — MCP Server для МойСклад

## Обзор проекта

Это MCP (Model Context Protocol) сервер для интеграции AI-ассистентов (Claude, ChatGPT и др.) с ERP-системой МойСклад (moysklad.ru). Сервер предоставляет набор tools для работы с JSON API МойСклад 1.2 через стандартный MCP-протокол.

Цель — стать первым open-source MCP-сервером для МойСклад и опубликоваться в npm + реестрах MCP.

## Текущий статус

**MVP готов:**
- [x] 10 tools для работы с МойСклад
- [x] 117 тестов, покрытие 90%+
- [x] Husky + lint-staged для pre-commit проверок
- [x] ESLint 9 + Prettier

## Стек технологий

- **Runtime**: Node.js 20+
- **Язык**: TypeScript 5.8 (strict mode)
- **MCP SDK**: `@modelcontextprotocol/sdk` 1.27
- **Валидация**: Zod
- **HTTP клиент**: встроенный fetch (Node.js 20+)
- **Сборка**: tsup (быстрый бандлер на esbuild)
- **Линтер**: ESLint 9 + Prettier
- **Тесты**: Vitest
- **Git hooks**: Husky + lint-staged

## Архитектура

```
mcp-moysklad/
├── src/
│   ├── index.ts              # Точка входа
│   ├── server.ts             # MCP сервер, регистрация tools
│   ├── config.ts             # Конфигурация (env переменные)
│   ├── api/
│   │   ├── client.ts         # HTTP клиент с retry и rate limit
│   │   ├── types.ts          # Типы API МойСклад
│   │   └── endpoints.ts      # Константы эндпоинтов
│   ├── tools/
│   │   ├── index.ts          # Реестр tools
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
├── .husky/                   # Git hooks
├── eslint.config.js          # ESLint 9 flat config
└── vitest.config.ts          # Конфиг тестов
```

## Команды разработки

```bash
npm run build         # Сборка
npm run dev           # Сборка с watch
npm run start         # Запуск
npm run lint          # Линтер
npm run lint:fix      # Линтер с автофиксом
npm run format        # Prettier
npm run test          # Тесты (watch)
npm run test:run      # Тесты (однократно)
npm run test:coverage # Тесты с coverage
```

## Следующие шаги

### Фаза 1.1 — Публикация (ближайшее)
- [ ] Публикация в npm
- [ ] Регистрация в MCP реестрах:
  - [ ] [Anthropic MCP Servers](https://github.com/modelcontextprotocol/servers)
  - [ ] [LobeHub](https://lobehub.com/plugins)
  - [ ] [Smithery](https://smithery.ai/)
  - [ ] [Glama](https://glama.ai/mcp/servers)
- [ ] GitHub Actions для CI/CD

### Фаза 2 — Расширение функционала
- [ ] **Документы**: отгрузки (`demand`), приёмки (`supply`), перемещения (`move`)
- [ ] **Справочники**: склады (`store`), организации (`organization`), валюты
- [ ] **Модификации товаров**: `variant`
- [ ] **Обновление сущностей**: PUT для товаров, контрагентов, заказов
- [ ] **Удаление**: DELETE с подтверждением
- [ ] **Расширенные отчёты**: прибыльность, обороты, остатки по складам

### Фаза 3 — Продвинутые фичи
- [ ] Вебхуки МойСклад (подписка на события)
- [ ] Batch-операции (массовое создание/обновление)
- [ ] Кэширование справочников
- [ ] Поддержка нескольких аккаунтов
- [ ] Интерактивные prompts для сложных сценариев

### Идеи для будущего
- [ ] Интеграция с Telegram-ботом
- [ ] Голосовой интерфейс через Claude
- [ ] Аналитические дашборды
- [ ] Экспорт в Excel/PDF
- [ ] Синхронизация с другими системами (1С, Bitrix24)

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
| `entity/store` | Склады |
| `entity/organization` | Юрлица |
| `report/stock/all` | Остатки |
| `report/dashboard` | Показатели |

### Ограничения
- 45 запросов в 3 секунды
- 1000 записей за запрос (100 при expand)

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

## Полезные ссылки

- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Spec](https://spec.modelcontextprotocol.io/)
- [API МойСклад 1.2](https://dev.moysklad.ru/doc/api/remap/1.2/)
- [OpenAPI МойСклад](https://github.com/moysklad/api-remap-1.2-openapi-specification)
