const db = require('../config/db');

// Get comprehensive report data for a specific date range
// All sections (sales, item-wise, payments, GST) are driven from real order data
exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // ═══════ 1. Overall summary stats ═══════
    const [overallStats] = await db.query(`
      SELECT 
        COUNT(*) as totalOrders,
        SUM(CASE WHEN status NOT IN ('Cancelled', 'cancelled') THEN total_amount ELSE 0 END) as totalRevenue,
        COUNT(CASE WHEN status IN ('Cancelled', 'cancelled') THEN 1 END) as cancelledCount
      FROM orders
      WHERE DATE(created_at) BETWEEN ? AND ?
    `, [startDate, endDate]);

    const stats = overallStats[0];
    const revenue = parseFloat(stats.totalRevenue || 0);
    const totalOrders = parseInt(stats.totalOrders || 0);
    const cancelledOrders = parseInt(stats.cancelledCount || 0);
    const validOrders = totalOrders - cancelledOrders;
    const avgOrder = validOrders > 0 ? Math.round(revenue / validOrders) : 0;
    const gst = Math.round(revenue * 0.05 * 100) / 100; // 5% GST

    // ═══════ 2. Daily breakdown for charts and table ═══════
    const [dailyAggregation] = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        COUNT(CASE WHEN status IN ('Cancelled', 'cancelled') THEN 1 END) as cancelled,
        SUM(CASE WHEN status NOT IN ('Cancelled', 'cancelled') THEN total_amount ELSE 0 END) as revenue
      FROM orders
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [startDate, endDate]);

    const dailyData = dailyAggregation.map(day => {
      const dayRevenue = parseFloat(day.revenue || 0);
      const dayOrders = parseInt(day.orders || 0);
      const dayCancelled = parseInt(day.cancelled || 0);
      const dayValid = dayOrders - dayCancelled;
      return {
        date: new Date(day.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        fullDate: new Date(day.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        orders: dayOrders,
        cancelled: dayCancelled,
        revenue: dayRevenue,
        avgOrder: dayValid > 0 ? Math.round(dayRevenue / dayValid) : 0,
        gst: Math.round(dayRevenue * 0.05 * 100) / 100
      };
    });

    // ═══════ 3. Item-wise breakdown ═══════
    const [itemWiseData] = await db.query(`
      SELECT 
        m.name,
        c.name as category,
        SUM(oi.quantity) as quantity,
        SUM(oi.quantity * oi.price) as revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN menu_items m ON oi.menu_item_id = m.id
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE DATE(o.created_at) BETWEEN ? AND ?
        AND o.status NOT IN ('Cancelled', 'cancelled')
      GROUP BY m.id, m.name, c.name
      ORDER BY revenue DESC
    `, [startDate, endDate]);

    const formattedItemData = itemWiseData.map(item => ({
      name: item.name,
      category: item.category || 'Other',
      quantity: parseInt(item.quantity),
      revenue: parseFloat(item.revenue || 0)
    }));

    // ═══════ 4. GST daily breakdown ═══════
    const gstData = dailyData.map(day => ({
      date: day.fullDate,
      taxable: day.revenue,
      cgst: Math.round(day.revenue * 0.025 * 100) / 100,
      sgst: Math.round(day.revenue * 0.025 * 100) / 100,
      total: Math.round(day.revenue * 0.05 * 100) / 100
    }));

    res.json({
      summary: {
        totalRevenue: revenue,
        totalOrders: totalOrders,
        validOrders: validOrders,
        avgOrderValue: avgOrder,
        totalGst: gst,
        cancelledOrders: cancelledOrders
      },
      dailyData,
      itemWiseData: formattedItemData,
      gstData
    });
  } catch (error) {
    console.error('Error fetching sales report:', error);
    res.status(500).json({ error: 'Failed to fetch sales report' });
  }
};
