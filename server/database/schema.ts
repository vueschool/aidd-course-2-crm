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

export const contacts = sqliteTable('contacts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  organizationId: integer('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  mobile: text('mobile'),
  position: text('position'),
  department: text('department'),
  isPrimary: integer('is_primary', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull()
})

export const notes = sqliteTable('notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  organizationId: integer('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  contactId: integer('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
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

export const creditTransactions = sqliteTable('credit_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  organizationId: integer('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  amountCents: integer('amount_cents').notNull(),
  reason: text('reason').notNull(),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull()
})

export type Organization = typeof organizations.$inferSelect
export type NewOrganization = typeof organizations.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Contact = typeof contacts.$inferSelect
export type NewContact = typeof contacts.$inferInsert
export type Note = typeof notes.$inferSelect
export type NewNote = typeof notes.$inferInsert
export type Opportunity = typeof opportunities.$inferSelect
export type NewOpportunity = typeof opportunities.$inferInsert
export type CreditTransaction = typeof creditTransactions.$inferSelect
export type NewCreditTransaction = typeof creditTransactions.$inferInsert