const db = require('../config/db');

// Get all inventory items
exports.getAllInventory = async (req, res) => {
  try {
    const [items] = await db.query('SELECT * FROM inventory_items ORDER BY name ASC');
    
    // Calculate stats
    const totalItems = items.length;
    const lowStock = items.filter(item => item.status === 'Low Stock').length;
    const outOfStock = items.filter(item => item.status === 'Out of Stock').length;
    const totalValue = items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.unit_price)), 0);

    res.json({
      items,
      stats: {
        totalItems,
        lowStock,
        outOfStock,
        totalValue
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

// Add new inventory item
exports.addInventoryItem = async (req, res) => {
  try {
    const { name, category, unit, quantity, min_stock, unit_price } = req.body;
    
    if (!name || !category || !unit) {
      return res.status(400).json({ error: 'Name, category, and unit are required' });
    }

    // Determine status
    let status = 'OK';
    const q = parseFloat(quantity || 0);
    const m = parseFloat(min_stock || 0);
    if (q <= 0) status = 'Out of Stock';
    else if (q <= m) status = 'Low Stock';

    const [result] = await db.query(
      'INSERT INTO inventory_items (name, category, unit, quantity, min_stock, unit_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, category, unit, q, m, parseFloat(unit_price || 0), status]
    );

    res.status(201).json({ id: result.insertId, message: 'Inventory item added successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Item with this name already exists' });
    }
    console.error('Error adding inventory item:', error);
    res.status(500).json({ error: 'Failed to add inventory item' });
  }
};

// Update inventory item
exports.updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, unit, quantity, min_stock, unit_price } = req.body;

    // Determine status
    let status = 'OK';
    const q = parseFloat(quantity);
    const m = parseFloat(min_stock);
    if (q <= 0) status = 'Out of Stock';
    else if (q <= m) status = 'Low Stock';

    await db.query(
      'UPDATE inventory_items SET name = ?, category = ?, unit = ?, quantity = ?, min_stock = ?, unit_price = ?, status = ? WHERE id = ?',
      [name, category, unit, q, m, parseFloat(unit_price), status, id]
    );

    res.json({ message: 'Inventory item updated successfully' });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
};

// Delete inventory item
exports.deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM inventory_items WHERE id = ?', [id]);
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
};
