const db = require('./src/config/db');

async function checkOrders() {
  try {
    const [orders] = await db.query("SELECT * FROM orders WHERE table_id = 1");
    console.log("All orders for table 1:", orders);
    
    const [tables] = await db.query("SELECT * FROM restaurant_tables WHERE id = 1");
    console.log("Table 1:", tables[0]);

  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

checkOrders();
