
import { db } from '../db';
import { penyewaTable } from '../db/schema';
import { type Penyewa } from '../schema';

export const getTenants = async (): Promise<Penyewa[]> => {
  try {
    // Fetch all tenants
    const results = await db.select()
      .from(penyewaTable)
      .execute();

    // Convert date strings to Date objects
    return results.map(result => ({
      ...result,
      tgl_masuk: new Date(result.tgl_masuk),
      tgl_keluar: result.tgl_keluar ? new Date(result.tgl_keluar) : null
    }));
  } catch (error) {
    console.error('Failed to fetch tenants:', error);
    throw error;
  }
};
