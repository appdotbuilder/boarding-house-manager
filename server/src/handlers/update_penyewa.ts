
import { db } from '../db';
import { penyewaTable, kamarTable } from '../db/schema';
import { type UpdatePenyewaInput, type Penyewa } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePenyewa = async (input: UpdatePenyewaInput): Promise<Penyewa> => {
  try {
    // If kamar_id is being updated, verify the room exists
    if (input.kamar_id) {
      const existingKamar = await db.select()
        .from(kamarTable)
        .where(eq(kamarTable.id, input.kamar_id))
        .execute();
      
      if (existingKamar.length === 0) {
        throw new Error(`Kamar with id ${input.kamar_id} not found`);
      }
    }

    // Extract id from input and create update object without id
    const { id, ...updateData } = input;

    // Convert Date objects to string format for database
    const dbUpdateData: any = { ...updateData };
    if (updateData.tgl_masuk) {
      dbUpdateData.tgl_masuk = updateData.tgl_masuk.toISOString().split('T')[0];
    }
    if (updateData.tgl_keluar) {
      dbUpdateData.tgl_keluar = updateData.tgl_keluar.toISOString().split('T')[0];
    }

    // Update the penyewa record
    const result = await db.update(penyewaTable)
      .set(dbUpdateData)
      .where(eq(penyewaTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Penyewa with id ${id} not found`);
    }

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
