# mcp-moysklad

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org)

MCP-сервер для интеграции AI-ассистентов с ERP-системой [МойСклад](https://moysklad.ru).

> **MCP (Model Context Protocol)** — открытый протокол от Anthropic для подключения AI к внешним данным и инструментам.

## Что умеет

```
👤 Покажи контрагентов с ИНН 7707083893
🤖 Найден 1 контрагент: ООО "Ромашка"...

👤 Какие остатки iPhone на складе?
🤖 iPhone 15 Pro — 45 шт., iPhone 14 — 23 шт...

👤 Создай заказ для ООО Ромашка на 10 штук арт. ABC-123
🤖 Заказ №00047 создан на сумму 150 000 ₽
```

## Доступные инструменты

| Инструмент | Описание |
|------------|----------|
| `moysklad_get_products` | Список товаров с поиском и фильтрацией |
| `moysklad_get_product` | Товар по ID |
| `moysklad_get_stock` | Остатки по всем складам |
| `moysklad_get_stock_by_store` | Остатки по конкретному складу |
| `moysklad_get_counterparties` | Контрагенты с поиском по ИНН/телефону |
| `moysklad_get_counterparty` | Контрагент по ID |
| `moysklad_get_orders` | Заказы с фильтрацией по дате/статусу |
| `moysklad_get_order` | Заказ с позициями |
| `moysklad_create_order` | Создание заказа |
| `moysklad_get_dashboard` | Сводка: продажи, заказы, деньги |

## Быстрый старт

### 1. Получите токен МойСклад

**МойСклад** → **Настройки** → **Пользователи** → ваш пользователь → **Токены** → создать

### 2. Подключите к Claude Desktop

Откройте конфиг:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "moysklad": {
      "command": "npx",
      "args": ["-y", "mcp-moysklad"],
      "env": {
        "MOYSKLAD_TOKEN": "ваш_токен"
      }
    }
  }
}
```

### 3. Готово!

Перезапустите Claude Desktop и спросите: *"Покажи товары из МойСклад"*

## Альтернативные способы подключения

### Claude Code CLI

```bash
claude mcp add moysklad -e MOYSKLAD_TOKEN=ваш_токен -- npx -y mcp-moysklad
```

### Из исходников

```bash
git clone https://github.com/Pelmenya/mcp-moysklad.git
cd mcp-moysklad
npm install && npm run build

# Добавьте в конфиг Claude Desktop:
# "command": "node",
# "args": ["/путь/к/mcp-moysklad/dist/index.js"]
```

### Авторизация по логину/паролю

```json
{
  "env": {
    "MOYSKLAD_LOGIN": "admin@company",
    "MOYSKLAD_PASSWORD": "пароль"
  }
}
```

## Параметры инструментов

### Товары

```
moysklad_get_products:
  search    — поиск по названию
  article   — фильтр по артикулу
  archived  — включать архивные (false)
  limit     — лимит записей (1-1000)
  offset    — смещение
```

### Остатки

```
moysklad_get_stock:
  search     — поиск по названию
  stockMode  — all | positiveOnly | negativeOnly | empty | nonEmpty
```

### Заказы

```
moysklad_get_orders:
  search   — поиск по номеру
  agentId  — ID контрагента
  stateId  — ID статуса
  dateFrom — начало периода (YYYY-MM-DD)
  dateTo   — конец периода (YYYY-MM-DD)

moysklad_create_order:
  organizationId — ID организации (обязательно)
  agentId        — ID контрагента (обязательно)
  positions      — [{productId, quantity, price?, discount?}]
```

### Контрагенты

```
moysklad_get_counterparties:
  search      — поиск по имени, ИНН, телефону, email
  companyType — legal | entrepreneur | individual
```

## Разработка

```bash
npm install       # Установка
npm run build     # Сборка
npm run dev       # Сборка с watch
npm run test      # Тесты
npm run test:api  # Тест с реальным API (нужен .env)
npm run lint      # Линтер
```

### Структура

```
src/
├── index.ts          # Точка входа
├── server.ts         # MCP сервер
├── config.ts         # Конфигурация
├── api/
│   ├── client.ts     # HTTP клиент с retry
│   ├── types.ts      # Типы API МойСклад
│   └── endpoints.ts  # Эндпоинты
├── tools/            # Инструменты (10 шт.)
└── utils/            # Утилиты
```

## Ограничения

- **API МойСклад**: 45 запросов / 3 сек, макс 1000 записей
- **Dashboard**: только на платных тарифах

## Лицензия

MIT © [Pelmenya](https://github.com/Pelmenya)

## Ссылки

- [API МойСклад](https://dev.moysklad.ru/doc/api/remap/1.2/)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Claude Desktop](https://claude.ai/download)
