
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createKamarInputSchema, 
  updateKamarInputSchema,
  createPenyewaInputSchema,
  updatePenyewaInputSchema,
  createPembayaranInputSchema,
  updatePembayaranInputSchema
} from './schema';

// Import handlers
import { createKamar } from './handlers/create_kamar';
import { getKamar } from './handlers/get_kamar';
import { updateKamar } from './handlers/update_kamar';
import { deleteKamar } from './handlers/delete_kamar';
import { createPenyewa } from './handlers/create_penyewa';
import { getPenyewa } from './handlers/get_penyewa';
import { updatePenyewa } from './handlers/update_penyewa';
import { deletePenyewa } from './handlers/delete_penyewa';
import { createPembayaran } from './handlers/create_pembayaran';
import { getPembayaran } from './handlers/get_pembayaran';
import { updatePembayaran } from './handlers/update_pembayaran';
import { deletePembayaran } from './handlers/delete_pembayaran';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Kamar (Room) routes
  createKamar: publicProcedure
    .input(createKamarInputSchema)
    .mutation(({ input }) => createKamar(input)),
  getKamar: publicProcedure
    .query(() => getKamar()),
  updateKamar: publicProcedure
    .input(updateKamarInputSchema)
    .mutation(({ input }) => updateKamar(input)),
  deleteKamar: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteKamar(input)),

  // Penyewa (Tenant) routes
  createPenyewa: publicProcedure
    .input(createPenyewaInputSchema)
    .mutation(({ input }) => createPenyewa(input)),
  getPenyewa: publicProcedure
    .query(() => getPenyewa()),
  updatePenyewa: publicProcedure
    .input(updatePenyewaInputSchema)
    .mutation(({ input }) => updatePenyewa(input)),
  deletePenyewa: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deletePenyewa(input)),

  // Pembayaran (Payment) routes
  createPembayaran: publicProcedure
    .input(createPembayaranInputSchema)
    .mutation(({ input }) => createPembayaran(input)),
  getPembayaran: publicProcedure
    .query(() => getPembayaran()),
  updatePembayaran: publicProcedure
    .input(updatePembayaranInputSchema)
    .mutation(({ input }) => updatePembayaran(input)),
  deletePembayaran: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deletePembayaran(input)),
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
