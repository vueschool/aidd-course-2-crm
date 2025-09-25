import express from 'express'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { fromNodeMiddleware } from '#imports'
import { tools } from './tools'

const app = express()
app.use(express.json({ type: ['application/json', 'application/json+rpc'] }))

// Handle all MCP requests (mounted at /mcp by Nuxt, so use / internally)
app.post('/', async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Create a new transport for each request (stateless)
  const transport = new StreamableHTTPServerTransport({
    // No session management - stateless server
    sessionIdGenerator: undefined,
    // DNS rebinding protection disabled for development
    enableDnsRebindingProtection: false,
  })

  const server = new McpServer({
    name: 'aidd-crm-mcp',
    version: '1.0.0'
  })

  // Register each tool using registerTool which handles Zod schemas
  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema.shape
      },
      async (params: any) => {
        // The SDK handles validation with Zod automatically
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

  // Connect to the MCP server
  await server.connect(transport)

  // Handle the request
  await transport.handleRequest(req, res, req.body)
})

// Handle GET requests (for SSE if needed)
app.get('/', async (_req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')

  // For stateless server, we just keep the connection alive
  res.write('data: {"type":"connection","status":"ready"}\n\n')
})

// CORS options
app.options('/', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.send('')
})

export default fromNodeMiddleware(app)