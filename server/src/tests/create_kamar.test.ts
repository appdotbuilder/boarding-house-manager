
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kamarTable } from '../db/schema';
import { type CreateKamarInput } from '../schema';
import { createKamar } from '../handlers/create_kamar';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateKamarInput = {
  nomor_kamar: 'K001',
  harga_sewa: 500000,
  kapasitas: 2,
  fasilitas: 'AC, WiFi, Kasur',
  status: 'Kosong',
  catatan: 'Kamar bersih dan nyaman'
};

describe('createKamar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a kamar', async () => {
    const result = await createKamar(testInput);

    // Basic field validation
    expect(result.nomor_kamar).toEqual('K001');
    expect(result.harga_sewa).toEqual(500000);
    expect(result.kapasitas).toEqual(2);
    expect(result.fasilitas).toEqual('AC, WiFi, Kasur');
    expect(result.status).toEqual('Kosong');
    expect(result.catatan).toEqual('Kamar bersih dan nyaman');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save kamar to database', async () => {
    const result = await createKamar(testInput);

    // Query using proper drizzle syntax
    const kamars = await db.select()
      .from(kamarTable)
      .where(eq(kamarTable.id, result.id))
      .execute();

    expect(kamars).toHaveLength(1);
    expect(kamars[0].nomor_kamar).toEqual('K001');
    expect(kamars[0].harga_sewa).toEqual(500000);
    expect(kamars[0].kapasitas).toEqual(2);
    expect(kamars[0].fasilitas).toEqual('AC, WiFi, Kasur');
    expect(kamars[0].status).toEqual('Kosong');
    expect(kamars[0].catatan).toEqual('Kamar bersih dan nyaman');
    expect(kamars[0].created_at).toBeInstanceOf(Date);
  });

  it('should create kamar with nullable fields', async () => {
    const inputWithNulls: CreateKamarInput = {
      nomor_kamar: 'K002',
      harga_sewa: 400000,
      kapasitas: 1,
      fasilitas: null,
      status: 'Terisi',
      catatan: null
    };

    const result = await createKamar(inputWithNulls);

    expect(result.nomor_kamar).toEqual('K002');
    expect(result.harga_sewa).toEqual(400000);
    expect(result.kapasitas).toEqual(1);
    expect(result.fasilitas).toBeNull();
    expect(result.status).toEqual('Terisi');
    expect(result.catatan).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should handle different status values', async () => {
    const inputTerisi: CreateKamarInput = {
      nomor_kamar: 'K003',
      harga_sewa: 600000,
      kapasitas: 3,
      fasilitas: 'AC, WiFi, TV',
      status: 'Terisi',
      catatan: 'Kamar sudah terisi'
    };

    const result = await createKamar(inputTerisi);

    expect(result.status).toEqual('Terisi');
    expect(result.nomor_kamar).toEqual('K003');
    expect(result.harga_sewa).toEqual(600000);
    expect(result.kapasitas).toEqual(3);
  });
});
