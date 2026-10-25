/**
 * The minimal database surface the service needs. postgres.js implements it
 * in production (Supabase's transaction pooler); PGlite implements it in
 * tests, running the real migration SQL in-process.
 */
import postgres from 'postgres'

export interface Db {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>
  transaction<R>(fn: (tx: Db) => Promise<R>): Promise<R>
}

type Sql = postgres.Sql | postgres.TransactionSql

/** Wraps a postgres.js client. Tests pass one connected to PGlite, so both run this code. */
export function createDb(sql: Sql): Db {
  return {
    async query<T>(text: string, params: unknown[] = []) {
      const rows = await sql.unsafe(text, params as postgres.ParameterOrJSON<never>[])
      return rows as unknown as T[]
    },
    async transaction<R>(fn: (tx: Db) => Promise<R>) {
      if ('begin' in sql) return (await sql.begin((tx) => fn(createDb(tx)))) as R
      // Already inside a transaction: nest with a savepoint.
      return (await (sql as postgres.TransactionSql).savepoint((tx) => fn(createDb(tx)))) as R
    },
  }
}

let singleton: Db | null = null

/**
 * DATABASE_URL is Supabase's transaction pooler (port 6543). Prepared
 * statements are off because the pooler does not support them; one
 * connection per serverless instance.
 */
export function getDb(): Db {
  if (singleton) return singleton
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  singleton = createDb(postgres(url, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 10 }))
  return singleton
}
