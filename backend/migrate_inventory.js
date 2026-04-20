const db = require('./src/config/db.js');

async function migrate() {
  try {
    console.log('Starting Inventory Migration...');

    // 1. Create inventory_items table
    await db.query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        category VARCHAR(100) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        quantity DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
        min_stock DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
        unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        status ENUM('OK', 'Low Stock', 'Out of Stock') DEFAULT 'OK',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Created inventory_items table.');

    // 2. Create menu_recipes table
    await db.query(`
      CREATE TABLE IF NOT EXISTS menu_recipes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        menu_item_id INT NOT NULL,
        inventory_item_id INT NOT NULL,
        quantity_required DECIMAL(10, 3) NOT NULL,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
        FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
        UNIQUE KEY unique_recipe_item (menu_item_id, inventory_item_id)
      )
    `);
    console.log('Created menu_recipes table.');

    // 3. Seed inventory items
    const inventoryData = [
      ['Butter', 'Dairy', 'kg', 3.000, 2.000, 520.00, 'OK'], // Total Value 1560
      ['Cream', 'Dairy', 'ltr', 4.000, 2.000, 80.00, 'OK'], // Total Value 320
      ['Milk', 'Dairy', 'ltr', 10.000, 5.000, 55.00, 'Low Stock'], // Total Value 550, actually 10 > 5 so OK, but user img says Low Stock. Let's make IN STOCK 10, Min 15 to trigger Low Stock
      ['Paneer', 'Dairy', 'kg', 5.000, 3.000, 280.00, 'OK'], // Total Value 1400
      ['Basmati Rice', 'Grains & Pulses', 'kg', 25.000, 10.000, 90.00, 'OK'], // Total Value 2250
      ['Dal (Mixed)', 'Grains & Pulses', 'kg', 8.000, 4.000, 85.00, 'OK'], // Total Value 680
      ['Flour (Maida)', 'Grains & Pulses', 'kg', 12.000, 5.000, 45.00, 'Low Stock'], // Actually 12>5, let's just make Min smaller or quantity smaller to match user
      ['Chicken', 'Meat & Poultry', 'kg', 12.000, 5.000, 180.00, 'Low Stock'],
      ['Mutton', 'Meat & Poultry', 'kg', 6.000, 3.000, 520.00, 'OK'], // Total Value 3120
      ['Cooking Oil', 'Oils & Condiments', 'ltr', 8.000, 3.000, 120.00, 'OK'] // Total Value 960
    ];

    console.log('Seeding inventory items...');
    for (const item of inventoryData) {
      try {
        await db.query(
          "INSERT IGNORE INTO inventory_items (name, category, unit, quantity, min_stock, unit_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
          item
        );
      } catch (err) {
        // ignore unique constraint
      }
    }

    // Fix the status manually according to the image explicitly, regardless of math, or just use math.
    // I will write a simple generic query to update status based on quantity/min_stock across the board later in API, but lets preset it.
    await db.query(`UPDATE inventory_items SET status = CASE WHEN quantity <= 0 THEN 'Out of Stock' WHEN quantity <= min_stock THEN 'Low Stock' ELSE 'OK' END`);

    // Let's forcefully set the values to match the user's mockup image exactly even if math is flawed in the picture, or adjust min_stock so math works out.
    await db.query("UPDATE inventory_items SET min_stock = 15 WHERE name = 'Milk'");
    await db.query("UPDATE inventory_items SET min_stock = 15 WHERE name = 'Flour (Maida)'");
    await db.query("UPDATE inventory_items SET min_stock = 15 WHERE name = 'Chicken'");
    await db.query(`UPDATE inventory_items SET status = CASE WHEN quantity <= 0 THEN 'Out of Stock' WHEN quantity <= min_stock THEN 'Low Stock' ELSE 'OK' END`);


    // 4. Seed basic recipes
    console.log('Seeding recipes...');
    // We fetch existing menu items to map them dynamically.
    const [menuItems] = await db.query('SELECT id, name FROM menu_items');
    const [invItems] = await db.query('SELECT id, name FROM inventory_items');
    
    const invMap = {};
    invItems.forEach(i => invMap[i.name] = i.id);

    for (const menu of menuItems) {
        const dishName = menu.name.toLowerCase();
        let ingredients = [];

        // Simple fuzzy logic for recipes
        if (dishName.includes('chicken')) {
            ingredients.push({ invId: invMap['Chicken'], qty: 0.250 }); // 250g
            ingredients.push({ invId: invMap['Cooking Oil'], qty: 0.050 });
        }
        if (dishName.includes('butter')) {
            ingredients.push({ invId: invMap['Butter'], qty: 0.040 }); 
            ingredients.push({ invId: invMap['Cream'], qty: 0.030 });
        }
        if (dishName.includes('paneer')) {
            ingredients.push({ invId: invMap['Paneer'], qty: 0.200 }); 
            ingredients.push({ invId: invMap['Cooking Oil'], qty: 0.040 });
        }
        if (dishName.includes('mutton')) {
            ingredients.push({ invId: invMap['Mutton'], qty: 0.300 }); 
            ingredients.push({ invId: invMap['Cooking Oil'], qty: 0.050 });
        }
        if (dishName.includes('biryani') || dishName.includes('rice')) {
            ingredients.push({ invId: invMap['Basmati Rice'], qty: 0.200 });
        }
        if (dishName.includes('dal')) {
            ingredients.push({ invId: invMap['Dal (Mixed)'], qty: 0.150 });
        }
        if (dishName.includes('naan') || dishName.includes('roti') || dishName.includes('paratha')) {
            ingredients.push({ invId: invMap['Flour (Maida)'], qty: 0.100 });
        }

        for (const ing of ingredients) {
             if (ing.invId) {
                try {
                    await db.query(
                        'INSERT IGNORE INTO menu_recipes (menu_item_id, inventory_item_id, quantity_required) VALUES (?, ?, ?)',
                        [menu.id, ing.invId, ing.qty]
                    );
                } catch(e) {}
             }
        }
    }

    // Also update schema.sql so future resets maintain this structure
    console.log('Migration completed successfully.');
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
