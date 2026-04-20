require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || 'admin',
    database: process.env.DB_NAME || 'restropos'
  });

  try {
    console.log('Connected to MySQL...');

    // Create tracking table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        menu_item_id INT NOT NULL,
        inventory_item_id INT NOT NULL,
        quantity_required DECIMAL(10, 3) NOT NULL,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
        FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
      );
    `);
    
    console.log('recipe_ingredients table created successfully.');

    // Add auto-availability fields if missing
    // We already have `is_available` on menu_items but let's make sure
    
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await connection.end();
  }
}

migrate();
