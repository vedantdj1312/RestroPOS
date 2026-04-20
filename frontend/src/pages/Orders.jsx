import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, X, Clock } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [billLoading, setBillLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/orders');
      setOrders(res.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBill = async (orderId) => {
    try {
      setBillLoading(true);
      setShowModal(true);
      const res = await axios.get(`http://localhost:5000/api/orders/${orderId}`);
      setSelectedOrder(res.data);
    } catch (error) {
      console.error('Error fetching bill:', error);
      alert('Failed to load bill details');
      setShowModal(false);
    } finally {
      setBillLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#f59e0b'; // Amber
      case 'Preparing': return '#3b82f6'; // Blue
      case 'Completed': return '#10b981'; // Green
      case 'Cancelled': return '#ef4444'; // Red
      case 'settled': return '#8b5cf6'; // Purple
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      
      {/* Header Section */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: 'var(--text-main)' }}>Order History</h2>
      </div>

      {/* Grid List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading order history...</div>
      ) : (
        <div style={{ 
          background: 'var(--surface-color)', 
          borderRadius: 'var(--radius-lg)', 
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Order ID</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date & Time</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Table</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment Mode</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="order-row">
                  <td style={{ padding: '1rem', fontWeight: 600 }}>#{order.id}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                      <Clock size={14} color="var(--text-muted)" />
                      {new Date(order.created_at).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', fontWeight: 600 }}>
                      Table {order.table_number || order.table_id}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '999px',
                      background: `${getStatusColor(order.status)}20`,
                      color: getStatusColor(order.status),
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {order.payment_method ? (
                      <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                        {order.payment_method}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: '#10B981' }}>
                    ₹{parseFloat(order.total_amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleViewBill(order.id)}
                      style={{ 
                        padding: '0.4rem 0.8rem', 
                        borderRadius: '6px', 
                        border: '1px solid var(--border-color)', 
                        background: 'transparent', 
                        cursor: 'pointer', 
                        color: 'var(--text-main)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                      className="view-bill-btn"
                    >
                      <FileText size={14} /> View Bill
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No orders have been placed yet.
            </div>
          )}
        </div>
      )}

      {/* Bill View Modal */}
      {showModal && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.7)', 
          backdropFilter: 'blur(4px)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 2000,
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{ 
            background: 'var(--bg-color)', 
            width: '90%', 
            maxWidth: '450px', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="var(--primary)" /> Order Receipt
              </h3>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
              {billLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Fetching bill details...</div>
              ) : selectedOrder ? (
                <div className="receipt-content">
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.5rem' }}>RestroPOS</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>Order #{selectedOrder.id}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>
                      {new Date(selectedOrder.created_at).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Table: <strong style={{color:'var(--text-main)'}}>{selectedOrder.table_number || selectedOrder.table_id}</strong></span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Status: <strong style={{color:getStatusColor(selectedOrder.status)}}>{selectedOrder.status}</strong></span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.quantity} x ₹{parseFloat(item.price).toFixed(2)}</div>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          ₹{(item.quantity * parseFloat(item.price)).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {(() => {
                    const billSubtotal = selectedOrder.items?.reduce((sum, item) => sum + (item.quantity * parseFloat(item.price)), 0) || 0;
                    const billDiscountPct = parseFloat(selectedOrder.discount_percent) || 0;
                    const billDiscountAmt = billSubtotal * (billDiscountPct / 100);
                    const billTaxable = billSubtotal - billDiscountAmt;
                    const billCgst = billTaxable * 0.025;
                    const billSgst = billTaxable * 0.025;
                    const billGrandTotal = billTaxable + billCgst + billSgst;
                    return (
                      <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>
                          <span>Subtotal</span>
                          <span style={{ color: 'var(--text-main)' }}>₹{billSubtotal.toFixed(2)}</span>
                        </div>
                        {billDiscountPct > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.3rem', color: '#10B981', fontWeight: 600 }}>
                            <span>Discount ({billDiscountPct}%)</span>
                            <span>- ₹{billDiscountAmt.toFixed(2)}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>
                          <span>CGST (2.5%)</span>
                          <span>₹{billCgst.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                          <span>SGST (2.5%)</span>
                          <span>₹{billSgst.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Grand Total</span>
                          <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#10B981' }}>
                            ₹{billGrandTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#ef4444' }}>Error displaying bill.</div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem', justifyContent: 'flex-end', background: 'var(--surface-color)' }}>
              <button 
                onClick={() => setShowModal(false)}
                style={{ padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .order-row:hover {
          background: rgba(255,255,255,0.03) !important;
        }
        .view-bill-btn:hover {
          background: rgba(255,255,255,0.05) !important;
          border-color: var(--primary) !important;
          color: var(--primary) !important;
        }
      `}</style>
    </div>
  );
}
