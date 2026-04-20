import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  X, 
  MinusCircle, 
  PlusCircle,
  Database,
  Info,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export default function Inventory({ user }) {
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' or 'details'
  const [currentItemId, setCurrentItemId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: '',
    quantity: 0,
    min_stock: 0,
    unit_price: 0,
    status: 'OK'
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/inventory');
      setInventory(res.data.items);
      setStats(res.data.stats);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setActiveTab('details');
    setFormData({
      name: '',
      category: '',
      unit: 'kg',
      quantity: 0,
      min_stock: 5,
      unit_price: 0,
      status: 'OK'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item, tab = 'stock') => {
    setIsEditing(true);
    setActiveTab(tab);
    setCurrentItemId(item.id);
    setFormData({
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantity: parseFloat(item.quantity),
      min_stock: parseFloat(item.min_stock),
      unit_price: parseFloat(item.unit_price),
      status: item.status
    });
    setShowModal(true);
  };

  const handleQuickAdjust = (amount) => {
    setFormData(prev => {
      const newQty = Math.max(0, prev.quantity + amount);
      let newStatus = 'OK';
      if (newQty <= 0) newStatus = 'Out of Stock';
      else if (newQty <= prev.min_stock) newStatus = 'Low Stock';
      
      return {
        ...prev,
        quantity: newQty,
        status: newStatus
      };
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/inventory/${id}`);
      fetchInventory();
    } catch (error) {
      alert('Failed to delete item');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/inventory/${currentItemId}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/inventory', formData);
      }
      setShowModal(false);
      fetchInventory();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving item');
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockLevelPercentage = (current, min) => {
    if (current <= 0) return 0;
    const target = Math.max(min * 2, 1);
    return Math.min((current / target) * 100, 100);
  };

  const getStatusColor = (status) => {
    if (status === 'Out of Stock') return '#EF4444';
    if (status === 'Low Stock') return '#F59E0B';
    return '#10B981'; // OK
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', padding: '0.5rem' }}>
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
        <MetricCard icon={<Package size={20} />} label="Total Items" value={stats.totalItems} color="#3b82f6" />
        <MetricCard icon={<AlertTriangle size={20} />} label="Low Stock" value={stats.lowStock} color="#F59E0B" />
        <MetricCard icon={<AlertCircle size={20} />} label="Out of Stock" value={stats.outOfStock} color="#EF4444" />
        <MetricCard icon={<TrendingUp size={20} />} label="Total Value" value={`₹${stats.totalValue.toLocaleString()}`} color="#10B981" />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'var(--surface-color)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <div style={{ position: 'relative', width: '350px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by name or category..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '0.65rem 1rem 0.65rem 2.75rem', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-color)', 
              background: 'var(--bg-color)', 
              color: 'var(--text-main)',
              fontSize: '0.9rem'
            }}
          />
        </div>
        <button 
          onClick={handleOpenAdd}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            background: 'var(--primary)', 
            color: 'white', 
            padding: '0.75rem 1.5rem', 
            borderRadius: 'var(--radius-md)', 
            border: 'none', 
            cursor: 'pointer',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)',
            transition: 'all 0.2s'
          }}
          className="add-item-btn"
        >
          <Plus size={18} /> New Inventory Item
        </button>
      </div>

      {/* Inventory List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ marginBottom: '1rem' }}></div>
          Fetching inventory data...
        </div>
      ) : (
        <div style={{ background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={thStyle}>Item Details</th>
                <th style={thStyle}>In Stock</th>
                <th style={thStyle}>Stock Health</th>
                <th style={thStyle}>Value (Total)</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Management</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map(item => (
                <tr key={item.id} className="inventory-row" style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                      <span style={{ padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>{item.category}</span>
                      <span>•</span>
                      <span>{item.unit}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 700 }}>
                    <span style={{ color: getStatusColor(item.status) }}>
                      {parseFloat(item.quantity).toFixed(3)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.2rem' }}>{item.unit}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ width: '100px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.3rem' }}>
                      <div style={{ 
                        width: `${getStockLevelPercentage(item.quantity, item.min_stock)}%`, 
                        height: '100%', 
                        background: getStatusColor(item.status),
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Min: {item.min_stock}{item.unit}</div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>₹{(item.quantity * item.unit_price).toLocaleString()}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      fontWeight: 800, 
                      padding: '0.25rem 0.6rem', 
                      borderRadius: '99px',
                      background: `${getStatusColor(item.status)}20`,
                      color: getStatusColor(item.status),
                      border: `1px solid ${getStatusColor(item.status)}40`,
                      textTransform: 'uppercase'
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleOpenEdit(item, 'stock')} style={actionBtnStyle} title="Adjust Stock"><Database size={16} /></button>
                      <button onClick={() => handleOpenEdit(item, 'details')} style={actionBtnStyle} title="Edit Item"><Edit2 size={16} /></button>
                      {['Owner/Admin', 'Inventory Manager'].includes(user?.role) && (
                        <button onClick={() => handleDelete(item.id)} style={{ ...actionBtnStyle, color: '#EF4444', borderColor: '#EF444430' }} title="Delete"><Trash2 size={16} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredInventory.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No items found in inventory.</div>
          )}
        </div>
      )}

      {/* Improved Edit Modal */}
      {showModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            {/* Modal Header */}
            <div style={modalHeaderStyle}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{isEditing ? 'Inventory Management' : 'Add New Item'}</h3>
                {isEditing && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formData.name} • {formData.category}</span>}
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            {/* Modal Tabs (Only for Editing) */}
            {isEditing && (
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                <button onClick={() => setActiveTab('stock')} style={{ ...tabBtnStyle, borderBottom: activeTab === 'stock' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'stock' ? 'var(--primary)' : 'var(--text-muted)' }}>
                  Stock Management
                </button>
                <button onClick={() => setActiveTab('details')} style={{ ...tabBtnStyle, borderBottom: activeTab === 'details' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'details' ? 'var(--primary)' : 'var(--text-muted)' }}>
                  Item Details
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ padding: '2rem' }}>
                {activeTab === 'stock' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Visual Progress Bar */}
                    <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Live Stock Preview</span>
                        <span style={{ fontSize: '0.85rem', color: getStatusColor(formData.status), fontWeight: 800 }}>
                          {formData.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${getStockLevelPercentage(formData.quantity, formData.min_stock)}%`, height: '100%', background: getStatusColor(formData.status), transition: 'width 0.3s ease' }} />
                      </div>
                    </div>

                    {/* Stock Adjustment Controls */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
                      <div style={inputGroupStyle}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Current Balance ({formData.unit})</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <button type="button" onClick={() => handleQuickAdjust(-1)} style={quickAdjustBtnStyle}><MinusCircle size={24} /></button>
                          <input 
                            type="number" 
                            step="0.001" 
                            value={formData.quantity} 
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              let status = 'OK';
                              if (val <= 0) status = 'Out of Stock';
                              else if (val <= formData.min_stock) status = 'Low Stock';
                              setFormData({...formData, quantity: val, status});
                            }}
                            style={{ ...inputStyle, textAlign: 'center', fontSize: '1.25rem', fontWeight: 700, padding: '0.75rem' }} 
                            required 
                          />
                          <button type="button" onClick={() => handleQuickAdjust(1)} style={quickAdjustBtnStyle}><PlusCircle size={24} /></button>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                          {[5, 10, 25].map(v => (
                            <button key={v} type="button" onClick={() => handleQuickAdjust(v)} style={pillBtnStyle}>+{v}</button>
                          ))}
                        </div>
                      </div>

                      <div style={inputGroupStyle}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Minimum Threshold</label>
                        <input 
                          type="number" 
                          step="0.001" 
                          value={formData.min_stock} 
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            let status = 'OK';
                            if (formData.quantity <= 0) status = 'Out of Stock';
                            else if (formData.quantity <= val) status = 'Low Stock';
                            setFormData({...formData, min_stock: val, status});
                          }}
                          style={inputStyle} 
                          required 
                        />
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>System will trigger alerts when stock falls below this value.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ ...inputGroupStyle, gridColumn: 'span 2' }}>
                      <label style={labelStyle}><Info size={14} /> Item Name</label>
                      <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={inputStyle} required />
                    </div>
                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>Category</label>
                      <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={inputStyle} required />
                    </div>
                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>Measurement Unit</label>
                      <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} style={inputStyle} required>
                        <option value="kg">kilograms (kg)</option>
                        <option value="ltr">liters (ltr)</option>
                        <option value="pcs">pieces (pcs)</option>
                        <option value="box">boxes (box)</option>
                      </select>
                    </div>
                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>Cost Price (per {formData.unit})</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 600 }}>₹</span>
                        <input type="number" step="0.01" value={formData.unit_price} onChange={e => setFormData({...formData, unit_price: parseFloat(e.target.value) || 0})} style={{ ...inputStyle, paddingLeft: '2rem' }} required />
                      </div>
                    </div>
                    <div style={{ background: 'rgba(25, 118, 210, 0.05)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(25, 118, 210, 0.3)', gridColumn: 'span 2', marginTop: '0.5rem' }}>
                      <p style={{ fontSize: '0.8rem', color: '#64b5f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={16} /> Total value of current stock: <strong>₹{(formData.quantity * formData.unit_price).toLocaleString()}</strong>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem', justifyContent: 'flex-end', background: 'var(--surface-color)' }}>
                <button type="button" onClick={() => setShowModal(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" style={saveBtnStyle}>{isEditing ? 'Commit Changes' : 'Create Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .inventory-row:hover {
          background: rgba(255,255,255,0.04) !important;
        }
        .add-item-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function MetricCard({ icon, label, value, color }) {
  return (
    <div style={{ background: 'var(--surface-color)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.1rem' }}>{value}</div>
      </div>
    </div>
  );
}

const thStyle = { padding: '1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' };
const actionBtnStyle = { padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' };

const modalOverlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 };
const modalContentStyle = { background: 'var(--bg-color)', width: '600px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' };
const modalHeaderStyle = { padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)' };

const tabBtnStyle = { flex: 1, padding: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s' };
const inputStyle = { width: '100%', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s' };
const pillBtnStyle = { padding: '0.3rem 0.8rem', borderRadius: '99px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 };
const quickAdjustBtnStyle = { background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const labelStyle = { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' };
const inputGroupStyle = { display: 'flex', flexDirection: 'column' };

const cancelBtnStyle = { padding: '0.8rem 1.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 };
const saveBtnStyle = { padding: '0.8rem 1.75rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)' };
