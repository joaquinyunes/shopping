import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Binary, MongoClient } from 'mongodb';
import { hayMongod, levantarReplicaSet } from './mongo-local';
import { COLECCIONES, exportar, importar } from './respaldo';

const conMongo = hayMongod() ? describe : describe.skip;

conMongo('respaldo y restauración de la base', () => {
  let mongo: Awaited<ReturnType<typeof levantarReplicaSet>>;
  let cliente: MongoClient;
  const carpeta = mkdtemp();
  function mkdtemp() { return mkdtempSync(join(tmpdir(), 'casa-nido-respaldo-')); }

  beforeAll(async () => {
    mongo = await levantarReplicaSet();
    cliente = await new MongoClient(mongo.uri).connect();
  }, 60_000);
  afterAll(async () => { await cliente?.close(); await mongo?.parar(); rmSync(carpeta, { recursive: true, force: true }); });

  it('exportar, borrar y restaurar deja la base idéntica (fechas, fotos y números incluidos)', async () => {
    const origen = cliente.db('respaldo_origen');
    const foto = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
    await origen.collection('tienda').insertOne({ _id: 1 as never, datos: { tienda: { nombre: 'Casa Nido' }, productos: [{ id: 'taza', precio: 8500, stock: 3 }] }, version: 7, actualizado: new Date('2026-11-03T12:00:00Z') });
    await origen.collection('pedidos').insertOne({ _id: 1 as never, estado: 'pendiente', total: 17000, cliente: { nombre: 'Ana' }, creado: new Date('2026-11-03T13:00:00Z') });
    await origen.collection('contadores').insertOne({ _id: 'pedido' as never, n: 1 });
    await origen.collection('fotos').insertOne({ _id: 'abc' as never, tipo: 'image/jpeg', data: new Binary(foto), creado: new Date('2026-11-01T00:00:00Z') });
    await origen.collection('limites').insertOne({ _id: 'no-se-respalda' as never, n: 1, expira: new Date() });

    const archivo = join(carpeta, 'copia.ndjson.gz');
    const cuenta = await exportar(origen, archivo);
    expect(cuenta).toEqual({ tienda: 1, pedidos: 1, contadores: 1, fotos: 1 });
    expect(statSync(archivo).size).toBeGreaterThan(50);

    // se pierde todo y se restaura en otra base vacía
    await origen.dropDatabase();
    const destino = cliente.db('respaldo_destino');
    expect(await importar(destino, archivo)).toEqual(cuenta);
    const tienda = await destino.collection('tienda').findOne({ _id: 1 as never });
    expect(tienda).toMatchObject({ version: 7, datos: { productos: [{ id: 'taza', precio: 8500, stock: 3 }] } });
    expect((tienda as unknown as { actualizado: Date }).actualizado.toISOString()).toBe('2026-11-03T12:00:00.000Z');
    const f = await destino.collection('fotos').findOne({ _id: 'abc' as never }) as unknown as { data: Binary };
    expect(Buffer.from(f.data.buffer).equals(foto)).toBe(true);
    expect(await destino.collection('limites').countDocuments()).toBe(0);
    expect((await destino.collection('pedidos').findOne({}))?._id).toBe(1); // los números siguen siendo números: el contador de pedidos no se rompe
  });

  it('no pisa una base que ya tiene datos salvo que se pida con --forzar', async () => {
    const archivo = join(carpeta, 'copia2.ndjson.gz');
    const db = cliente.db('respaldo_dos');
    await db.collection('pedidos').insertOne({ _id: 5 as never, total: 1 });
    await exportar(db, archivo);
    await db.collection('pedidos').insertOne({ _id: 6 as never, total: 2 });
    await expect(importar(db, archivo)).rejects.toThrow(/ya tiene datos/);
    expect(await importar(db, archivo, { forzar: true })).toEqual({ pedidos: 1 });
    expect(await db.collection('pedidos').countDocuments()).toBe(1);
  });

  it('un archivo cortado no borra nada aunque se use --forzar', async () => {
    const buenos = join(carpeta, 'bueno.ndjson.gz');
    const db = cliente.db('respaldo_tres');
    await db.collection('pedidos').insertMany([{ _id: 1 as never, total: 1 }, { _id: 2 as never, total: 2 }]);
    await exportar(db, buenos);
    const roto = join(carpeta, 'roto.ndjson.gz');
    writeFileSync(roto, readFileSync(buenos).subarray(0, 12)); // se cortó la descarga
    await expect(importar(db, roto, { forzar: true })).rejects.toThrow();
    expect(await db.collection('pedidos').countDocuments()).toBe(2);
    const ajeno = join(carpeta, 'ajeno.ndjson.gz');
    writeFileSync(ajeno, gzipSync('{"c":"usuarios","d":{"_id":1}}\n'));
    await expect(importar(db, ajeno, { forzar: true })).rejects.toThrow(/inesperada/);
    expect(await db.collection('pedidos').countDocuments()).toBe(2);
  });

  it('guarda solo las colecciones que importan', () => {
    expect(COLECCIONES).not.toContain('limites');
    expect(COLECCIONES).toContain('pedidos');
  });
});
