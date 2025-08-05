
import { db } from '../db';
import { pembayaranTable } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { type Pembayaran } from '../schema';

export interface GetPaymentsByTenantInput {
  penyewa_id: number;
}

export const getPaymentsByTenant = async (input: GetPaymentsByTenantInput): Promise<Pembayaran[]> => {
  try {
    const results = await db.select()
      .from(pembayaranTable)
      .where(eq(pembayaranTable.penyewa_id, input.penyewa_id))
      .orderBy(desc(pembayaranTable.tanggal_bayar))
      .execute();

    // Convert date fields and return as Pembayaran type
    return results.map(result => ({
      id: result.id,
      penyewa_id: result.penyewa_id,
      bulan: result.bulan,
      jumlah: result.jumlah,
      tanggal_bayar: new Date(result.tanggal_bayar),
      metode_bayar: result.metode_bayar,
      bukti_bayar: result.bukti_bayar,
      status: result.status,
      keterangan: result.keterangan,
      created_at: result.created_at
    }));
  } catch (error) {
    console.error('Failed to get payments by tenant:', error);
    throw error;
  }
};
