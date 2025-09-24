import { db } from '../../database/db'
import { purchases, customers } from '../../database/schema'
import { getUserFromEvent } from '../../utils/auth'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const auth = getUserFromEvent(event)

  if (!auth) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const query = getQuery(event)
  const limit = Number(query.limit) || 50
  const offset = Number(query.offset) || 0
  const customerId = query.customerId ? Number(query.customerId) : null

  let queryBuilder = db.select({
    purchase: purchases,
    customer: customers
  })
    .from(purchases)
    .leftJoin(customers, eq(purchases.customerId, customers.id))
    .orderBy(desc(purchases.purchaseDate))
    .limit(limit)
    .offset(offset)

  if (customerId) {
    queryBuilder = queryBuilder.where(eq(purchases.customerId, customerId))
  }

  const results = await queryBuilder.all()

  return {
    data: results.map(r => ({ ...r.purchase, customer: r.customer })),
    limit,
    offset
  }
})