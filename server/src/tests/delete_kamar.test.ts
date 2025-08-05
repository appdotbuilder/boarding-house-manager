
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kamarTable, penyewaTable } from '../db/schema';
import { type DeleteKamarInput } from '../handlers/delete_kamar';
import { deleteKamar } from '../handlers/delete_kamar';
import { eq } from 'drizzle-orm';

describe('deleteKamar', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should delete a kamar successfully', async () => {
        // Create a test kamar first
        const kamarResult = await db.insert(kamarTable)
            .values({
                nomor_kamar: 'K001',
                harga_sewa: 500000,
                kapasitas: 2,
                fasilitas: 'AC, WiFi',
                status: 'Kosong',
                catatan: 'Test kamar'
            })
            .returning()
            .execute();

        const kamarId = kamarResult[0].id;
        const input: DeleteKamarInput = { id: kamarId };

        const result = await deleteKamar(input);

        expect(result.success).toBe(true);

        // Verify kamar is deleted from database
        const deletedKamar = await db.select()
            .from(kamarTable)
            .where(eq(kamarTable.id, kamarId))
            .execute();

        expect(deletedKamar).toHaveLength(0);
    });

    it('should throw error when kamar does not exist', async () => {
        const input: DeleteKamarInput = { id: 999 };

        expect(deleteKamar(input)).rejects.toThrow(/kamar not found/i);
    });

    it('should throw error when kamar has active tenants', async () => {
        // Create a test kamar
        const kamarResult = await db.insert(kamarTable)
            .values({
                nomor_kamar: 'K002',
                harga_sewa: 600000,
                kapasitas: 1,
                fasilitas: 'AC',
                status: 'Terisi',
                catatan: null
            })
            .returning()
            .execute();

        const kamarId = kamarResult[0].id;

        // Create an ACTIVE tenant in this kamar
        await db.insert(penyewaTable)
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
            .execute();

        const input: DeleteKamarInput = { id: kamarId };

        expect(deleteKamar(input)).rejects.toThrow(/cannot delete kamar with active tenants/i);

        // Verify kamar still exists
        const existingKamar = await db.select()
            .from(kamarTable)
            .where(eq(kamarTable.id, kamarId))
            .execute();

        expect(existingKamar).toHaveLength(1);
    });

    it('should delete kamar and cascade delete former tenants', async () => {
        // Create a test kamar
        const kamarResult = await db.insert(kamarTable)
            .values({
                nomor_kamar: 'K003',
                harga_sewa: 700000,
                kapasitas: 2,
                fasilitas: 'AC, WiFi, Kitchen',
                status: 'Kosong',
                catatan: null
            })
            .returning()
            .execute();

        const kamarId = kamarResult[0].id;

        // Create a FORMER tenant (status: 'Keluar')
        const penyewaResult = await db.insert(penyewaTable)
            .values({
                nama_lengkap: 'Jane Smith',
                no_telepon: '081987654321',
                email: 'jane@example.com',
                nomor_ktp: '9876543210987654',
                alamat_asal: 'Bandung',
                kamar_id: kamarId,
                tgl_masuk: '2023-01-01',
                tgl_keluar: '2023-12-31',
                status: 'Keluar'
            })
            .returning()
            .execute();

        const penyewaId = penyewaResult[0].id;
        const input: DeleteKamarInput = { id: kamarId };

        const result = await deleteKamar(input);

        expect(result.success).toBe(true);

        // Verify kamar is deleted
        const deletedKamar = await db.select()
            .from(kamarTable)
            .where(eq(kamarTable.id, kamarId))
            .execute();

        expect(deletedKamar).toHaveLength(0);

        // Verify associated penyewa is also deleted (cascade)
        const deletedPenyewa = await db.select()
            .from(penyewaTable)
            .where(eq(penyewaTable.id, penyewaId))
            .execute();

        expect(deletedPenyewa).toHaveLength(0);
    });
});
