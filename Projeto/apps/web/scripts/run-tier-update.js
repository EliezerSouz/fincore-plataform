const postgres = require('postgres');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  const sql = postgres(connectionString, { ssl: 'require' });

  try {
    const migrationPath = path.join(__dirname, 'update_category_tiers.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running tier update...');
    await sql.unsafe(migrationSql);
    console.log('Tier update completed successfully!');
  } catch (err) {
    console.error('Error running tier update:', err);
  } finally {
    await sql.end();
  }
}

run();
