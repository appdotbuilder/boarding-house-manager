
import { db } from '../db';
import { pembayaranTable, penyewaTable } from '../db/schema';
import { type CreatePembayaranInput, type Pembayaran } from '../schema';
import { eq } from 'drizzle-orm';

export const createPembayaran = async (input: CreatePembayaranInput): Promise<Pembayaran> => {
  try {
    // Verify that the referenced penyewa exists
    const existingPenyewa = await db.select()
      .from(penyewaTable)
      .where(eq(penyewaTable.id, input.penyewa_id))
      .execute();

    if (existingPenyewa.length === 0) {
      throw new Error(`Penyewa with id ${input.penyewa_id} not found`);
    }

    // Convert Date to string for date column
    const tanggalBayarString = input.tanggal_bayar.toISOString().split('T')[0];

    // Insert pembayaran record
    const result = await db.insert(pembayaranTable)
      .values({
        penyewa_id: input.penyewa_id,
        bulan: input.bulan,
        jumlah: input.jumlah,
        tanggal_bayar: tanggalBayarString,
        metode_bayar: input.metode_bayar,
        bukti_bayar: input.bukti_bayar,
        status: input.status,
        keterangan: input.keterangan
      })
      .returning()
      .execute();

    // Convert string date back to Date object
    const pembayaran = result[0];
    return {
      ...pembayaran,
      tanggal_bayar: new Date(pembayaran.tanggal_bayar)
    };
  } catch (error) {
    console.error('Pembayaran creation failed:', error);
    throw error;
  }
};
