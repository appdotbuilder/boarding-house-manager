
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kamarTable, penyewaTable, pembayaranTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getPaymentById } from '../handlers/get_payment_by_id';

const testKamar = {
  nomor_kamar: '101',
  harga_sewa: 1500000,
  kapasitas: 2,
  fasilitas: 'AC, Wi-Fi, Kamar Mandi Dalam',
  status: 'Terisi' as const,
  catatan: 'Kamar dengan pemandangan taman'
};

const testPenyewa = {
  nama_lengkap: 'Ahmad Rizki Pratama',
  no_telepon: '081234567890',
  email: 'ahmad.rizki@email.com',
  nomor_ktp: '3201234567890123',
  alamat_asal: 'Jl. Merdeka No. 45, Jakarta Pusat',
  tgl_masuk: '2024-01-15', // String format for date column
  tgl_keluar: null,
  status: 'Aktif' as const
};

const testPembayaran = {
  bulan: 'Januari 2024',
  jumlah: 1500000,
  tanggal_bayar: '2024-01-31', // String format for date column
  metode_bayar: 'Transfer' as const,
  bukti_bayar: 'transfer_receipt_123.jpg',
  status: 'Lunas' as const,
  keterangan: 'Pembayaran tepat waktu'
};

describe('getPaymentById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return payment when found', async () => {
    // Create prerequisite kamar
    const kamarResults = await db.insert(kamarTable)
      .values(testKamar)
      .returning()
      .execute();

    const kamarId = kamarResults[0].id;

    // Create prerequisite penyewa
    const penyewaResults = await db.insert(penyewaTable)
      .values({
        ...testPenyewa,
        kamar_id: kamarId
      })
      .returning()
      .execute();

    const penyewaId = penyewaResults[0].id;

    // Create test payment
    const pembayaranResults = await db.insert(pembayaranTable)
      .values({
        ...testPembayaran,
        penyewa_id: penyewaId
      })
      .returning()
      .execute();

    const paymentId = pembayaranResults[0].id;

    // Test the handler
    const result = await getPaymentById({ id: paymentId });

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(paymentId);
    expect(result!.penyewa_id).toEqual(penyewaId);
    expect(result!.bulan).toEqual('Januari 2024');
    expect(result!.jumlah).toEqual(1500000);
    expect(result!.tanggal_bayar).toBeInstanceOf(Date);
    expect(result!.metode_bayar).toEqual('Transfer');
    expect(result!.bukti_bayar).toEqual('transfer_receipt_123.jpg');
    expect(result!.status).toEqual('Lunas');
    expect(result!.keterangan).toEqual('Pembayaran tepat waktu');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when payment not found', async () => {
    const result = await getPaymentById({ id: 999 });

    expect(result).toBeNull();
  });

  it('should verify payment exists in database', async () => {
    // Create prerequisite kamar
    const kamarResults = await db.insert(kamarTable)
      .values(testKamar)
      .returning()
      .execute();

    const kamarId = kamarResults[0].id;

    // Create prerequisite penyewa
    const penyewaResults = await db.insert(penyewaTable)
      .values({
        ...testPenyewa,
        kamar_id: kamarId
      })
      .returning()
      .execute();

    const penyewaId = penyewaResults[0].id;

    // Create test payment
    const pembayaranResults = await db.insert(pembayaranTable)
      .values({
        ...testPembayaran,
        penyewa_id: penyewaId
      })
      .returning()
      .execute();

    const paymentId = pembayaranResults[0].id;

    // Verify payment exists in database
    const dbResults = await db.select()
      .from(pembayaranTable)
      .where(eq(pembayaranTable.id, paymentId))
      .execute();

    expect(dbResults).toHaveLength(1);
    expect(dbResults[0].bulan).toEqual('Januari 2024');
    expect(dbResults[0].jumlah).toEqual(1500000);
    expect(dbResults[0].metode_bayar).toEqual('Transfer');
    expect(dbResults[0].status).toEqual('Lunas');
  });
});
