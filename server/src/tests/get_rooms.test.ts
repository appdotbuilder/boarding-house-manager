
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kamarTable } from '../db/schema';
import { type CreateKamarInput } from '../schema';
import { getRooms } from '../handlers/get_rooms';

// Test data
const testKamar1: CreateKamarInput = {
  nomor_kamar: '101',
  harga_sewa: 1500000,
  kapasitas: 2,
  fasilitas: 'AC, WiFi, Lemari',
  status: 'Kosong',
  catatan: 'Kamar bersih dan nyaman'
};

const testKamar2: CreateKamarInput = {
  nomor_kamar: '102',
  harga_sewa: 1200000,
  kapasitas: 1,
  fasilitas: 'WiFi, Kasur',
  status: 'Terisi',
  catatan: null
};

describe('getRooms', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no rooms exist', async () => {
    const result = await getRooms();
    expect(result).toEqual([]);
  });

  it('should return all rooms', async () => {
    // Create test rooms
    await db.insert(kamarTable)
      .values([testKamar1, testKamar2])
      .execute();

    const result = await getRooms();

    expect(result).toHaveLength(2);
    
    // Verify first room
    const room1 = result.find(r => r.nomor_kamar === '101');
    expect(room1).toBeDefined();
    expect(room1!.harga_sewa).toEqual(1500000);
    expect(room1!.kapasitas).toEqual(2);
    expect(room1!.fasilitas).toEqual('AC, WiFi, Lemari');
    expect(room1!.status).toEqual('Kosong');
    expect(room1!.catatan).toEqual('Kamar bersih dan nyaman');
    expect(room1!.id).toBeDefined();
    expect(room1!.created_at).toBeInstanceOf(Date);

    // Verify second room
    const room2 = result.find(r => r.nomor_kamar === '102');
    expect(room2).toBeDefined();
    expect(room2!.harga_sewa).toEqual(1200000);
    expect(room2!.kapasitas).toEqual(1);
    expect(room2!.fasilitas).toEqual('WiFi, Kasur');
    expect(room2!.status).toEqual('Terisi');
    expect(room2!.catatan).toBeNull();
    expect(room2!.id).toBeDefined();
    expect(room2!.created_at).toBeInstanceOf(Date);
  });

  it('should return rooms with different status values', async () => {
    // Create rooms with different statuses
    const kosongRoom: CreateKamarInput = {
      ...testKamar1,
      nomor_kamar: '201',
      status: 'Kosong'
    };

    const terisiRoom: CreateKamarInput = {
      ...testKamar2,
      nomor_kamar: '202', 
      status: 'Terisi'
    };

    await db.insert(kamarTable)
      .values([kosongRoom, terisiRoom])
      .execute();

    const result = await getRooms();

    expect(result).toHaveLength(2);
    
    const kosongRooms = result.filter(r => r.status === 'Kosong');
    const terisiRooms = result.filter(r => r.status === 'Terisi');
    
    expect(kosongRooms).toHaveLength(1);
    expect(terisiRooms).toHaveLength(1);
    
    expect(kosongRooms[0].nomor_kamar).toEqual('201');
    expect(terisiRooms[0].nomor_kamar).toEqual('202');
  });

  it('should handle nullable fields correctly', async () => {
    const roomWithNulls: CreateKamarInput = {
      nomor_kamar: '301',
      harga_sewa: 1000000,
      kapasitas: 1,
      fasilitas: null,
      status: 'Kosong',
      catatan: null
    };

    await db.insert(kamarTable)
      .values(roomWithNulls)
      .execute();

    const result = await getRooms();

    expect(result).toHaveLength(1);
    expect(result[0].fasilitas).toBeNull();
    expect(result[0].catatan).toBeNull();
    expect(result[0].nomor_kamar).toEqual('301');
    expect(result[0].harga_sewa).toEqual(1000000);
    expect(result[0].kapasitas).toEqual(1);
    expect(result[0].status).toEqual('Kosong');
  });
});
