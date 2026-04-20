const db = require('../src/config/db');

const updates = [
  { name: "Milk", category: "Dairy", unit: "Ltr", quantity: 20, min_stock: 5, unit_price: 60 },
  { name: "Coffee Powder", category: "Pantry", unit: "kg", quantity: 2, min_stock: 0.5, unit_price: 1200 },
  { name: "Sugar", category: "Pantry", unit: "kg", quantity: 10, min_stock: 2, unit_price: 45 },
  { name: "Ice Cubes", category: "Miscellaneous", unit: "Bag", quantity: 5, min_stock: 1, unit_price: 20 },
  { name: "Chocolate Syrup", category: "Pantry", unit: "Bottle", quantity: 3, min_stock: 1, unit_price: 180 },
  { name: "Lemon", category: "Produce", unit: "kg", quantity: 5, min_stock: 1, unit_price: 80 },
  { name: "Soda Water", category: "Beverage", unit: "Bottle", quantity: 24, min_stock: 12, unit_price: 15 },
  { name: "Sugar Syrup", category: "Pantry", unit: "Ltr", quantity: 5, min_stock: 1, unit_price: 80 },
  { name: "Salt", category: "Pantry", unit: "kg", quantity: 10, min_stock: 2, unit_price: 20 },
  { name: "Masala", category: "Pantry", unit: "kg", quantity: 5, min_stock: 1, unit_price: 450 },
  { name: "Ice", category: "Miscellaneous", unit: "kg", quantity: 50, min_stock: 10, unit_price: 5 },
  { name: "Mango Pulp", category: "Pantry", unit: "Tin", quantity: 10, min_stock: 3, unit_price: 120 },
  { name: "Yogurt", category: "Dairy", unit: "kg", quantity: 10, min_stock: 3, unit_price: 80 },
  { name: "Cardamom", category: "Pantry", unit: "kg", quantity: 0.5, min_stock: 0.1, unit_price: 2500 },
  { name: "Tea Leaves", category: "Pantry", unit: "kg", quantity: 5, min_stock: 1, unit_price: 350 },
  { name: "Ginger", category: "Produce", unit: "kg", quantity: 3, min_stock: 0.5, unit_price: 120 },
  { name: "Tea Masala", category: "Pantry", unit: "kg", quantity: 1, min_stock: 0.2, unit_price: 600 },
  { name: "Mint Leaves", category: "Produce", unit: "Bunch", quantity: 20, min_stock: 5, unit_price: 10 },
  { name: "Lime Juice", category: "Pantry", unit: "Ltr", quantity: 5, min_stock: 1, unit_price: 150 },
  { name: "Khoya", category: "Dairy", unit: "kg", quantity: 5, min_stock: 1, unit_price: 350 },
  { name: "Maida", category: "Pantry", unit: "kg", quantity: 25, min_stock: 5, unit_price: 40 },
  { name: "Saffron", category: "Pantry", unit: "gm", quantity: 0.01, min_stock: 0.002, unit_price: 350000 }, // Saffron is expensive per kg, but let's use gm units or adjust
  { name: "Oil", category: "Pantry", unit: "Ltr", quantity: 30, min_stock: 10, unit_price: 140 },
  { name: "Ghee", category: "Pantry", unit: "Ltr", quantity: 10, min_stock: 2, unit_price: 650 },
  { name: "Pistachios", category: "Pantry", unit: "kg", quantity: 2, min_stock: 0.5, unit_price: 1800 },
  { name: "Almonds", category: "Pantry", unit: "kg", quantity: 3, min_stock: 1, unit_price: 900 },
  { name: "Chocolate Brownie", category: "Bakery", unit: "pcs", quantity: 24, min_stock: 12, unit_price: 45 },
  { name: "Vanilla Ice Cream", category: "Dairy", unit: "Ltr", quantity: 10, min_stock: 3, unit_price: 250 },
  { name: "Chocolate Sauce", category: "Pantry", unit: "Bottle", quantity: 5, min_stock: 1, unit_price: 150 },
  { name: "Walnuts", category: "Pantry", unit: "kg", quantity: 2, min_stock: 0.5, unit_price: 1200 },
  { name: "Carrots", category: "Produce", unit: "kg", quantity: 10, min_stock: 3, unit_price: 40 },
  { name: "Full Cream Milk", category: "Dairy", unit: "Ltr", quantity: 15, min_stock: 5, unit_price: 70 },
  { name: "Dry Fruits", category: "Pantry", unit: "kg", quantity: 5, min_stock: 1, unit_price: 1200 },
  { name: "Spring Roll Wrappers", category: "Pantry", unit: "Pkt", quantity: 10, min_stock: 3, unit_price: 90 },
  { name: "Cabbage", category: "Produce", unit: "kg", quantity: 15, min_stock: 5, unit_price: 30 },
  { name: "Capsicum", category: "Produce", unit: "kg", quantity: 8, min_stock: 2, unit_price: 60 },
  { name: "Soy Sauce", category: "Pantry", unit: "Bottle", quantity: 5, min_stock: 2, unit_price: 120 },
  { name: "Spinach", category: "Produce", unit: "kg", quantity: 5, min_stock: 2, unit_price: 40 },
  { name: "Green Peas", category: "Produce", unit: "kg", quantity: 10, min_stock: 3, unit_price: 80 },
  { name: "Potatoes", category: "Produce", unit: "kg", quantity: 50, min_stock: 10, unit_price: 25 },
  { name: "Breadcrumbs", category: "Pantry", unit: "kg", quantity: 5, min_stock: 1, unit_price: 100 },
  { name: "Green Chillies", category: "Produce", unit: "kg", quantity: 2, min_stock: 0.5, unit_price: 80 },
  { name: "Spices", category: "Pantry", unit: "kg", quantity: 10, min_stock: 2, unit_price: 400 },
  { name: "Prawns", category: "Protein", unit: "kg", quantity: 5, min_stock: 2, unit_price: 800 },
  { name: "Ginger-Garlic Paste", category: "Pantry", unit: "kg", quantity: 5, min_stock: 1, unit_price: 180 },
  { name: "Tandoori Masala", category: "Pantry", unit: "kg", quantity: 3, min_stock: 1, unit_price: 550 },
  { name: "Lemon Juice", category: "Pantry", unit: "Ltr", quantity: 5, min_stock: 1, unit_price: 160 },
  { name: "Dosa Batter", category: "Dairy", unit: "Ltr", quantity: 15, min_stock: 5, unit_price: 90 },
  { name: "Potato Masala", category: "Pantry", unit: "kg", quantity: 10, min_stock: 3, unit_price: 150 }
];

async function updateInventory() {
  for (const item of updates) {
    let status = 'OK';
    if (item.quantity <= 0) status = 'Out of Stock';
    else if (item.quantity <= item.min_stock) status = 'Low Stock';

    await db.query(
      'UPDATE inventory_items SET category = ?, unit = ?, quantity = ?, min_stock = ?, unit_price = ?, status = ? WHERE name = ?',
      [item.category, item.unit, item.quantity, item.min_stock, item.unit_price, status, item.name]
    );
  }
  process.exit(0);
}

updateInventory().catch(err => {
  console.error(err);
  process.exit(1);
});
