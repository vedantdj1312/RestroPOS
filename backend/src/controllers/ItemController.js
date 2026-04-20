const db = require('../config/db');

// Get all menu items
exports.getAllItems = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, c.name as category_name,
      (CASE 
          WHEN m.is_available = FALSE THEN FALSE
          WHEN (
            SELECT COUNT(*) 
            FROM menu_recipes mr
            JOIN inventory_items ii ON mr.inventory_item_id = ii.id
            WHERE mr.menu_item_id = m.id AND ii.quantity < mr.quantity_required
          ) > 0 THEN FALSE
          ELSE TRUE
      END) as computed_available
      FROM menu_items m 
      LEFT JOIN categories c ON m.category_id = c.id
      ORDER BY c.name, m.name
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
};

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Add new item
exports.addItem = async (req, res) => {
  try {
    const { category_id, name, description, price, image_url, is_available, is_veg } = req.body;
    
    if (!category_id || !name || !price) {
      return res.status(400).json({ error: 'Category, name, and price are required' });
    }

    const [result] = await db.query(
      'INSERT INTO menu_items (category_id, name, description, price, image_url, is_available, is_veg) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [category_id, name, description, price, image_url || null, is_available !== undefined ? is_available : true, is_veg !== undefined ? is_veg : true]
    );
    
    res.status(201).json({ id: result.insertId, message: 'Item added successfully' });
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
};

// Update existing item
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, name, description, price, image_url, is_available, is_veg } = req.body;
    
    if (!category_id || !name || !price) {
      return res.status(400).json({ error: 'Category, name, and price are required' });
    }

    await db.query(`
      UPDATE menu_items 
      SET category_id = ?, name = ?, description = ?, price = ?, image_url = ?, is_available = ?, is_veg = ? 
      WHERE id = ?
    `, [category_id, name, description, price, image_url || null, is_available !== undefined ? is_available : true, is_veg !== undefined ? is_veg : true, id]);
    
    res.json({ message: 'Item updated successfully' });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
};

// Delete item
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Attempting to delete item with ID:", id);
    const [result] = await db.query('DELETE FROM menu_items WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      console.warn("Delete failed: No item found with ID", id);
      return res.status(404).json({ error: 'Item not found in database.' });
    }

    console.log("Successfully deleted item ID:", id);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('CRITICAL: Error deleting item:', error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === '1451' || error.message.includes('foreign key')) {
      return res.status(400).json({ 
        error: 'Historical Data Lock: This item was used in previous orders. To keep your records accurate, it cannot be deleted. Please use the "Edit" function to mark it as unavailable instead.' 
      });
    }
    res.status(500).json({ error: 'Database Error: ' + error.message });
  }
};

// Update item availability
exports.updateItemAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available } = req.body;
    
    await db.query('UPDATE menu_items SET is_available = ? WHERE id = ?', [is_available, id]);
    res.json({ message: 'Item availability updated' });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
};

// Get item recipe (ingredients map)
exports.getItemRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const [ingredients] = await db.query(`
      SELECT mr.id, mr.inventory_item_id, mr.quantity_required, ii.name, ii.unit, ii.quantity as current_stock 
      FROM menu_recipes mr
      JOIN inventory_items ii ON mr.inventory_item_id = ii.id
      WHERE mr.menu_item_id = ?
    `, [id]);
    res.json(ingredients);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
};

// Update item recipe
exports.updateItemRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const { ingredients } = req.body; // Array of { inventory_item_id, quantity_required }
    
    await db.query('DELETE FROM menu_recipes WHERE menu_item_id = ?', [id]);
    
    if (ingredients && ingredients.length > 0) {
      const values = ingredients.map(ing => [id, ing.inventory_item_id, ing.quantity_required]);
      await db.query('INSERT INTO menu_recipes (menu_item_id, inventory_item_id, quantity_required) VALUES ?', [values]);
    }
    
    res.json({ message: 'Recipe updated successfully' });
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
};
