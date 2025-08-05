
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pembayaranTable, penyewaTable, kamarTable } from '../db/schema';
import { type CreatePembayaranInput } from '../schema';
import { createPayment } from '../handlers/create_payment';
import { eq } from 'drizzle-orm';

describe('createPayment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testPenyewaId: number;

  beforeEach(async () => {
    // Create prerequisite kamar (room) first
    const kamarResult = await db.insert(kamarTable)
      .values({
        nomor_kamar: '101',
        harga_sewa: 1500000,
        kapasitas: 2,
        fasilitas: 'AC, Wifi, Kamar Mandi Dalam',
        status: 'Terisi',
        catatan: 'Kamar untuk testing'
      })
      .returning()
      .execute();

    // Create prerequisite penyewa (tenant) - convert dates to strings for database
    const penyewaResult = await db.insert(penyewaTable)
      .values({
        nama_lengkap: 'John Doe',
        no_telepon: '081234567890',
        email: 'john.doe@example.com',
        nomor_ktp: '3201234567890001',
        alamat_asal: 'Jakarta Selatan',
        kamar_id: kamarResult[0].id,
        tgl_masuk: '2024-01-01', // String format for date column
        tgl_keluar: null,
        status: 'Aktif'
      })
      .returning()
      .execute();

    testPenyewaId = penyewaResult[0].id;
  });

  const testInput: CreatePembayaranInput = {
    penyewa_id: 0, // Will be set in each test
    bulan: 'Januari 2024',
    jumlah: 1500000,
    tanggal_bayar: new Date('2024-01-05'),
    metode_bayar: 'Transfer',
    bukti_bayar: 'TRX123456789',
    status: 'Lunas',
    keterangan: 'Pembayaran sewa bulan Januari'
  };

  it('should create a payment', async () => {
    const input = { ...testInput, penyewa_id: testPenyewaId };
    const result = await createPayment(input);

    // Basic field validation
    expect(result.penyewa_id).toEqual(testPenyewaId);
    expect(result.bulan).toEqual('Januari 2024');
    expect(result.jumlah).toEqual(1500000);
    expect(result.tanggal_bayar).toEqual(new Date('2024-01-05'));
    expect(result.metode_bayar).toEqual('Transfer');
    expect(result.bukti_bayar).toEqual('TRX123456789');
    expect(result.status).toEqual('Lunas');
    expect(result.keterangan).toEqual('Pembayaran sewa bulan Januari');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save payment to database', async () => {
    const input = { ...testInput, penyewa_id: testPenyewaId };
    const result = await createPayment(input);

    // Query database to verify payment was saved
    const payments = await db.select()
      .from(pembayaranTable)
      .where(eq(pembayaranTable.id, result.id))
      .execute();

    expect(payments).toHaveLength(1);
    expect(payments[0].penyewa_id).toEqual(testPenyewaId);
    expect(payments[0].bulan).toEqual('Januari 2024');
    expect(payments[0].jumlah).toEqual(1500000);
    expect(payments[0].tanggal_bayar).toEqual('2024-01-05'); // Database stores as string
    expect(payments[0].metode_bayar).toEqual('Transfer');
    expect(payments[0].bukti_bayar).toEqual('TRX123456789');
    expect(payments[0].status).toEqual('Lunas');
    expect(payments[0].keterangan).toEqual('Pembayaran sewa bulan Januari');
    expect(payments[0].created_at).toBeInstanceOf(Date);
  });

  it('should create payment with cash method', async () => {
    const input: CreatePembayaranInput = {
      ...testInput,
      penyewa_id: testPenyewaId,
      metode_bayar: 'Tunai',
      bukti_bayar: null,
      status: 'Belum'
    };

    const result = await createPayment(input);

    expect(result.metode_bayar).toEqual('Tunai');
    expect(result.bukti_bayar).toBeNull();
    expect(result.status).toEqual('Belum');
  });

  it('should create payment with minimal required fields', async () => {
    const input: CreatePembayaranInput = {
      penyewa_id: testPenyewaId,
      bulan: 'Februari 2024',
      jumlah: 1500000,
      tanggal_bayar: new Date('2024-02-05'),
      metode_bayar: 'Transfer',
      bukti_bayar: null,
      status: 'Lunas',
      keterangan: null
    };

    const result = await createPayment(input);

    expect(result.penyewa_id).toEqual(testPenyewaId);
    expect(result.bulan).toEqual('Februari 2024');
    expect(result.jumlah).toEqual(1500000);
    expect(result.bukti_bayar).toBeNull();
    expect(result.keterangan).toBeNull();
  });

  it('should throw error when penyewa does not exist', async () => {
    const input = { ...testInput, penyewa_id: 99999 };

    await expect(createPayment(input)).rejects.toThrow(/Penyewa with id 99999 not found/i);
  });
});
