import { db } from '../database/db'
import { organizations, contacts, notes, creditTransactions } from '../database/schema'
import { eq, like, or, desc, and } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

// MCP Tool implementations
const tools = {
  search_customers: async (params: any) => {
    const searchStr = params?.str?.toLowerCase() || ''

    const results = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        plan: organizations.plan,
        website: organizations.website,
        industry: organizations.industry,
        primaryContact: sql`(
          SELECT json_object(
            'firstName', c.first_name,
            'lastName', c.last_name,
            'email', c.email
          )
          FROM contacts c
          WHERE c.organization_id = organizations.id
          AND c.is_primary = 1
          LIMIT 1
        )`
      })
      .from(organizations)
      .where(
        or(
          sql`LOWER(${organizations.name}) LIKE ${`%${searchStr}%`}`,
          sql`LOWER(${organizations.website}) LIKE ${`%${searchStr}%`}`,
          sql`LOWER(${organizations.industry}) LIKE ${`%${searchStr}%`}`
        )
      )
      .limit(20)

    return {
      success: true,
      data: results.map(r => ({
        ...r,
        primaryContact: r.primaryContact ? JSON.parse(r.primaryContact as string) : null
      }))
    }
  },

  get_customer_profile: async (params: any) => {
    const customerId = parseInt(params?.id)

    if (!customerId) {
      throw new Error('Customer ID required')
    }

    const [customer] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, customerId))
      .limit(1)

    if (!customer) {
      throw new Error('Customer not found')
    }

    const customerContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.organizationId, customerId))
      .orderBy(desc(contacts.isPrimary))

    const recentNotes = await db
      .select({
        id: notes.id,
        content: notes.content,
        type: notes.type,
        createdAt: notes.createdAt
      })
      .from(notes)
      .where(eq(notes.organizationId, customerId))
      .orderBy(desc(notes.createdAt))
      .limit(10)

    const recentCredits = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.organizationId, customerId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(10)

    return {
      success: true,
      data: {
        ...customer,
        contacts: customerContacts,
        recentNotes,
        recentCredits,
        totalCreditsCents: customer.accountCreditsCents
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

    const [updated] = await db
      .update(organizations)
      .set({
        plan: newPlan,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(organizations.id, customerId))
      .returning()

    if (!updated) {
      throw new Error('Customer not found')
    }

    await db.insert(notes).values({
      organizationId: customerId,
      userId: 1,
      content: `Plan changed to ${newPlan}`,
      type: 'note'
    })

    return {
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        plan: updated.plan
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
      .from(organizations)
      .where(eq(organizations.id, customerId))
      .limit(1)

    if (!customer) {
      throw new Error('Customer not found')
    }

    const newBalance = (customer.accountCreditsCents || 0) + amountCents

    const [updated] = await db
      .update(organizations)
      .set({
        accountCreditsCents: newBalance,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(organizations.id, customerId))
      .returning()

    await db.insert(creditTransactions).values({
      organizationId: customerId,
      amountCents,
      reason,
      createdBy: 1
    })

    await db.insert(notes).values({
      organizationId: customerId,
      userId: 1,
      content: `Account credited: ${amountCents / 100} (${reason})`,
      type: 'note'
    })

    return {
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        previousBalance: customer.accountCreditsCents,
        newBalance: updated.accountCreditsCents,
        creditApplied: amountCents
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
      .from(organizations)
      .where(eq(organizations.id, customerId))
      .limit(1)

    if (!customer) {
      throw new Error('Customer not found')
    }

    const [primaryContact] = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.organizationId, customerId),
          eq(contacts.isPrimary, true)
        )
      )
      .limit(1)

    if (!primaryContact || !primaryContact.email) {
      throw new Error('No primary contact with email found for this customer')
    }

    await db.insert(notes).values({
      organizationId: customerId,
      userId: 1,
      contactId: primaryContact.id,
      content: `Email sent to ${primaryContact.email}`,
      type: 'email'
    })

    return {
      success: true,
      data: {
        customerId,
        customerName: customer.name,
        recipientEmail: primaryContact.email,
        recipientName: `${primaryContact.firstName} ${primaryContact.lastName}`,
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

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { method, params, id, jsonrpc } = body

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

  try {
    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '0.1.0',
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
      id: id || null,
      error: {
        code: -32603,
        message: 'Internal error',
        data: error.message
      }
    }
  }
})