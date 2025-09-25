import express from 'express'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { fromNodeMiddleware } from '#imports'
import { tools } from './tools'
import { registerTools } from './registerTools'

const app = express()
app.use(express.json({ type: ['application/json', 'application/json+rpc'] }))

// Handle all MCP requests (mounted at /mcp by Nuxt, so use / internally)
app.post('/', async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Create a stateless transport for each request
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // No session management - stateless
    enableDnsRebindingProtection: false, // Disabled for development
  })

  // Create and configure MCP server
  const server = new McpServer({
    name: 'aidd-crm-mcp',
    version: '1.0.0'
  })

  // Register all tools
  registerTools(server, tools)

  // Connect and handle the request
  await server.connect(transport)
  await transport.handleRequest(req, res, req.body)
})

// Handle GET requests for SSE (if needed)
app.get('/', async (_req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')

  // For stateless server, just keep connection alive
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