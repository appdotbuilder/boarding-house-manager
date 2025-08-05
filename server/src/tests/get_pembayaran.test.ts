
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kamarTable, penyewaTable, pembayaranTable } from '../db/schema';
import { getPembayaran } from '../handlers/get_pembayaran';

describe('getPembayaran', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no pembayaran exist', async () => {
    const result = await getPembayaran();
    expect(result).toEqual([]);
  });

  it('should return all pembayaran records', async () => {
    // Create prerequisite kamar record
    const kamarResult = await db.insert(kamarTable)
      .values({
        nomor_kamar: '101',
        harga_sewa: 500000,
        kapasitas: 2,
        fasilitas: 'AC, WiFi',
        status: 'Terisi',
        catatan: 'Test room'
      })
      .returning()
      .execute();

    // Create prerequisite penyewa record - use string dates for date columns
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

    // Create test pembayaran records - use string dates for date columns
    await db.insert(pembayaranTable)
      .values([
        {
          penyewa_id: penyewaResult[0].id,
          bulan: 'Januari 2024',
          jumlah: 500000,
          tanggal_bayar: '2024-01-01',
          metode_bayar: 'Transfer',
          bukti_bayar: 'transfer_001.jpg',
          status: 'Lunas',
          keterangan: 'Pembayaran tepat waktu'
        },
        {
          penyewa_id: penyewaResult[0].id,
          bulan: 'Februari 2024',
          jumlah: 500000,
          tanggal_bayar: '2024-02-01',
          metode_bayar: 'Tunai',
          bukti_bayar: null,
          status: 'Belum',
          keterangan: null
        }
      ])
      .execute();

    const result = await getPembayaran();

    expect(result).toHaveLength(2);
    
    // Check first payment
    expect(result[0].penyewa_id).toEqual(penyewaResult[0].id);
    expect(result[0].bulan).toEqual('Januari 2024');
    expect(result[0].jumlah).toEqual(500000);
    expect(result[0].tanggal_bayar).toBeInstanceOf(Date);
    expect(result[0].metode_bayar).toEqual('Transfer');
    expect(result[0].bukti_bayar).toEqual('transfer_001.jpg');
    expect(result[0].status).toEqual('Lunas');
    expect(result[0].keterangan).toEqual('Pembayaran tepat waktu');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second payment
    expect(result[1].penyewa_id).toEqual(penyewaResult[0].id);
    expect(result[1].bulan).toEqual('Februari 2024');
    expect(result[1].jumlah).toEqual(500000);
    expect(result[1].metode_bayar).toEqual('Tunai');
    expect(result[1].bukti_bayar).toBeNull();
    expect(result[1].status).toEqual('Belum');
    expect(result[1].keterangan).toBeNull();
  });

  it('should return pembayaran with correct field types', async () => {
    // Create prerequisite records
    const kamarResult = await db.insert(kamarTable)
      .values({
        nomor_kamar: '102',
        harga_sewa: 600000,
        kapasitas: 1,
        fasilitas: 'WiFi',
        status: 'Terisi',
        catatan: null
      })
      .returning()
      .execute();

    const penyewaResult = await db.insert(penyewaTable)
      .values({
        nama_lengkap: 'Jane Smith',
        no_telepon: '087654321098',
        email: 'jane@example.com',
        nomor_ktp: '9876543210987654',
        alamat_asal: 'Bandung',
        kamar_id: kamarResult[0].id,
        tgl_masuk: '2024-01-15',
        tgl_keluar: null,
        status: 'Aktif'
      })
      .returning()
      .execute();

    // Create single pembayaran
    await db.insert(pembayaranTable)
      .values({
        penyewa_id: penyewaResult[0].id,
        bulan: 'Maret 2024',
        jumlah: 600000,
        tanggal_bayar: '2024-03-01',
        metode_bayar: 'Transfer',
        bukti_bayar: 'receipt.pdf',
        status: 'Lunas',
        keterangan: 'Payment complete'
      })
      .execute();

    const result = await getPembayaran();

    expect(result).toHaveLength(1);
    const payment = result[0];

    // Verify field types
    expect(typeof payment.id).toBe('number');
    expect(typeof payment.penyewa_id).toBe('number');
    expect(typeof payment.bulan).toBe('string');
    expect(typeof payment.jumlah).toBe('number');
    expect(payment.tanggal_bayar).toBeInstanceOf(Date);
    expect(typeof payment.metode_bayar).toBe('string');
    expect(typeof payment.bukti_bayar).toBe('string');
    expect(typeof payment.status).toBe('string');
    expect(typeof payment.keterangan).toBe('string');
    expect(payment.created_at).toBeInstanceOf(Date);
  });
});
