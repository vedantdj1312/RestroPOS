const db = require('../config/db');

// Register a new customer (sign-up)
exports.registerCustomer = async (req, res) => {
  try {
    const { name, contact } = req.body;

    if (!name || !contact) {
      return res.status(400).json({ error: 'Name and email/phone are required' });
    }

    // Check if customer already exists
    const [existing] = await db.query(
      'SELECT * FROM customers WHERE contact = ?',
      [contact]
    );

    if (existing.length > 0) {
      // Return existing customer (auto-login)
      return res.json({ customer: existing[0], message: 'Welcome back!' });
    }

    // Create new customer
    const [result] = await db.query(
      'INSERT INTO customers (name, contact) VALUES (?, ?)',
      [name, contact]
    );

    const [newCustomer] = await db.query('SELECT * FROM customers WHERE id = ?', [result.insertId]);

    res.status(201).json({ customer: newCustomer[0], message: 'Welcome! Account created.' });
  } catch (error) {
    console.error('Error registering customer:', error);
    res.status(500).json({ error: 'Failed to register customer' });
  }
};

// Get all customers with order stats (for admin view)
exports.getAllCustomers = async (req, res) => {
  try {
    const [customers] = await db.query(`
      SELECT 
        c.*,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

// Customer places an order (table_id, items, customer_id)
exports.customerPlaceOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { table_id, items, customer_id } = req.body;

    if (!table_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Table and items are required' });
    }

    // Verify table is Available
    const [tables] = await connection.query('SELECT * FROM restaurant_tables WHERE id = ?', [table_id]);
    if (tables.length === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }
    if (tables[0].status !== 'Available') {
      return res.status(400).json({ error: 'Table is not available. Please choose another table.' });
    }

    // Calculate total
    let total_amount = 0;
    for (const item of items) {
      total_amount += parseFloat(item.price) * item.quantity;
    }

    // Insert order with customer_id
    const [orderResult] = await connection.query(
      'INSERT INTO orders (table_id, status, total_amount, customer_id) VALUES (?, ?, ?, ?)',
      [table_id, 'Pending', total_amount, customer_id || null]
    );
    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.menu_item_id, item.quantity, item.price]
      );
    }

    // Mark table as Occupied
    await connection.query('UPDATE restaurant_tables SET status = ? WHERE id = ?', ['Occupied', table_id]);

    await connection.commit();
    res.status(201).json({ id: orderId, message: 'Order placed successfully! Your food is being prepared.' });
  } catch (error) {
    await connection.rollback();
    console.error('Error placing customer order:', error);
    res.status(500).json({ error: 'Failed to place order' });
  } finally {
    connection.release();
  }
};

// Get status of a specific order (public)
exports.getOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Get order details
    const [orders] = await db.query(`
      SELECT o.*, t.table_number 
      FROM orders o
      JOIN restaurant_tables t ON o.table_id = t.id
      WHERE o.id = ?
    `, [id]);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items and prep time
    const [items] = await db.query(`
      SELECT oi.*, m.name, m.prep_time, m.is_veg
      FROM order_items oi
      JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE oi.order_id = ?
    `, [id]);

    const order = orders[0];
    order.items = items;
    
    // Calculate estimated time (max prep time of any item)
    const maxPrepTime = items.reduce((max, item) => Math.max(max, item.prep_time || 15), 0);
    order.max_prep_time = maxPrepTime;

    res.json(order);
  } catch (error) {
    console.error('Error fetching order status:', error);
    res.status(500).json({ error: 'Failed to fetch order status' });
  }
};

// Customer updates their pending order (add/remove items)
exports.updateCustomerOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const { items, customer_id } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    await connection.beginTransaction();

    // 1. Verify order is still Pending
    const [orders] = await connection.query('SELECT status FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }
    if (orders[0].status !== 'Pending') {
      await connection.rollback();
      return res.status(400).json({ error: 'Order is already being prepared and cannot be edited. Please place a new order.' });
    }

    // 2. Calculate new total
    let total_amount = 0;
    for (const item of items) {
      total_amount += parseFloat(item.price) * item.quantity;
    }

    // 3. Update order total amount
    await connection.query('UPDATE orders SET total_amount = ? WHERE id = ?', [total_amount, id]);

    // 4. Replace items (Delete old, Insert new)
    await connection.query('DELETE FROM order_items WHERE order_id = ?', [id]);
    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)',
        [id, item.menu_item_id, item.quantity, item.price]
      );
    }

    await connection.commit();
    res.json({ id, message: 'Order updated successfully!' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating customer order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  } finally {
    connection.release();
  }
};
