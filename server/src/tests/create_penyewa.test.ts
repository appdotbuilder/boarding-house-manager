
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { penyewaTable, kamarTable } from '../db/schema';
import { type CreatePenyewaInput } from '../schema';
import { createPenyewa } from '../handlers/create_penyewa';
import { eq } from 'drizzle-orm';

describe('createPenyewa', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test room
  const createTestKamar = async () => {
    const result = await db.insert(kamarTable)
      .values({
        nomor_kamar: '101',
        harga_sewa: 500000,
        kapasitas: 2,
        fasilitas: 'AC, WiFi, Kasur',
        status: 'Kosong',
        catatan: 'Kamar bersih dan terawat'
      })
      .returning()
      .execute();
    return result[0];
  };

  const testInput: CreatePenyewaInput = {
    nama_lengkap: 'John Doe',
    no_telepon: '081234567890',
    email: 'john.doe@example.com',
    nomor_ktp: '1234567890123456',
    alamat_asal: 'Jl. Merdeka No. 123, Jakarta',
    kamar_id: 0, // Will be set in tests
    tgl_masuk: new Date('2024-01-01'),
    tgl_keluar: null,
    status: 'Aktif'
  };

  it('should create a penyewa', async () => {
    // Create test kamar first
    const kamar = await createTestKamar();
    const input = { ...testInput, kamar_id: kamar.id };

    const result = await createPenyewa(input);

    // Basic field validation
    expect(result.nama_lengkap).toEqual('John Doe');
    expect(result.no_telepon).toEqual('081234567890');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.nomor_ktp).toEqual('1234567890123456');
    expect(result.alamat_asal).toEqual('Jl. Merdeka No. 123, Jakarta');
    expect(result.kamar_id).toEqual(kamar.id);
    expect(result.tgl_masuk).toEqual(new Date('2024-01-01'));
    expect(result.tgl_keluar).toBeNull();
    expect(result.status).toEqual('Aktif');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save penyewa to database', async () => {
    // Create test kamar first
    const kamar = await createTestKamar();
    const input = { ...testInput, kamar_id: kamar.id };

    const result = await createPenyewa(input);

    // Query using proper drizzle syntax
    const penyewas = await db.select()
      .from(penyewaTable)
      .where(eq(penyewaTable.id, result.id))
      .execute();

    expect(penyewas).toHaveLength(1);
    expect(penyewas[0].nama_lengkap).toEqual('John Doe');
    expect(penyewas[0].no_telepon).toEqual('081234567890');
    expect(penyewas[0].email).toEqual('john.doe@example.com');
    expect(penyewas[0].nomor_ktp).toEqual('1234567890123456');
    expect(penyewas[0].alamat_asal).toEqual('Jl. Merdeka No. 123, Jakarta');
    expect(penyewas[0].kamar_id).toEqual(kamar.id);
    expect(penyewas[0].tgl_masuk).toEqual('2024-01-01'); // Date stored as string in DB
    expect(penyewas[0].tgl_keluar).toBeNull();
    expect(penyewas[0].status).toEqual('Aktif');
    expect(penyewas[0].created_at).toBeInstanceOf(Date);
  });

  it('should create penyewa with tgl_keluar set', async () => {
    // Create test kamar first
    const kamar = await createTestKamar();
    const inputWithEndDate = {
      ...testInput,
      kamar_id: kamar.id,
      tgl_keluar: new Date('2024-12-31'),
      status: 'Keluar' as const
    };

    const result = await createPenyewa(inputWithEndDate);

    expect(result.tgl_keluar).toEqual(new Date('2024-12-31'));
    expect(result.status).toEqual('Keluar');

    // Verify in database
    const penyewas = await db.select()
      .from(penyewaTable)
      .where(eq(penyewaTable.id, result.id))
      .execute();

    expect(penyewas[0].tgl_keluar).toEqual('2024-12-31'); // Date stored as string in DB
  });

  it('should throw error when kamar does not exist', async () => {
    const input = { ...testInput, kamar_id: 999 }; // Non-existent kamar_id

    await expect(createPenyewa(input)).rejects.toThrow(/does not exist/i);
  });

  it('should create multiple penyewa for the same kamar', async () => {
    // Create test kamar first
    const kamar = await createTestKamar();
    
    const input1 = { ...testInput, kamar_id: kamar.id };
    const input2 = {
      ...testInput,
      kamar_id: kamar.id,
      nama_lengkap: 'Jane Doe',
      email: 'jane.doe@example.com',
      nomor_ktp: '9876543210987654'
    };

    const result1 = await createPenyewa(input1);
    const result2 = await createPenyewa(input2);

    expect(result1.kamar_id).toEqual(kamar.id);
    expect(result2.kamar_id).toEqual(kamar.id);
    expect(result1.nama_lengkap).toEqual('John Doe');
    expect(result2.nama_lengkap).toEqual('Jane Doe');
  });

  it('should handle date conversions correctly', async () => {
    // Create test kamar first
    const kamar = await createTestKamar();
    const input = { ...testInput, kamar_id: kamar.id };

    const result = await createPenyewa(input);

    // Check that dates are returned as Date objects
    expect(result.tgl_masuk).toBeInstanceOf(Date);
    expect(result.tgl_masuk.getFullYear()).toEqual(2024);
    expect(result.tgl_masuk.getMonth()).toEqual(0); // January is 0
    expect(result.tgl_masuk.getDate()).toEqual(1);
  });
});
