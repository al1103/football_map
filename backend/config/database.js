const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user:  'postgres',
  host: 'localhost',
  database:  'football_fields_db',
  password: 'root',
  port:  5432,
});

// Test connection
pool.on('connect', () => {
  console.log('PostgreSQL connected successfully');
});

pool.on('error', (err, client) => {
  console.error('PostgreSQL connection error:', err);
  process.exit(-1);
});

module.exports = pool;
