
import { db } from '../db';
import { pembayaranTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Pembayaran } from '../schema';

export interface GetPaymentByIdInput {
  id: number;
}

export const getPaymentById = async (input: GetPaymentByIdInput): Promise<Pembayaran | null> => {
  try {
    const results = await db.select()
      .from(pembayaranTable)
      .where(eq(pembayaranTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const payment = results[0];
    return {
      ...payment,
      // Convert date strings to Date objects for the Zod schema
      tanggal_bayar: new Date(payment.tanggal_bayar)
    };
  } catch (error) {
    console.error('Failed to get payment by ID:', error);
    throw error;
  }
};
