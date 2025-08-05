
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kamarTable } from '../db/schema';
import { getKamar } from '../handlers/get_kamar';

describe('getKamar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no kamar exist', async () => {
    const result = await getKamar();
    expect(result).toEqual([]);
  });

  it('should return all kamar from database', async () => {
    // Create test kamar
    await db.insert(kamarTable).values([
      {
        nomor_kamar: '101',
        harga_sewa: 500000,
        kapasitas: 2,
        fasilitas: 'AC, Wifi, Kamar Mandi Dalam',
        status: 'Kosong',
        catatan: 'Kamar lantai 1'
      },
      {
        nomor_kamar: '102',
        harga_sewa: 600000,
        kapasitas: 1,
        fasilitas: 'AC, Wifi',
        status: 'Terisi',
        catatan: null
      },
      {
        nomor_kamar: '201',
        harga_sewa: 750000,
        kapasitas: 3,
        fasilitas: null,
        status: 'Kosong',
        catatan: 'Kamar lantai 2'
      }
    ]).execute();

    const result = await getKamar();

    expect(result).toHaveLength(3);
    
    // Verify first kamar
    const kamar1 = result.find(k => k.nomor_kamar === '101');
    expect(kamar1).toBeDefined();
    expect(kamar1!.harga_sewa).toEqual(500000);
    expect(kamar1!.kapasitas).toEqual(2);
    expect(kamar1!.fasilitas).toEqual('AC, Wifi, Kamar Mandi Dalam');
    expect(kamar1!.status).toEqual('Kosong');
    expect(kamar1!.catatan).toEqual('Kamar lantai 1');
    expect(kamar1!.id).toBeDefined();
    expect(kamar1!.created_at).toBeInstanceOf(Date);

    // Verify second kamar
    const kamar2 = result.find(k => k.nomor_kamar === '102');
    expect(kamar2).toBeDefined();
    expect(kamar2!.harga_sewa).toEqual(600000);
    expect(kamar2!.kapasitas).toEqual(1);
    expect(kamar2!.fasilitas).toEqual('AC, Wifi');
    expect(kamar2!.status).toEqual('Terisi');
    expect(kamar2!.catatan).toBeNull();

    // Verify third kamar
    const kamar3 = result.find(k => k.nomor_kamar === '201');
    expect(kamar3).toBeDefined();
    expect(kamar3!.harga_sewa).toEqual(750000);
    expect(kamar3!.kapasitas).toEqual(3);
    expect(kamar3!.fasilitas).toBeNull();
    expect(kamar3!.status).toEqual('Kosong');
    expect(kamar3!.catatan).toEqual('Kamar lantai 2');
  });

  it('should return kamar with different status values', async () => {
    // Create kamar with different status
    await db.insert(kamarTable).values([
      {
        nomor_kamar: 'A1',
        harga_sewa: 400000,
        kapasitas: 1,
        fasilitas: 'Basic',
        status: 'Kosong',
        catatan: null
      },
      {
        nomor_kamar: 'A2',
        harga_sewa: 450000,
        kapasitas: 1,
        fasilitas: 'Basic',
        status: 'Terisi',
        catatan: null
      }
    ]).execute();

    const result = await getKamar();

    expect(result).toHaveLength(2);
    
    const kosongKamar = result.find(k => k.status === 'Kosong');
    const terisiKamar = result.find(k => k.status === 'Terisi');
    
    expect(kosongKamar).toBeDefined();
    expect(terisiKamar).toBeDefined();
    expect(kosongKamar!.nomor_kamar).toEqual('A1');
    expect(terisiKamar!.nomor_kamar).toEqual('A2');
  });

  it('should handle nullable fields correctly', async () => {
    // Create kamar with null values for optional fields
    await db.insert(kamarTable).values({
      nomor_kamar: 'NULL_TEST',
      harga_sewa: 300000,
      kapasitas: 1,
      fasilitas: null,
      status: 'Kosong',
      catatan: null
    }).execute();

    const result = await getKamar();

    expect(result).toHaveLength(1);
    expect(result[0].fasilitas).toBeNull();
    expect(result[0].catatan).toBeNull();
    expect(result[0].nomor_kamar).toEqual('NULL_TEST');
    expect(result[0].harga_sewa).toEqual(300000);
    expect(result[0].status).toEqual('Kosong');
  });
});
