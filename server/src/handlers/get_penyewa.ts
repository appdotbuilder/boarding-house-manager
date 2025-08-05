
import { db } from '../db';
import { penyewaTable } from '../db/schema';
import { type Penyewa } from '../schema';

export const getPenyewa = async (): Promise<Penyewa[]> => {
  try {
    const results = await db.select()
      .from(penyewaTable)
      .execute();

    // Convert date strings to Date objects to match Zod schema
    return results.map(penyewa => ({
      ...penyewa,
      tgl_masuk: new Date(penyewa.tgl_masuk),
      tgl_keluar: penyewa.tgl_keluar ? new Date(penyewa.tgl_keluar) : null
    }));
  } catch (error) {
    console.error('Failed to fetch penyewa:', error);
    throw error;
  }
};
