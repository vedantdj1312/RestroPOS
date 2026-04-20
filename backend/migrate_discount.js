const db = require('./src/config/db.js');

async function run() {
  try {
    console.log("Adding discount_percent column to orders table...");
    try {
      await db.query(`ALTER TABLE orders ADD COLUMN discount_percent DECIMAL(5, 2) DEFAULT 0.00`);
      console.log("Column discount_percent added successfully.");
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log("Column discount_percent already exists.");
      else throw err;
    }

    console.log("Migration complete.");
  } catch (error) {
    console.error("Migration Error:", error);
  } finally {
    process.exit(0);
  }
}
run();
