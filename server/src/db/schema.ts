
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Payment status enum
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'overdue', 'cancelled']);

// Rooms table
export const roomsTable = pgTable('rooms', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  monthly_rent: numeric('monthly_rent', { precision: 10, scale: 2 }).notNull(),
  is_available: boolean('is_available').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Tenants table
export const tenantsTable = pgTable('tenants', {
  id: serial('id').primaryKey(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'), // Nullable by default
  room_id: integer('room_id').references(() => roomsTable.id),
  rental_start_date: date('rental_start_date'),
  rental_end_date: date('rental_end_date'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Payments table
export const paymentsTable = pgTable('payments', {
  id: serial('id').primaryKey(),
  tenant_id: integer('tenant_id').notNull().references(() => tenantsTable.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  payment_month: date('payment_month').notNull(), // Which month this payment is for
  payment_date: timestamp('payment_date'), // When payment was actually made
  status: paymentStatusEnum('status').notNull().default('pending'),
  notes: text('notes'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const roomsRelations = relations(roomsTable, ({ many }) => ({
  tenants: many(tenantsTable),
}));

export const tenantsRelations = relations(tenantsTable, ({ one, many }) => ({
  room: one(roomsTable, {
    fields: [tenantsTable.room_id],
    references: [roomsTable.id],
  }),
  payments: many(paymentsTable),
}));

export const paymentsRelations = relations(paymentsTable, ({ one }) => ({
  tenant: one(tenantsTable, {
    fields: [paymentsTable.tenant_id],
    references: [tenantsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Room = typeof roomsTable.$inferSelect;
export type NewRoom = typeof roomsTable.$inferInsert;
export type Tenant = typeof tenantsTable.$inferSelect;
export type NewTenant = typeof tenantsTable.$inferInsert;
export type Payment = typeof paymentsTable.$inferSelect;
export type NewPayment = typeof paymentsTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  rooms: roomsTable, 
  tenants: tenantsTable, 
  payments: paymentsTable 
};
