
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kamarTable } from '../db/schema';
import { type CreateKamarInput, type UpdateKamarInput } from '../schema';
import { updateKamar } from '../handlers/update_kamar';
import { eq } from 'drizzle-orm';

// Test data
const testKamarInput: CreateKamarInput = {
  nomor_kamar: 'K001',
  harga_sewa: 500000,
  kapasitas: 2,
  fasilitas: 'AC, Wifi, Kasur',
  status: 'Kosong',
  catatan: 'Kamar lantai 1'
};

describe('updateKamar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update kamar successfully', async () => {
    // Create a kamar first
    const created = await db.insert(kamarTable)
      .values(testKamarInput)
      .returning()
      .execute();
    const kamarId = created[0].id;

    // Update the kamar
    const updateInput: UpdateKamarInput = {
      id: kamarId,
      nomor_kamar: 'K002',
      harga_sewa: 600000,
      status: 'Terisi'
    };

    const result = await updateKamar(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(kamarId);
    expect(result.nomor_kamar).toEqual('K002');
    expect(result.harga_sewa).toEqual(600000);
    expect(result.status).toEqual('Terisi');
    
    // Verify unchanged fields
    expect(result.kapasitas).toEqual(2);
    expect(result.fasilitas).toEqual('AC, Wifi, Kasur');
    expect(result.catatan).toEqual('Kamar lantai 1');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update database record correctly', async () => {
    // Create a kamar first
    const created = await db.insert(kamarTable)
      .values(testKamarInput)
      .returning()
      .execute();
    const kamarId = created[0].id;

    // Update the kamar
    const updateInput: UpdateKamarInput = {
      id: kamarId,
      harga_sewa: 750000,
      kapasitas: 3,
      catatan: 'Updated room description'
    };

    await updateKamar(updateInput);

    // Verify database was updated
    const updatedKamar = await db.select()
      .from(kamarTable)
      .where(eq(kamarTable.id, kamarId))
      .execute();

    expect(updatedKamar).toHaveLength(1);
    expect(updatedKamar[0].harga_sewa).toEqual(750000);
    expect(updatedKamar[0].kapasitas).toEqual(3);
    expect(updatedKamar[0].catatan).toEqual('Updated room description');
    
    // Verify unchanged fields
    expect(updatedKamar[0].nomor_kamar).toEqual('K001');
    expect(updatedKamar[0].status).toEqual('Kosong');
  });

  it('should update only nullable fields', async () => {
    // Create a kamar first
    const created = await db.insert(kamarTable)
      .values(testKamarInput)
      .returning()
      .execute();
    const kamarId = created[0].id;

    // Update nullable fields
    const updateInput: UpdateKamarInput = {
      id: kamarId,
      fasilitas: null,
      catatan: null
    };

    const result = await updateKamar(updateInput);

    expect(result.fasilitas).toBeNull();
    expect(result.catatan).toBeNull();
    
    // Verify other fields unchanged
    expect(result.nomor_kamar).toEqual('K001');
    expect(result.harga_sewa).toEqual(500000);
    expect(result.status).toEqual('Kosong');
  });

  it('should throw error when kamar not found', async () => {
    const updateInput: UpdateKamarInput = {
      id: 999, // Non-existent ID
      nomor_kamar: 'K999'
    };

    await expect(() => updateKamar(updateInput)).toThrow(/Kamar with id 999 not found/i);
  });

  it('should handle partial updates correctly', async () => {
    // Create a kamar first
    const created = await db.insert(kamarTable)
      .values(testKamarInput)
      .returning()
      .execute();
    const kamarId = created[0].id;

    // Update only status
    const updateInput: UpdateKamarInput = {
      id: kamarId,
      status: 'Terisi'
    };

    const result = await updateKamar(updateInput);

    // Only status should change
    expect(result.status).toEqual('Terisi');
    expect(result.nomor_kamar).toEqual('K001');
    expect(result.harga_sewa).toEqual(500000);
    expect(result.kapasitas).toEqual(2);
    expect(result.fasilitas).toEqual('AC, Wifi, Kasur');
    expect(result.catatan).toEqual('Kamar lantai 1');
  });
});
