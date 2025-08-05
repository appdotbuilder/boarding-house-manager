
import { db } from '../db';
import { pembayaranTable, penyewaTable } from '../db/schema';
import { type UpdatePembayaranInput, type Pembayaran } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePembayaran = async (input: UpdatePembayaranInput): Promise<Pembayaran> => {
  try {
    // Verify that the pembayaran exists
    const existingPembayaran = await db.select()
      .from(pembayaranTable)
      .where(eq(pembayaranTable.id, input.id))
      .execute();

    if (existingPembayaran.length === 0) {
      throw new Error('Pembayaran not found');
    }

    // If penyewa_id is being updated, verify it exists
    if (input.penyewa_id !== undefined) {
      const penyewa = await db.select()
        .from(penyewaTable)
        .where(eq(penyewaTable.id, input.penyewa_id))
        .execute();

      if (penyewa.length === 0) {
        throw new Error('Penyewa not found');
      }
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    
    if (input.penyewa_id !== undefined) updateData['penyewa_id'] = input.penyewa_id;
    if (input.bulan !== undefined) updateData['bulan'] = input.bulan;
    if (input.jumlah !== undefined) updateData['jumlah'] = input.jumlah;
    if (input.tanggal_bayar !== undefined) updateData['tanggal_bayar'] = input.tanggal_bayar.toISOString().split('T')[0];
    if (input.metode_bayar !== undefined) updateData['metode_bayar'] = input.metode_bayar;
    if (input.bukti_bayar !== undefined) updateData['bukti_bayar'] = input.bukti_bayar;
    if (input.status !== undefined) updateData['status'] = input.status;
    if (input.keterangan !== undefined) updateData['keterangan'] = input.keterangan;

    // Update the pembayaran record
    const result = await db.update(pembayaranTable)
      .set(updateData)
      .where(eq(pembayaranTable.id, input.id))
      .returning()
      .execute();

    // Convert date string back to Date object
    const pembayaran = result[0];
    return {
      ...pembayaran,
      tanggal_bayar: new Date(pembayaran.tanggal_bayar)
    };
  } catch (error) {
    console.error('Pembayaran update failed:', error);
    throw error;
  }
};
