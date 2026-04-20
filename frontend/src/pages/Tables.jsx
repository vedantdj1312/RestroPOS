import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { User, Eye, Printer, CreditCard, X, Clock, RotateCcw, Calendar } from 'lucide-react';

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [modalOrder, setModalOrder] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  
  const [reserveModal, setReserveModal] = useState(null);
  const [resDate, setResDate] = useState('');
  const [resTime, setResTime] = useState('');
  const [isReserving, setIsReserving] = useState(false);
  
  const [settings, setSettings] = useState({});

  // Payment Modal States
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchTables();
    fetchSettings();
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/settings');
      setSettings(res.data || {});
    } catch (e) {
      console.error('Failed to fetch settings');
    }
  };

  const fetchTables = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tables');
      setTables(res.data);
    } catch (error) {
      console.error('Failed to fetch tables', error);
    }
  };

  const handleTableClick = (table) => {
    if (table.status === 'Available' || table.status === 'Occupied' || table.status === 'Billed') {
      navigate(`/admin/pos?table_id=${table.id}`);
    }
  };

  const calculateElapsed = (startTime) => {
    if (!startTime) return '';
    const diff = Math.floor((currentTime - new Date(startTime)) / 60000);
    if (diff < 60) return `${diff}m`;
    return `${Math.floor(diff/60)}h ${diff%60}m`;
  };

  const formatReservationTime = (datetime) => {
    if (!datetime) return '';
    return new Date(datetime).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };



  const viewOrder = async (e, table) => {
    e.stopPropagation();
    try {
      const res = await axios.get(`http://localhost:5000/api/orders/active/${table.id}`);
      setModalOrder({ ...res.data, table_number: table.table_number });
    } catch (error) {
      alert('Error fetching order details. No active order found.');
    }
  };

  const generateReceiptHTML = (table, order) => {
    let subtotal = 0;
    const itemsHtml = order.items.map(item => {
      const price = parseFloat(item.unit_price || item.price);
      const qty = parseInt(item.quantity);
      const amt = price * qty;
      subtotal += amt;
      return `
        <tr>
          <td>${item.name}</td>
          <td class="text-center">${qty}</td>
          <td class="text-right">Rs.${price.toFixed(2)}</td>
          <td class="text-right">Rs.${amt.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const discountPct = parseFloat(order.discount_percent) || 0;
    const discountAmt = subtotal * (discountPct / 100);
    const taxableAmount = subtotal - discountAmt;
    const cgst = taxableAmount * 0.025;
    const sgst = taxableAmount * 0.025;
    const grandTotal = taxableAmount + cgst + sgst;

    const discountHtml = discountPct > 0 ? `
        <div class="row" style="color: #16a34a;">
          <span>Discount (${discountPct}%)</span>
          <span>- Rs.${discountAmt.toFixed(2)}</span>
        </div>
    ` : '';

    return `
      <html>
      <head>
        <title>Receipt - Table ${table.table_number}</title>
        <style>
          body { font-family: monospace; width: 300px; margin: 0 auto; padding: 20px; color: black; }
          .text-center { text-align: center; }
          h2 { margin: 0 0 5px; font-size: 1.5em; }
          .meta { margin-bottom: 15px; font-size: 0.9em; color: #333; line-height: 1.4; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
          th, td { padding: 5px 0; font-size: 0.9em; }
          th { border-top: 1px dashed black; border-bottom: 1px dashed black; text-align: left; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .dashed-border-top { border-top: 1px dashed black; padding-top: 5px; margin-top: 5px; }
          .dashed-border-bottom { border-bottom: 1px dashed black; padding-bottom: 5px; margin-bottom: 5px; }
          .bold { font-weight: bold; }
          .row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.9em; }
          .row-spacing { margin-top: 10px; }
          .grand-total { font-size: 1.1em; font-weight: bold; padding: 5px 0; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <h2>Order Receipt</h2>
          <div class="meta">
            Table T${table.table_number} &nbsp;&middot;&nbsp; Order #${order.id}<br/>
            Dine_in &nbsp;&middot;&nbsp; Confirmed
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>ITEM</th>
              <th class="text-center">QTY</th>
              <th class="text-right">RATE</th>
              <th class="text-right">AMT</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div class="row dashed-border-top bold">
          <span>Subtotal</span>
          <span>Rs.${subtotal.toFixed(2)}</span>
        </div>
        ${discountHtml}
        <div class="row">
          <span>CGST</span>
          <span>Rs.${cgst.toFixed(2)}</span>
        </div>
        <div class="row dashed-border-bottom">
          <span>SGST</span>
          <span>Rs.${sgst.toFixed(2)}</span>
        </div>

        <div class="grand-total">
          <span>Grand Total</span>
          <span>Rs.${grandTotal.toFixed(2)}</span>
        </div>
        <div class="dashed-border-top text-center" style="margin-top: 15px; padding-top: 10px; font-size: 0.9em; color: #555;">
          Thank you for dining with us!
        </div>
      </body>
      </html>
    `;
  };

  const printBill = async (e, table) => {
    e.stopPropagation();
    if (!window.confirm(`Generate receipt and print bill for Table ${table.table_number}?`)) return;

    try {
      const res = await axios.get(`http://localhost:5000/api/orders/active/${table.id}`);
      const order = res.data;
      const receiptHTML = generateReceiptHTML(table, order);
      
      // Create an invisible iframe for printing to bypass all popup blockers completely
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
      
      // Write the perfectly styled HTML template directly to iframe
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(receiptHTML);
      doc.close();
      
      // Wait a fraction of a second for CSS parsing, then invoke system print
      setTimeout(async () => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          
          // Cleanup iframe after printing
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2000);
          
          // Update database and transition visual state to Billed (Orange)
          await axios.patch(`http://localhost:5000/api/tables/${table.id}/bill`);
          fetchTables();
        } catch (printErr) {
          console.error("Print dialog blocked or failed:", printErr);
          alert('System print dialog failed.');
        }
      }, 300);

    } catch (error) {
      alert('Failed to fetch the order details or generate the bill.');
      console.error(error);
    }
  };

  const openPaymentModal = async (e, table) => {
    e.stopPropagation();
    try {
      const res = await axios.get(`http://localhost:5000/api/orders/active/${table.id}`);
      const order = res.data;
      
      const subtotal = order.items.reduce((acc, item) => acc + (parseFloat(item.unit_price || item.price) * item.quantity), 0);
      const discountPct = parseFloat(order.discount_percent) || 0;
      const discountAmt = subtotal * (discountPct / 100);
      const taxableAmount = subtotal - discountAmt;
      const grandTotal = taxableAmount * 1.05; // 5% GST

      setPaymentModal({ ...table, discount_percent: discountPct, subtotal, discountAmt, taxableAmount });
      setPaymentAmount(grandTotal.toFixed(2));
      setPaymentMethod('Cash');
    } catch (error) {
      alert('Failed to fetch order details for payment.');
    }
  };

  const confirmPayment = async () => {
    if (!window.confirm(`Confirm payment of ₹${paymentAmount} via ${paymentMethod}?`)) return;

    setIsProcessingPayment(true);
    try {
      await axios.patch(`http://localhost:5000/api/tables/${paymentModal.id}/pay`, {
        payment_method: paymentMethod,
        paid_amount: parseFloat(paymentAmount)
      });
      
      setPaymentModal(null);
      fetchTables();
    } catch (error) {
      alert('Failed to confirm payment.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const clearTable = async (e, table) => {
    e.stopPropagation();
    if (!window.confirm(`Clear Table ${table.table_number} and make it available?`)) return;

    try {
      await axios.patch(`http://localhost:5000/api/tables/${table.id}/clear`);
      fetchTables();
    } catch (error) {
      alert('Failed to clear table.');
    }
  };

  const confirmReset = async () => {
    try {
      await axios.post('http://localhost:5000/api/tables/reset');
      await fetchTables();
      setShowResetModal(false);
    } catch (error) {
      console.error('Reset Error Payload:', error);
      alert('Failed to reset all tables. Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleReserveSubmit = async (e) => {
    if (e) e.preventDefault();
    console.log("handleReserveSubmit (Form Submit) triggered");
    
    // Check if reservation is already processing
    if (isReserving) return;
    
    if (!reserveModal) {
      alert("Error: No table selected.");
      return;
    }

    if (!resDate || !resTime) {
      alert("Please select both a date and a time.");
      return;
    }
    
    // 1. Validate Timing (7 PM - 11 PM)
    const [hStr, mStr] = resTime.split(':');
    const hour = parseInt(hStr, 10);
    const minute = parseInt(mStr, 10);
    
    if (hour < 19 || (hour === 23 && minute > 0) || hour > 23) {
      alert("⚠️ Timing Error: Restaurant hours are 7 PM to 11 PM.");
      return;
    }

    // 2. Build Date Object safely
    let combinedDateTime;
    try {
      const [year, month, day] = resDate.split('-').map(Number);
      combinedDateTime = new Date(year, month - 1, day, hour, minute, 0);
    } catch (err) {
      alert("Date Error. Please re-select.");
      return;
    }
    
    if (isNaN(combinedDateTime.getTime())) {
      alert("Invalid Date chosen.");
      return;
    }

    // 3. Past Check
    if (combinedDateTime < new Date()) {
      alert("🚫 Past Date Error: Reservations must be in the future.");
      return;
    }

    // 4. Send to Backend
    setIsReserving(true);
    try {
      const url = `http://localhost:5000/api/tables/${reserveModal.id}/reserve`;
      console.log("PATCHing reservation to:", url);
      
      const response = await axios.patch(url, {
        reserved_at: combinedDateTime.toISOString()
      });
      
      console.log("Success Response:", response.data);
      alert("Success: Reservation Confirmed!");
      
      setReserveModal(null);
      setResDate('');
      setResTime('');
      fetchTables();
    } catch (error) {
      console.error('Submission Error:', error);
      const msg = error.response?.data?.error || error.message;
      alert('Failed to Reserve: ' + msg);
    } finally {
      setIsReserving(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Occupied') return 'var(--danger)';
    if (status === 'Billed') return '#eab308'; // Yellow
    if (status === 'Reserved') return '#a855f7'; // Purple
    if (status === 'Paid') return 'var(--secondary)'; // Green
    return 'var(--secondary)'; // Available (green)
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button 
          onClick={() => setShowResetModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', color: 'var(--danger)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger)', cursor: 'pointer', fontWeight: 600 }}
          title="Reset all tables to available"
        >
          <RotateCcw size={16} /> Reset All Tables
        </button>
      </div>

      <div className="status-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--secondary)' }}></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#a855f7' }}></div>
          <span>Reserved</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--danger)' }}></div>
          <span>Occupied</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#eab308' }}></div>
          <span>Billed</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--secondary)', border: '2px solid #059669' }}></div>
          <span>Paid</span>
        </div>
      </div>
      
      <div className="tables-grid">
        {tables.map(table => (
          <div 
            key={table.id} 
            className={`table-card ${table.status.toLowerCase()}`}
            onClick={() => handleTableClick(table)}
            style={{ 
              borderColor: getStatusColor(table.status),
              borderWidth: '2px',
              borderStyle: 'solid'
            }}
          >
            <h3>T{table.table_number}</h3>
            
            <div className="table-status-label" style={{ color: getStatusColor(table.status) }}>
              {table.status.toUpperCase()}
            </div>

            <div className="table-capacity-row">
              <User size={14} color="#a855f7" />
              <span>{table.seating_capacity}</span>
            </div>

            {/* Metadata (Time Info) */}
            {table.status === 'Reserved' && (
              <div style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <Calendar size={10} /> {formatReservationTime(table.reserved_at)}
              </div>
            )}
            
            {(table.status === 'Occupied' || table.status === 'Billed' || table.status === 'Paid') && (
              <div style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                <Clock size={10} /> {calculateElapsed(table.occupied_at)}
              </div>
            )}

            {/* Action Tray */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
              {table.status === 'Available' && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setResDate(''); 
                    setResTime(''); 
                    setReserveModal(table); 
                  }}
                  className="table-action-btn btn-border-green" 
                  title="Reserve Table"
                >
                  <Calendar size={16} />
                </button>
              )}

              {(table.status === 'Occupied' || table.status === 'Billed' || table.status === 'Paid') && (
                <>
                  <button onClick={(e) => viewOrder(e, table)} className="table-action-btn btn-border-red" title="View Order">
                    <Eye size={16} />
                  </button>
                  {table.status === 'Occupied' && (
                    <button onClick={(e) => printBill(e, table)} className="table-action-btn btn-border-red" title="Print Bill">
                      <Printer size={16} />
                    </button>
                  )}
                  {table.status === 'Billed' && (
                    <button onClick={(e) => openPaymentModal(e, table)} className="table-action-btn btn-border-red" title="Pay Bill">
                      <CreditCard size={16} />
                    </button>
                  )}
                  {table.status === 'Paid' && (
                    <button onClick={(e) => clearTable(e, table)} className="table-action-btn btn-border-green" title="Clear Table">
                      <RotateCcw size={16} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Order Modal */}
       {modalOrder && (
         <div className="table-modal-overlay">
           <div className="table-modal-content">
            <div className="table-modal-header">
              <h3>Table {modalOrder.table_number} - Active Order</h3>
              <button onClick={() => setModalOrder(null)} className="table-modal-close"><X size={20} /></button>
            </div>
            <div className="table-modal-body">
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.5rem 0' }}>Item</th>
                    <th>Qty</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {modalOrder.items?.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px dashed var(--border-color)' }}>
                      <td style={{ padding: '0.5rem 0', fontSize: '0.9rem' }}>{item.name}</td>
                      <td style={{ fontSize: '0.9rem' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', fontSize: '0.9rem' }}>₹{parseFloat(item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(() => {
                const modalSubtotal = modalOrder.items?.reduce((sum, item) => sum + (parseFloat(item.unit_price || item.price) * item.quantity), 0) || 0;
                const modalDiscountPct = parseFloat(modalOrder.discount_percent) || 0;
                const modalDiscountAmt = modalSubtotal * (modalDiscountPct / 100);
                const modalTaxable = modalSubtotal - modalDiscountAmt;
                const modalCgst = modalTaxable * 0.025;
                const modalSgst = modalTaxable * 0.025;
                const modalGrandTotal = modalTaxable + modalCgst + modalSgst;
                return (
                  <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                      <span>₹{modalSubtotal.toFixed(2)}</span>
                    </div>
                    {modalDiscountPct > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.3rem', color: '#10B981' }}>
                        <span>Discount ({modalDiscountPct}%)</span>
                        <span>- ₹{modalDiscountAmt.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>
                      <span>CGST (2.5%)</span>
                      <span>₹{modalCgst.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                      <span>SGST (2.5%)</span>
                      <span>₹{modalSgst.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                      <span>Grand Total</span>
                      <span style={{ color: 'var(--primary)' }}>₹{modalGrandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      {/* Reset Confirmation Modal */}
       {showResetModal && (
         <div className="table-modal-overlay">
           <div className="table-modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--danger)', fontSize: '1.25rem' }}>Reset All Tables</h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
              Do You Want to Reset all the Tables ?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={confirmReset}
                style={{ padding: '0.5rem 1.5rem', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}
              >
                Yes
              </button>
              <button 
                onClick={() => setShowResetModal(false)}
                style={{ padding: '0.5rem 1.5rem', background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date/Time Reservation Modal */}
       {reserveModal && (
         <div className="table-modal-overlay">
           <form 
              onSubmit={handleReserveSubmit} 
              noValidate
              className="table-modal-content" 
              style={{ maxWidth: '400px', textAlign: 'center', padding: '1.5rem', pointerEvents: 'auto' }}
            >
             <h3 style={{ marginBottom: '1rem', color: '#a855f7', fontSize: '1.25rem' }}>Reserve Table {reserveModal.table_number}</h3>
             
             <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', textAlign: 'left', width: '100%' }}>
               <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                 <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Select Date</label>
                 <input 
                   type="date" 
                   value={resDate}
                   className="white-picker"
                   onChange={(e) => setResDate(e.target.value)}
                   style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)' }}
                 />
               </div>
               <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                 <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Select Time</label>
                 <input 
                   type="time" 
                   value={resTime}
                   className="white-picker"
                   onChange={(e) => setResTime(e.target.value)}
                   style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)' }}
                 />
               </div>
             </div>
 
             <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
               <button 
                 type="submit"
                 className="confirm-btn"
                 disabled={isReserving}
                 style={{ 
                   padding: '0.5rem 1.5rem', 
                   background: isReserving ? '#d8b4fe' : '#a855f7', 
                   color: 'white', 
                   border: 'none', 
                   borderRadius: 'var(--radius-md)', 
                   cursor: isReserving ? 'not-allowed' : 'pointer', 
                   fontWeight: 600,
                   opacity: isReserving ? 0.7 : 1
                 }}
               >
                 {isReserving ? 'Processing...' : 'Confirm Reservation'}
               </button>
               <button 
                 type="button"
                 onClick={() => setReserveModal(null)}
                 style={{ padding: '0.5rem 1.5rem', background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}
               >
                 Cancel
               </button>
             </div>
           </form>
         </div>
       )}

  {/* Payment Modal */}
  {paymentModal && (
    <div className="table-modal-overlay">
      <div className="table-modal-content" style={{ maxWidth: '450px' }}>
        <div className="table-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Table {paymentModal.table_number} - Payment</h3>
          <button onClick={() => setPaymentModal(null)} className="table-modal-close" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div className="table-modal-body">
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total Amount to Pay</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>₹{paymentAmount}</div>
            {paymentModal?.discount_percent > 0 && (
              <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '0.25rem', fontWeight: 600 }}>
                {paymentModal.discount_percent}% discount applied (- ₹{paymentModal.discountAmt?.toFixed(2)})
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Manual Amount Entry</label>
            <input 
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 600 }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Payment Method</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {['Cash', 'UPI', 'Credit Card'].map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  style={{ 
                    padding: '0.75rem 0.5rem', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid',
                    borderColor: paymentMethod === method ? 'var(--primary)' : 'var(--border-color)',
                    background: paymentMethod === method ? 'rgba(249, 115, 22, 0.1)' : 'var(--bg-color)',
                    color: paymentMethod === method ? 'var(--primary)' : 'var(--text-main)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === 'UPI' && (
            <div style={{ textAlign: 'center', padding: '1rem', background: 'white', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <div style={{ color: '#000', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Scan to Pay</div>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${settings.upi_id || 'restaurant@upi'}&pn=${encodeURIComponent(settings.upi_name || 'RestroPOS')}&am=${paymentAmount}`} 
                alt="UPI QR Code" 
                style={{ width: '150px', height: '150px' }} 
              />
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.5rem', textTransform: 'uppercase' }}>
                Merchant: {settings.upi_name || 'RESTROPOS'}
              </div>
            </div>
          )}

          {paymentMethod === 'Credit Card' && (
            <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60A5FA', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 600 }}>
              Please insert your credit card into the machine
            </div>
          )}

          <button
            onClick={confirmPayment}
            disabled={isProcessingPayment}
            style={{ 
              width: '100%', 
              padding: '1rem', 
              background: 'var(--secondary)', 
              color: 'white', 
              border: 'none', 
              borderRadius: 'var(--radius-md)', 
              fontSize: '1rem', 
              fontWeight: 700, 
              cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
              opacity: isProcessingPayment ? 0.7 : 1
            }}
          >
            {isProcessingPayment ? 'Processing...' : 'Confirm Payment (Admin)'}
          </button>
        </div>
      </div>
    </div>
  )}

    </div>
  );
}
