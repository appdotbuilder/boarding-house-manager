
import { db } from '../db';
import { kamarTable } from '../db/schema';
import { type CreateKamarInput, type Kamar } from '../schema';

export const createKamar = async (input: CreateKamarInput): Promise<Kamar> => {
  try {
    // Insert kamar record
    const result = await db.insert(kamarTable)
      .values({
        nomor_kamar: input.nomor_kamar,
        harga_sewa: input.harga_sewa,
        kapasitas: input.kapasitas,
        fasilitas: input.fasilitas,
        status: input.status,
        catatan: input.catatan
      })
      .returning()
      .execute();

    const kamar = result[0];
    return kamar;
  } catch (error) {
    console.error('Kamar creation failed:', error);
    throw error;
  }
};
