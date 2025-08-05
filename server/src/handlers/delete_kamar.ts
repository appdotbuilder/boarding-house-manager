
import { db } from '../db';
import { kamarTable, penyewaTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const deleteKamarInputSchema = z.object({
    id: z.number()
});

export type DeleteKamarInput = z.infer<typeof deleteKamarInputSchema>;

export const deleteKamar = async (input: DeleteKamarInput): Promise<{ success: boolean }> => {
    try {
        // Check if kamar exists
        const existingKamar = await db.select()
            .from(kamarTable)
            .where(eq(kamarTable.id, input.id))
            .execute();

        if (existingKamar.length === 0) {
            throw new Error('Kamar not found');
        }

        // Check if there are any ACTIVE tenants (penyewa) in this room
        const activePenyewa = await db.select()
            .from(penyewaTable)
            .where(and(
                eq(penyewaTable.kamar_id, input.id),
                eq(penyewaTable.status, 'Aktif')
            ))
            .execute();

        if (activePenyewa.length > 0) {
            throw new Error('Cannot delete kamar with active tenants');
        }

        // First delete all penyewa records (active and inactive) for this kamar
        // This prevents foreign key constraint violation
        await db.delete(penyewaTable)
            .where(eq(penyewaTable.kamar_id, input.id))
            .execute();

        // Then delete the kamar
        await db.delete(kamarTable)
            .where(eq(kamarTable.id, input.id))
            .execute();

        return { success: true };
    } catch (error) {
        console.error('Kamar deletion failed:', error);
        throw error;
    }
};
