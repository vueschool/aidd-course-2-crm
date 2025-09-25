import express from 'express'
import { fromNodeMiddleware } from '#imports'
import { z } from 'zod'
import { toolDefinitions, toolHandlers } from '../mcp/tools'

// Express app for HTTP transport
const app = express()
app.use(express.json())

// Handle MCP requests via HTTP
app.post('/', async (req, res) => {
  try {
    const { method, params, id } = req.body

    let result: any
    switch (method) {
      case 'initialize':
        result = {
          protocolVersion: '2025-06-18',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'aidd-crm-mcp',
            version: '1.0.0'
          }
        }
        break

      case 'tools/list':
        result = { tools: toolDefinitions }
        break

      case 'tools/call':
        const { name, arguments: args } = params
        const handler = toolHandlers[name]

        if (!handler) {
          throw new Error(`Unknown tool: ${name}`)
        }

        try {
          const response = await handler(args)
          result = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(response, null, 2)
              }
            ]
          }
        } catch (error: any) {
          if (error instanceof z.ZodError) {
            throw new Error(`Invalid arguments: ${error.message}`)
          }
          throw error
        }
        break

      default:
        return res.json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`
          }
        })
    }

    res.json({
      jsonrpc: '2.0',
      id,
      result
    })
  } catch (error: any) {
    res.json({
      jsonrpc: '2.0',
      id: req.body.id || null,
      error: {
        code: -32603,
        message: error.message || 'Internal error'
      }
    })
  }
})

// SSE endpoint for MCP Inspector
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')

  res.write('data: {"type":"connection","status":"ready"}\n\n')

  const keepAlive = setInterval(() => {
    res.write(':keepalive\n\n')
  }, 30000)

  req.on('close', () => {
    clearInterval(keepAlive)
  })
})

// CORS options
app.options('/', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.send('')
})

export default fromNodeMiddleware(app)