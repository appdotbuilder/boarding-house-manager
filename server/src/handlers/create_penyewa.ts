
import { db } from '../db';
import { penyewaTable, kamarTable } from '../db/schema';
import { type CreatePenyewaInput, type Penyewa } from '../schema';
import { eq } from 'drizzle-orm';

export const createPenyewa = async (input: CreatePenyewaInput): Promise<Penyewa> => {
  try {
    // Verify that the kamar (room) exists before creating penyewa
    const existingKamar = await db.select()
      .from(kamarTable)
      .where(eq(kamarTable.id, input.kamar_id))
      .execute();

    if (existingKamar.length === 0) {
      throw new Error(`Kamar with id ${input.kamar_id} does not exist`);
    }

    // Convert dates to strings for database storage
    const tglMasukString = input.tgl_masuk.toISOString().split('T')[0];
    const tglKeluarString = input.tgl_keluar ? input.tgl_keluar.toISOString().split('T')[0] : null;

    // Insert penyewa record
    const result = await db.insert(penyewaTable)
      .values({
        nama_lengkap: input.nama_lengkap,
        no_telepon: input.no_telepon,
        email: input.email,
        nomor_ktp: input.nomor_ktp,
        alamat_asal: input.alamat_asal,
        kamar_id: input.kamar_id,
        tgl_masuk: tglMasukString,
        tgl_keluar: tglKeluarString,
        status: input.status
      })
      .returning()
      .execute();

    // Convert date strings back to Date objects for return
    const penyewa = result[0];
    return {
      ...penyewa,
      tgl_masuk: new Date(penyewa.tgl_masuk),
      tgl_keluar: penyewa.tgl_keluar ? new Date(penyewa.tgl_keluar) : null
    };
  } catch (error) {
    console.error('Penyewa creation failed:', error);
    throw error;
  }
};
