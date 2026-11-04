import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

console.log('Testing connection with:');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('Database:', process.env.DB_NAME);
console.log('Password length:', (process.env.DB_PASSWORD || '').length);

async function test() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000,
    });
    console.log('CONNECTED TO HOSTINGER MYSQL SUCCESSFULLY!');
    const [rows] = await conn.query('SHOW TABLES;');
    console.log('Tables:', rows);
    await conn.end();
  } catch (err) {
    console.error('ERROR:', err.message);
    console.error('Code:', err.code);
  }
}

test();
