
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kamarTable, penyewaTable, pembayaranTable } from '../db/schema';
import { type UpdatePembayaranInput } from '../schema';
import { updatePembayaran } from '../handlers/update_pembayaran';
import { eq } from 'drizzle-orm';

describe('updatePembayaran', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let kamarId: number;
  let penyewaId: number;
  let pembayaranId: number;

  beforeEach(async () => {
    // Create prerequisite kamar
    const kamar = await db.insert(kamarTable)
      .values({
        nomor_kamar: '101',
        harga_sewa: 1000000,
        kapasitas: 2,
        fasilitas: 'AC, WiFi',
        status: 'Terisi',
        catatan: null
      })
      .returning()
      .execute();
    kamarId = kamar[0].id;

    // Create prerequisite penyewa
    const penyewa = await db.insert(penyewaTable)
      .values({
        nama_lengkap: 'John Doe',
        no_telepon: '08123456789',
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
    penyewaId = penyewa[0].id;

    // Create test pembayaran
    const pembayaran = await db.insert(pembayaranTable)
      .values({
        penyewa_id: penyewaId,
        bulan: 'Januari 2024',
        jumlah: 1000000,
        tanggal_bayar: '2024-01-05',
        metode_bayar: 'Transfer',
        bukti_bayar: 'bukti001.jpg',
        status: 'Belum',
        keterangan: 'Original payment'
      })
      .returning()
      .execute();
    pembayaranId = pembayaran[0].id;
  });

  it('should update pembayaran with all fields', async () => {
    const updateInput: UpdatePembayaranInput = {
      id: pembayaranId,
      penyewa_id: penyewaId,
      bulan: 'Februari 2024',
      jumlah: 1200000,
      tanggal_bayar: new Date('2024-02-05'),
      metode_bayar: 'Tunai',
      bukti_bayar: 'bukti002.jpg',
      status: 'Lunas',
      keterangan: 'Updated payment'
    };

    const result = await updatePembayaran(updateInput);

    expect(result.id).toEqual(pembayaranId);
    expect(result.penyewa_id).toEqual(penyewaId);
    expect(result.bulan).toEqual('Februari 2024');
    expect(result.jumlah).toEqual(1200000);
    expect(result.tanggal_bayar).toEqual(new Date('2024-02-05'));
    expect(result.metode_bayar).toEqual('Tunai');
    expect(result.bukti_bayar).toEqual('bukti002.jpg');
    expect(result.status).toEqual('Lunas');
    expect(result.keterangan).toEqual('Updated payment');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update pembayaran with partial fields', async () => {
    const updateInput: UpdatePembayaranInput = {
      id: pembayaranId,
      status: 'Lunas',
      keterangan: 'Payment completed'
    };

    const result = await updatePembayaran(updateInput);

    expect(result.id).toEqual(pembayaranId);
    expect(result.penyewa_id).toEqual(penyewaId);
    expect(result.bulan).toEqual('Januari 2024'); // Original value
    expect(result.jumlah).toEqual(1000000); // Original value
    expect(result.status).toEqual('Lunas'); // Updated
    expect(result.keterangan).toEqual('Payment completed'); // Updated
  });

  it('should save updated pembayaran to database', async () => {
    const updateInput: UpdatePembayaranInput = {
      id: pembayaranId,
      status: 'Lunas',
      metode_bayar: 'Tunai'
    };

    await updatePembayaran(updateInput);

    const pembayaran = await db.select()
      .from(pembayaranTable)
      .where(eq(pembayaranTable.id, pembayaranId))
      .execute();

    expect(pembayaran).toHaveLength(1);
    expect(pembayaran[0].status).toEqual('Lunas');
    expect(pembayaran[0].metode_bayar).toEqual('Tunai');
    expect(pembayaran[0].bulan).toEqual('Januari 2024'); // Unchanged
  });

  it('should throw error when pembayaran not found', async () => {
    const updateInput: UpdatePembayaranInput = {
      id: 99999,
      status: 'Lunas'
    };

    await expect(updatePembayaran(updateInput)).rejects.toThrow(/pembayaran not found/i);
  });

  it('should throw error when penyewa_id does not exist', async () => {
    const updateInput: UpdatePembayaranInput = {
      id: pembayaranId,
      penyewa_id: 99999
    };

    await expect(updatePembayaran(updateInput)).rejects.toThrow(/penyewa not found/i);
  });

  it('should update nullable fields to null', async () => {
    const updateInput: UpdatePembayaranInput = {
      id: pembayaranId,
      bukti_bayar: null,
      keterangan: null
    };

    const result = await updatePembayaran(updateInput);

    expect(result.bukti_bayar).toBeNull();
    expect(result.keterangan).toBeNull();
    expect(result.bulan).toEqual('Januari 2024'); // Other fields unchanged
  });
});
