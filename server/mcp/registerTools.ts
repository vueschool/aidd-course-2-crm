import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

interface Tool {
  name: string
  description: string
  inputSchema: z.ZodObject<any>
  handler: (params: any) => Promise<any>
  readOnly?: boolean
}

export function registerTools(server: McpServer, tools: Tool[]) {
  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema.shape,
        ...(tool.readOnly && {
          annotations: {
            readOnlyHint: true
          }
        })
      },
      async (params: any) => {
        const result = await tool.handler(params)

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      }
    )
  }
}