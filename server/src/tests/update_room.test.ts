
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kamarTable } from '../db/schema';
import { type CreateKamarInput, type UpdateKamarInput } from '../schema';
import { updateKamar } from '../handlers/update_room';
import { eq } from 'drizzle-orm';

// Test data for creating initial kamar
const testKamarInput: CreateKamarInput = {
  nomor_kamar: 'K001',
  harga_sewa: 500000,
  kapasitas: 2,
  fasilitas: 'AC, Kasur, Lemari',
  status: 'Kosong',
  catatan: 'Kamar lantai 1'
};

describe('updateKamar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update kamar successfully', async () => {
    // Create initial kamar
    const createResult = await db.insert(kamarTable)
      .values(testKamarInput)
      .returning()
      .execute();
    
    const createdKamar = createResult[0];

    // Update the kamar
    const updateInput: UpdateKamarInput = {
      id: createdKamar.id,
      nomor_kamar: 'K002',
      harga_sewa: 600000,
      kapasitas: 3,
      status: 'Terisi'
    };

    const result = await updateKamar(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(createdKamar.id);
    expect(result.nomor_kamar).toEqual('K002');
    expect(result.harga_sewa).toEqual(600000);
    expect(result.kapasitas).toEqual(3);
    expect(result.status).toEqual('Terisi');
    
    // Verify unchanged fields
    expect(result.fasilitas).toEqual(testKamarInput.fasilitas);
    expect(result.catatan).toEqual(testKamarInput.catatan);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    // Create initial kamar
    const createResult = await db.insert(kamarTable)
      .values(testKamarInput)
      .returning()
      .execute();
    
    const createdKamar = createResult[0];

    // Update only harga_sewa
    const updateInput: UpdateKamarInput = {
      id: createdKamar.id,
      harga_sewa: 750000
    };

    const result = await updateKamar(updateInput);

    // Verify only harga_sewa changed
    expect(result.harga_sewa).toEqual(750000);
    expect(result.nomor_kamar).toEqual(testKamarInput.nomor_kamar);
    expect(result.kapasitas).toEqual(testKamarInput.kapasitas);
    expect(result.fasilitas).toEqual(testKamarInput.fasilitas);
    expect(result.status).toEqual(testKamarInput.status);
    expect(result.catatan).toEqual(testKamarInput.catatan);
  });

  it('should persist changes in database', async () => {
    // Create initial kamar
    const createResult = await db.insert(kamarTable)
      .values(testKamarInput)
      .returning()
      .execute();
    
    const createdKamar = createResult[0];

    // Update the kamar
    const updateInput: UpdateKamarInput = {
      id: createdKamar.id,
      nomor_kamar: 'K999',
      status: 'Terisi',
      catatan: 'Updated catatan'
    };

    await updateKamar(updateInput);

    // Verify changes persisted in database
    const dbKamar = await db.select()
      .from(kamarTable)
      .where(eq(kamarTable.id, createdKamar.id))
      .execute();

    expect(dbKamar).toHaveLength(1);
    expect(dbKamar[0].nomor_kamar).toEqual('K999');
    expect(dbKamar[0].status).toEqual('Terisi');
    expect(dbKamar[0].catatan).toEqual('Updated catatan');
    expect(dbKamar[0].harga_sewa).toEqual(testKamarInput.harga_sewa); // Unchanged
  });

  it('should handle null values correctly', async () => {
    // Create initial kamar
    const createResult = await db.insert(kamarTable)
      .values(testKamarInput)
      .returning()
      .execute();
    
    const createdKamar = createResult[0];

    // Update with null values
    const updateInput: UpdateKamarInput = {
      id: createdKamar.id,
      fasilitas: null,
      catatan: null
    };

    const result = await updateKamar(updateInput);

    expect(result.fasilitas).toBeNull();
    expect(result.catatan).toBeNull();
    expect(result.nomor_kamar).toEqual(testKamarInput.nomor_kamar); // Unchanged
  });

  it('should throw error for non-existent kamar', async () => {
    const updateInput: UpdateKamarInput = {
      id: 99999,
      nomor_kamar: 'K999'
    };

    expect(updateKamar(updateInput)).rejects.toThrow(/not found/i);
  });
});
