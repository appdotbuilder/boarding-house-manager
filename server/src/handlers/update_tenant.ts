
import { db } from '../db';
import { penyewaTable, kamarTable } from '../db/schema';
import { type UpdatePenyewaInput, type Penyewa } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePenyewa = async (input: UpdatePenyewaInput): Promise<Penyewa> => {
  try {
    // Check if penyewa exists
    const existingPenyewa = await db.select()
      .from(penyewaTable)
      .where(eq(penyewaTable.id, input.id))
      .execute();

    if (existingPenyewa.length === 0) {
      throw new Error('Penyewa not found');
    }

    // If kamar_id is being updated, verify the new kamar exists
    if (input.kamar_id !== undefined) {
      const kamarExists = await db.select()
        .from(kamarTable)
        .where(eq(kamarTable.id, input.kamar_id))
        .execute();

      if (kamarExists.length === 0) {
        throw new Error('Kamar not found');
      }
    }

    // Prepare update data, excluding undefined fields and converting dates to strings
    const updateData: any = {};
    if (input.nama_lengkap !== undefined) updateData.nama_lengkap = input.nama_lengkap;
    if (input.no_telepon !== undefined) updateData.no_telepon = input.no_telepon;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.nomor_ktp !== undefined) updateData.nomor_ktp = input.nomor_ktp;
    if (input.alamat_asal !== undefined) updateData.alamat_asal = input.alamat_asal;
    if (input.kamar_id !== undefined) updateData.kamar_id = input.kamar_id;
    if (input.tgl_masuk !== undefined) updateData.tgl_masuk = input.tgl_masuk.toISOString().split('T')[0];
    if (input.tgl_keluar !== undefined) updateData.tgl_keluar = input.tgl_keluar ? input.tgl_keluar.toISOString().split('T')[0] : null;
    if (input.status !== undefined) updateData.status = input.status;

    // Update penyewa record
    const result = await db.update(penyewaTable)
      .set(updateData)
      .where(eq(penyewaTable.id, input.id))
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
    console.error('Penyewa update failed:', error);
    throw error;
  }
};
