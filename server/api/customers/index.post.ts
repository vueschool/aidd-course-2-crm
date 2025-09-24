import { db } from '../../database/db'
import { customers } from '../../database/schema'
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

  const newCustomer = await db.insert(customers).values({
    ...body,
    credit: body.credit || 0
  }).returning().get()

  return newCustomer
})