
import { z } from 'zod';

// Enums
export const statusKamarEnum = z.enum(['Kosong', 'Terisi']);
export const statusPenyewaEnum = z.enum(['Aktif', 'Keluar']);
export const metodeBayarEnum = z.enum(['Transfer', 'Tunai']);
export const statusPembayaranEnum = z.enum(['Lunas', 'Belum']);

export type StatusKamar = z.infer<typeof statusKamarEnum>;
export type StatusPenyewa = z.infer<typeof statusPenyewaEnum>;
export type MetodeBayar = z.infer<typeof metodeBayarEnum>;
export type StatusPembayaran = z.infer<typeof statusPembayaranEnum>;

// Kamar (Room) schemas
export const kamarSchema = z.object({
  id: z.number(),
  nomor_kamar: z.string(),
  harga_sewa: z.number().int(),
  kapasitas: z.number().int(),
  fasilitas: z.string().nullable(),
  status: statusKamarEnum,
  catatan: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Kamar = z.infer<typeof kamarSchema>;

export const createKamarInputSchema = z.object({
  nomor_kamar: z.string().max(10),
  harga_sewa: z.number().int().positive(),
  kapasitas: z.number().int().positive(),
  fasilitas: z.string().nullable(),
  status: statusKamarEnum,
  catatan: z.string().nullable()
});

export type CreateKamarInput = z.infer<typeof createKamarInputSchema>;

export const updateKamarInputSchema = z.object({
  id: z.number(),
  nomor_kamar: z.string().max(10).optional(),
  harga_sewa: z.number().int().positive().optional(),
  kapasitas: z.number().int().positive().optional(),
  fasilitas: z.string().nullable().optional(),
  status: statusKamarEnum.optional(),
  catatan: z.string().nullable().optional()
});

export type UpdateKamarInput = z.infer<typeof updateKamarInputSchema>;

// Penyewa (Tenant) schemas
export const penyewaSchema = z.object({
  id: z.number(),
  nama_lengkap: z.string(),
  no_telepon: z.string(),
  email: z.string(),
  nomor_ktp: z.string(),
  alamat_asal: z.string(),
  kamar_id: z.number(),
  tgl_masuk: z.coerce.date(),
  tgl_keluar: z.coerce.date().nullable(),
  status: statusPenyewaEnum,
  created_at: z.coerce.date()
});

export type Penyewa = z.infer<typeof penyewaSchema>;

export const createPenyewaInputSchema = z.object({
  nama_lengkap: z.string().max(100),
  no_telepon: z.string().max(15),
  email: z.string().email().max(100),
  nomor_ktp: z.string().max(20),
  alamat_asal: z.string(),
  kamar_id: z.number(),
  tgl_masuk: z.coerce.date(),
  tgl_keluar: z.coerce.date().nullable(),
  status: statusPenyewaEnum
});

export type CreatePenyewaInput = z.infer<typeof createPenyewaInputSchema>;

export const updatePenyewaInputSchema = z.object({
  id: z.number(),
  nama_lengkap: z.string().max(100).optional(),
  no_telepon: z.string().max(15).optional(),
  email: z.string().email().max(100).optional(),
  nomor_ktp: z.string().max(20).optional(),
  alamat_asal: z.string().optional(),
  kamar_id: z.number().optional(),
  tgl_masuk: z.coerce.date().optional(),
  tgl_keluar: z.coerce.date().nullable().optional(),
  status: statusPenyewaEnum.optional()
});

export type UpdatePenyewaInput = z.infer<typeof updatePenyewaInputSchema>;

// Pembayaran (Payment) schemas
export const pembayaranSchema = z.object({
  id: z.number(),
  penyewa_id: z.number(),
  bulan: z.string(),
  jumlah: z.number().int(),
  tanggal_bayar: z.coerce.date(),
  metode_bayar: metodeBayarEnum,
  bukti_bayar: z.string().nullable(),
  status: statusPembayaranEnum,
  keterangan: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Pembayaran = z.infer<typeof pembayaranSchema>;

export const createPembayaranInputSchema = z.object({
  penyewa_id: z.number(),
  bulan: z.string().max(20),
  jumlah: z.number().int().positive(),
  tanggal_bayar: z.coerce.date(),
  metode_bayar: metodeBayarEnum,
  bukti_bayar: z.string().max(255).nullable(),
  status: statusPembayaranEnum,
  keterangan: z.string().nullable()
});

export type CreatePembayaranInput = z.infer<typeof createPembayaranInputSchema>;

export const updatePembayaranInputSchema = z.object({
  id: z.number(),
  penyewa_id: z.number().optional(),
  bulan: z.string().max(20).optional(),
  jumlah: z.number().int().positive().optional(),
  tanggal_bayar: z.coerce.date().optional(),
  metode_bayar: metodeBayarEnum.optional(),
  bukti_bayar: z.string().max(255).nullable().optional(),
  status: statusPembayaranEnum.optional(),
  keterangan: z.string().nullable().optional()
});

export type UpdatePembayaranInput = z.infer<typeof updatePembayaranInputSchema>;
