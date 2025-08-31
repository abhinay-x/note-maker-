import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  console.log('Testing Neon PostgreSQL connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000, // 10 second timeout
    idleTimeoutMillis: 30000,
  });

  try {
    console.log('Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');

    // Test a simple query
    const result = await client.query('SELECT NOW()');
    console.log('✅ Query executed successfully:', result.rows[0]);

    client.release();
    console.log('✅ Connection test completed successfully');
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

    if (error.message.includes('timeout')) {
      console.log('\n🔍 Possible causes:');
      console.log('1. Network connectivity issues');
      console.log('2. Neon database is paused');
      console.log('3. Connection string format issues');
      console.log('4. Firewall blocking outbound connections');
    }
  } finally {
    await pool.end();
    console.log('Connection pool closed');
  }
}

testConnection();
