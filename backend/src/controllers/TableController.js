const db = require('../config/db');

// Get all tables
exports.getAllTables = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT t.*, 
        (SELECT id FROM orders WHERE table_id = t.id AND status NOT IN ('Cancelled', 'settled') ORDER BY created_at DESC LIMIT 1) as active_order_id,
        (SELECT created_at FROM orders WHERE table_id = t.id AND status NOT IN ('Cancelled', 'settled') ORDER BY created_at DESC LIMIT 1) as occupied_at
      FROM restaurant_tables t
      ORDER BY t.table_number ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
};

// Update Table Status
exports.updateTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (status === 'Available') {
      await db.query('UPDATE restaurant_tables SET status = ?, reserved_at = NULL WHERE id = ?', [status, id]);
    } else {
      await db.query('UPDATE restaurant_tables SET status = ? WHERE id = ?', [status, id]);
    }
    res.json({ message: 'Table status updated' });
  } catch (error) {
    console.error('Error updating table status:', error);
    res.status(500).json({ error: 'Failed to update table status' });
  }
};

// Add new table
exports.addTable = async (req, res) => {
  try {
    const { table_number, seating_capacity } = req.body;
    if (!table_number) return res.status(400).json({ error: 'Table number is required' });

    const [result] = await db.query('INSERT INTO restaurant_tables (table_number, seating_capacity) VALUES (?, ?)', [table_number, seating_capacity || 4]);
    res.status(201).json({ id: result.insertId, table_number, status: 'Available', seating_capacity: seating_capacity || 4 });
  } catch (error) {
    console.error('Error adding table:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Table number already exists' });
    }
    res.status(500).json({ error: 'Failed to add table' });
  }
};

// Remove table
exports.removeTable = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM restaurant_tables WHERE id = ?', [id]);
    res.json({ message: 'Table removed successfully' });
  } catch (error) {
    console.error('Error removing table:', error);
    res.status(500).json({ error: 'Failed to remove table' });
  }
};

// Print Bill
exports.printBill = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE restaurant_tables SET status = "Billed" WHERE id = ?', [id]);
    res.json({ message: 'Bill printed successfully' });
  } catch (error) {
    console.error('Error printing bill:', error);
    res.status(500).json({ error: 'Failed to print bill' });
  }
};

// Pay Bill
exports.payBill = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { payment_method, paid_amount } = req.body;

    if (!payment_method || !paid_amount) {
      return res.status(400).json({ error: 'Payment method and amount are required' });
    }

    // Update the table status to 'Paid' (it stays 'Paid' until cleared)
    await connection.query('UPDATE restaurant_tables SET status = "Paid" WHERE id = ?', [id]);
    
    // Update the order status to 'settled' and store payment info
    await connection.query(`
      UPDATE orders 
      SET status = 'settled', 
          payment_method = ?, 
          paid_amount = ? 
      WHERE table_id = ? AND status NOT IN ('Cancelled', 'settled')
    `, [payment_method, paid_amount, id]);
    
    await connection.commit();
    res.json({ message: 'Payment confirmed and table marked as Paid' });
  } catch (error) {
    await connection.rollback();
    console.error('Error paying bill:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  } finally {
    connection.release();
  }
};

// Clear Table (Reset to Available)
exports.clearTable = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE restaurant_tables SET status = "Available", reserved_at = NULL WHERE id = ?', [id]);
    res.json({ message: 'Table cleared and available' });
  } catch (error) {
    console.error('Error clearing table:', error);
    res.status(500).json({ error: 'Failed to clear table' });
  }
};

// Reset All Tables
exports.resetAllTables = async (req, res) => {
  try {
    await db.query('UPDATE restaurant_tables SET status = "Available", reserved_at = NULL');
    await db.query(`
      UPDATE orders SET status = 'Cancelled' 
      WHERE status NOT IN ('Cancelled', 'settled')
    `);
    res.json({ message: 'All tables reset successfully' });
  } catch (error) {
    console.error('Error resetting all tables:', error);
    res.status(500).json({ error: 'Failed to reset tables' });
  }
};

// Reserve Table
exports.reserveTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { reserved_at } = req.body;
    
    if (!reserved_at) return res.status(400).json({ error: 'Reservation time required' });
    
    // Parse to JS Date object which mysql2 natively supports for DATETIME columns
    const reservedDate = new Date(reserved_at);
    
    await db.query('UPDATE restaurant_tables SET status = "Reserved", reserved_at = ? WHERE id = ?', [reservedDate, id]);
    res.json({ message: 'Table reserved successfully' });
  } catch (error) {
    console.error('Error reserving table:', error);
    res.status(500).json({ error: 'Failed to reserve table' });
  }
};
