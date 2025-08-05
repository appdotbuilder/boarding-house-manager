
import { z } from 'zod';

// Room schemas
export const roomSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  monthly_rent: z.number(),
  is_available: z.boolean(),
  created_at: z.coerce.date()
});

export type Room = z.infer<typeof roomSchema>;

export const createRoomInputSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  description: z.string().nullable(),
  monthly_rent: z.number().positive("Monthly rent must be positive"),
  is_available: z.boolean().default(true)
});

export type CreateRoomInput = z.infer<typeof createRoomInputSchema>;

export const updateRoomInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  monthly_rent: z.number().positive().optional(),
  is_available: z.boolean().optional()
});

export type UpdateRoomInput = z.infer<typeof updateRoomInputSchema>;

// Tenant schemas
export const tenantSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  room_id: z.number().nullable(),
  rental_start_date: z.coerce.date().nullable(),
  rental_end_date: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export type Tenant = z.infer<typeof tenantSchema>;

export const createTenantInputSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().nullable(),
  room_id: z.number().nullable(),
  rental_start_date: z.coerce.date().nullable(),
  rental_end_date: z.coerce.date().nullable()
});

export type CreateTenantInput = z.infer<typeof createTenantInputSchema>;

export const updateTenantInputSchema = z.object({
  id: z.number(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  room_id: z.number().nullable().optional(),
  rental_start_date: z.coerce.date().nullable().optional(),
  rental_end_date: z.coerce.date().nullable().optional()
});

export type UpdateTenantInput = z.infer<typeof updateTenantInputSchema>;

// Payment schemas
export const paymentStatusEnum = z.enum(['pending', 'completed', 'overdue', 'cancelled']);
export type PaymentStatus = z.infer<typeof paymentStatusEnum>;

export const paymentSchema = z.object({
  id: z.number(),
  tenant_id: z.number(),
  amount: z.number(),
  payment_month: z.coerce.date(),
  payment_date: z.coerce.date().nullable(),
  status: paymentStatusEnum,
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Payment = z.infer<typeof paymentSchema>;

export const createPaymentInputSchema = z.object({
  tenant_id: z.number(),
  amount: z.number().positive("Payment amount must be positive"),
  payment_month: z.coerce.date(),
  payment_date: z.coerce.date().nullable(),
  status: paymentStatusEnum.default('pending'),
  notes: z.string().nullable()
});

export type CreatePaymentInput = z.infer<typeof createPaymentInputSchema>;

export const updatePaymentInputSchema = z.object({
  id: z.number(),
  tenant_id: z.number().optional(),
  amount: z.number().positive().optional(),
  payment_month: z.coerce.date().optional(),
  payment_date: z.coerce.date().nullable().optional(),
  status: paymentStatusEnum.optional(),
  notes: z.string().nullable().optional()
});

export type UpdatePaymentInput = z.infer<typeof updatePaymentInputSchema>;

// Additional query schemas
export const getRoomByIdInputSchema = z.object({
  id: z.number()
});

export type GetRoomByIdInput = z.infer<typeof getRoomByIdInputSchema>;

export const getTenantByIdInputSchema = z.object({
  id: z.number()
});

export type GetTenantByIdInput = z.infer<typeof getTenantByIdInputSchema>;

export const getPaymentByIdInputSchema = z.object({
  id: z.number()
});

export type GetPaymentByIdInput = z.infer<typeof getPaymentByIdInputSchema>;

export const getPaymentsByTenantInputSchema = z.object({
  tenant_id: z.number()
});

export type GetPaymentsByTenantInput = z.infer<typeof getPaymentsByTenantInputSchema>;
