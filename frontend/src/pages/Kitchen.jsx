import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  UtensilsCrossed,
  Timer,
  Zap,
  RefreshCw
} from 'lucide-react';

const API = 'http://localhost:5000/api';

// Calculate elapsed minutes since order was created
function getElapsed(createdAt) {
  const diff = Date.now() - new Date(createdAt).getTime();
  return Math.floor(diff / 60000);
}

// Format elapsed time nicely
function formatElapsed(minutes) {
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m ago`;
}

// Urgency level based on elapsed time
function getUrgency(minutes) {
  if (minutes >= 30) return 'critical';
  if (minutes >= 15) return 'warning';
  return 'normal';
}

export default function Kitchen({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0); // force re-render for timers
  const intervalRef = useRef(null);
  const [filter, setFilter] = useState('all'); // all | Pending | Preparing

  useEffect(() => {
    fetchOrders();

    // Auto-refresh every 10 seconds to pick up new orders
    const refreshInterval = setInterval(fetchOrders, 10000);

    // Tick every 30 seconds for timer updates
    intervalRef.current = setInterval(() => setTick(t => t + 1), 30000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(intervalRef.current);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API}/kitchen/orders`);
      setOrders(res.data);
    } catch (error) {
      console.error('Error fetching kitchen orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (orderId) => {
    try {
      await axios.patch(`${API}/kitchen/${orderId}/accept`);
      fetchOrders();
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  const handleComplete = async (orderId) => {
    try {
      await axios.patch(`${API}/kitchen/${orderId}/complete`);
      fetchOrders();
    } catch (error) {
      console.error('Error completing order:', error);
    }
  };

  // Stats
  const pendingCount = orders.filter(o => o.status === 'Pending').length;
  const preparingCount = orders.filter(o => o.status === 'Preparing').length;
  const totalItems = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0);

  // Filter orders
  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  return (
    <div className="kitchen-page">
      {/* Stats Strip */}
      <div className="kitchen-stats-strip">
        <div className="kitchen-stat-pill">
          <div className="kitchen-stat-icon pending-icon">
            <AlertCircle size={18} />
          </div>
          <div>
            <span className="kitchen-stat-num">{pendingCount}</span>
            <span className="kitchen-stat-lbl">New Orders</span>
          </div>
        </div>
        <div className="kitchen-stat-pill">
          <div className="kitchen-stat-icon preparing-icon">
            <Flame size={18} />
          </div>
          <div>
            <span className="kitchen-stat-num">{preparingCount}</span>
            <span className="kitchen-stat-lbl">Preparing</span>
          </div>
        </div>
        <div className="kitchen-stat-pill">
          <div className="kitchen-stat-icon items-icon">
            <UtensilsCrossed size={18} />
          </div>
          <div>
            <span className="kitchen-stat-num">{totalItems}</span>
            <span className="kitchen-stat-lbl">Total Items</span>
          </div>
        </div>

        {/* Right side: filter + refresh */}
        <div className="kitchen-controls">
          <div className="kitchen-filter-group">
            <button
              className={`kitchen-filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({orders.length})
            </button>
            <button
              className={`kitchen-filter-btn ${filter === 'Pending' ? 'active' : ''}`}
              onClick={() => setFilter('Pending')}
            >
              New ({pendingCount})
            </button>
            <button
              className={`kitchen-filter-btn ${filter === 'Preparing' ? 'active' : ''}`}
              onClick={() => setFilter('Preparing')}
            >
              Cooking ({preparingCount})
            </button>
          </div>
          <button className="kitchen-refresh-btn" onClick={fetchOrders} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="kitchen-loading">
          <div className="loading-spinner" />
          <p>Loading kitchen orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="kitchen-empty">
          <ChefHat size={64} strokeWidth={1} />
          <h3>Kitchen is clear!</h3>
          <p>No active orders right now. New orders will appear here automatically.</p>
        </div>
      ) : (
        <div className="kitchen-orders-grid">
          {filteredOrders.map(order => {
            const elapsed = getElapsed(order.created_at);
            const urgency = getUrgency(elapsed);
            const isPending = order.status === 'Pending';
            const isPreparing = order.status === 'Preparing';

            return (
              <div
                key={order.id}
                className={`kot-card ${isPending ? 'kot-pending' : 'kot-preparing'} ${urgency === 'critical' ? 'kot-critical' : ''} ${urgency === 'warning' ? 'kot-warning' : ''}`}
              >
                {/* KOT Header */}
                <div className="kot-header">
                  <div className="kot-header-left">
                    <span className="kot-order-id">#{order.id}</span>
                    <span className={`kot-status-badge ${isPending ? 'badge-pending' : 'badge-preparing'}`}>
                      {isPending ? (
                        <><Zap size={11} /> NEW</>
                      ) : (
                        <><Flame size={11} /> COOKING</>
                      )}
                    </span>
                  </div>
                  <div className="kot-table-badge">
                    T{order.table_number}
                  </div>
                </div>

                {/* Timer */}
                <div className={`kot-timer ${urgency}`}>
                  <Timer size={14} />
                  <span>{formatElapsed(elapsed)}</span>
                  {urgency === 'critical' && <span className="kot-urgent-text">⚠ URGENT</span>}
                </div>

                {/* Items List */}
                <div className="kot-items">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="kot-item">
                      <div className="kot-item-left">
                        <span className={`kot-veg-dot ${item.is_veg ? 'veg' : 'nonveg'}`} />
                        <span className="kot-item-qty">{item.quantity}x</span>
                        <span className="kot-item-name">{item.name}</span>
                      </div>
                      {item.category_name && (
                        <span className="kot-item-cat">{item.category_name}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                {['Owner/Admin', 'Manager', 'Kitchen Staff'].includes(user?.role) && (
                  <div className="kot-actions">
                    {isPending && (
                      <button
                        className="kot-action-btn kot-accept-btn"
                        onClick={() => handleAccept(order.id)}
                      >
                        <Flame size={16} />
                        Start Preparing
                      </button>
                    )}
                    {isPreparing && (
                      <button
                        className="kot-action-btn kot-complete-btn"
                        onClick={() => handleComplete(order.id)}
                      >
                        <CheckCircle2 size={16} />
                        Mark Ready
                      </button>
                    )}
                  </div>
                )}

                {/* Order timestamp */}
                <div className="kot-timestamp">
                  <Clock size={11} />
                  {new Date(order.created_at).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
