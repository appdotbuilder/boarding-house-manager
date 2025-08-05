
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kamarTable, penyewaTable } from '../db/schema';
import { getPenyewa } from '../handlers/get_penyewa';

describe('getPenyewa', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no penyewa exist', async () => {
    const result = await getPenyewa();
    expect(result).toEqual([]);
  });

  it('should return all penyewa', async () => {
    // Create a kamar first (foreign key requirement)
    const kamarResult = await db.insert(kamarTable)
      .values({
        nomor_kamar: '101',
        harga_sewa: 1500000,
        kapasitas: 2,
        fasilitas: 'AC, WiFi',
        status: 'Kosong',
        catatan: 'Kamar bersih'
      })
      .returning()
      .execute();

    const kamarId = kamarResult[0].id;

    // Create test penyewa - use string format for date columns
    await db.insert(penyewaTable)
      .values([
        {
          nama_lengkap: 'John Doe',
          no_telepon: '081234567890',
          email: 'john@example.com',
          nomor_ktp: '1234567890123456',
          alamat_asal: 'Jakarta Selatan',
          kamar_id: kamarId,
          tgl_masuk: '2024-01-01',
          tgl_keluar: null,
          status: 'Aktif'
        },
        {
          nama_lengkap: 'Jane Smith',
          no_telepon: '089876543210',
          email: 'jane@example.com',
          nomor_ktp: '6543210987654321',
          alamat_asal: 'Bandung',
          kamar_id: kamarId,
          tgl_masuk: '2024-02-01',
          tgl_keluar: '2024-12-31',
          status: 'Keluar'
        }
      ])
      .execute();

    const result = await getPenyewa();

    expect(result).toHaveLength(2);
    
    // Verify first penyewa
    const firstPenyewa = result.find(p => p.nama_lengkap === 'John Doe');
    expect(firstPenyewa).toBeDefined();
    expect(firstPenyewa!.no_telepon).toEqual('081234567890');
    expect(firstPenyewa!.email).toEqual('john@example.com');
    expect(firstPenyewa!.nomor_ktp).toEqual('1234567890123456');
    expect(firstPenyewa!.alamat_asal).toEqual('Jakarta Selatan');
    expect(firstPenyewa!.kamar_id).toEqual(kamarId);
    expect(firstPenyewa!.tgl_masuk).toEqual(new Date('2024-01-01'));
    expect(firstPenyewa!.tgl_keluar).toBeNull();
    expect(firstPenyewa!.status).toEqual('Aktif');
    expect(firstPenyewa!.id).toBeDefined();
    expect(firstPenyewa!.created_at).toBeInstanceOf(Date);

    // Verify second penyewa
    const secondPenyewa = result.find(p => p.nama_lengkap === 'Jane Smith');
    expect(secondPenyewa).toBeDefined();
    expect(secondPenyewa!.no_telepon).toEqual('089876543210');
    expect(secondPenyewa!.email).toEqual('jane@example.com');
    expect(secondPenyewa!.nomor_ktp).toEqual('6543210987654321');
    expect(secondPenyewa!.alamat_asal).toEqual('Bandung');
    expect(secondPenyewa!.kamar_id).toEqual(kamarId);
    expect(secondPenyewa!.tgl_masuk).toEqual(new Date('2024-02-01'));
    expect(secondPenyewa!.tgl_keluar).toEqual(new Date('2024-12-31'));
    expect(secondPenyewa!.status).toEqual('Keluar');
    expect(secondPenyewa!.id).toBeDefined();
    expect(secondPenyewa!.created_at).toBeInstanceOf(Date);
  });

  it('should handle database query correctly', async () => {
    // Create kamar first
    const kamarResult = await db.insert(kamarTable)
      .values({
        nomor_kamar: '102',
        harga_sewa: 2000000,
        kapasitas: 1,
        fasilitas: 'AC, WiFi, Lemari',
        status: 'Terisi',
        catatan: null
      })
      .returning()
      .execute();

    // Create penyewa - use string format for date columns
    const penyewaResult = await db.insert(penyewaTable)
      .values({
        nama_lengkap: 'Test User',
        no_telepon: '081111111111',
        email: 'test@example.com',
        nomor_ktp: '1111111111111111',
        alamat_asal: 'Surabaya',
        kamar_id: kamarResult[0].id,
        tgl_masuk: '2024-03-01',
        tgl_keluar: null,
        status: 'Aktif'
      })
      .returning()
      .execute();

    const result = await getPenyewa();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(penyewaResult[0].id);
    expect(result[0].nama_lengkap).toEqual('Test User');
    expect(result[0].kamar_id).toEqual(kamarResult[0].id);
    expect(result[0].tgl_masuk).toEqual(new Date('2024-03-01'));
    expect(result[0].tgl_keluar).toBeNull();
  });
});
