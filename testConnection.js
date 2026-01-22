/**
 * Test script to verify Access database connection
 * Run with: node --env-file=.env testConnection.js
 */
import { getConnection, closeConnection } from './accessConnection.js';

const dbPath = process.env.ACCESS_DB_PATH;

if (!dbPath) {
  console.error('ACCESS_DB_PATH not set in .env');
  process.exit(1);
}

async function testConnection() {
  try {
    console.log('Testing connection to:', dbPath);
    const connection = await getConnection(dbPath);
    
    // Try a simple query to test the connection
    const result = await connection.query('SELECT TOP 1 * FROM [Notas de Manutenção]');
    console.log('Connection successful!');
    console.log('Sample record:', result);
    
    await closeConnection();
  } catch (error) {
    console.error('Connection test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();

