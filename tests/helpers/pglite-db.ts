import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import postgres from 'postgres'
import { createDb, type Db } from '@/lib/db/db'

const MIGRATIONS_DIR = path.resolve(__dirname, '../../supabase/migrations')

/**
 * A fresh in-memory Postgres (PGlite) with every migration applied, reached
 * through postgres.js over a local socket with the production client options,
 * so tests exercise the same driver, encoding and parsing as production.
 */
export async function createTestDb(): Promise<{ db: Db; close: () => Promise<void> }> {
  const pg = await PGlite.create()
  // Supabase's client roles and its default grants to them, as on a new project.
  await pg.exec(`
    create role anon; create role authenticated;
    alter default privileges in schema public grant all on tables to anon, authenticated;
    alter default privileges in schema public grant all on sequences to anon, authenticated;
  `)
  for (const file of readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort()) {
    await pg.exec(readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'))
  }
  const server = new PGLiteSocketServer({ db: pg, port: 0, host: '127.0.0.1' })
  await server.start()
  const [host, port] = server.getServerConn().split(':')
  const sql = postgres({ host, port: Number(port), database: 'postgres', username: 'postgres', prepare: false, max: 1, onnotice: () => {} })
  return {
    db: createDb(sql),
    close: async () => {
      await sql.end()
      await server.stop()
      await pg.close()
    },
  }
}
