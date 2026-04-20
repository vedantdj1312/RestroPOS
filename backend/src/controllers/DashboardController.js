const db = require('../config/db');

// Get comprehensive dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    // Get today's date boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    // 1. Today's orders
    const [todayOrders] = await db.query(
      `SELECT * FROM orders WHERE DATE(created_at) = CURDATE()`
    );

    // 2. Settled/Completed orders for revenue
    const [settledOrders] = await db.query(
      `SELECT * FROM orders WHERE DATE(created_at) = CURDATE() AND status IN ('Completed', 'Settled', 'confirmed', 'settled')`
    );

    // 3. Cancelled orders today
    const [cancelledOrders] = await db.query(
      `SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE() AND status IN ('Cancelled', 'cancelled')`
    );

    // 4. Revenue calculation
    const totalRevenue = settledOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    const avgOrderValue = settledOrders.length > 0 ? totalRevenue / settledOrders.length : 0;

    // 5. Hourly revenue for chart
    const [hourlyData] = await db.query(`
      SELECT HOUR(created_at) as hour, SUM(total_amount) as revenue
      FROM orders
      WHERE DATE(created_at) = CURDATE() AND status IN ('Completed', 'Settled', 'confirmed', 'settled')
      GROUP BY HOUR(created_at)
      ORDER BY hour ASC
    `);

    // 6. Tables info
    const [tables] = await db.query('SELECT * FROM restaurant_tables');
    const totalTables = tables.length;
    const occupiedTables = tables.filter(t => t.status === 'Occupied').length;
    const availableTables = totalTables - occupiedTables;

    // 7. Recent orders (latest 4) with item counts and table numbers
    const [recentOrders] = await db.query(`
      SELECT o.id, o.table_id, o.status, o.total_amount, o.created_at,
             t.table_number,
             (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
      FROM orders o
      JOIN restaurant_tables t ON o.table_id = t.id
      ORDER BY o.created_at DESC
      LIMIT 4
    `);

    // 8. Top selling items today
    const [topItems] = await db.query(`
      SELECT m.name, SUM(oi.quantity) as total_qty
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE DATE(o.created_at) = CURDATE()
      GROUP BY m.name
      ORDER BY total_qty DESC
      LIMIT 5
    `);

    // 9. Order types count (dine-in = has table, we'll consider all as dine-in for now)
    const [dineInCount] = await db.query(
      `SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE() AND table_id IS NOT NULL`
    );

    res.json({
      todaysRevenue: totalRevenue,
      totalOrders: todayOrders.length,
      avgOrderValue: Math.round(avgOrderValue),
      cancelledOrders: cancelledOrders[0].count,
      hourlyRevenue: hourlyData.map(h => ({
        hour: h.hour,
        revenue: parseFloat(h.revenue)
      })),
      orderTypes: {
        dineIn: dineInCount[0].count,
        takeaway: 0,
        delivery: 0
      },
      tableStatus: {
        total: totalTables,
        occupied: occupiedTables,
        available: availableTables
      },
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        tableNumber: o.table_number,
        itemCount: o.item_count,
        amount: parseFloat(o.total_amount),
        status: o.status,
        time: o.created_at
      })),
      topItems: topItems.map(item => ({
        name: item.name,
        quantity: item.total_qty
      }))
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};
