import { z } from 'zod'
import { db } from '../../database/db'
import { organizations, customers, notes, purchases } from '../../database/schema'
import { eq, desc } from 'drizzle-orm'

const inputSchema = z.object({
  id: z.string().describe('Customer ID')
})

type Input = z.infer<typeof inputSchema>

async function handler(input: Input) {
  const customerId = parseInt(input.id)

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
}

export default {
  name: 'get_customer_profile',
  description: 'Get detailed customer information',
  inputSchema,
  handler,
  readOnly: true
}