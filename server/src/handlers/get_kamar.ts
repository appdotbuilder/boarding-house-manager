
import { db } from '../db';
import { kamarTable } from '../db/schema';
import { type Kamar } from '../schema';

export const getKamar = async (): Promise<Kamar[]> => {
  try {
    const results = await db.select()
      .from(kamarTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch kamar:', error);
    throw error;
  }
};
