import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

// Singleton connection for Server Side
// Note: In Next.js dev mode, this might create multiple connections on hot reload,
// but postgres.js handles pooling well.
// For production, you might want to attach this to globalThis to prevent exhaustion.

const sql = postgres(connectionString, {
  ssl: 'require',
  max: 10, // Pool size
  idle_timeout: 20,
  connect_timeout: 10,
})

export default sql
