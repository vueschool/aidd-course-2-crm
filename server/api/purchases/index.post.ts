import { db } from '../../database/db'
import { purchases } from '../../database/schema'
import { getUserFromEvent } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const auth = getUserFromEvent(event)

  if (!auth) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const body = await readBody(event)

  if (!body.customerId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Customer ID is required'
    })
  }

  if (!body.amount || body.amount <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Valid amount is required'
    })
  }

  if (!body.description) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Description is required'
    })
  }

  const newPurchase = await db.insert(purchases).values({
    customerId: body.customerId,
    amount: body.amount,
    description: body.description,
    purchaseDate: body.purchaseDate || new Date().toISOString()
  }).returning().get()

  return newPurchase
})