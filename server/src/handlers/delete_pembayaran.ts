
import { z } from 'zod';
import { db } from '../db';
import { pembayaranTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deletePembayaranInputSchema = z.object({
    id: z.number()
});

export type DeletePembayaranInput = z.infer<typeof deletePembayaranInputSchema>;

export const deletePembayaran = async (input: DeletePembayaranInput): Promise<{ success: boolean }> => {
    try {
        // Delete the payment record
        const result = await db.delete(pembayaranTable)
            .where(eq(pembayaranTable.id, input.id))
            .returning()
            .execute();

        // Check if a record was actually deleted
        if (result.length === 0) {
            return { success: false };
        }

        return { success: true };
    } catch (error) {
        console.error('Payment deletion failed:', error);
        throw error;
    }
};
