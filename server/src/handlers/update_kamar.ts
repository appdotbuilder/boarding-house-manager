
import { db } from '../db';
import { kamarTable } from '../db/schema';
import { type UpdateKamarInput, type Kamar } from '../schema';
import { eq } from 'drizzle-orm';

export const updateKamar = async (input: UpdateKamarInput): Promise<Kamar> => {
  try {
    // Extract id and create update object without id
    const { id, ...updateData } = input;
    
    // Only include fields that are defined (not undefined)
    const fieldsToUpdate = Object.entries(updateData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    // Update the kamar record
    const result = await db.update(kamarTable)
      .set(fieldsToUpdate)
      .where(eq(kamarTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Kamar with id ${id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Kamar update failed:', error);
    throw error;
  }
};
