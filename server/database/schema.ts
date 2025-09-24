import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const organizations = sqliteTable('organizations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  website: text('website'),
  industry: text('industry'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zip: text('zip'),
  country: text('country'),
  plan: text('plan', { enum: ['Basic', 'Pro', 'Enterprise'] }).default('Basic').notNull(),
  accountCreditsCents: integer('account_credits_cents').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull()
})

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  role: text('role', { enum: ['admin', 'user'] }).default('user').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull()
})

export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  organizationId: integer('organization_id').references(() => organizations.id, { onDelete: 'set null' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  mobile: text('mobile'),
  position: text('position'),
  department: text('department'),
  credit: real('credit').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull()
})

export const notes = sqliteTable('notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  organizationId: integer('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  type: text('type', { enum: ['call', 'email', 'meeting', 'note'] }).default('note').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull()
})

export const opportunities = sqliteTable('opportunities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  organizationId: integer('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  value: real('value'),
  stage: text('stage', { enum: ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] }).default('lead').notNull(),
  probability: integer('probability').default(0),
  expectedCloseDate: text('expected_close_date'),
  assignedTo: integer('assigned_to').references(() => users.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull()
})


export const purchases = sqliteTable('purchases', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  amount: real('amount').notNull(),
  description: text('description').notNull(),
  purchaseDate: text('purchase_date').default(sql`CURRENT_TIMESTAMP`).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull()
})

export type Organization = typeof organizations.$inferSelect
export type NewOrganization = typeof organizations.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert
export type Note = typeof notes.$inferSelect
export type NewNote = typeof notes.$inferInsert
export type Opportunity = typeof opportunities.$inferSelect
export type Purchase = typeof purchases.$inferSelect
export type NewPurchase = typeof purchases.$inferInsert
