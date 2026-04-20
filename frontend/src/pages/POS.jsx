import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  Search,
  Clock,
  ChevronDown,
  Printer,
  CreditCard,
  CheckCircle2,
  Percent,
  Tag
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

// Assign consistent colors to categories
const CATEGORY_COLORS = {
  'Starters': { bg: 'rgba(20, 184, 166, 0.15)', text: '#14B8A6', border: '#14B8A6' },
  'Main Course': { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6', border: '#3B82F6' },
  'Breads': { bg: 'rgba(34, 197, 94, 0.15)', text: '#22C55E', border: '#22C55E' },
  'Rice & Biryani': { bg: 'rgba(249, 115, 22, 0.15)', text: '#F97316', border: '#F97316' },
  'Beverages': { bg: 'rgba(96, 165, 250, 0.15)', text: '#60A5FA', border: '#60A5FA' },
  'Desserts': { bg: 'rgba(168, 85, 247, 0.15)', text: '#A855F7', border: '#A855F7' },
  'Combos': { bg: 'rgba(236, 72, 153, 0.15)', text: '#EC4899', border: '#EC4899' },
  'Chinese': { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', border: '#F59E0B' },
};

const DEFAULT_COLOR = { bg: 'rgba(156, 163, 175, 0.15)', text: '#9CA3AF', border: '#9CA3AF' };

function getCategoryColor(name) {
  return CATEGORY_COLORS[name] || DEFAULT_COLOR;
}

export default function POS() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [cart, setCart] = useState([]);
  const [tables, setTables] = useState([]);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [showDiscountPanel, setShowDiscountPanel] = useState(false);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tableIdParam = searchParams.get('table_id');
  
  const [selectedTable, setSelectedTable] = useState(tableIdParam || '');
  const [orderType, setOrderType] = useState('dine-in');

  useEffect(() => {
    fetchData();
    if (tableIdParam) {
      setSelectedTable(tableIdParam);
      setOrderType('dine-in');
      fetchActiveOrder(tableIdParam);
    }
  }, [tableIdParam]);

  const fetchActiveOrder = async (tableId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/orders/active/${tableId}`);
      const order = res.data;
      if (order) {
        setActiveOrderId(order.id);
        setDiscountPercent(parseFloat(order.discount_percent) || 0);
        // Map backend order items to frontend cart structure
        setCart(order.items.map(item => ({
          id: item.menu_item_id,
          name: item.name,
          price: item.unit_price,
          quantity: item.quantity
        })));
      }
    } catch (error) {
      // 404 is expected for tables without active orders
      setActiveOrderId(null);
      setCart([]);
    }
  };

  const fetchData = async () => {
    try {
      const [itemsRes, tablesRes, catRes] = await Promise.all([
        axios.get('http://localhost:5000/api/items'),
        axios.get('http://localhost:5000/api/tables'),
        axios.get('http://localhost:5000/api/categories')
      ]);
      setItems(itemsRes.data);
      // Filter out 'Reserved' tables but keep 'Available', 'Occupied', and 'Billed'
      setTables(tablesRes.data.filter(t => t.status !== 'Reserved'));
      setCategories(catRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => { 
    setCart([]); 
    setSelectedTable(''); 
    setActiveOrderId(null);
    setDiscountPercent(0);
    setShowDiscountPanel(false);
  };

  const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const taxableAmount = subtotal - discountAmount;
  const cgst = taxableAmount * 0.025;
  const sgst = taxableAmount * 0.025;
  const grandTotal = taxableAmount + cgst + sgst;
  const totalItems = cart.reduce((count, item) => count + item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (orderType === 'dine-in' && !selectedTable) return alert('Select a table first');
    if (cart.length === 0) return alert('Cart is empty');

    try {
      if (activeOrderId) {
        // Update existing order
        await axios.put(`http://localhost:5000/api/orders/${activeOrderId}`, {
          items: cart.map(item => ({
            menu_item_id: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          discount_percent: discountPercent
        });
        alert('Order updated successfully!');
      } else {
        // Create new order
        await axios.post('http://localhost:5000/api/orders', {
          table_id: orderType === 'dine-in' ? selectedTable : (tables[0]?.id || 1),
          items: cart.map(item => ({
            menu_item_id: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          discount_percent: discountPercent
        });
        alert('Order placed successfully!');
      }
      
      setCart([]);
      setSelectedTable('');
      setActiveOrderId(null);
      setDiscountPercent(0);
      setShowDiscountPanel(false);
      fetchData();
      
      // Auto-navigate back to Tables grid to see it turn Red
      navigate('/admin/tables');
    } catch (error) {
      alert('Failed to place order');
    }
  };

  // Count items per category
  const categoryCounts = {};
  categories.forEach(cat => {
    categoryCounts[cat.id] = items.filter(item => item.category_id === cat.id).length;
  });

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category_id === activeCategory;
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Check if item is in cart
  const getCartQty = (itemId) => {
    const cartItem = cart.find(i => i.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  return (
    <div className="pos-layout">
      {/* ═══════ LEFT: Menu Section ═══════ */}
      <div className="pos-menu-area">
        {/* Search Bar */}
        <div className="pos-search-wrap">
          <Search size={18} className="pos-search-icon" />
          <input
            type="text"
            placeholder="Search menu items..."
            className="pos-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Chips */}
        <div className="pos-categories">
          <button
            className={`pos-cat-chip ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`pos-cat-chip ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name} ({categoryCounts[cat.id] || 0})
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="pos-items-grid">
          {filteredItems.length === 0 ? (
            <div className="pos-no-items">
              <Search size={32} />
              <p>No items found</p>
            </div>
          ) : (
            filteredItems.map(item => {
              const catColor = getCategoryColor(item.category_name);
              const inCart = getCartQty(item.id);
              return (
                <div
                  key={item.id}
                  className={`pos-item-card ${inCart > 0 ? 'in-cart' : ''} ${!item.computed_available ? 'disabled' : ''}`}
                  onClick={() => item.computed_available && addToCart(item)}
                  style={{ opacity: item.computed_available ? 1 : 0.5, cursor: item.computed_available ? 'pointer' : 'not-allowed' }}
                >
                  {/* Out of stock overlay */}
                  {!item.computed_available && (
                     <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: 'inherit' }}>
                       <span style={{ background: '#EF4444', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Out of Stock</span>
                     </div>
                  )}
                  {/* Category Badge + Veg/Non-Veg */}
                  <div className="pos-item-top-row">
                    <span
                      className={`pos-veg-badge ${item.is_veg ? 'veg' : 'nonveg'}`}
                    >
                      <span className="pos-veg-dot"></span>
                    </span>
                    <span
                      className="pos-item-cat-badge"
                      style={{ background: catColor.bg, color: catColor.text }}
                    >
                      {item.category_name}
                    </span>
                  </div>

                  {/* Item Name */}
                  <h4 className="pos-item-name">{item.name}</h4>

                  {/* Price */}
                  <span className="pos-item-price">₹{parseFloat(item.price).toFixed(2)}</span>

                  {/* Prep time */}
                  <div className="pos-item-meta">
                    <Clock size={12} />
                    <span>{item.prep_time || 15} min</span>
                  </div>

                  {/* Cart quantity indicator */}
                  {inCart > 0 && (
                    <div className="pos-item-qty-badge">{inCart}</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══════ RIGHT: Order Sidebar ═══════ */}
      <div className="pos-order-sidebar">
        {/* Header */}
        <div className="pos-order-header">
          <div>
            <h3>Current Order</h3>
            <span className="pos-order-count">{totalItems} Items</span>
          </div>
          <button className="pos-clear-btn" onClick={clearCart}>Clear</button>
        </div>

        {/* Order Type & Table Selectors */}
        <div className="pos-order-type-row">
          {/* Table Selector */}
          <div className="pos-type-select-wrap">
            <select
              value={selectedTable}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedTable(val);
                if (val) fetchActiveOrder(val);
              }}
              className="pos-type-select"
            >
              <option value="" disabled>Select Table</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>
                  Table {t.table_number} ({t.status})
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pos-select-arrow" />
          </div>

          {/* Order Type Selector */}
          <div className="pos-type-select-wrap">
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="pos-type-select"
            >
              <option value="dine-in">Dine-in</option>
              <option value="takeaway">Takeaway</option>
              <option value="delivery">Delivery</option>
            </select>
            <ChevronDown size={14} className="pos-select-arrow" />
          </div>
        </div>

        {/* Cart Items */}
        <div className="pos-cart-items">
          {cart.length === 0 ? (
            <div className="pos-cart-empty">
              <ShoppingCart size={48} strokeWidth={1} />
              <h4>Cart is empty</h4>
              <p>Tap items from the menu to add</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="pos-cart-item">
                <span className="pos-cart-item-name">{item.name}</span>
                
                <div className="pos-cart-item-actions">
                  <button className="pos-qty-btn" onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}>
                    <Minus size={13} />
                  </button>
                  <span className="pos-qty-val">{item.quantity}</span>
                  <button className="pos-qty-btn" onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}>
                    <Plus size={13} />
                  </button>
                </div>

                <div className="pos-cart-item-price-wrap">
                  <span className="pos-cart-item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                  <button
                    className="pos-qty-btn danger"
                    style={{ marginLeft: '4px' }}
                    onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Discount Panel */}
        <div className="pos-discount-section">
          <button
            className={`pos-discount-toggle ${showDiscountPanel ? 'active' : ''}`}
            onClick={() => setShowDiscountPanel(prev => !prev)}
          >
            <Tag size={14} />
            {discountPercent > 0 ? `Discount: ${discountPercent}%` : 'Add Discount'}
            <ChevronDown size={14} style={{ transform: showDiscountPanel ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
          </button>

          {showDiscountPanel && (
            <div className="pos-discount-panel">
              <div className="pos-discount-chips">
                {[5, 10, 15, 20].map(val => (
                  <button
                    key={val}
                    className={`pos-discount-chip ${discountPercent === val ? 'active' : ''}`}
                    onClick={() => setDiscountPercent(prev => prev === val ? 0 : val)}
                  >
                    {val}%
                  </button>
                ))}
              </div>
              <div className="pos-discount-input-row">
                <label>Custom %</label>
                <div className="pos-discount-input-wrap">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={discountPercent}
                    onChange={(e) => {
                      let val = parseFloat(e.target.value) || 0;
                      val = Math.min(100, Math.max(0, val));
                      setDiscountPercent(val);
                    }}
                    className="pos-discount-input"
                  />
                  <Percent size={14} className="pos-discount-percent-icon" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Totals + Buttons */}
        <div className="pos-order-footer">
          <div className="pos-totals">
            <div className="pos-total-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discountPercent > 0 && (
              <div className="pos-total-row discount">
                <span>Discount ({discountPercent}%)</span>
                <span>- ₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="pos-total-row">
              <span>CGST (2.5%)</span>
              <span>₹{cgst.toFixed(2)}</span>
            </div>
            <div className="pos-total-row">
              <span>SGST (2.5%)</span>
              <span>₹{sgst.toFixed(2)}</span>
            </div>
            <div className="pos-total-row grand">
              <span>Grand Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="pos-action-btns-row">
            <button className="pos-action-btn kot" disabled={cart.length === 0} onClick={handlePlaceOrder}>
              <Printer size={15} />
              Send KOT
            </button>
            <button className="pos-action-btn pay" disabled={cart.length === 0}>
              <CreditCard size={15} />
              Pay
            </button>
          </div>

          <button
            className="pos-place-order-btn"
            onClick={handlePlaceOrder}
            disabled={cart.length === 0}
          >
            <CheckCircle2 size={18} />
            {activeOrderId ? 'Update Order' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
