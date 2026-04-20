require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrateSettings() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || 'admin',
    database: process.env.DB_NAME || 'restropos'
  });

  try {
    console.log('Connected to MySQL...');

    // Create settings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    
    console.log('settings table created successfully.');

    // Default settings to insert
    const defaultSettings = [
      ['restaurant_name', 'The Grand Spice Kitchen'],
      ['address', '123, MG Road, Andheri West, Mumbai - 400053'],
      ['phone', '+91 98765 43210'],
      ['email', 'info@grandspice.com'],
      ['gstin', '27AABCU9603R1ZX'],
      ['fssai', '10016011001126'],
      ['currency', 'INR (₹)'],
      ['timezone', 'Asia/Kolkata (IST +5:30)'],
      ['receipt_footer', 'Thank you for visiting!']
    ];

    for (const [key, value] of defaultSettings) {
      await connection.query(
        'INSERT IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)',
        [key, value]
      );
    }
    
    console.log('Default settings seeded successfully.');

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await connection.end();
  }
}

migrateSettings();
