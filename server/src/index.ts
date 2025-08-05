
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createRoomInputSchema,
  updateRoomInputSchema,
  getRoomByIdInputSchema,
  createTenantInputSchema,
  updateTenantInputSchema,
  getTenantByIdInputSchema,
  createPaymentInputSchema,
  updatePaymentInputSchema,
  getPaymentByIdInputSchema,
  getPaymentsByTenantInputSchema
} from './schema';

// Import handlers
import { createRoom } from './handlers/create_room';
import { getRooms } from './handlers/get_rooms';
import { getRoomById } from './handlers/get_room_by_id';
import { updateRoom } from './handlers/update_room';
import { createTenant } from './handlers/create_tenant';
import { getTenants } from './handlers/get_tenants';
import { getTenantById } from './handlers/get_tenant_by_id';
import { updateTenant } from './handlers/update_tenant';
import { createPayment } from './handlers/create_payment';
import { getPayments } from './handlers/get_payments';
import { getPaymentById } from './handlers/get_payment_by_id';
import { getPaymentsByTenant } from './handlers/get_payments_by_tenant';
import { updatePayment } from './handlers/update_payment';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Room management routes
  createRoom: publicProcedure
    .input(createRoomInputSchema)
    .mutation(({ input }) => createRoom(input)),

  getRooms: publicProcedure
    .query(() => getRooms()),

  getRoomById: publicProcedure
    .input(getRoomByIdInputSchema)
    .query(({ input }) => getRoomById(input)),

  updateRoom: publicProcedure
    .input(updateRoomInputSchema)
    .mutation(({ input }) => updateRoom(input)),

  // Tenant management routes
  createTenant: publicProcedure
    .input(createTenantInputSchema)
    .mutation(({ input }) => createTenant(input)),

  getTenants: publicProcedure
    .query(() => getTenants()),

  getTenantById: publicProcedure
    .input(getTenantByIdInputSchema)
    .query(({ input }) => getTenantById(input)),

  updateTenant: publicProcedure
    .input(updateTenantInputSchema)
    .mutation(({ input }) => updateTenant(input)),

  // Payment management routes
  createPayment: publicProcedure
    .input(createPaymentInputSchema)
    .mutation(({ input }) => createPayment(input)),

  getPayments: publicProcedure
    .query(() => getPayments()),

  getPaymentById: publicProcedure
    .input(getPaymentByIdInputSchema)
    .query(({ input }) => getPaymentById(input)),

  getPaymentsByTenant: publicProcedure
    .input(getPaymentsByTenantInputSchema)
    .query(({ input }) => getPaymentsByTenant(input)),

  updatePayment: publicProcedure
    .input(updatePaymentInputSchema)
    .mutation(({ input }) => updatePayment(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
