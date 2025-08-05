
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kamarTable, penyewaTable } from '../db/schema';
import { type CreateKamarInput } from '../schema';
import { getTenants } from '../handlers/get_tenants';

const testKamar: CreateKamarInput = {
  nomor_kamar: 'A101',
  harga_sewa: 500000,
  kapasitas: 2,
  fasilitas: 'AC, WiFi, Kamar mandi dalam',
  status: 'Terisi',
  catatan: 'Kamar sudah terisi'
};

describe('getTenants', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tenants exist', async () => {
    const result = await getTenants();
    expect(result).toEqual([]);
  });

  it('should fetch all tenants with room associations', async () => {
    // Create room first
    const kamarResult = await db.insert(kamarTable)
      .values(testKamar)
      .returning()
      .execute();

    // Create tenant with proper date conversion
    await db.insert(penyewaTable)
      .values({
        nama_lengkap: 'John Doe',
        no_telepon: '081234567890',
        email: 'john.doe@example.com',
        nomor_ktp: '1234567890123456',
        alamat_asal: 'Jakarta Selatan',
        kamar_id: kamarResult[0].id,
        tgl_masuk: '2024-01-01', // Use string format for date column
        tgl_keluar: null,
        status: 'Aktif'
      })
      .execute();

    const results = await getTenants();

    expect(results).toHaveLength(1);
    expect(results[0].nama_lengkap).toEqual('John Doe');
    expect(results[0].no_telepon).toEqual('081234567890');
    expect(results[0].email).toEqual('john.doe@example.com');
    expect(results[0].nomor_ktp).toEqual('1234567890123456');
    expect(results[0].alamat_asal).toEqual('Jakarta Selatan');
    expect(results[0].kamar_id).toEqual(kamarResult[0].id);
    expect(results[0].tgl_masuk).toBeInstanceOf(Date);
    expect(results[0].tgl_keluar).toBeNull();
    expect(results[0].status).toEqual('Aktif');
    expect(results[0].created_at).toBeInstanceOf(Date);
  });

  it('should fetch multiple tenants correctly', async () => {
    // Create two rooms
    const kamar1 = await db.insert(kamarTable)
      .values(testKamar)
      .returning()
      .execute();

    const kamar2 = await db.insert(kamarTable)
      .values({
        ...testKamar,
        nomor_kamar: 'A102'
      })
      .returning()
      .execute();

    // Create two tenants
    await db.insert(penyewaTable)
      .values({
        nama_lengkap: 'John Doe',
        no_telepon: '081234567890',
        email: 'john.doe@example.com',
        nomor_ktp: '1234567890123456',
        alamat_asal: 'Jakarta Selatan',
        kamar_id: kamar1[0].id,
        tgl_masuk: '2024-01-01',
        tgl_keluar: null,
        status: 'Aktif'
      })
      .execute();

    await db.insert(penyewaTable)
      .values({
        nama_lengkap: 'Jane Smith',
        no_telepon: '081234567891',
        email: 'jane.smith@example.com',
        nomor_ktp: '9876543210987654',
        alamat_asal: 'Jakarta Utara',
        kamar_id: kamar2[0].id,
        tgl_masuk: '2024-02-01',
        tgl_keluar: null,
        status: 'Keluar'
      })
      .execute();

    const results = await getTenants();

    expect(results).toHaveLength(2);
    
    // Find specific tenants
    const johnTenant = results.find(t => t.nama_lengkap === 'John Doe');
    const janeTenant = results.find(t => t.nama_lengkap === 'Jane Smith');

    expect(johnTenant).toBeDefined();
    expect(johnTenant?.status).toEqual('Aktif');
    expect(johnTenant?.kamar_id).toEqual(kamar1[0].id);

    expect(janeTenant).toBeDefined();
    expect(janeTenant?.status).toEqual('Keluar');
    expect(janeTenant?.kamar_id).toEqual(kamar2[0].id);
  });

  it('should handle tenants with different rental dates', async () => {
    // Create room
    const kamarResult = await db.insert(kamarTable)
      .values(testKamar)
      .returning()
      .execute();

    // Create tenant with checkout date
    await db.insert(penyewaTable)
      .values({
        nama_lengkap: 'John Doe',
        no_telepon: '081234567890',
        email: 'john.doe@example.com',
        nomor_ktp: '1234567890123456',
        alamat_asal: 'Jakarta Selatan',
        kamar_id: kamarResult[0].id,
        tgl_masuk: '2024-01-01',
        tgl_keluar: '2024-06-30', // Use string format for date column
        status: 'Keluar'
      })
      .execute();

    const results = await getTenants();

    expect(results).toHaveLength(1);
    expect(results[0].tgl_masuk).toBeInstanceOf(Date);
    expect(results[0].tgl_keluar).toBeInstanceOf(Date);
    expect(results[0].status).toEqual('Keluar');
  });

  it('should handle date conversions correctly', async () => {
    // Create room
    const kamarResult = await db.insert(kamarTable)
      .values(testKamar)
      .returning()
      .execute();

    // Create tenant
    await db.insert(penyewaTable)
      .values({
        nama_lengkap: 'Test User',
        no_telepon: '081234567890',
        email: 'test@example.com',
        nomor_ktp: '1234567890123456',
        alamat_asal: 'Jakarta',
        kamar_id: kamarResult[0].id,
        tgl_masuk: '2024-01-15',
        tgl_keluar: null,
        status: 'Aktif'
      })
      .execute();

    const results = await getTenants();

    expect(results).toHaveLength(1);
    expect(results[0].tgl_masuk).toBeInstanceOf(Date);
    expect(results[0].tgl_masuk.getFullYear()).toEqual(2024);
    expect(results[0].tgl_masuk.getMonth()).toEqual(0); // January is 0
    expect(results[0].tgl_masuk.getDate()).toEqual(15);
    expect(results[0].tgl_keluar).toBeNull();
  });
});
