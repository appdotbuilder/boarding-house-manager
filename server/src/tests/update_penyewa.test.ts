
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { penyewaTable, kamarTable } from '../db/schema';
import { type CreateKamarInput, type UpdatePenyewaInput } from '../schema';
import { updatePenyewa } from '../handlers/update_penyewa';
import { eq } from 'drizzle-orm';

describe('updatePenyewa', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testKamarId: number;
  let testPenyewaId: number;

  const setupTestData = async () => {
    // Create test kamar first
    const kamarInput: CreateKamarInput = {
      nomor_kamar: '101',
      harga_sewa: 1500000,
      kapasitas: 2,
      fasilitas: 'AC, WiFi',
      status: 'Kosong',
      catatan: 'Test room'
    };

    const kamar = await db.insert(kamarTable)
      .values(kamarInput)
      .returning()
      .execute();
    testKamarId = kamar[0].id;

    // Create test penyewa with string dates for database
    const penyewaInput = {
      nama_lengkap: 'John Doe',
      no_telepon: '081234567890',
      email: 'john@example.com',
      nomor_ktp: '1234567890123456',
      alamat_asal: 'Jakarta',
      kamar_id: testKamarId,
      tgl_masuk: '2024-01-01',
      tgl_keluar: null,
      status: 'Aktif' as const
    };

    const penyewa = await db.insert(penyewaTable)
      .values(penyewaInput)
      .returning()
      .execute();
    testPenyewaId = penyewa[0].id;
  };

  it('should update penyewa with all fields', async () => {
    await setupTestData();

    const updateInput: UpdatePenyewaInput = {
      id: testPenyewaId,
      nama_lengkap: 'Jane Smith',
      no_telepon: '081987654321',
      email: 'jane@example.com',
      nomor_ktp: '9876543210987654',
      alamat_asal: 'Bandung',
      tgl_keluar: new Date('2024-12-31'),
      status: 'Keluar'
    };

    const result = await updatePenyewa(updateInput);

    expect(result.id).toEqual(testPenyewaId);
    expect(result.nama_lengkap).toEqual('Jane Smith');
    expect(result.no_telepon).toEqual('081987654321');
    expect(result.email).toEqual('jane@example.com');
    expect(result.nomor_ktp).toEqual('9876543210987654');
    expect(result.alamat_asal).toEqual('Bandung');
    expect(result.tgl_keluar).toEqual(new Date('2024-12-31'));
    expect(result.status).toEqual('Keluar');
    expect(result.kamar_id).toEqual(testKamarId); // Should remain unchanged
  });

  it('should update penyewa with partial fields', async () => {
    await setupTestData();

    const updateInput: UpdatePenyewaInput = {
      id: testPenyewaId,
      nama_lengkap: 'Updated Name',
      status: 'Keluar'
    };

    const result = await updatePenyewa(updateInput);

    expect(result.id).toEqual(testPenyewaId);
    expect(result.nama_lengkap).toEqual('Updated Name');
    expect(result.status).toEqual('Keluar');
    // Other fields should remain unchanged
    expect(result.email).toEqual('john@example.com');
    expect(result.no_telepon).toEqual('081234567890');
    expect(result.alamat_asal).toEqual('Jakarta');
  });

  it('should save updated penyewa to database', async () => {
    await setupTestData();

    const updateInput: UpdatePenyewaInput = {
      id: testPenyewaId,
      nama_lengkap: 'Database Test',
      email: 'dbtest@example.com'
    };

    await updatePenyewa(updateInput);

    // Verify changes were saved
    const penyewa = await db.select()
      .from(penyewaTable)
      .where(eq(penyewaTable.id, testPenyewaId))
      .execute();

    expect(penyewa).toHaveLength(1);
    expect(penyewa[0].nama_lengkap).toEqual('Database Test');
    expect(penyewa[0].email).toEqual('dbtest@example.com');
  });

  it('should update kamar_id when provided with valid kamar', async () => {
    await setupTestData();

    // Create another kamar
    const newKamar = await db.insert(kamarTable)
      .values({
        nomor_kamar: '102',
        harga_sewa: 2000000,
        kapasitas: 1,
        fasilitas: 'WiFi only',
        status: 'Kosong',
        catatan: null
      })
      .returning()
      .execute();

    const updateInput: UpdatePenyewaInput = {
      id: testPenyewaId,
      kamar_id: newKamar[0].id
    };

    const result = await updatePenyewa(updateInput);

    expect(result.kamar_id).toEqual(newKamar[0].id);
  });

  it('should update date fields correctly', async () => {
    await setupTestData();

    const newTglMasuk = new Date('2024-02-01');
    const newTglKeluar = new Date('2024-12-31');

    const updateInput: UpdatePenyewaInput = {
      id: testPenyewaId,
      tgl_masuk: newTglMasuk,
      tgl_keluar: newTglKeluar
    };

    const result = await updatePenyewa(updateInput);

    expect(result.tgl_masuk).toEqual(newTglMasuk);
    expect(result.tgl_keluar).toEqual(newTglKeluar);

    // Verify in database
    const penyewa = await db.select()
      .from(penyewaTable)
      .where(eq(penyewaTable.id, testPenyewaId))
      .execute();

    expect(penyewa[0].tgl_masuk).toEqual('2024-02-01');
    expect(penyewa[0].tgl_keluar).toEqual('2024-12-31');
  });

  it('should throw error when penyewa not found', async () => {
    const updateInput: UpdatePenyewaInput = {
      id: 999999,
      nama_lengkap: 'Non-existent'
    };

    expect(updatePenyewa(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should throw error when kamar_id is invalid', async () => {
    await setupTestData();

    const updateInput: UpdatePenyewaInput = {
      id: testPenyewaId,
      kamar_id: 999999
    };

    expect(updatePenyewa(updateInput)).rejects.toThrow(/kamar.*not found/i);
  });
});
