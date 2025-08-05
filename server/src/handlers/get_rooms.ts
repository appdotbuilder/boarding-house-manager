
import { db } from '../db';
import { kamarTable } from '../db/schema';
import { type Kamar } from '../schema';

export const getRooms = async (): Promise<Kamar[]> => {
  try {
    // Fetch all rooms from the database
    const result = await db.select()
      .from(kamarTable)
      .execute();

    // Return the rooms - no numeric conversion needed as harga_sewa and kapasitas are integers
    return result;
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
    throw error;
  }
};
