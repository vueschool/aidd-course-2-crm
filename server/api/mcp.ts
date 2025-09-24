import { db } from '../database/db'
import { organizations, customers, notes, purchases } from '../database/schema'
import { eq, like, or, desc, and } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

// MCP Tool implementations
const tools = {
  search_customers: async (params: any) => {
    const searchStr = params?.str?.toLowerCase() || ''

    const results = await db
      .select({
        id: customers.id,
        firstName: customers.firstName,
        lastName: customers.lastName,
        email: customers.email,
        phone: customers.phone,
        position: customers.position,
        department: customers.department,
        credit: customers.credit,
        organizationId: customers.organizationId,
        organizationName: organizations.name,
        organizationWebsite: organizations.website,
        organizationIndustry: organizations.industry
      })
      .from(customers)
      .leftJoin(organizations, eq(customers.organizationId, organizations.id))
      .where(
        or(
          sql`LOWER(${customers.firstName}) LIKE ${`%${searchStr}%`}`,
          sql`LOWER(${customers.lastName}) LIKE ${`%${searchStr}%`}`,
          sql`LOWER(${customers.email}) LIKE ${`%${searchStr}%`}`,
          sql`LOWER(${organizations.name}) LIKE ${`%${searchStr}%`}`,
          sql`LOWER(${organizations.website}) LIKE ${`%${searchStr}%`}`,
          sql`LOWER(${organizations.industry}) LIKE ${`%${searchStr}%`}`
        )
      )
      .limit(20)

    return {
      success: true,
      data: results
    }
  },

  get_customer_profile: async (params: any) => {
    const customerId = parseInt(params?.id)

    if (!customerId) {
      throw new Error('Customer ID required')
    }

    const [customer] = await db
      .select({
        id: customers.id,
        firstName: customers.firstName,
        lastName: customers.lastName,
        email: customers.email,
        phone: customers.phone,
        mobile: customers.mobile,
        position: customers.position,
        department: customers.department,
        credit: customers.credit,
        organizationId: customers.organizationId,
        organizationName: organizations.name,
        organizationWebsite: organizations.website,
        organizationIndustry: organizations.industry,
        organizationAddress: organizations.address,
        organizationCity: organizations.city,
        organizationState: organizations.state,
        organizationZip: organizations.zip,
        organizationCountry: organizations.country
      })
      .from(customers)
      .leftJoin(organizations, eq(customers.organizationId, organizations.id))
      .where(eq(customers.id, customerId))
      .limit(1)

    if (!customer) {
      throw new Error('Customer not found')
    }

    const recentNotes = await db
      .select({
        id: notes.id,
        content: notes.content,
        type: notes.type,
        createdAt: notes.createdAt
      })
      .from(notes)
      .where(eq(notes.customerId, customerId))
      .orderBy(desc(notes.createdAt))
      .limit(10)

    const recentPurchases = await db
      .select()
      .from(purchases)
      .where(eq(purchases.customerId, customerId))
      .orderBy(desc(purchases.purchaseDate))
      .limit(10)

    return {
      success: true,
      data: {
        ...customer,
        recentNotes,
        recentPurchases,
        totalCredit: customer.credit
      }
    }
  },

  change_customer_plan: async (params: any) => {
    const customerId = parseInt(params?.id)
    const newPlan = params?.newPlan

    if (!customerId || !newPlan) {
      throw new Error('Customer ID and new plan required')
    }

    if (!['Basic', 'Pro', 'Enterprise'].includes(newPlan)) {
      throw new Error('Invalid plan. Must be Basic, Pro, or Enterprise')
    }

    // Get customer and their organization
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1)

    if (!customer || !customer.organizationId) {
      throw new Error('Customer not found or not associated with an organization')
    }

    const [updated] = await db
      .update(organizations)
      .set({
        plan: newPlan,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(organizations.id, customer.organizationId))
      .returning()

    if (!updated) {
      throw new Error('Organization not found')
    }

    await db.insert(notes).values({
      customerId: customerId,
      organizationId: customer.organizationId,
      userId: 1,
      content: `Plan changed to ${newPlan}`,
      type: 'note'
    })

    return {
      success: true,
      data: {
        customerId: customerId,
        customerName: `${customer.firstName} ${customer.lastName}`,
        organizationId: updated.id,
        organizationName: updated.name,
        newPlan: updated.plan
      }
    }
  },

  credit_account: async (params: any) => {
    const customerId = parseInt(params?.id)
    const amountCents = parseInt(params?.amountCents)
    const reason = params?.reason

    if (!customerId || !amountCents || !reason) {
      throw new Error('Customer ID, amount, and reason required')
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1)

    if (!customer) {
      throw new Error('Customer not found')
    }

    const amountDollars = amountCents / 100
    const newBalance = (customer.credit || 0) + amountDollars

    const [updated] = await db
      .update(customers)
      .set({
        credit: newBalance,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(customers.id, customerId))
      .returning()

    // Record this as a negative purchase (credit)
    await db.insert(purchases).values({
      customerId: customerId,
      amount: -amountDollars, // Negative amount for credit
      description: `Credit: ${reason}`,
      purchaseDate: sql`CURRENT_TIMESTAMP`
    })

    await db.insert(notes).values({
      customerId: customerId,
      organizationId: customer.organizationId,
      userId: 1,
      content: `Account credited: $${amountDollars} (${reason})`,
      type: 'note'
    })

    return {
      success: true,
      data: {
        customerId: updated.id,
        customerName: `${updated.firstName} ${updated.lastName}`,
        previousBalance: customer.credit,
        newBalance: updated.credit,
        creditApplied: amountDollars
      }
    }
  },

  send_email_to_customer: async (params: any) => {
    const customerId = parseInt(params?.id)

    if (!customerId) {
      throw new Error('Customer ID required')
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1)

    if (!customer) {
      throw new Error('Customer not found')
    }

    if (!customer.email) {
      throw new Error('Customer does not have an email address')
    }

    await db.insert(notes).values({
      customerId: customerId,
      organizationId: customer.organizationId,
      userId: 1,
      content: `Email sent to ${customer.email}`,
      type: 'email'
    })

    return {
      success: true,
      data: {
        customerId,
        customerName: `${customer.firstName} ${customer.lastName}`,
        recipientEmail: customer.email,
        message: 'Email queued for sending'
      }
    }
  }
}

// Tool definitions for MCP
const toolDefinitions = [
  {
    name: 'search_customers',
    description: 'Search for customers by name, website, or industry',
    inputSchema: {
      type: 'object',
      properties: {
        str: {
          type: 'string',
          description: 'Search string'
        }
      },
      required: ['str']
    }
  },
  {
    name: 'get_customer_profile',
    description: 'Get detailed customer information',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Customer ID'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'change_customer_plan',
    description: 'Change customer subscription plan',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Customer ID'
        },
        newPlan: {
          type: 'string',
          enum: ['Basic', 'Pro', 'Enterprise'],
          description: 'New plan'
        }
      },
      required: ['id', 'newPlan']
    }
  },
  {
    name: 'credit_account',
    description: 'Add credits to customer account',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Customer ID'
        },
        amountCents: {
          type: 'number',
          description: 'Amount in cents'
        },
        reason: {
          type: 'string',
          description: 'Reason for credit'
        }
      },
      required: ['id', 'amountCents', 'reason']
    }
  },
  {
    name: 'send_email_to_customer',
    description: 'Send email to customer primary contact',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Customer ID'
        }
      },
      required: ['id']
    }
  }
]

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
          const result = await tools[toolName as keyof typeof tools](toolArgs)
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