
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kamarTable, penyewaTable } from '../db/schema';
import { getTenantById, type GetTenantByIdInput } from '../handlers/get_tenant_by_id';

describe('getTenantById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return tenant with room details when tenant exists', async () => {
    // Create test room first
    const roomResult = await db.insert(kamarTable)
      .values({
        nomor_kamar: 'A101',
        harga_sewa: 1500000,
        kapasitas: 2,
        fasilitas: 'AC, WiFi, Lemari',
        status: 'Terisi',
        catatan: 'Kamar nyaman'
      })
      .returning()
      .execute();

    const testRoom = roomResult[0];

    // Create test tenant - dates need to be strings for date columns
    const tenantResult = await db.insert(penyewaTable)
      .values({
        nama_lengkap: 'John Doe',
        no_telepon: '08123456789',
        email: 'john.doe@example.com',
        nomor_ktp: '1234567890123456',
        alamat_asal: 'Jakarta Selatan',
        kamar_id: testRoom.id,
        tgl_masuk: '2024-01-01',
        tgl_keluar: null,
        status: 'Aktif'
      })
      .returning()
      .execute();

    const testTenant = tenantResult[0];

    const input: GetTenantByIdInput = {
      id: testTenant.id
    };

    const result = await getTenantById(input);

    // Verify tenant data
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testTenant.id);
    expect(result!.nama_lengkap).toEqual('John Doe');
    expect(result!.no_telepon).toEqual('08123456789');
    expect(result!.email).toEqual('john.doe@example.com');
    expect(result!.nomor_ktp).toEqual('1234567890123456');
    expect(result!.alamat_asal).toEqual('Jakarta Selatan');
    expect(result!.kamar_id).toEqual(testRoom.id);
    expect(result!.tgl_masuk).toBeInstanceOf(Date);
    expect(result!.tgl_masuk.toISOString().split('T')[0]).toEqual('2024-01-01');
    expect(result!.tgl_keluar).toBeNull();
    expect(result!.status).toEqual('Aktif');
    expect(result!.created_at).toBeInstanceOf(Date);

    // Verify room data
    expect(result!.kamar).toBeDefined();
    expect(result!.kamar.id).toEqual(testRoom.id);
    expect(result!.kamar.nomor_kamar).toEqual('A101');
    expect(result!.kamar.harga_sewa).toEqual(1500000);
    expect(result!.kamar.kapasitas).toEqual(2);
    expect(result!.kamar.fasilitas).toEqual('AC, WiFi, Lemari');
    expect(result!.kamar.status).toEqual('Terisi');
    expect(result!.kamar.catatan).toEqual('Kamar nyaman');
    expect(result!.kamar.created_at).toBeInstanceOf(Date);
  });

  it('should return null when tenant does not exist', async () => {
    const input: GetTenantByIdInput = {
      id: 999
    };

    const result = await getTenantById(input);

    expect(result).toBeNull();
  });

  it('should handle tenant with null tgl_keluar', async () => {
    // Create test room
    const roomResult = await db.insert(kamarTable)
      .values({
        nomor_kamar: 'B202',
        harga_sewa: 1200000,
        kapasitas: 1,
        fasilitas: null,
        status: 'Terisi',
        catatan: null
      })
      .returning()
      .execute();

    // Create tenant with null optional fields
    const tenantResult = await db.insert(penyewaTable)
      .values({
        nama_lengkap: 'Jane Smith',
        no_telepon: '08198765432',
        email: 'jane.smith@example.com',
        nomor_ktp: '9876543210987654',
        alamat_asal: 'Bandung',
        kamar_id: roomResult[0].id,
        tgl_masuk: '2024-02-15',
        tgl_keluar: null,
        status: 'Aktif'
      })
      .returning()
      .execute();

    const input: GetTenantByIdInput = {
      id: tenantResult[0].id
    };

    const result = await getTenantById(input);

    expect(result).not.toBeNull();
    expect(result!.tgl_keluar).toBeNull();
    expect(result!.kamar.fasilitas).toBeNull();
    expect(result!.kamar.catatan).toBeNull();
    expect(result!.tgl_masuk).toBeInstanceOf(Date);
    expect(result!.tgl_masuk.toISOString().split('T')[0]).toEqual('2024-02-15');
  });

  it('should handle tenant with status Keluar and tgl_keluar', async () => {
    // Create test room
    const roomResult = await db.insert(kamarTable)
      .values({
        nomor_kamar: 'C303',
        harga_sewa: 1800000,
        kapasitas: 3,
        fasilitas: 'AC, WiFi, TV, Kulkas',
        status: 'Kosong',
        catatan: 'Baru direnovasi'
      })
      .returning()
      .execute();

    // Create former tenant
    const tenantResult = await db.insert(penyewaTable)
      .values({
        nama_lengkap: 'Bob Wilson',
        no_telepon: '08111222333',
        email: 'bob.wilson@example.com',
        nomor_ktp: '5555666677778888',
        alamat_asal: 'Surabaya',
        kamar_id: roomResult[0].id,
        tgl_masuk: '2023-06-01',
        tgl_keluar: '2024-01-31',
        status: 'Keluar'
      })
      .returning()
      .execute();

    const input: GetTenantByIdInput = {
      id: tenantResult[0].id
    };

    const result = await getTenantById(input);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('Keluar');
    expect(result!.tgl_keluar).toBeInstanceOf(Date);
    expect(result!.tgl_keluar!.toISOString().split('T')[0]).toEqual('2024-01-31');
    expect(result!.tgl_masuk).toBeInstanceOf(Date);
    expect(result!.tgl_masuk.toISOString().split('T')[0]).toEqual('2023-06-01');
    expect(result!.kamar.status).toEqual('Kosong');
  });
});
