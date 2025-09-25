import { db } from '../../database/db'
import { organizations, customers } from '../../database/schema'
import { eq, or } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

export const definition = {
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
}

export async function handler(params: any) {
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
}