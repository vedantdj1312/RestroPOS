import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  IndianRupee,
  ShoppingBag,
  Receipt,
  X,
  TrendingUp,
  UtensilsCrossed,
  Bike,
  Package
} from 'lucide-react';

// Simple SVG Line Chart component
function HourlyChart({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // If no data, show placeholder
    if (!data || data.length === 0) {
      ctx.fillStyle = '#4b5563';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No revenue data today', W / 2, H / 2);
      return;
    }

    // Chart area
    const padding = { top: 20, right: 20, bottom: 40, left: 55 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;

    // Find data range
    const maxRevenue = Math.max(...data.map(d => d.revenue), 100);
    const minHour = Math.min(...data.map(d => d.hour));
    const maxHour = Math.max(...data.map(d => d.hour));
    const hourRange = Math.max(maxHour - minHour, 1);

    // Grid lines
    const gridLines = 4;
    ctx.strokeStyle = 'rgba(75, 85, 99, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();

      // Y labels
      const val = Math.round(maxRevenue - (maxRevenue / gridLines) * i);
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val.toLocaleString(), padding.left - 8, y + 4);
    }
    ctx.setLineDash([]);

    // X labels
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px Inter, sans-serif';
    const formatHour = (h) => {
      if (h === 0) return '12AM';
      if (h < 12) return h + 'AM';
      if (h === 12) return '12PM';
      return (h - 12) + 'PM';
    };

    // Plot data points
    const points = data.map(d => ({
      x: padding.left + ((d.hour - minHour) / hourRange) * chartW,
      y: padding.top + chartH - (d.revenue / maxRevenue) * chartH
    }));

    // X axis labels
    data.forEach((d, i) => {
      ctx.fillText(formatHour(d.hour), points[i].x, H - padding.bottom + 20);
    });

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    gradient.addColorStop(0, 'rgba(249, 115, 22, 0.25)');
    gradient.addColorStop(1, 'rgba(249, 115, 22, 0.02)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, padding.top + chartH);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((p, i) => {
      if (i > 0) ctx.lineTo(p.x, p.y);
    });
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Draw dots
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#F97316';
      ctx.fill();
      ctx.strokeStyle = '#0f141e';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/dashboard');
      setStats(res.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      // Set empty fallback
      setStats({
        todaysRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        cancelledOrders: 0,
        hourlyRevenue: [],
        orderTypes: { dineIn: 0, takeaway: 0, delivery: 0 },
        tableStatus: { total: 15, occupied: 0, available: 15 },
        recentOrders: [],
        topItems: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return '₹' + Number(val).toLocaleString('en-IN');
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'settled' || s === 'confirmed') return { bg: 'rgba(16,185,129,0.15)', color: '#10B981' };
    if (s === 'pending') return { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' };
    if (s === 'cancelled') return { bg: 'rgba(239,68,68,0.15)', color: '#EF4444' };
    return { bg: 'rgba(156,163,175,0.15)', color: '#9CA3AF' };
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* ─── Top Stats Row ─── */}
      <div className="dashboard-stats-row">
        <div className="dash-stat-card">
          <div className="dash-stat-content">
            <span className="dash-stat-label">TODAY'S REVENUE</span>
            <h2 className="dash-stat-value">{formatCurrency(stats.todaysRevenue)}</h2>
            <span className="dash-stat-sub green">
              <TrendingUp size={13} /> Settled orders
            </span>
          </div>
          <div className="dash-stat-icon-wrap orange">
            <IndianRupee size={22} />
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-content">
            <span className="dash-stat-label">TOTAL ORDERS</span>
            <h2 className="dash-stat-value">{stats.totalOrders}</h2>
            <span className="dash-stat-sub blue">Today</span>
          </div>
          <div className="dash-stat-icon-wrap blue">
            <ShoppingBag size={22} />
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-content">
            <span className="dash-stat-label">AVG ORDER VALUE</span>
            <h2 className="dash-stat-value">{formatCurrency(stats.avgOrderValue)}</h2>
            <span className="dash-stat-sub blue">Per settled order</span>
          </div>
          <div className="dash-stat-icon-wrap purple">
            <Receipt size={22} />
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-content">
            <span className="dash-stat-label">CANCELLED</span>
            <h2 className="dash-stat-value">{stats.cancelledOrders}</h2>
            <span className="dash-stat-sub blue">Today</span>
          </div>
          <div className="dash-stat-icon-wrap red">
            <X size={22} />
          </div>
        </div>
      </div>

      {/* ─── Middle Row: Chart + Order Types ─── */}
      <div className="dashboard-mid-row">
        <div className="dash-chart-card card">
          <div className="dash-card-header">
            <h3>Hourly Revenue</h3>
            <span className="dash-card-badge">Today (₹)</span>
          </div>
          <div className="dash-chart-area">
            <HourlyChart data={stats.hourlyRevenue} />
          </div>
        </div>

        <div className="dash-order-types-card card">
          <div className="dash-card-header">
            <h3>Order Types</h3>
            <span className="dash-card-badge-muted">Today</span>
          </div>
          <div className="dash-order-type-list">
            <div className="dash-order-type-item">
              <div className="dash-ot-left">
                <UtensilsCrossed size={16} className="dash-ot-icon" />
                <span>Dine-in</span>
              </div>
              <span className="dash-ot-count">{stats.orderTypes.dineIn}</span>
            </div>
            <div className="dash-dot-indicator orange"></div>
            <div className="dash-order-type-item">
              <div className="dash-ot-left">
                <Package size={16} className="dash-ot-icon" />
                <span>Takeaway</span>
              </div>
              <span className="dash-ot-count">{stats.orderTypes.takeaway}</span>
            </div>
            <div className="dash-order-type-item">
              <div className="dash-ot-left">
                <Bike size={16} className="dash-ot-icon" />
                <span>Delivery</span>
              </div>
              <span className="dash-ot-count">{stats.orderTypes.delivery}</span>
            </div>
          </div>

          {/* Table Occupancy */}
          <div className="dash-table-occupancy">
            <div className="dash-occ-card occupied">
              <span className="dash-occ-label">Occupied</span>
              <span className="dash-occ-value red">
                {stats.tableStatus.occupied}/{stats.tableStatus.total}
              </span>
            </div>
            <div className="dash-occ-card available">
              <span className="dash-occ-label">Available</span>
              <span className="dash-occ-value green">{stats.tableStatus.available}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom Row: Recent Orders + Top Items ─── */}
      <div className="dashboard-bottom-row">
        <div className="dash-recent-orders card">
          <div className="dash-card-header">
            <h3>Recent Orders</h3>
            <span className="dash-card-badge-muted">Latest {stats.recentOrders.length}</span>
          </div>
          {stats.recentOrders.length === 0 ? (
            <div className="dash-empty-state">
              <ShoppingBag size={32} />
              <p>No orders yet today</p>
            </div>
          ) : (
            <div className="dash-orders-table-wrap">
              <table className="dash-orders-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>TABLE</th>
                    <th>ITEMS</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                    <th>TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map(order => {
                    const sc = getStatusColor(order.status);
                    return (
                      <tr key={order.id}>
                        <td className="order-id">#{order.id}</td>
                        <td>T{order.tableNumber}</td>
                        <td>{order.itemCount} items</td>
                        <td className="order-amount">{formatCurrency(order.amount)}</td>
                        <td>
                          <span className="order-status-badge" style={{ background: sc.bg, color: sc.color }}>
                            {order.status}
                          </span>
                        </td>
                        <td className="order-time">{formatTime(order.time)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="dash-top-items card">
          <div className="dash-card-header">
            <h3>Top Items</h3>
            <span className="dash-card-badge-muted">Today</span>
          </div>
          {stats.topItems.length === 0 ? (
            <div className="dash-empty-state">
              <UtensilsCrossed size={32} />
              <p>No item data yet</p>
            </div>
          ) : (
            <div className="dash-top-items-list">
              {stats.topItems.map((item, index) => (
                <div key={index} className="dash-top-item">
                  <div className="dash-top-item-rank" data-rank={index + 1}>
                    {index + 1}
                  </div>
                  <span className="dash-top-item-name">{item.name}</span>
                  <span className="dash-top-item-qty">×{item.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
