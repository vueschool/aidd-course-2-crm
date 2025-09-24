import { db } from '../../database/db'
import { customers } from '../../database/schema'
import { eq } from 'drizzle-orm'
import { getUserFromEvent } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const auth = getUserFromEvent(event)

  if (!auth) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Customer ID is required'
    })
  }

  const customer = await db.select()
    .from(customers)
    .where(eq(customers.id, parseInt(id)))
    .get()

  if (!customer) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Customer not found'
    })
  }

  return customer
})