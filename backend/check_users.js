const db = require('./src/config/db');

async function inspectDB() {
  try {
    const [rows] = await db.query('SHOW COLUMNS FROM users');
    console.log("Users Table Columns:", rows.map(r => `${r.Field} - ${r.Type}`));
    
    const [users] = await db.query('SELECT id, name, email, role FROM users');
    console.log("Existing Users:", users);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

inspectDB();
