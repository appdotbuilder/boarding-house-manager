
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pembayaranTable, penyewaTable, kamarTable } from '../db/schema';
import { type CreatePembayaranInput } from '../schema';
import { createPembayaran } from '../handlers/create_pembayaran';
import { eq } from 'drizzle-orm';

describe('createPembayaran', () => {
  let testPenyewaId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test kamar first
    const kamarResult = await db.insert(kamarTable)
      .values({
        nomor_kamar: '101',
        harga_sewa: 1000000,
        kapasitas: 2,
        fasilitas: 'AC, WiFi',
        status: 'Terisi',
        catatan: 'Test kamar'
      })
      .returning()
      .execute();

    // Create a test penyewa - convert Date to string for date columns
    const penyewaResult = await db.insert(penyewaTable)
      .values({
        nama_lengkap: 'John Doe',
        no_telepon: '081234567890',
        email: 'john@example.com',
        nomor_ktp: '1234567890123456',
        alamat_asal: 'Jakarta',
        kamar_id: kamarResult[0].id,
        tgl_masuk: '2024-01-01',
        tgl_keluar: null,
        status: 'Aktif'
      })
      .returning()
      .execute();

    testPenyewaId = penyewaResult[0].id;
  });

  afterEach(resetDB);

  const testInput: CreatePembayaranInput = {
    penyewa_id: 0, // Will be set in tests
    bulan: 'Januari 2024',
    jumlah: 1000000,
    tanggal_bayar: new Date('2024-01-15'),
    metode_bayar: 'Transfer',
    bukti_bayar: 'bukti_transfer_001.jpg',
    status: 'Lunas',
    keterangan: 'Pembayaran bulan Januari'
  };

  it('should create a pembayaran', async () => {
    const input = { ...testInput, penyewa_id: testPenyewaId };
    const result = await createPembayaran(input);

    // Basic field validation
    expect(result.penyewa_id).toEqual(testPenyewaId);
    expect(result.bulan).toEqual('Januari 2024');
    expect(result.jumlah).toEqual(1000000);
    expect(result.tanggal_bayar).toBeInstanceOf(Date);
    expect(result.tanggal_bayar.toISOString().split('T')[0]).toEqual('2024-01-15');
    expect(result.metode_bayar).toEqual('Transfer');
    expect(result.bukti_bayar).toEqual('bukti_transfer_001.jpg');
    expect(result.status).toEqual('Lunas');
    expect(result.keterangan).toEqual('Pembayaran bulan Januari');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save pembayaran to database', async () => {
    const input = { ...testInput, penyewa_id: testPenyewaId };
    const result = await createPembayaran(input);

    // Query using proper drizzle syntax
    const pembayarans = await db.select()
      .from(pembayaranTable)
      .where(eq(pembayaranTable.id, result.id))
      .execute();

    expect(pembayarans).toHaveLength(1);
    expect(pembayarans[0].penyewa_id).toEqual(testPenyewaId);
    expect(pembayarans[0].bulan).toEqual('Januari 2024');
    expect(pembayarans[0].jumlah).toEqual(1000000);
    expect(pembayarans[0].metode_bayar).toEqual('Transfer');
    expect(pembayarans[0].status).toEqual('Lunas');
    expect(pembayarans[0].tanggal_bayar).toEqual('2024-01-15'); // String in database
    expect(pembayarans[0].created_at).toBeInstanceOf(Date);
  });

  it('should create pembayaran with minimal required fields', async () => {
    const minimalInput: CreatePembayaranInput = {
      penyewa_id: testPenyewaId,
      bulan: 'Februari 2024',
      jumlah: 1000000,
      tanggal_bayar: new Date('2024-02-15'),
      metode_bayar: 'Tunai',
      bukti_bayar: null,
      status: 'Belum',
      keterangan: null
    };

    const result = await createPembayaran(minimalInput);

    expect(result.penyewa_id).toEqual(testPenyewaId);
    expect(result.bulan).toEqual('Februari 2024');
    expect(result.jumlah).toEqual(1000000);
    expect(result.metode_bayar).toEqual('Tunai');
    expect(result.bukti_bayar).toBeNull();
    expect(result.status).toEqual('Belum');
    expect(result.keterangan).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should handle different metode_bayar values', async () => {
    const transferInput = { ...testInput, penyewa_id: testPenyewaId, metode_bayar: 'Transfer' as const };
    const tunaiInput = { ...testInput, penyewa_id: testPenyewaId, metode_bayar: 'Tunai' as const, bulan: 'Maret 2024' };

    const transferResult = await createPembayaran(transferInput);
    const tunaiResult = await createPembayaran(tunaiInput);

    expect(transferResult.metode_bayar).toEqual('Transfer');
    expect(tunaiResult.metode_bayar).toEqual('Tunai');
  });

  it('should handle different status values', async () => {
    const lunasInput = { ...testInput, penyewa_id: testPenyewaId, status: 'Lunas' as const };
    const belumInput = { ...testInput, penyewa_id: testPenyewaId, status: 'Belum' as const, bulan: 'April 2024' };

    const lunasResult = await createPembayaran(lunasInput);
    const belumResult = await createPembayaran(belumInput);

    expect(lunasResult.status).toEqual('Lunas');
    expect(belumResult.status).toEqual('Belum');
  });

  it('should throw error when penyewa_id does not exist', async () => {
    const input = { ...testInput, penyewa_id: 99999 };

    await expect(createPembayaran(input)).rejects.toThrow(/penyewa with id 99999 not found/i);
  });

  it('should handle date fields correctly', async () => {
    const input = { ...testInput, penyewa_id: testPenyewaId };
    const result = await createPembayaran(input);

    // Verify date handling
    expect(result.tanggal_bayar).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Verify the date value is correct
    const expectedDate = new Date('2024-01-15');
    expect(result.tanggal_bayar.getTime()).toEqual(expectedDate.getTime());
  });
});
