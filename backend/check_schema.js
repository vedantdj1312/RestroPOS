const db = require('./src/config/db.js');

async function run() {
  try {
    // Check columns
    const [cols] = await db.query('SHOW COLUMNS FROM restaurant_tables');
    console.log('=== COLUMNS ===');
    cols.forEach(c => console.log(`  ${c.Field}: ${c.Type} (Null: ${c.Null}, Default: ${c.Default})`));
    
    // Try a test reservation
    console.log('\n=== TEST RESERVE ===');
    try {
      await db.query('UPDATE restaurant_tables SET status = "Reserved", reserved_at = ? WHERE id = ?', ['2026-04-05 19:30:00', 1]);
      console.log('SUCCESS: Table 1 reserved!');
      
      // Check the result
      const [rows] = await db.query('SELECT * FROM restaurant_tables WHERE id = 1');
      console.log('Table 1 after reserve:', JSON.stringify(rows[0]));
      
      // Reset it back
      await db.query('UPDATE restaurant_tables SET status = "Available", reserved_at = NULL WHERE id = 1');
      console.log('Table 1 reset back to Available.');
    } catch (err) {
      console.error('RESERVE FAILED:', err.code, err.message);
    }
  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    process.exit(0);
  }
}
run();
