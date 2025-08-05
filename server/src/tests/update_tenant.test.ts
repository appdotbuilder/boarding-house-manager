
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { penyewaTable, kamarTable } from '../db/schema';
import { type UpdatePenyewaInput } from '../schema';
import { updatePenyewa } from '../handlers/update_tenant';
import { eq } from 'drizzle-orm';

// Test data
const testKamarData = {
  nomor_kamar: '101',
  harga_sewa: 500000,
  kapasitas: 2,
  fasilitas: 'AC, WiFi',
  status: 'Kosong' as const,
  catatan: 'Kamar test'
};

const testPenyewaData = {
  nama_lengkap: 'John Doe',
  no_telepon: '081234567890',
  email: 'john.doe@example.com',
  nomor_ktp: '1234567890123456',
  alamat_asal: 'Jakarta Selatan',
  kamar_id: 1,
  tgl_masuk: '2024-01-01', // String format for database
  tgl_keluar: null,
  status: 'Aktif' as const
};

describe('updatePenyewa', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update penyewa successfully', async () => {
    // Create prerequisite kamar
    const kamarResult = await db.insert(kamarTable)
      .values(testKamarData)
      .returning()
      .execute();

    // Create penyewa
    const penyewaResult = await db.insert(penyewaTable)
      .values({
        ...testPenyewaData,
        kamar_id: kamarResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdatePenyewaInput = {
      id: penyewaResult[0].id,
      nama_lengkap: 'Jane Doe Updated',
      no_telepon: '081987654321',
      email: 'jane.updated@example.com'
    };

    const result = await updatePenyewa(updateInput);

    // Verify updated fields
    expect(result.nama_lengkap).toEqual('Jane Doe Updated');
    expect(result.no_telepon).toEqual('081987654321');
    expect(result.email).toEqual('jane.updated@example.com');
    expect(result.id).toEqual(penyewaResult[0].id);

    // Verify unchanged fields remain the same
    expect(result.nomor_ktp).toEqual(testPenyewaData.nomor_ktp);
    expect(result.alamat_asal).toEqual(testPenyewaData.alamat_asal);
    expect(result.status).toEqual(testPenyewaData.status);

    // Verify date conversion
    expect(result.tgl_masuk).toBeInstanceOf(Date);
    expect(result.tgl_masuk).toEqual(new Date('2024-01-01'));
  });

  it('should update kamar_id when provided', async () => {
    // Create two kamar
    const kamar1 = await db.insert(kamarTable)
      .values(testKamarData)
      .returning()
      .execute();

    const kamar2 = await db.insert(kamarTable)
      .values({
        ...testKamarData,
        nomor_kamar: '102'
      })
      .returning()
      .execute();

    // Create penyewa in first kamar
    const penyewaResult = await db.insert(penyewaTable)
      .values({
        ...testPenyewaData,
        kamar_id: kamar1[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdatePenyewaInput = {
      id: penyewaResult[0].id,
      kamar_id: kamar2[0].id
    };

    const result = await updatePenyewa(updateInput);

    expect(result.kamar_id).toEqual(kamar2[0].id);
    expect(result.nama_lengkap).toEqual(testPenyewaData.nama_lengkap); // Unchanged
  });

  it('should update status from Aktif to Keluar', async () => {
    // Create prerequisite kamar
    const kamarResult = await db.insert(kamarTable)
      .values(testKamarData)
      .returning()
      .execute();

    // Create penyewa
    const penyewaResult = await db.insert(penyewaTable)
      .values({
        ...testPenyewaData,
        kamar_id: kamarResult[0].id,
        status: 'Aktif'
      })
      .returning()
      .execute();

    const updateInput: UpdatePenyewaInput = {
      id: penyewaResult[0].id,
      status: 'Keluar',
      tgl_keluar: new Date('2024-12-31')
    };

    const result = await updatePenyewa(updateInput);

    expect(result.status).toEqual('Keluar');
    expect(result.tgl_keluar).toBeInstanceOf(Date);
    expect(result.tgl_keluar).toEqual(new Date('2024-12-31'));
  });

  it('should save changes to database', async () => {
    // Create prerequisite kamar
    const kamarResult = await db.insert(kamarTable)
      .values(testKamarData)
      .returning()
      .execute();

    // Create penyewa
    const penyewaResult = await db.insert(penyewaTable)
      .values({
        ...testPenyewaData,
        kamar_id: kamarResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdatePenyewaInput = {
      id: penyewaResult[0].id,
      nama_lengkap: 'Database Test Update'
    };

    await updatePenyewa(updateInput);

    // Verify in database
    const dbResult = await db.select()
      .from(penyewaTable)
      .where(eq(penyewaTable.id, penyewaResult[0].id))
      .execute();

    expect(dbResult).toHaveLength(1);
    expect(dbResult[0].nama_lengkap).toEqual('Database Test Update');
  });

  it('should update dates correctly', async () => {
    // Create prerequisite kamar
    const kamarResult = await db.insert(kamarTable)
      .values(testKamarData)
      .returning()
      .execute();

    // Create penyewa
    const penyewaResult = await db.insert(penyewaTable)
      .values({
        ...testPenyewaData,
        kamar_id: kamarResult[0].id
      })
      .returning()
      .execute();

    const newTglMasuk = new Date('2024-02-01');
    const updateInput: UpdatePenyewaInput = {
      id: penyewaResult[0].id,
      tgl_masuk: newTglMasuk
    };

    const result = await updatePenyewa(updateInput);

    expect(result.tgl_masuk).toBeInstanceOf(Date);
    expect(result.tgl_masuk).toEqual(newTglMasuk);

    // Verify in database
    const dbResult = await db.select()
      .from(penyewaTable)
      .where(eq(penyewaTable.id, penyewaResult[0].id))
      .execute();

    expect(dbResult[0].tgl_masuk).toEqual('2024-02-01');
  });

  it('should throw error when penyewa not found', async () => {
    const updateInput: UpdatePenyewaInput = {
      id: 999,
      nama_lengkap: 'Non-existent'
    };

    await expect(updatePenyewa(updateInput)).rejects.toThrow(/penyewa not found/i);
  });

  it('should throw error when kamar_id does not exist', async () => {
    // Create prerequisite kamar
    const kamarResult = await db.insert(kamarTable)
      .values(testKamarData)
      .returning()
      .execute();

    // Create penyewa
    const penyewaResult = await db.insert(penyewaTable)
      .values({
        ...testPenyewaData,
        kamar_id: kamarResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdatePenyewaInput = {
      id: penyewaResult[0].id,
      kamar_id: 999 // Non-existent kamar
    };

    await expect(updatePenyewa(updateInput)).rejects.toThrow(/kamar not found/i);
  });
});
