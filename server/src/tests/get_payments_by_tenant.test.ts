
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kamarTable, penyewaTable, pembayaranTable } from '../db/schema';
import { getPaymentsByTenant, type GetPaymentsByTenantInput } from '../handlers/get_payments_by_tenant';

describe('getPaymentsByTenant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return payments for a specific tenant', async () => {
    // Create prerequisite kamar
    const kamarResult = await db.insert(kamarTable)
      .values({
        nomor_kamar: '101',
        harga_sewa: 1000000,
        kapasitas: 2,
        fasilitas: 'AC, WiFi',
        status: 'Terisi',
        catatan: 'Test room'
      })
      .returning()
      .execute();

    const kamarId = kamarResult[0].id;

    // Create prerequisite penyewa
    const penyewaResult = await db.insert(penyewaTable)
      .values({
        nama_lengkap: 'John Doe',
        no_telepon: '081234567890',
        email: 'john@example.com',
        nomor_ktp: '1234567890123456',
        alamat_asal: 'Jakarta',
        kamar_id: kamarId,
        tgl_masuk: '2024-01-01',
        tgl_keluar: null,
        status: 'Aktif'
      })
      .returning()
      .execute();

    const penyewaId = penyewaResult[0].id;

    // Create test payments
    await db.insert(pembayaranTable)
      .values([
        {
          penyewa_id: penyewaId,
          bulan: 'Januari 2024',
          jumlah: 1000000,
          tanggal_bayar: '2024-01-05',
          metode_bayar: 'Transfer',
          bukti_bayar: 'transfer_receipt_1.jpg',
          status: 'Lunas',
          keterangan: 'Pembayaran tepat waktu'
        },
        {
          penyewa_id: penyewaId,
          bulan: 'Februari 2024',
          jumlah: 1000000,
          tanggal_bayar: '2024-02-03',
          metode_bayar: 'Tunai',
          bukti_bayar: null,
          status: 'Lunas',
          keterangan: null
        }
      ])
      .execute();

    const input: GetPaymentsByTenantInput = {
      penyewa_id: penyewaId
    };

    const result = await getPaymentsByTenant(input);

    expect(result).toHaveLength(2);
    
    // Check first payment (should be ordered by tanggal_bayar desc)
    expect(result[0].penyewa_id).toEqual(penyewaId);
    expect(result[0].bulan).toEqual('Februari 2024');
    expect(result[0].jumlah).toEqual(1000000);
    expect(result[0].tanggal_bayar).toBeInstanceOf(Date);
    expect(result[0].metode_bayar).toEqual('Tunai');
    expect(result[0].bukti_bayar).toBeNull();
    expect(result[0].status).toEqual('Lunas');
    expect(result[0].keterangan).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second payment
    expect(result[1].penyewa_id).toEqual(penyewaId);
    expect(result[1].bulan).toEqual('Januari 2024');
    expect(result[1].jumlah).toEqual(1000000);
    expect(result[1].metode_bayar).toEqual('Transfer');
    expect(result[1].bukti_bayar).toEqual('transfer_receipt_1.jpg');
    expect(result[1].status).toEqual('Lunas');
    expect(result[1].keterangan).toEqual('Pembayaran tepat waktu');
  });

  it('should return empty array for tenant with no payments', async () => {
    // Create prerequisite kamar
    const kamarResult = await db.insert(kamarTable)
      .values({
        nomor_kamar: '102',
        harga_sewa: 800000,
        kapasitas: 1,
        fasilitas: 'WiFi',
        status: 'Terisi',
        catatan: null
      })
      .returning()
      .execute();

    const kamarId = kamarResult[0].id;

    // Create penyewa with no payments
    const penyewaResult = await db.insert(penyewaTable)
      .values({
        nama_lengkap: 'Jane Smith',
        no_telepon: '087654321098',
        email: 'jane@example.com',
        nomor_ktp: '9876543210987654',
        alamat_asal: 'Bandung',
        kamar_id: kamarId,
        tgl_masuk: '2024-03-01',
        tgl_keluar: null,
        status: 'Aktif'
      })
      .returning()
      .execute();

    const penyewaId = penyewaResult[0].id;

    const input: GetPaymentsByTenantInput = {
      penyewa_id: penyewaId
    };

    const result = await getPaymentsByTenant(input);

    expect(result).toHaveLength(0);
  });

  it('should order payments by tanggal_bayar in descending order', async () => {
    // Create prerequisite kamar
    const kamarResult = await db.insert(kamarTable)
      .values({
        nomor_kamar: '103',
        harga_sewa: 1200000,
        kapasitas: 3,
        fasilitas: 'AC, WiFi, TV',
        status: 'Terisi',
        catatan: 'Premium room'
      })
      .returning()
      .execute();

    const kamarId = kamarResult[0].id;

    // Create prerequisite penyewa
    const penyewaResult = await db.insert(penyewaTable)
      .values({
        nama_lengkap: 'Bob Wilson',
        no_telepon: '085123456789',
        email: 'bob@example.com',
        nomor_ktp: '5555666677778888',
        alamat_asal: 'Surabaya',
        kamar_id: kamarId,
        tgl_masuk: '2023-12-01',
        tgl_keluar: null,
        status: 'Aktif'
      })
      .returning()
      .execute();

    const penyewaId = penyewaResult[0].id;

    // Create payments with different dates
    await db.insert(pembayaranTable)
      .values([
        {
          penyewa_id: penyewaId,
          bulan: 'Desember 2023',
          jumlah: 1200000,
          tanggal_bayar: '2023-12-05',
          metode_bayar: 'Transfer',
          bukti_bayar: 'dec_receipt.jpg',
          status: 'Lunas',
          keterangan: 'First payment'
        },
        {
          penyewa_id: penyewaId,
          bulan: 'Februari 2024',
          jumlah: 1200000,
          tanggal_bayar: '2024-02-10',
          metode_bayar: 'Tunai',
          bukti_bayar: null,
          status: 'Lunas',
          keterangan: 'Latest payment'
        },
        {
          penyewa_id: penyewaId,
          bulan: 'Januari 2024',
          jumlah: 1200000,
          tanggal_bayar: '2024-01-08',
          metode_bayar: 'Transfer',
          bukti_bayar: 'jan_receipt.jpg',
          status: 'Lunas',
          keterangan: 'Middle payment'
        }
      ])
      .execute();

    const input: GetPaymentsByTenantInput = {
      penyewa_id: penyewaId
    };

    const result = await getPaymentsByTenant(input);

    expect(result).toHaveLength(3);

    // Verify descending order by tanggal_bayar
    expect(result[0].bulan).toEqual('Februari 2024'); // Latest date
    expect(result[1].bulan).toEqual('Januari 2024');  // Middle date
    expect(result[2].bulan).toEqual('Desember 2023'); // Earliest date

    // Verify dates are in descending order
    expect(result[0].tanggal_bayar.getTime()).toBeGreaterThan(result[1].tanggal_bayar.getTime());
    expect(result[1].tanggal_bayar.getTime()).toBeGreaterThan(result[2].tanggal_bayar.getTime());
  });
});
