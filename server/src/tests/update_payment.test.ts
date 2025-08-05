
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kamarTable, penyewaTable, pembayaranTable } from '../db/schema';
import { type UpdatePembayaranInput } from '../schema';
import { updatePembayaran } from '../handlers/update_payment';
import { eq } from 'drizzle-orm';

describe('updatePembayaran', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testKamarId: number;
  let testPenyewaId: number;
  let testPembayaranId: number;

  beforeEach(async () => {
    // Create test kamar first
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
    testKamarId = kamarResult[0].id;

    // Create test penyewa with proper date string format
    const penyewaResult = await db.insert(penyewaTable)
      .values({
        nama_lengkap: 'John Doe',
        no_telepon: '081234567890',
        email: 'john@example.com',
        nomor_ktp: '1234567890123456',
        alamat_asal: 'Jakarta',
        kamar_id: testKamarId,
        tgl_masuk: '2024-01-01',
        tgl_keluar: null,
        status: 'Aktif'
      })
      .returning()
      .execute();
    testPenyewaId = penyewaResult[0].id;

    // Create test pembayaran with proper date string format
    const pembayaranResult = await db.insert(pembayaranTable)
      .values({
        penyewa_id: testPenyewaId,
        bulan: 'Januari 2024',
        jumlah: 1000000,
        tanggal_bayar: '2024-01-01',
        metode_bayar: 'Transfer',
        bukti_bayar: 'bukti001.jpg',
        status: 'Belum',
        keterangan: 'Pembayaran bulan Januari'
      })
      .returning()
      .execute();
    testPembayaranId = pembayaranResult[0].id;
  });

  it('should update pembayaran status', async () => {
    const input: UpdatePembayaranInput = {
      id: testPembayaranId,
      status: 'Lunas'
    };

    const result = await updatePembayaran(input);

    expect(result.id).toEqual(testPembayaranId);
    expect(result.status).toEqual('Lunas');
    expect(result.penyewa_id).toEqual(testPenyewaId);
    expect(result.bulan).toEqual('Januari 2024');
    expect(result.jumlah).toEqual(1000000);
  });

  it('should update multiple fields', async () => {
    const input: UpdatePembayaranInput = {
      id: testPembayaranId,
      jumlah: 1200000,
      metode_bayar: 'Tunai',
      status: 'Lunas',
      keterangan: 'Updated payment'
    };

    const result = await updatePembayaran(input);

    expect(result.jumlah).toEqual(1200000);
    expect(result.metode_bayar).toEqual('Tunai');
    expect(result.status).toEqual('Lunas');
    expect(result.keterangan).toEqual('Updated payment');
  });

  it('should save updated pembayaran to database', async () => {
    const input: UpdatePembayaranInput = {
      id: testPembayaranId,
      status: 'Lunas',
      bukti_bayar: 'bukti_updated.jpg'
    };

    await updatePembayaran(input);

    const pembayaran = await db.select()
      .from(pembayaranTable)
      .where(eq(pembayaranTable.id, testPembayaranId))
      .execute();

    expect(pembayaran).toHaveLength(1);
    expect(pembayaran[0].status).toEqual('Lunas');
    expect(pembayaran[0].bukti_bayar).toEqual('bukti_updated.jpg');
  });

  it('should throw error when pembayaran not found', async () => {
    const input: UpdatePembayaranInput = {
      id: 99999,
      status: 'Lunas'
    };

    expect(updatePembayaran(input)).rejects.toThrow(/Pembayaran not found/i);
  });

  it('should throw error when penyewa_id does not exist', async () => {
    const input: UpdatePembayaranInput = {
      id: testPembayaranId,
      penyewa_id: 99999
    };

    expect(updatePembayaran(input)).rejects.toThrow(/Penyewa not found/i);
  });

  it('should update with nullable fields', async () => {
    const input: UpdatePembayaranInput = {
      id: testPembayaranId,
      bukti_bayar: null,
      keterangan: null
    };

    const result = await updatePembayaran(input);

    expect(result.bukti_bayar).toBeNull();
    expect(result.keterangan).toBeNull();
  });

  it('should update tanggal_bayar field', async () => {
    const newDate = new Date('2024-02-01');
    const input: UpdatePembayaranInput = {
      id: testPembayaranId,
      tanggal_bayar: newDate
    };

    const result = await updatePembayaran(input);

    expect(result.tanggal_bayar).toBeInstanceOf(Date);
    expect(result.tanggal_bayar.toISOString().split('T')[0]).toEqual('2024-02-01');
  });
});
