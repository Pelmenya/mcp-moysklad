import { runServer } from './server.js';

runServer().catch((error) => {
  console.error('Ошибка запуска MCP сервера:', error);
  process.exit(1);
});
