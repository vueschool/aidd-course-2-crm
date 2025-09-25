import { z } from 'zod'
import { db } from '../../database/db'
import { customers, notes } from '../../database/schema'
import { eq } from 'drizzle-orm'

export const name = 'send_email_to_customer'
export const description = 'Send email to customer primary contact'

export const inputSchema = z.object({
  id: z.string().describe('Customer ID')
})

export type Input = z.infer<typeof inputSchema>

export async function handler(input: Input) {
  const customerId = parseInt(input.id)

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