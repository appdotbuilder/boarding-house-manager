
import { db } from '../db';
import { kamarTable } from '../db/schema';
import { type UpdateKamarInput, type Kamar } from '../schema';
import { eq } from 'drizzle-orm';

export const updateKamar = async (input: UpdateKamarInput): Promise<Kamar> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof kamarTable.$inferInsert> = {};
    
    if (input.nomor_kamar !== undefined) {
      updateData.nomor_kamar = input.nomor_kamar;
    }
    if (input.harga_sewa !== undefined) {
      updateData.harga_sewa = input.harga_sewa;
    }
    if (input.kapasitas !== undefined) {
      updateData.kapasitas = input.kapasitas;
    }
    if (input.fasilitas !== undefined) {
      updateData.fasilitas = input.fasilitas;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.catatan !== undefined) {
      updateData.catatan = input.catatan;
    }

    // Update the kamar record
    const result = await db.update(kamarTable)
      .set(updateData)
      .where(eq(kamarTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Kamar with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Kamar update failed:', error);
    throw error;
  }
};
