
import { db } from '../db';
import { kamarTable } from '../db/schema';
import { eq } from 'drizzle-orm';

// Input type (would normally be imported from schema.ts)
type GetRoomByIdInput = {
  id: number;
};

// Return type matching the kamar table structure
type Kamar = {
  id: number;
  nomor_kamar: string;
  harga_sewa: number;
  kapasitas: number;
  fasilitas: string | null;
  status: 'Kosong' | 'Terisi';
  catatan: string | null;
  created_at: Date;
};

export const getRoomById = async (input: GetRoomByIdInput): Promise<Kamar | null> => {
  try {
    const result = await db.select()
      .from(kamarTable)
      .where(eq(kamarTable.id, input.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Failed to get room by ID:', error);
    throw error;
  }
};
