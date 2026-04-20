const db = require('./src/config/db.js');

async function run() {
  try {
    console.log("Altering ENUM...");
    await db.query(`ALTER TABLE restaurant_tables MODIFY COLUMN status ENUM('Available', 'Occupied', 'Billed', 'Reserved') DEFAULT 'Available'`);
    console.log("Enum altered.");
    
    console.log("Adding reserved_at column...");
    try {
      await db.query(`ALTER TABLE restaurant_tables ADD COLUMN reserved_at DATETIME NULL`);
      console.log("Column reserved_at successfully added.");
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log("Column reserved_at already exists, skipping...");
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error("Migration Error:", error);
  } finally {
    process.exit(0);
  }
}
run();
