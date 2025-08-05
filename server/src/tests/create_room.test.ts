
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kamarTable } from '../db/schema';
import { type CreateKamarInput } from '../schema';
import { createRoom } from '../handlers/create_room';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateKamarInput = {
  nomor_kamar: 'A101',
  harga_sewa: 500000,
  kapasitas: 2,
  fasilitas: 'AC, WiFi, Kasur',
  status: 'Kosong',
  catatan: 'Kamar baru renovasi'
};

describe('createRoom', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a room', async () => {
    const result = await createRoom(testInput);

    // Basic field validation
    expect(result.nomor_kamar).toEqual('A101');
    expect(result.harga_sewa).toEqual(500000);
    expect(result.kapasitas).toEqual(2);
    expect(result.fasilitas).toEqual('AC, WiFi, Kasur');
    expect(result.status).toEqual('Kosong');
    expect(result.catatan).toEqual('Kamar baru renovasi');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save room to database', async () => {
    const result = await createRoom(testInput);

    // Query using proper drizzle syntax
    const rooms = await db.select()
      .from(kamarTable)
      .where(eq(kamarTable.id, result.id))
      .execute();

    expect(rooms).toHaveLength(1);
    expect(rooms[0].nomor_kamar).toEqual('A101');
    expect(rooms[0].harga_sewa).toEqual(500000);
    expect(rooms[0].kapasitas).toEqual(2);
    expect(rooms[0].fasilitas).toEqual('AC, WiFi, Kasur');
    expect(rooms[0].status).toEqual('Kosong');
    expect(rooms[0].catatan).toEqual('Kamar baru renovasi');
    expect(rooms[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null fasilitas and catatan', async () => {
    const inputWithNulls: CreateKamarInput = {
      nomor_kamar: 'B202',
      harga_sewa: 400000,
      kapasitas: 1,
      fasilitas: null,
      status: 'Terisi',
      catatan: null
    };

    const result = await createRoom(inputWithNulls);

    expect(result.nomor_kamar).toEqual('B202');
    expect(result.harga_sewa).toEqual(400000);
    expect(result.kapasitas).toEqual(1);
    expect(result.fasilitas).toBeNull();
    expect(result.status).toEqual('Terisi');
    expect(result.catatan).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create room with valid enum status values', async () => {
    const kosongInput: CreateKamarInput = {
      ...testInput,
      nomor_kamar: 'C301',
      status: 'Kosong'
    };

    const terisiInput: CreateKamarInput = {
      ...testInput,
      nomor_kamar: 'C302',
      status: 'Terisi'
    };

    const kosongResult = await createRoom(kosongInput);
    const terisiResult = await createRoom(terisiInput);

    expect(kosongResult.status).toEqual('Kosong');
    expect(terisiResult.status).toEqual('Terisi');

    // Verify in database
    const rooms = await db.select()
      .from(kamarTable)
      .execute();

    const kosongRoom = rooms.find(r => r.nomor_kamar === 'C301');
    const terisiRoom = rooms.find(r => r.nomor_kamar === 'C302');

    expect(kosongRoom?.status).toEqual('Kosong');
    expect(terisiRoom?.status).toEqual('Terisi');
  });
});
