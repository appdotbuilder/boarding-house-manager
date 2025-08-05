
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kamarTable, penyewaTable } from '../db/schema';
import { type CreateKamarInput, type CreatePenyewaInput } from '../schema';
import { deletePenyewa, type DeletePenyewaInput } from '../handlers/delete_penyewa';
import { eq } from 'drizzle-orm';

// Test inputs
const testKamarInput: CreateKamarInput = {
  nomor_kamar: '101',
  harga_sewa: 500000,
  kapasitas: 2,
  fasilitas: 'AC, WiFi, Kamar Mandi Dalam',
  status: 'Kosong',
  catatan: 'Kamar lantai 1'
};

const testPenyewaInput: CreatePenyewaInput = {
  nama_lengkap: 'John Doe',
  no_telepon: '081234567890',
  email: 'john.doe@example.com',
  nomor_ktp: '1234567890123456',
  alamat_asal: 'Jakarta Selatan',
  kamar_id: 1, // Will be set after creating kamar
  tgl_masuk: new Date('2024-01-01'),
  tgl_keluar: null,
  status: 'Aktif'
};

const testDeleteInput: DeletePenyewaInput = {
  id: 1
};

describe('deletePenyewa', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a penyewa', async () => {
    // Create prerequisite kamar
    const kamarResult = await db.insert(kamarTable)
      .values(testKamarInput)
      .returning()
      .execute();

    // Create penyewa to delete - convert dates to strings for database
    const penyewaResult = await db.insert(penyewaTable)
      .values({
        nama_lengkap: testPenyewaInput.nama_lengkap,
        no_telepon: testPenyewaInput.no_telepon,
        email: testPenyewaInput.email,
        nomor_ktp: testPenyewaInput.nomor_ktp,
        alamat_asal: testPenyewaInput.alamat_asal,
        kamar_id: kamarResult[0].id,
        tgl_masuk: '2024-01-01', // Convert Date to string
        tgl_keluar: null,
        status: testPenyewaInput.status
      })
      .returning()
      .execute();

    // Delete the penyewa
    const result = await deletePenyewa({ id: penyewaResult[0].id });

    expect(result.success).toBe(true);

    // Verify penyewa was deleted from database
    const penyewas = await db.select()
      .from(penyewaTable)
      .where(eq(penyewaTable.id, penyewaResult[0].id))
      .execute();

    expect(penyewas).toHaveLength(0);
  });

  it('should throw error when penyewa does not exist', async () => {
    const nonExistentId = 999;

    await expect(deletePenyewa({ id: nonExistentId }))
      .rejects.toThrow(/penyewa with id 999 not found/i);
  });

  it('should not affect other penyewa records', async () => {
    // Create prerequisite kamar
    const kamarResult = await db.insert(kamarTable)
      .values(testKamarInput)
      .returning()
      .execute();

    // Create two penyewa records - convert dates to strings for database
    const penyewa1Result = await db.insert(penyewaTable)
      .values({
        nama_lengkap: 'Penyewa 1',
        no_telepon: testPenyewaInput.no_telepon,
        email: testPenyewaInput.email,
        nomor_ktp: testPenyewaInput.nomor_ktp,
        alamat_asal: testPenyewaInput.alamat_asal,
        kamar_id: kamarResult[0].id,
        tgl_masuk: '2024-01-01', // Convert Date to string
        tgl_keluar: null,
        status: testPenyewaInput.status
      })
      .returning()
      .execute();

    const penyewa2Result = await db.insert(penyewaTable)
      .values({
        nama_lengkap: 'Penyewa 2',
        no_telepon: testPenyewaInput.no_telepon,
        email: 'penyewa2@example.com',
        nomor_ktp: testPenyewaInput.nomor_ktp,
        alamat_asal: testPenyewaInput.alamat_asal,
        kamar_id: kamarResult[0].id,
        tgl_masuk: '2024-01-01', // Convert Date to string
        tgl_keluar: null,
        status: testPenyewaInput.status
      })
      .returning()
      .execute();

    // Delete only the first penyewa
    await deletePenyewa({ id: penyewa1Result[0].id });

    // Verify first penyewa is deleted
    const deletedPenyewa = await db.select()
      .from(penyewaTable)
      .where(eq(penyewaTable.id, penyewa1Result[0].id))
      .execute();
    expect(deletedPenyewa).toHaveLength(0);

    // Verify second penyewa still exists
    const remainingPenyewa = await db.select()
      .from(penyewaTable)
      .where(eq(penyewaTable.id, penyewa2Result[0].id))
      .execute();
    expect(remainingPenyewa).toHaveLength(1);
    expect(remainingPenyewa[0].nama_lengkap).toEqual('Penyewa 2');
  });
});
