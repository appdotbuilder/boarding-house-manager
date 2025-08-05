
import { db } from '../db';
import { penyewaTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const deletePenyewaInputSchema = z.object({
  id: z.number()
});

export type DeletePenyewaInput = z.infer<typeof deletePenyewaInputSchema>;

export const deletePenyewa = async (input: DeletePenyewaInput): Promise<{ success: boolean }> => {
  try {
    // Delete the penyewa record
    const result = await db.delete(penyewaTable)
      .where(eq(penyewaTable.id, input.id))
      .returning()
      .execute();

    // Check if any record was deleted
    if (result.length === 0) {
      throw new Error(`Penyewa with id ${input.id} not found`);
    }

    return { success: true };
  } catch (error) {
    console.error('Penyewa deletion failed:', error);
    throw error;
  }
};
