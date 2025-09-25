import { db } from '../../database/db'
import { customers, purchases, notes } from '../../database/schema'
import { eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

export const definition = {
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
}

export async function handler(params: any) {
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
}