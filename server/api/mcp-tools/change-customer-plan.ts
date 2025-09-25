import { db } from '../../database/db'
import { organizations, customers, notes } from '../../database/schema'
import { eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

export const definition = {
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
}

export async function handler(params: any) {
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
}