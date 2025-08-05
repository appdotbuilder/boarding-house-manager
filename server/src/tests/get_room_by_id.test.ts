
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kamarTable } from '../db/schema';
import { getRoomById } from '../handlers/get_room_by_id';

// Test input type
type GetRoomByIdInput = {
  id: number;
};

// Test data for creating a room
const testKamarData = {
  nomor_kamar: '101',
  harga_sewa: 500000,
  kapasitas: 2,
  fasilitas: 'AC, Wifi, Kasur',
  status: 'Kosong' as const,
  catatan: 'Kamar di lantai 1'
};

describe('getRoomById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return room when found', async () => {
    // Create a test room first
    const insertResult = await db.insert(kamarTable)
      .values(testKamarData)
      .returning()
      .execute();

    const createdRoom = insertResult[0];
    const input: GetRoomByIdInput = { id: createdRoom.id };

    const result = await getRoomById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdRoom.id);
    expect(result!.nomor_kamar).toEqual('101');
    expect(result!.harga_sewa).toEqual(500000);
    expect(result!.kapasitas).toEqual(2);
    expect(result!.fasilitas).toEqual('AC, Wifi, Kasur');
    expect(result!.status).toEqual('Kosong');
    expect(result!.catatan).toEqual('Kamar di lantai 1');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when room not found', async () => {
    const input: GetRoomByIdInput = { id: 999 };

    const result = await getRoomById(input);

    expect(result).toBeNull();
  });

  it('should handle room with null optional fields', async () => {
    // Create room with null optional fields
    const minimalKamarData = {
      nomor_kamar: '102',
      harga_sewa: 400000,
      kapasitas: 1,
      fasilitas: null,
      status: 'Terisi' as const,
      catatan: null
    };

    const insertResult = await db.insert(kamarTable)
      .values(minimalKamarData)
      .returning()
      .execute();

    const createdRoom = insertResult[0];
    const input: GetRoomByIdInput = { id: createdRoom.id };

    const result = await getRoomById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdRoom.id);
    expect(result!.nomor_kamar).toEqual('102');
    expect(result!.harga_sewa).toEqual(400000);
    expect(result!.kapasitas).toEqual(1);
    expect(result!.fasilitas).toBeNull();
    expect(result!.status).toEqual('Terisi');
    expect(result!.catatan).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should verify room is saved correctly in database', async () => {
    // Create a test room
    const insertResult = await db.insert(kamarTable)
      .values(testKamarData)
      .returning()
      .execute();

    const createdRoom = insertResult[0];

    // Retrieve using handler
    const handlerResult = await getRoomById({ id: createdRoom.id });

    // Verify database consistency
    expect(handlerResult).not.toBeNull();
    expect(handlerResult!.id).toEqual(createdRoom.id);
    expect(handlerResult!.nomor_kamar).toEqual(createdRoom.nomor_kamar);
    expect(handlerResult!.harga_sewa).toEqual(createdRoom.harga_sewa);
    expect(handlerResult!.kapasitas).toEqual(createdRoom.kapasitas);
    expect(handlerResult!.status).toEqual(createdRoom.status);
    expect(handlerResult!.created_at).toEqual(createdRoom.created_at);
  });
});
