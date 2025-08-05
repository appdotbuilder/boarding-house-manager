
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { penyewaTable, kamarTable } from '../db/schema';
import { type CreatePenyewaInput } from '../schema';
import { createTenant } from '../handlers/create_tenant';
import { eq } from 'drizzle-orm';

describe('createTenant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestKamar = async () => {
    const result = await db.insert(kamarTable)
      .values({
        nomor_kamar: '101',
        harga_sewa: 1500000,
        kapasitas: 2,
        fasilitas: 'AC, WiFi, Lemari',
        status: 'Kosong',
        catatan: null
      })
      .returning()
      .execute();
    return result[0];
  };

  const testInput: CreatePenyewaInput = {
    nama_lengkap: 'John Doe',
    no_telepon: '081234567890',
    email: 'john.doe@example.com',
    nomor_ktp: '3201234567890123',
    alamat_asal: 'Jl. Kebon Jeruk No. 123, Jakarta',
    kamar_id: 0, // Will be set in tests
    tgl_masuk: new Date('2024-01-01'),
    tgl_keluar: null,
    status: 'Aktif'
  };

  it('should create a tenant', async () => {
    const kamar = await createTestKamar();
    const input = { ...testInput, kamar_id: kamar.id };

    const result = await createTenant(input);

    expect(result.nama_lengkap).toEqual('John Doe');
    expect(result.no_telepon).toEqual('081234567890');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.nomor_ktp).toEqual('3201234567890123');
    expect(result.alamat_asal).toEqual('Jl. Kebon Jeruk No. 123, Jakarta');
    expect(result.kamar_id).toEqual(kamar.id);
    expect(result.tgl_masuk).toEqual(new Date('2024-01-01'));
    expect(result.tgl_keluar).toBeNull();
    expect(result.status).toEqual('Aktif');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save tenant to database', async () => {
    const kamar = await createTestKamar();
    const input = { ...testInput, kamar_id: kamar.id };

    const result = await createTenant(input);

    const tenants = await db.select()
      .from(penyewaTable)
      .where(eq(penyewaTable.id, result.id))
      .execute();

    expect(tenants).toHaveLength(1);
    expect(tenants[0].nama_lengkap).toEqual('John Doe');
    expect(tenants[0].no_telepon).toEqual('081234567890');
    expect(tenants[0].email).toEqual('john.doe@example.com');
    expect(tenants[0].nomor_ktp).toEqual('3201234567890123');
    expect(tenants[0].alamat_asal).toEqual('Jl. Kebon Jeruk No. 123, Jakarta');
    expect(tenants[0].kamar_id).toEqual(kamar.id);
    expect(tenants[0].status).toEqual('Aktif');
    expect(tenants[0].created_at).toBeInstanceOf(Date);
    // Check that dates are stored as strings in database but converted back
    expect(tenants[0].tgl_masuk).toEqual('2024-01-01');
  });

  it('should create tenant with tgl_keluar', async () => {
    const kamar = await createTestKamar();
    const input = { 
      ...testInput, 
      kamar_id: kamar.id,
      tgl_keluar: new Date('2024-12-31'),
      status: 'Keluar' as const
    };

    const result = await createTenant(input);

    expect(result.tgl_keluar).toEqual(new Date('2024-12-31'));
    expect(result.status).toEqual('Keluar');
  });

  it('should throw error when kamar does not exist', async () => {
    const input = { ...testInput, kamar_id: 999 };

    expect(createTenant(input)).rejects.toThrow(/room with id 999 does not exist/i);
  });

  it('should handle different tenant statuses', async () => {
    const kamar = await createTestKamar();
    
    // Test 'Aktif' status
    const activeInput = { ...testInput, kamar_id: kamar.id, status: 'Aktif' as const };
    const activeResult = await createTenant(activeInput);
    expect(activeResult.status).toEqual('Aktif');

    // Test 'Keluar' status
    const exitInput = { 
      ...testInput, 
      kamar_id: kamar.id,
      status: 'Keluar' as const,
      nama_lengkap: 'Jane Doe',
      email: 'jane.doe@example.com',
      nomor_ktp: '3201234567890124'
    };
    const exitResult = await createTenant(exitInput);
    expect(exitResult.status).toEqual('Keluar');
  });

  it('should handle date conversions correctly', async () => {
    const kamar = await createTestKamar();
    const testDate = new Date('2024-06-15');
    const exitDate = new Date('2024-12-15');
    
    const input = { 
      ...testInput, 
      kamar_id: kamar.id,
      tgl_masuk: testDate,
      tgl_keluar: exitDate
    };

    const result = await createTenant(input);

    // Verify returned dates are proper Date objects
    expect(result.tgl_masuk).toBeInstanceOf(Date);
    expect(result.tgl_masuk.getTime()).toEqual(testDate.getTime());
    expect(result.tgl_keluar).toBeInstanceOf(Date);
    expect(result.tgl_keluar?.getTime()).toEqual(exitDate.getTime());
  });
});
