import * as searchCustomers from './mcp-tools/search-customers'
import * as getCustomerProfile from './mcp-tools/get-customer-profile'
import * as changeCustomerPlan from './mcp-tools/change-customer-plan'
import * as creditAccount from './mcp-tools/credit-account'
import * as sendEmailToCustomer from './mcp-tools/send-email-to-customer'

// Register all tools
const toolModules = [
  searchCustomers,
  getCustomerProfile,
  changeCustomerPlan,
  creditAccount,
  sendEmailToCustomer
]

// Build tools object and definitions array
const tools: Record<string, Function> = {}
const toolDefinitions: any[] = []

for (const module of toolModules) {
  if (module.definition && module.handler) {
    tools[module.definition.name] = module.handler
    toolDefinitions.push(module.definition)
  }
}

async function processRequest(body: string) {
  try {
    const request = JSON.parse(body)
    const { method, params, id, jsonrpc } = request

    // Ensure it's a JSON-RPC 2.0 request
    if (jsonrpc !== '2.0') {
      return {
        jsonrpc: '2.0',
        id: id || null,
        error: {
          code: -32600,
          message: 'Invalid Request - Must be JSON-RPC 2.0'
        }
      }
    }

    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2025-06-18',
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'aidd-crm-mcp',
              version: '1.0.0'
            }
          }
        }

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: toolDefinitions
          }
        }

      case 'tools/call':
        const toolName = params?.name
        const toolArgs = params?.arguments

        if (!toolName || !(toolName in tools)) {
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: `Tool not found: ${toolName}`
            }
          }
        }

        try {
          const result = await tools[toolName](toolArgs)
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            }
          }
        } catch (error: any) {
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32603,
              message: error.message || 'Internal error'
            }
          }
        }

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`
          }
        }
    }
  } catch (error: any) {
    return {
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: 'Parse error',
        data: error.message
      }
    }
  }
}

export default defineEventHandler(async (event) => {
  // Handle OPTIONS for CORS
  if (event.method === 'OPTIONS') {
    setHeader(event, 'Access-Control-Allow-Origin', '*')
    setHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type')
    return ''
  }

  // Set CORS headers
  setHeader(event, 'Access-Control-Allow-Origin', '*')

  // For POST requests - standard JSON-RPC
  if (event.method === 'POST') {
    const body = await readBody(event)
    const response = await processRequest(JSON.stringify(body))
    return response
  }

  // For GET requests - SSE stream for MCP Inspector
  if (event.method === 'GET') {
    setHeader(event, 'Content-Type', 'text/event-stream')
    setHeader(event, 'Cache-Control', 'no-cache')
    setHeader(event, 'Connection', 'keep-alive')

    const { res } = event.node

    // Send initial connection
    res.write('data: {"type":"connection","status":"ready"}\n\n')

    // Handle incoming messages via query params or wait for POST
    const keepAlive = setInterval(() => {
      res.write(':keepalive\n\n')
    }, 30000)

    // Cleanup on close
    event.node.req.on('close', () => {
      clearInterval(keepAlive)
    })

    // Don't end the response, keep connection open
    return new Promise(() => {})
  }

  // Method not allowed
  return {
    jsonrpc: '2.0',
    id: null,
    error: {
      code: -32601,
      message: 'Method not allowed'
    }
  }
})