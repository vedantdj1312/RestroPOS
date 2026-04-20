import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import patternImg from '../assets/food_pattern.png';

const API = 'http://localhost:5000/api';

export default function CustomerMenu({ customer, onLogout }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tables, setTables] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [isUpdatingOrderId, setIsUpdatingOrderId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, catRes, tablesRes] = await Promise.all([
        axios.get(`${API}/items`),
        axios.get(`${API}/categories`),
        axios.get(`${API}/tables`)
      ]);
      setItems(itemsRes.data); // Removed the is_available filter so we can show "Out of Stock"
      setCategories(catRes.data);
      // Only show available tables
      setTables(tablesRes.data.filter(t => t.status === 'Available'));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    if (!item.computed_available) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  const gst = subtotal * 0.05;
  const grandTotal = subtotal + gst;
  const totalItems = cart.reduce((c, i) => c + i.quantity, 0);

  const filteredItems = items.filter(item => {
    const matchCat = activeCategory === 'all' || item.category_id === activeCategory;
    const matchSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const getCartQty = (id) => {
    const ci = cart.find(i => i.id === id);
    return ci ? ci.quantity : 0;
  };

  const handlePlaceOrder = async () => {
    if (!selectedTable) return;
    if (cart.length === 0) return;

    setPlacing(true);
    try {
      let res;
      if (isUpdatingOrderId) {
        // Update existing order
        res = await axios.put(`${API}/customers/order/${isUpdatingOrderId}`, {
          customer_id: customer?.id || null,
          items: cart.map(item => ({
            menu_item_id: item.id,
            quantity: item.quantity,
            price: item.price
          }))
        });
      } else {
        // Create new order
        res = await axios.post(`${API}/customers/order`, {
          table_id: selectedTable,
          customer_id: customer?.id || null,
          items: cart.map(item => ({
            menu_item_id: item.id,
            quantity: item.quantity,
            price: item.price
          }))
        });
      }

      const orderId = isUpdatingOrderId || res.data.id;

      setOrderDetails({
        orderId: orderId,
        table: tables.find(t => t.id === parseInt(selectedTable)) || orderDetails?.table,
        items: [...cart],
        subtotal,
        gst,
        grandTotal
      });
      setOrderPlaced(true);
      setCart([]);
      setIsUpdatingOrderId(null);
      setShowCart(false);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  // ═══════ LIVE TRACKING VIEW ═══════
  const [liveStatus, setLiveStatus] = useState('Pending');
  const [liveOrder, setLiveOrder] = useState(null);

  useEffect(() => {
    let interval;
    if (orderPlaced && orderDetails?.orderId) {
      // Fetch initial status
      fetchLiveStatus();
      // Polling every 10 seconds
      interval = setInterval(fetchLiveStatus, 10000);
    }
    return () => clearInterval(interval);
  }, [orderPlaced, orderDetails]);

  const fetchLiveStatus = async () => {
    try {
      const res = await axios.get(`${API}/customers/order/${orderDetails.orderId}`);
      setLiveStatus(res.data.status);
      setLiveOrder(res.data);
    } catch (err) {
      console.error('Error polling order status:', err);
    }
  };

  if (orderPlaced && orderDetails) {
    const statusSteps = ['Pending', 'Preparing', 'Completed'];
    const currentStepIndex = statusSteps.indexOf(liveStatus === 'confirmed' ? 'Preparing' : liveStatus);
    
    return (
      <div className="cust-page tracking-view">
        <div className="cust-bg-pattern" style={{ backgroundImage: `url(${patternImg})` }} />
        
        <div className="cust-tracking-container">
          {/* Video Placeholder Area */}
          <div className="cust-video-placeholder">
            <div className="cust-video-overlay">
              <span>Your Special Dish is on its way!</span>
              <p>Exclusive Kitchen View Coming Soon...</p>
            </div>
            {/* Future Video Tag goes here */}
            <div className="cust-video-aspect-ratio" />
          </div>

          <div className="cust-success-card tracking-card">
            <div className="cust-tracking-header">
              <h1>{liveStatus === 'Completed' ? 'Your Meal is Ready!' : 'Tracking Your Order'}</h1>
              <p className="order-id-badge">Order #{orderDetails.orderId}</p>
            </div>

            {/* Preparation Timer & Progress */}
            <div className="cust-status-tracker">
              <div className="tracker-steps">
                {statusSteps.map((step, idx) => (
                  <React.Fragment key={step}>
                    <div className={`tracker-step ${idx <= currentStepIndex ? 'active' : ''} ${idx < currentStepIndex ? 'completed' : ''}`}>
                      <div className="step-dot" />
                      <span className="step-label">{step}</span>
                    </div>
                    {idx < statusSteps.length - 1 && <div className={`step-line ${idx < currentStepIndex ? 'filled' : ''}`} />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {liveStatus !== 'Completed' ? (
              <div className="cust-et-box">
                <div className="et-content">
                  <span className="et-icon">⏱️</span>
                  <div className="et-text">
                    <span className="et-label">Estimated Preparation Time</span>
                    <span className="et-value">{liveOrder?.max_prep_time || orderDetails?.items?.reduce((m, i) => Math.max(m, i.prep_time || 15), 0)} Minutes</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="cust-order-ready-msg">
                <span className="ready-icon">🍽️</span>
                <h2>Your Order Is There!</h2>
                <p>Please enjoy your delicious meal.</p>
              </div>
            )}

            <div className="cust-order-summary-mini">
              <h3>Order Details</h3>
              <div className="summary-row">
                <span>Table {orderDetails.table?.table_number}</span>
                <span>{orderDetails.items.length} Items</span>
              </div>
              <div className="summary-items-list">
                {orderDetails.items.map((item, idx) => (
                  <div key={idx} className="mini-item">
                    <span>{item.quantity}x {item.name}</span>
                    <span>₹{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="cust-tracking-actions">
              {liveStatus === 'Pending' && (
                <button 
                  className="cust-success-btn secondary"
                  onClick={() => {
                    // Populate cart with existing items
                    setCart(liveOrder?.items?.map(item => ({
                      ...item,
                      id: item.menu_item_id, // Map database ID to cart ID
                      price: item.price
                    })) || []);
                    setIsUpdatingOrderId(orderDetails.orderId);
                    setSelectedTable(orderDetails.table.id.toString());
                    setOrderPlaced(false);
                  }}
                >
                  Edit Order
                </button>
              )}
              <button 
                className="cust-success-btn primary" 
                onClick={() => {
                  setOrderPlaced(false);
                  setOrderDetails(null);
                  setSelectedTable('');
                  setIsUpdatingOrderId(null);
                  fetchData();
                }}
              >
                Order More
              </button>
              <button className="cust-back-btn" onClick={() => { onLogout(); navigate('/'); }}>
                Exit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════ MAIN MENU PAGE ═══════
  return (
    <div className="cust-page">
      <div className="cust-bg-pattern" style={{ backgroundImage: `url(${patternImg})` }} />

      {/* Top Nav */}
      <header className="cust-topbar">
        <div className="cust-topbar-left">
          <div>
            <h1 className="cust-topbar-title">Grand Spice Kitchen</h1>
            <p className="cust-topbar-sub">Hi, {customer?.name || 'Guest'}!</p>
          </div>
        </div>
        <div className="cust-topbar-right">
          {/* Table Selector */}
          <div className="cust-table-select">
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="cust-table-dropdown"
            >
              <option value="">Select your table</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>Table {t.table_number} (seats {t.seating_capacity})</option>
              ))}
            </select>
          </div>
          {/* Cart Button */}
          <button className="cust-cart-btn" onClick={() => setShowCart(true)}>
            🛒
            {totalItems > 0 && <span className="cust-cart-badge">{totalItems}</span>}
          </button>
          <button className="cust-exit-btn" onClick={() => { onLogout(); navigate('/'); }}>Exit</button>
        </div>
      </header>

      {/* Search */}
      <div className="cust-search-area">
        <div className="cust-search-box">
          <input
            type="text"
            placeholder="Search for dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="cust-categories">
        <button
          className={`cust-cat-btn ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`cust-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {getCatEmoji(cat.name)} {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      {loading ? (
        <div className="cust-loading">
          <div className="cust-spinner-lg" />
          <p>Loading delicious menu...</p>
        </div>
      ) : (
        <div className="cust-menu-grid">
          {filteredItems.length === 0 ? (
            <div className="cust-empty-menu">
              <p>No dishes found. Try a different search!</p>
            </div>
          ) : (
            filteredItems.map(item => {
              const inCart = getCartQty(item.id);
              const isOut = !item.computed_available;
              return (
                <div key={item.id} className={`cust-menu-card ${inCart > 0 ? 'in-cart' : ''} ${isOut ? 'out-of-stock' : ''}`} style={{ opacity: isOut ? 0.6 : 1, position: 'relative' }}>
                  {isOut && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#EF4444', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', zIndex: 5, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      OUT OF STOCK
                    </div>
                  )}
                  {/* Veg/Non-veg badge */}
                  <div className="cust-card-top">
                    <span className={`cust-veg-tag ${item.is_veg ? 'veg' : 'nonveg'}`}>
                      {item.is_veg ? 'Veg' : 'Non-Veg'}
                    </span>
                    <span className="cust-prep-time">⏱️ {item.prep_time || 15}m</span>
                  </div>

                  {/* Item info */}
                  <h3 className="cust-card-name">{item.name}</h3>
                  {item.description && (
                    <p className="cust-card-desc">{item.description}</p>
                  )}
                  <p className="cust-card-cat">{item.category_name}</p>
                  <div className="cust-card-price">₹{parseFloat(item.price).toFixed(0)}</div>

                  {/* Add-to-cart controls */}
                  {inCart > 0 ? (
                    <div className="cust-qty-controls">
                      <button className="cust-qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                      <span className="cust-qty-value">{inCart}</span>
                      <button className="cust-qty-btn" onClick={() => updateQty(item.id, 1)} disabled={isOut}>+</button>
                    </div>
                  ) : (
                    <button className="cust-add-btn" onClick={() => addToCart(item)} disabled={isOut} style={{ background: isOut ? '#ccc' : '', cursor: isOut ? 'not-allowed' : 'pointer', color: isOut ? '#666' : '' }}>
                      {isOut ? 'Unavailable' : '+ Add to Order'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Floating cart summary */}
      {totalItems > 0 && !showCart && (
        <div className="cust-floating-bar" onClick={() => setShowCart(true)}>
          <div className="cust-float-left">
            <span className="cust-float-count">{totalItems} item{totalItems > 1 ? 's' : ''}</span>
            <span className="cust-float-total">₹{grandTotal.toFixed(2)}</span>
          </div>
          <span className="cust-float-action">View Cart →</span>
        </div>
      )}

      {/* Cart Slide-Over */}
      {showCart && (
        <div className="cust-cart-overlay" onClick={() => setShowCart(false)}>
          <div className="cust-cart-panel" onClick={(e) => e.stopPropagation()}>
            <div className="cust-cart-header">
              <h2>🛒 Your Order</h2>
              <button onClick={() => setShowCart(false)} className="cust-cart-close">✕</button>
            </div>

            {cart.length === 0 ? (
              <div className="cust-cart-empty">
                <span style={{ fontSize: '3rem' }}>🛒</span>
                <p>Your cart is empty</p>
                <p className="cust-cart-empty-sub">Add delicious items from the menu</p>
              </div>
            ) : (
              <>
                {/* Table selection in cart */}
                {!selectedTable && (
                  <div className="cust-cart-table-alert">
                    <div>
                      <strong>Please select your table</strong>
                      <select
                        value={selectedTable}
                        onChange={(e) => setSelectedTable(e.target.value)}
                        className="cust-cart-table-select"
                      >
                        <option value="">Choose table...</option>
                        {tables.map(t => (
                          <option key={t.id} value={t.id}>Table {t.table_number}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {selectedTable && (
                  <div className="cust-cart-table-info">
                    Table {tables.find(t => t.id === parseInt(selectedTable))?.table_number}
                  </div>
                )}

                <div className="cust-cart-items">
                  {cart.map(item => (
                    <div key={item.id} className="cust-cart-item">
                      <div className="cust-cart-item-info">
                        <div>
                          <div className="cust-cart-item-name">{item.name}</div>
                          <div className="cust-cart-item-price">₹{parseFloat(item.price).toFixed(0)} each</div>
                        </div>
                      </div>
                      <div className="cust-cart-item-right">
                        <div className="cust-qty-controls-sm">
                          <button onClick={() => updateQty(item.id, -1)}>−</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, 1)}>+</button>
                        </div>
                        <div className="cust-cart-item-total">
                          ₹{(item.price * item.quantity).toFixed(0)}
                        </div>
                        <button className="cust-cart-remove" onClick={() => removeItem(item.id)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="cust-cart-totals">
                  <div className="cust-cart-total-row">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="cust-cart-total-row">
                    <span>GST (5%)</span>
                    <span>₹{gst.toFixed(2)}</span>
                  </div>
                  <div className="cust-cart-total-row grand">
                    <span>Total</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  className="cust-place-order-btn"
                  onClick={handlePlaceOrder}
                  disabled={!selectedTable || placing}
                >
                  {placing ? '⏳ Placing Order...' : `Place Order — ₹${grandTotal.toFixed(2)}`}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

  function getCatEmoji(name) {
  return '';
}
