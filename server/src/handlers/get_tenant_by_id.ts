
import { db } from '../db';
import { penyewaTable, kamarTable } from '../db/schema';
import { eq } from 'drizzle-orm';

// Input schema for getting tenant by ID
export const getTenantByIdInputSchema = {
  id: 'number'
} as const;

export type GetTenantByIdInput = {
  id: number;
};

// Combined tenant with room data type
export type TenantWithRoom = {
  id: number;
  nama_lengkap: string;
  no_telepon: string;
  email: string;
  nomor_ktp: string;
  alamat_asal: string;
  kamar_id: number;
  tgl_masuk: Date;
  tgl_keluar: Date | null;
  status: 'Aktif' | 'Keluar';
  created_at: Date;
  kamar: {
    id: number;
    nomor_kamar: string;
    harga_sewa: number;
    kapasitas: number;
    fasilitas: string | null;
    status: 'Kosong' | 'Terisi';
    catatan: string | null;
    created_at: Date;
  };
};

export const getTenantById = async (input: GetTenantByIdInput): Promise<TenantWithRoom | null> => {
  try {
    const results = await db.select()
      .from(penyewaTable)
      .innerJoin(kamarTable, eq(penyewaTable.kamar_id, kamarTable.id))
      .where(eq(penyewaTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const result = results[0];
    
    return {
      id: result.penyewa.id,
      nama_lengkap: result.penyewa.nama_lengkap,
      no_telepon: result.penyewa.no_telepon,
      email: result.penyewa.email,
      nomor_ktp: result.penyewa.nomor_ktp,
      alamat_asal: result.penyewa.alamat_asal,
      kamar_id: result.penyewa.kamar_id,
      tgl_masuk: new Date(result.penyewa.tgl_masuk),
      tgl_keluar: result.penyewa.tgl_keluar ? new Date(result.penyewa.tgl_keluar) : null,
      status: result.penyewa.status,
      created_at: result.penyewa.created_at,
      kamar: {
        id: result.kamar.id,
        nomor_kamar: result.kamar.nomor_kamar,
        harga_sewa: result.kamar.harga_sewa,
        kapasitas: result.kamar.kapasitas,
        fasilitas: result.kamar.fasilitas,
        status: result.kamar.status,
        catatan: result.kamar.catatan,
        created_at: result.kamar.created_at
      }
    };
  } catch (error) {
    console.error('Get tenant by ID failed:', error);
    throw error;
  }
};
