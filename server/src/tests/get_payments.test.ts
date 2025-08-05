
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kamarTable, penyewaTable, pembayaranTable } from '../db/schema';
import { getPayments } from '../handlers/get_payments';

describe('getPayments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no payments exist', async () => {
    const result = await getPayments();
    expect(result).toEqual([]);
  });

  it('should return all payments', async () => {
    // Create prerequisite data - kamar first
    const kamarResult = await db.insert(kamarTable)
      .values({
        nomor_kamar: '101',
        harga_sewa: 500000,
        kapasitas: 2,
        fasilitas: 'AC, WiFi',
        status: 'Kosong',
        catatan: 'Kamar test'
      })
      .returning()
      .execute();

    // Create penyewa with proper date string format
    const penyewaResult = await db.insert(penyewaTable)
      .values({
        nama_lengkap: 'John Doe',
        no_telepon: '08123456789',
        email: 'john@example.com',
        nomor_ktp: '1234567890123456',
        alamat_asal: 'Jakarta',
        kamar_id: kamarResult[0].id,
        tgl_masuk: '2024-01-01', // Use string format
        tgl_keluar: null,
        status: 'Aktif'
      })
      .returning()
      .execute();

    // Create payment with proper date string format
    await db.insert(pembayaranTable)
      .values({
        penyewa_id: penyewaResult[0].id,
        bulan: 'Januari 2024',
        jumlah: 500000,
        tanggal_bayar: '2024-01-05', // Use string format
        metode_bayar: 'Transfer',
        bukti_bayar: 'transfer_receipt_001.jpg',
        status: 'Lunas',
        keterangan: 'Pembayaran tepat waktu'
      })
      .execute();

    const result = await getPayments();

    expect(result).toHaveLength(1);
    expect(result[0].bulan).toEqual('Januari 2024');
    expect(result[0].jumlah).toEqual(500000);
    expect(result[0].metode_bayar).toEqual('Transfer');
    expect(result[0].status).toEqual('Lunas');
    expect(result[0].bukti_bayar).toEqual('transfer_receipt_001.jpg');
    expect(result[0].keterangan).toEqual('Pembayaran tepat waktu');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].tanggal_bayar).toBeInstanceOf(Date);
    expect(result[0].tanggal_bayar.getFullYear()).toEqual(2024);
    expect(result[0].tanggal_bayar.getMonth()).toEqual(0); // January is 0
    expect(result[0].tanggal_bayar.getDate()).toEqual(5);
  });

  it('should return multiple payments', async () => {
    // Create prerequisite data
    const kamarResult = await db.insert(kamarTable)
      .values({
        nomor_kamar: '101',
        harga_sewa: 500000,
        kapasitas: 2,
        fasilitas: 'AC, WiFi',
        status: 'Kosong',
        catatan: 'Kamar test'
      })
      .returning()
      .execute();

    const penyewaResult = await db.insert(penyewaTable)
      .values({
        nama_lengkap: 'John Doe',
        no_telepon: '08123456789',
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

    // Create multiple payments with different enum values
    await db.insert(pembayaranTable)
      .values([
        {
          penyewa_id: penyewaResult[0].id,
          bulan: 'Januari 2024',
          jumlah: 500000,
          tanggal_bayar: '2024-01-05',
          metode_bayar: 'Transfer',
          bukti_bayar: 'transfer_receipt_001.jpg',
          status: 'Lunas',
          keterangan: 'Pembayaran tepat waktu'
        },
        {
          penyewa_id: penyewaResult[0].id,
          bulan: 'Februari 2024',
          jumlah: 500000,
          tanggal_bayar: '2024-02-05',
          metode_bayar: 'Tunai',
          bukti_bayar: null,
          status: 'Belum',
          keterangan: null
        }
      ])
      .execute();

    const result = await getPayments();

    expect(result).toHaveLength(2);
    
    // Check that both payments are returned
    const bulans = result.map(p => p.bulan);
    expect(bulans).toContain('Januari 2024');
    expect(bulans).toContain('Februari 2024');

    // Check different enum values
    const metodes = result.map(p => p.metode_bayar);
    expect(metodes).toContain('Transfer');
    expect(metodes).toContain('Tunai');

    const statuses = result.map(p => p.status);
    expect(statuses).toContain('Lunas');
    expect(statuses).toContain('Belum');

    // Verify date conversion works for all records
    result.forEach(payment => {
      expect(payment.tanggal_bayar).toBeInstanceOf(Date);
      expect(payment.created_at).toBeInstanceOf(Date);
    });
  });
});
