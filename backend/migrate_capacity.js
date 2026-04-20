const db = require('./src/config/db.js');

async function run() {
  try {
    console.log("Adding seating_capacity column...");
    try {
      await db.query(`ALTER TABLE restaurant_tables ADD COLUMN seating_capacity INT DEFAULT 4`);
      console.log("Column seating_capacity successfully added.");
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log("Column seating_capacity already exists, skipping...");
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
