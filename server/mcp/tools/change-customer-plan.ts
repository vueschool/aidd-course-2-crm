import { z } from 'zod'
import { db } from '../../database/db'
import { organizations, customers, notes } from '../../database/schema'
import { eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

const inputSchema = z.object({
  id: z.string().describe('Customer ID'),
  newPlan: z.enum(['Basic', 'Pro', 'Enterprise']).describe('New plan')
})

type Input = z.infer<typeof inputSchema>

async function handler(input: Input) {
  const customerId = parseInt(input.id)
  const newPlan = input.newPlan

  if (!customerId) {
    throw new Error('Customer ID required')
  }

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

export default {
  name: 'change_customer_plan',
  description: 'Change customer subscription plan',
  inputSchema,
  handler
}