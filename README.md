# mcp-moysklad

MCP (Model Context Protocol) сервер для интеграции AI-ассистентов с ERP-системой [МойСклад](https://moysklad.ru).

## Зачем нужен этот проект?

**МойСклад** — популярная облачная ERP-система для управления торговлей, складом и финансами. Используется тысячами компаний в России и СНГ.

**MCP (Model Context Protocol)** — открытый протокол от Anthropic для подключения AI-ассистентов (Claude, ChatGPT и др.) к внешним источникам данных и инструментам.

**mcp-moysklad** объединяет эти технологии, позволяя:

- Запрашивать данные из МойСклад на естественном языке
- Автоматизировать рутинные операции через AI
- Получать аналитику и отчёты в диалоговом режиме
- Создавать заказы и управлять данными голосом или текстом

### Примеры использования

```
Пользователь: Покажи остатки iPhone на складе
Claude: [вызывает moysklad_get_stock] На складе 45 единиц iPhone 15 Pro...

Пользователь: Какие заказы за последнюю неделю?
Claude: [вызывает moysklad_get_orders] За неделю 23 заказа на сумму 1.2 млн...

Пользователь: Создай заказ для ООО Ромашка на 10 единиц артикула ABC-123
Claude: [вызывает moysklad_create_order] Заказ №00047 создан...
```

## Возможности

| Категория | Инструменты |
|-----------|-------------|
| **Товары** | Список товаров, поиск, фильтрация по артикулу |
| **Остатки** | Остатки по всем складам, по конкретному складу |
| **Заказы** | Список заказов, детали заказа, создание заказа |
| **Контрагенты** | Список контрагентов, поиск по ИНН/телефону |
| **Аналитика** | Dashboard с ключевыми показателями |

## Установка

### Через npx (рекомендуется)

```bash
npx mcp-moysklad
```

### Глобальная установка

```bash
npm install -g mcp-moysklad
```

### Из исходников

```bash
git clone https://github.com/Pelmenya/mcp-moysklad.git
cd mcp-moysklad
npm install
npm run build
```

## Настройка

### 1. Получите токен МойСклад

1. Войдите в [МойСклад](https://moysklad.ru)
2. Перейдите в **Настройки** → **Пользователи** → ваш пользователь
3. В разделе **Токены** создайте новый токен
4. Скопируйте токен (он показывается только один раз!)

### 2. Подключение к Claude Desktop

Откройте файл конфигурации:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Добавьте конфигурацию:

```json
{
  "mcpServers": {
    "moysklad": {
      "command": "npx",
      "args": ["-y", "mcp-moysklad"],
      "env": {
        "MOYSKLAD_TOKEN": "ваш_токен_здесь"
      }
    }
  }
}
```

### 3. Подключение к Claude Code CLI

```bash
claude mcp add moysklad -e MOYSKLAD_TOKEN=ваш_токен -- npx -y mcp-moysklad
```

### Альтернативная авторизация (логин/пароль)

Если нет токена, можно использовать логин и пароль:

```json
{
  "mcpServers": {
    "moysklad": {
      "command": "npx",
      "args": ["-y", "mcp-moysklad"],
      "env": {
        "MOYSKLAD_LOGIN": "admin@company",
        "MOYSKLAD_PASSWORD": "your_password"
      }
    }
  }
}
```

## Доступные инструменты

### Товары

| Инструмент | Описание |
|------------|----------|
| `moysklad_get_products` | Список товаров с поиском и фильтрацией |
| `moysklad_get_product` | Детальная информация о товаре по ID |

**Параметры `moysklad_get_products`:**
- `search` — поиск по наименованию
- `article` — фильтр по артикулу
- `archived` — включать архивные (по умолчанию `false`)
- `limit` — лимит записей (макс 1000, по умолчанию 25)
- `offset` — смещение для пагинации

### Остатки

| Инструмент | Описание |
|------------|----------|
| `moysklad_get_stock` | Остатки по всем складам |
| `moysklad_get_stock_by_store` | Остатки по конкретному складу |

**Параметры `moysklad_get_stock`:**
- `search` — поиск по наименованию
- `stockMode` — режим: `all`, `positiveOnly`, `negativeOnly`, `empty`, `nonEmpty`

### Заказы покупателей

| Инструмент | Описание |
|------------|----------|
| `moysklad_get_orders` | Список заказов с фильтрацией |
| `moysklad_get_order` | Детали заказа с позициями |
| `moysklad_create_order` | Создание нового заказа |

**Параметры `moysklad_get_orders`:**
- `search` — поиск по номеру
- `agentId` — ID контрагента
- `stateId` — ID статуса
- `dateFrom`, `dateTo` — период (YYYY-MM-DD)

### Контрагенты

| Инструмент | Описание |
|------------|----------|
| `moysklad_get_counterparties` | Список контрагентов |
| `moysklad_get_counterparty` | Детали контрагента |

**Параметры `moysklad_get_counterparties`:**
- `search` — поиск по имени, ИНН, телефону, email
- `companyType` — тип: `legal`, `entrepreneur`, `individual`

### Отчёты

| Инструмент | Описание |
|------------|----------|
| `moysklad_get_dashboard` | Сводка: продажи, заказы, деньги |

## Разработка

```bash
# Установка зависимостей
npm install

# Сборка
npm run build

# Запуск в dev режиме (с watch)
npm run dev

# Линтер
npm run lint

# Тесты
npm run test

# Тесты с покрытием
npm run test:coverage
```

### Структура проекта

```
src/
├── index.ts          # Точка входа
├── server.ts         # MCP сервер
├── config.ts         # Конфигурация
├── api/
│   ├── client.ts     # HTTP клиент с retry
│   ├── types.ts      # Типы API
│   └── endpoints.ts  # Эндпоинты
├── tools/
│   ├── products.ts   # Товары
│   ├── stock.ts      # Остатки
│   ├── orders.ts     # Заказы
│   ├── counterparties.ts
│   └── reports.ts    # Dashboard
└── utils/
    ├── errors.ts     # Обработка ошибок
    ├── filters.ts    # Фильтры МойСклад
    └── pagination.ts # Пагинация
```

## Требования

- Node.js 20+
- Аккаунт МойСклад с API-доступом

## Ограничения API МойСклад

- Не более 45 запросов в 3 секунды
- Максимум 1000 записей за запрос
- При expand максимум 100 записей

## Лицензия

MIT

## Автор

[Pelmenya](https://github.com/Pelmenya)

## Ссылки

- [API МойСклад](https://dev.moysklad.ru/doc/api/remap/1.2/)
- [MCP Protocol](https://spec.modelcontextprotocol.io/)
- [Claude Desktop](https://claude.ai/download)
