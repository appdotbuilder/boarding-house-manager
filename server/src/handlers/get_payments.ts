
import { db } from '../db';
import { pembayaranTable } from '../db/schema';
import { type Pembayaran } from '../schema';

export const getPayments = async (): Promise<Pembayaran[]> => {
  try {
    const results = await db.select()
      .from(pembayaranTable)
      .execute();

    // Convert date strings to Date objects for tanggal_bayar
    return results.map(payment => ({
      ...payment,
      tanggal_bayar: new Date(payment.tanggal_bayar)
    }));
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    throw error;
  }
};
