import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { tools } from './tools/index.js';

export function createServer() {
  const server = new McpServer({
    name: 'mcp-moysklad',
    version: '0.1.0',
  });

  // Регистрируем все tools
  for (const [name, tool] of Object.entries(tools)) {
    server.registerTool(
      name,
      {
        description: tool.description,
        inputSchema: tool.schema as z.ZodObject<z.ZodRawShape>,
      },
      async (args) => {
        try {
          const result = await tool.handler(args);

          if (!result.success) {
            return {
              content: [{ type: 'text' as const, text: result.error ?? 'Неизвестная ошибка' }],
              isError: true,
            };
          }

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(result.data, null, 2),
              },
            ],
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
          return {
            content: [{ type: 'text' as const, text: `Ошибка выполнения: ${message}` }],
            isError: true,
          };
        }
      }
    );
  }

  return server;
}

export async function runServer() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
