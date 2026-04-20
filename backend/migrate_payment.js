const db = require('./src/config/db.js');

async function run() {
  try {
    console.log("Altering restaurant_tables status ENUM...");
    // We add 'Paid' to the status list.
    await db.query(`ALTER TABLE restaurant_tables MODIFY COLUMN status ENUM('Available', 'Occupied', 'Billed', 'Reserved', 'Paid') DEFAULT 'Available'`);
    console.log("Enum altered.");
    
    console.log("Adding payment columns to orders table...");
    try {
      await db.query(`ALTER TABLE orders ADD COLUMN payment_method ENUM('Cash', 'UPI', 'Credit Card') NULL`);
      console.log("Column payment_method added.");
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log("Column payment_method already exists.");
      else throw err;
    }

    try {
      await db.query(`ALTER TABLE orders ADD COLUMN paid_amount DECIMAL(10, 2) NULL`);
      console.log("Column paid_amount added.");
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log("Column paid_amount already exists.");
      else throw err;
    }

  } catch (error) {
    console.error("Migration Error:", error);
  } finally {
    process.exit(0);
  }
}
run();
