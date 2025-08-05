
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kamarTable, penyewaTable, pembayaranTable } from '../db/schema';
import { type DeletePembayaranInput } from '../handlers/delete_pembayaran';
import { deletePembayaran } from '../handlers/delete_pembayaran';
import { eq } from 'drizzle-orm';

describe('deletePembayaran', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should delete a payment successfully', async () => {
        // Create prerequisite data
        const kamarResult = await db.insert(kamarTable)
            .values({
                nomor_kamar: 'K001',
                harga_sewa: 500000,
                kapasitas: 2,
                fasilitas: 'AC, WiFi',
                status: 'Terisi',
                catatan: 'Kamar bagus'
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

        const pembayaranResult = await db.insert(pembayaranTable)
            .values({
                penyewa_id: penyewaResult[0].id,
                bulan: 'Januari 2024',
                jumlah: 500000,
                tanggal_bayar: '2024-01-05',
                metode_bayar: 'Transfer',
                bukti_bayar: 'transfer_001.jpg',
                status: 'Lunas',
                keterangan: 'Pembayaran bulanan'
            })
            .returning()
            .execute();

        const testInput: DeletePembayaranInput = {
            id: pembayaranResult[0].id
        };

        // Delete the payment
        const result = await deletePembayaran(testInput);

        // Verify deletion was successful
        expect(result.success).toBe(true);

        // Verify payment no longer exists in database
        const deletedPayments = await db.select()
            .from(pembayaranTable)
            .where(eq(pembayaranTable.id, pembayaranResult[0].id))
            .execute();

        expect(deletedPayments).toHaveLength(0);
    });

    it('should return false when payment does not exist', async () => {
        const testInput: DeletePembayaranInput = {
            id: 999 // Non-existent ID
        };

        const result = await deletePembayaran(testInput);

        expect(result.success).toBe(false);
    });

    it('should not affect other payments when deleting one', async () => {
        // Create prerequisite data
        const kamarResult = await db.insert(kamarTable)
            .values({
                nomor_kamar: 'K001',
                harga_sewa: 500000,
                kapasitas: 2,
                fasilitas: 'AC, WiFi',
                status: 'Terisi',
                catatan: 'Kamar bagus'
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

        // Create two payments
        const payment1Result = await db.insert(pembayaranTable)
            .values({
                penyewa_id: penyewaResult[0].id,
                bulan: 'Januari 2024',
                jumlah: 500000,
                tanggal_bayar: '2024-01-05',
                metode_bayar: 'Transfer',
                bukti_bayar: 'transfer_001.jpg',
                status: 'Lunas',
                keterangan: 'Pembayaran bulanan'
            })
            .returning()
            .execute();

        const payment2Result = await db.insert(pembayaranTable)
            .values({
                penyewa_id: penyewaResult[0].id,
                bulan: 'Februari 2024',
                jumlah: 500000,
                tanggal_bayar: '2024-02-05',
                metode_bayar: 'Tunai',
                bukti_bayar: null,
                status: 'Lunas',
                keterangan: 'Pembayaran bulanan'
            })
            .returning()
            .execute();

        const testInput: DeletePembayaranInput = {
            id: payment1Result[0].id
        };

        // Delete first payment
        const result = await deletePembayaran(testInput);

        expect(result.success).toBe(true);

        // Verify first payment is deleted
        const deletedPayments = await db.select()
            .from(pembayaranTable)
            .where(eq(pembayaranTable.id, payment1Result[0].id))
            .execute();

        expect(deletedPayments).toHaveLength(0);

        // Verify second payment still exists
        const remainingPayments = await db.select()
            .from(pembayaranTable)
            .where(eq(pembayaranTable.id, payment2Result[0].id))
            .execute();

        expect(remainingPayments).toHaveLength(1);
        expect(remainingPayments[0].bulan).toEqual('Februari 2024');
    });
});
