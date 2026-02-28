import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { tools, type ToolName } from './tools/index.js';

export function createServer() {
  const server = new Server(
    {
      name: 'mcp-moysklad',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Список доступных tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: Object.entries(tools).map(([name, tool]) => ({
        name,
        description: tool.description,
        inputSchema: zodToJsonSchema(tool.schema),
      })),
    };
  });

  // Обработка вызовов tools
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name as ToolName;
    const tool = tools[toolName];

    if (!tool) {
      return {
        content: [{ type: 'text', text: `Неизвестный инструмент: ${toolName}` }],
        isError: true,
      };
    }

    try {
      const parsed = tool.schema.safeParse(request.params.arguments);
      if (!parsed.success) {
        return {
          content: [{
            type: 'text',
            text: `Ошибка валидации параметров: ${parsed.error.message}`,
          }],
          isError: true,
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (tool.handler as (input: any) => Promise<any>)(parsed.data);

      if (result.success === false) {
        return {
          content: [{ type: 'text', text: result.error }],
          isError: true,
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result.data, null, 2),
        }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
      return {
        content: [{ type: 'text', text: `Ошибка выполнения: ${message}` }],
        isError: true,
      };
    }
  });

  return server;
}

export async function runServer() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
