const db = require('../config/db');
const inventoryService = require('../services/InventoryService');

// Get all orders and their items
exports.getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT o.*, t.table_number 
      FROM orders o
      JOIN restaurant_tables t ON o.table_id = t.id
      ORDER BY o.created_at DESC
    `);
    
    // We can fetch order items for each order or separately.
    // For simplicity, we just return the orders to power the dashboard.
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get single order with items
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    
    if (orders.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    const [items] = await db.query(`
      SELECT oi.*, m.name, m.price as unit_price 
      FROM order_items oi
      JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE oi.order_id = ?
    `, [id]);
    
    const order = orders[0];
    order.items = items;
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// Get active order for a specific table
exports.getActiveTableOrder = async (req, res) => {
  try {
    const { tableId } = req.params;
    const [orders] = await db.query(
      "SELECT * FROM orders WHERE table_id = ? AND status NOT IN ('Cancelled', 'settled') ORDER BY created_at DESC LIMIT 1", 
      [tableId]
    );
    
    if (orders.length === 0) return res.status(404).json({ error: 'No active order found for this table' });
    
    const [items] = await db.query(`
      SELECT oi.*, m.name, m.price as unit_price 
      FROM order_items oi
      JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE oi.order_id = ?
    `, [orders[0].id]);
    
    const order = orders[0];
    order.items = items;
    res.json(order);
  } catch (error) {
    console.error('Error fetching active order:', error);
    res.status(500).json({ error: 'Failed to fetch active order' });
  }
};

// Create a new order
exports.createOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const { table_id, items, discount_percent } = req.body;
    
    if (!table_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Table ID and items are required' });
    }
    
    const discountPct = Math.min(100, Math.max(0, parseFloat(discount_percent) || 0));
    
    // Calculate total amount
    let total_amount = 0;
    for (const item of items) {
      total_amount += (parseFloat(item.price) * item.quantity);
    }
    
    // Insert order
    const [orderResult] = await connection.query(
      'INSERT INTO orders (table_id, status, total_amount, discount_percent) VALUES (?, ?, ?, ?)',
      [table_id, 'Pending', total_amount, discountPct]
    );
    const orderId = orderResult.insertId;
    
    // Insert order items
    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.menu_item_id, item.quantity, item.price]
      );
    }
    
    // Update table status to occupied
    await connection.query('UPDATE restaurant_tables SET status = ? WHERE id = ?', ['Occupied', table_id]);
    
    await connection.commit();
    res.status(201).json({ id: orderId, message: 'Order created successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    connection.release();
  }
};

// Update order status (and optionally clear table if completed)
exports.updateOrderStatus = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) return res.status(400).json({ error: 'Status is required' });
    
    await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    
    // Auto-deduct inventory if marked as Completed
    if (status === 'Completed') {
      await inventoryService.deductIngredientsForOrder(id, connection);
    }
    
    if (status === 'Completed' || status === 'Cancelled') {
      const [orders] = await connection.query('SELECT table_id FROM orders WHERE id = ?', [id]);
      if (orders.length > 0) {
        // Free the table
        await connection.query('UPDATE restaurant_tables SET status = ? WHERE id = ?', ['Available', orders[0].table_id]);
      }
    }
    
    await connection.commit();
    res.json({ message: 'Order status updated' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  } finally {
    connection.release();
  }
};

// Update existing order (edit items)
exports.updateOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { items, discount_percent } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }
    
    const discountPct = Math.min(100, Math.max(0, parseFloat(discount_percent) || 0));
    
    // Calculate total amount
    let total_amount = 0;
    for (const item of items) {
      total_amount += (parseFloat(item.price) * item.quantity);
    }
    
    // Update order total and discount
    await connection.query('UPDATE orders SET total_amount = ?, discount_percent = ? WHERE id = ?', [total_amount, discountPct, id]);
    
    // Delete existing order items
    await connection.query('DELETE FROM order_items WHERE order_id = ?', [id]);
    
    // Insert new order items
    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)',
        [id, item.menu_item_id, item.quantity, item.price]
      );
    }
    
    await connection.commit();
    res.json({ message: 'Order updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  } finally {
    connection.release();
  }
};
