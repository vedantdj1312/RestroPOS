const db = require('../config/db');

// Get all active kitchen orders (Pending + Preparing) with their items
exports.getKitchenOrders = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT o.id, o.table_id, o.status, o.total_amount, o.created_at,
             t.table_number
      FROM orders o
      JOIN restaurant_tables t ON o.table_id = t.id
      WHERE o.status IN ('Pending', 'Preparing')
      ORDER BY 
        CASE o.status 
          WHEN 'Pending' THEN 1 
          WHEN 'Preparing' THEN 2 
        END,
        o.created_at ASC
    `);

    // Fetch items for each order
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const [items] = await db.query(`
        SELECT oi.id, oi.menu_item_id, oi.quantity, oi.price,
               m.name, m.is_veg, m.prep_time, m.category_id,
               c.name as category_name
        FROM order_items oi
        JOIN menu_items m ON oi.menu_item_id = m.id
        LEFT JOIN categories c ON m.category_id = c.id
        WHERE oi.order_id = ?
      `, [order.id]);

      return { ...order, items };
    }));

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching kitchen orders:', error);
    res.status(500).json({ error: 'Failed to fetch kitchen orders' });
  }
};

// Mark order as Preparing (kitchen acknowledges the order)
exports.acceptOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("UPDATE orders SET status = 'Preparing' WHERE id = ? AND status = 'Pending'", [id]);
    res.json({ message: 'Order accepted — now preparing' });
  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({ error: 'Failed to accept order' });
  }
};

const inventoryService = require('../services/InventoryService');

// Mark order as Completed (kitchen finished preparing)
exports.completeOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    
    // 1. Update order status
    await connection.query("UPDATE orders SET status = 'Completed' WHERE id = ?", [id]);
    
    // 2. Automated Inventory Deduction based on SOP
    await inventoryService.deductIngredientsForOrder(id, connection);
    
    await connection.commit();
    res.json({ message: 'Order marked as completed and inventory deducted' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error completing order:', error);
    res.status(500).json({ error: 'Failed to complete order: ' + error.message });
  } finally {
    if (connection) connection.release();
  }
};

// Get kitchen order count (for sidebar badge)
exports.getKitchenCount = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM orders WHERE status IN ('Pending', 'Preparing')"
    );
    res.json({ count: rows[0].count });
  } catch (error) {
    console.error('Error fetching kitchen count:', error);
    res.status(500).json({ error: 'Failed to fetch count' });
  }
};
