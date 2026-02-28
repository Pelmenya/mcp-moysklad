# mcp-moysklad

MCP сервер для интеграции AI-ассистентов (Claude, ChatGPT и др.) с ERP-системой [МойСклад](https://moysklad.ru).

## Возможности

- Получение списка товаров с фильтрацией и поиском
- Просмотр остатков по складам
- Работа с заказами покупателей (просмотр и создание)
- Управление контрагентами
- Дашборд с ключевыми показателями

## Установка

```bash
npm install -g mcp-moysklad
```

Или через npx:

```bash
npx mcp-moysklad
```

## Настройка

### Переменные окружения

Авторизация через Bearer Token (рекомендуется):
```
MOYSKLAD_TOKEN=your_token_here
```

Или через логин/пароль:
```
MOYSKLAD_LOGIN=your_login
MOYSKLAD_PASSWORD=your_password
```

### Подключение к Claude Desktop

Добавьте в `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "moysklad": {
      "command": "npx",
      "args": ["-y", "mcp-moysklad"],
      "env": {
        "MOYSKLAD_TOKEN": "your_token_here"
      }
    }
  }
}
```

### Подключение через Claude Code CLI

```bash
claude mcp add moysklad -- npx -y mcp-moysklad
```

## Доступные инструменты

| Инструмент | Описание |
|------------|----------|
| `moysklad_get_products` | Получить список товаров |
| `moysklad_get_product` | Получить товар по ID |
| `moysklad_get_stock` | Получить остатки по всем складам |
| `moysklad_get_stock_by_store` | Получить остатки по конкретному складу |
| `moysklad_get_counterparties` | Получить список контрагентов |
| `moysklad_get_counterparty` | Получить контрагента по ID |
| `moysklad_get_orders` | Получить список заказов |
| `moysklad_get_order` | Получить заказ по ID с позициями |
| `moysklad_create_order` | Создать заказ покупателя |
| `moysklad_get_dashboard` | Получить сводку показателей |

## Разработка

```bash
# Установка зависимостей
npm install

# Сборка
npm run build

# Запуск в dev режиме
npm run dev

# Линтер
npm run lint

# Тесты
npm run test
```

## Лицензия

MIT
