
import { serial, varchar, text, pgTable, timestamp, integer, date, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const statusKamarEnum = pgEnum('status_kamar', ['Kosong', 'Terisi']);
export const statusPenyewaEnum = pgEnum('status_penyewa', ['Aktif', 'Keluar']);
export const metodeBayarEnum = pgEnum('metode_bayar', ['Transfer', 'Tunai']);
export const statusPembayaranEnum = pgEnum('status_pembayaran', ['Lunas', 'Belum']);

// Kamar (Room) table
export const kamarTable = pgTable('kamar', {
  id: serial('id').primaryKey(),
  nomor_kamar: varchar('nomor_kamar', { length: 10 }).notNull(),
  harga_sewa: integer('harga_sewa').notNull(),
  kapasitas: integer('kapasitas').notNull(),
  fasilitas: text('fasilitas'),
  status: statusKamarEnum('status').notNull(),
  catatan: text('catatan'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Penyewa (Tenant) table
export const penyewaTable = pgTable('penyewa', {
  id: serial('id').primaryKey(),
  nama_lengkap: varchar('nama_lengkap', { length: 100 }).notNull(),
  no_telepon: varchar('no_telepon', { length: 15 }).notNull(),
  email: varchar('email', { length: 100 }).notNull(),
  nomor_ktp: varchar('nomor_ktp', { length: 20 }).notNull(),
  alamat_asal: text('alamat_asal').notNull(),
  kamar_id: integer('kamar_id').notNull().references(() => kamarTable.id),
  tgl_masuk: date('tgl_masuk').notNull(),
  tgl_keluar: date('tgl_keluar'),
  status: statusPenyewaEnum('status').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Pembayaran (Payment) table
export const pembayaranTable = pgTable('pembayaran', {
  id: serial('id').primaryKey(),
  penyewa_id: integer('penyewa_id').notNull().references(() => penyewaTable.id),
  bulan: varchar('bulan', { length: 20 }).notNull(),
  jumlah: integer('jumlah').notNull(),
  tanggal_bayar: date('tanggal_bayar').notNull(),
  metode_bayar: metodeBayarEnum('metode_bayar').notNull(),
  bukti_bayar: varchar('bukti_bayar', { length: 255 }),
  status: statusPembayaranEnum('status').notNull(),
  keterangan: text('keterangan'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const kamarRelations = relations(kamarTable, ({ many }) => ({
  penyewa: many(penyewaTable),
}));

export const penyewaRelations = relations(penyewaTable, ({ one, many }) => ({
  kamar: one(kamarTable, {
    fields: [penyewaTable.kamar_id],
    references: [kamarTable.id],
  }),
  pembayaran: many(pembayaranTable),
}));

export const pembayaranRelations = relations(pembayaranTable, ({ one }) => ({
  penyewa: one(penyewaTable, {
    fields: [pembayaranTable.penyewa_id],
    references: [penyewaTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Kamar = typeof kamarTable.$inferSelect;
export type NewKamar = typeof kamarTable.$inferInsert;
export type Penyewa = typeof penyewaTable.$inferSelect;
export type NewPenyewa = typeof penyewaTable.$inferInsert;
export type Pembayaran = typeof pembayaranTable.$inferSelect;
export type NewPembayaran = typeof pembayaranTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  kamar: kamarTable, 
  penyewa: penyewaTable, 
  pembayaran: pembayaranTable 
};
