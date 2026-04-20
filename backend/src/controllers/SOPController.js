const db = require('../config/db');

// Get all menu items with their recipes
exports.getAllSOPs = async (req, res) => {
  try {
    // 1. Fetch all menu items
    const [menuItems] = await db.query(`
      SELECT m.id, m.name, m.serving_size, c.name as category_name 
      FROM menu_items m
      JOIN categories c ON m.category_id = c.id
      ORDER BY c.name, m.name
    `);

    // 2. Fetch all recipes
    const [recipes] = await db.query(`
      SELECT r.menu_item_id, r.inventory_item_id, r.quantity_required, i.name as ingredient_name, i.unit
      FROM menu_recipes r
      JOIN inventory_items i ON r.inventory_item_id = i.id
    `);

    // 3. Group recipes by menu item
    const sopList = menuItems.map(item => ({
      ...item,
      ingredients: recipes.filter(r => r.menu_item_id === item.id)
    }));

    res.json(sopList);
  } catch (error) {
    console.error('Error fetching SOPs:', error);
    res.status(500).json({ error: 'Failed to fetch SOP data' });
  }
};

// Update SOP (Serving Size & Recipes)
exports.updateSOP = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { menu_item_id } = req.params;
    const { serving_size, ingredients } = req.body;

    await connection.beginTransaction();

    // 1. Update serving size in menu_items
    await connection.query(
      'UPDATE menu_items SET serving_size = ? WHERE id = ?',
      [serving_size, menu_item_id]
    );

    // 2. Clean up existing recipes for this item
    await connection.query('DELETE FROM menu_recipes WHERE menu_item_id = ?', [menu_item_id]);

    // 3. Handle ingredients
    if (ingredients && ingredients.length > 0) {
      for (const ing of ingredients) {
        let invItemId = ing.inventory_item_id;

        // If inventory_item_id is not provided but name is, check or create in inventory
        if (!invItemId && ing.ingredient_name) {
          const [exists] = await connection.query('SELECT id FROM inventory_items WHERE name = ?', [ing.ingredient_name]);
          if (exists.length > 0) {
            invItemId = exists[0].id;
          } else {
            // Auto-add new ingredient to inventory
            const [newInv] = await connection.query(
              'INSERT INTO inventory_items (name, category, unit, quantity, min_stock, unit_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [ing.ingredient_name, 'General', ing.unit || 'pcs', 0, 0, 0, 'Out of Stock']
            );
            invItemId = newInv.insertId;
          }
        }

        if (invItemId) {
          await connection.query(
            'INSERT INTO menu_recipes (menu_item_id, inventory_item_id, quantity_required) VALUES (?, ?, ?)',
            [menu_item_id, invItemId, parseFloat(ing.quantity_required || 0)]
          );
        }
      }
    }

    await connection.commit();
    res.json({ message: 'SOP updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating SOP:', error);
    res.status(500).json({ error: 'Failed to update SOP' });
  } finally {
    connection.release();
  }
};
