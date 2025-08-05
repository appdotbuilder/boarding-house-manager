
import { db } from '../db';
import { pembayaranTable } from '../db/schema';
import { type Pembayaran } from '../schema';

export const getPembayaran = async (): Promise<Pembayaran[]> => {
  try {
    const results = await db.select()
      .from(pembayaranTable)
      .execute();

    // Convert date strings to Date objects to match Zod schema expectations
    return results.map(pembayaran => ({
      ...pembayaran,
      tanggal_bayar: new Date(pembayaran.tanggal_bayar)
    }));
  } catch (error) {
    console.error('Failed to fetch pembayaran:', error);
    throw error;
  }
};
