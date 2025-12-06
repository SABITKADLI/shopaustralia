#!/usr/bin/env node
const { readFileSync } = require('fs');
const path = require('path');
const { Client } = require('pg');

async function run() {
  const schemaPath = path.join(__dirname, '..', 'src', 'db', 'schema.sql');
  let sql;
  try {
    sql = readFileSync(schemaPath, 'utf8');
  } catch (err) {
    console.error('Could not read schema.sql:', err.message);
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set in environment');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    await client.query(sql);
    console.log('Migration applied successfully');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
