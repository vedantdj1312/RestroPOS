const db = require('../src/config/db');

const data = [
  {
    dish: "Cold Coffee",
    materials: ["Milk", "Coffee Powder", "Sugar", "Ice Cubes", "Chocolate Syrup"]
  },
  {
    dish: "Fresh Lime Soda",
    materials: ["Lemon", "Soda Water", "Sugar Syrup", "Salt", "Masala", "Ice"]
  },
  {
    dish: "Mango Lassi",
    materials: ["Mango Pulp", "Yogurt", "Sugar", "Cardamom", "Milk"]
  },
  {
    dish: "Masala Chai",
    materials: ["Milk", "Tea Leaves", "Ginger", "Cardamom", "Tea Masala", "Sugar"]
  },
  {
    dish: "Mojito",
    materials: ["Mint Leaves", "Lime Juice", "Soda", "Sugar"]
  },
  {
    dish: "Gulab Jamun",
    materials: ["Khoya", "Maida", "Sugar", "Cardamom", "Saffron", "Oil", "Ghee"]
  },
  {
    dish: "Rasmalai",
    materials: ["Paneer", "Milk", "Sugar", "Saffron", "Pistachios", "Almonds"]
  },
  {
    dish: "Brownie with Ice Cream",
    materials: ["Chocolate Brownie", "Vanilla Ice Cream", "Chocolate Sauce", "Walnuts"]
  },
  {
    dish: "Gajar Ka Halwa",
    materials: ["Carrots", "Full Cream Milk", "Ghee", "Sugar", "Khoya", "Dry Fruits"]
  },
  {
    dish: "Veg Spring Roll",
    materials: ["Spring Roll Wrappers", "Cabbage", "Carrots", "Capsicum", "Soy Sauce", "Oil"]
  },
  {
    dish: "Hara Bhara Kabab",
    materials: ["Spinach", "Green Peas", "Potatoes", "Breadcrumbs", "Green Chillies", "Spices"]
  },
  {
    dish: "Tandoori Prawns",
    materials: ["Prawns", "Yogurt", "Ginger-Garlic Paste", "Tandoori Masala", "Lemon Juice"]
  },
  {
    dish: "Dosa",
    materials: ["Dosa Batter", "Oil", "Butter", "Potato Masala"]
  }
];

async function populate() {
  for (const item of data) {
    console.log(`Processing Dish: ${item.dish}...`);
    
    // 1. Find the menu item
    const [dishes] = await db.query('SELECT id FROM menu_items WHERE name LIKE ?', [`%${item.dish}%`]);
    if (dishes.length === 0) {
      console.warn(`  [WARN] Dish "${item.dish}" not found in menu_items. Skipping.`);
      continue;
    }
    const menuItemId = dishes[0].id;

    // 2. Clear existing recipes for this dish (optional, but requested to insert these)
    await db.query('DELETE FROM menu_recipes WHERE menu_item_id = ?', [menuItemId]);

    // 3. Process materials
    for (const materialName of item.materials) {
      // Check if material exists in inventory
      const [invItems] = await db.query('SELECT id FROM inventory_items WHERE name = ?', [materialName]);
      let invItemId;

      if (invItems.length > 0) {
        invItemId = invItems[0].id;
      } else {
        // Auto-add missing material
        console.log(`  [NEW] Adding "${materialName}" to inventory...`);
        const [newInv] = await db.query(
          'INSERT INTO inventory_items (name, category, unit, quantity, min_stock, unit_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [materialName, 'General', 'pcs', 0, 0, 0, 'Out of Stock']
        );
        invItemId = newInv.insertId;
      }

      // 4. Link in menu_recipes
      // Use a default quantity (e.g., 0.1) as none was provided by user
      await db.query(
        'INSERT IGNORE INTO menu_recipes (menu_item_id, inventory_item_id, quantity_required) VALUES (?, ?, ?)',
        [menuItemId, invItemId, 0.100]
      );
    }
    console.log(`  [OK] Done with ${item.dish}.`);
  }
  process.exit(0);
}

populate().catch(err => {
  console.error(err);
  process.exit(1);
});
