import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { 
  Users, Search, RefreshCw, Mail, Phone, Calendar, 
  ShoppingBag, DollarSign, TrendingUp, Award, ArrowUpDown, CreditCard 
} from 'lucide-react';

const API = 'http://localhost:5000/api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'last_order_date', direction: 'desc' });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/customers`);
      setCustomers(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Handle sorting request
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Derived & Sorted Data
  const filteredAndSortedCustomers = useMemo(() => {
    let filterable = customers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.contact.toLowerCase().includes(search.toLowerCase())
    );

    filterable.sort((a, b) => {
      const { key, direction } = sortConfig;
      let aVal = a[key];
      let bVal = b[key];
      
      // Handle numeric conversions for sorting
      if (key === 'total_spent' || key === 'total_orders') {
        aVal = parseFloat(aVal || 0);
        bVal = parseFloat(bVal || 0);
      } else if (key === 'last_order_date' || key === 'created_at') {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      } else {
        // strings
        aVal = (aVal || '').toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filterable;
  }, [customers, search, sortConfig]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + parseFloat(c.total_spent || 0), 0);
    const avgSpent = totalCustomers ? (totalRevenue / totalCustomers) : 0;

    return { totalCustomers, totalRevenue, avgSpent };
  }, [customers]);

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.4s ease' }}>
      
      {/* ─── Header ─── */}
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Customer Intelligence</h1>
          <p className="page-subtitle" style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>Analyze ordering history and manage your top patrons</p>
        </div>
      </div>

      {/* ─── Stats Cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.5rem' }}>Total Network</p>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, lineHeight: 1 }}>{stats.totalCustomers}</h3>
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered patrons</div>
          </div>
          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
        </div>
        
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.5rem' }}>Lifetime Gross</p>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, lineHeight: 1 }}>₹{stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h3>
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 500 }}><TrendingUp size={12}/> All-time revenue</div>
          </div>
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={24} />
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div>
             <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.5rem' }}>Avg. Patron Value</p>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, lineHeight: 1 }}>₹{stats.avgSpent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h3>
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Per registered customer</div>
          </div>
          <div style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', color: '#F97316', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag size={24} />
          </div>
        </div>
      </div>

      {/* ─── Error State ─── */}
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 500, fontSize: '0.95rem' }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* ─── Unified Table Card ─── */}
      <div className="card" style={{ padding: '0', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        
        {/* Table Toolbar / Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Customer Directory</h2>
            <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', padding: '0.2rem 0.6rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600 }}>
              {filteredAndSortedCustomers.length} Records
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.4rem 0.75rem', width: '280px' }}>
              <Search size={16} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
              <input 
                type="text" 
                placeholder="Search name or contact..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none', fontSize: '0.85rem' }}
              />
            </div>
            <button 
              className="btn" 
              onClick={fetchCustomers} 
              disabled={loading}
              style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', borderRadius: '6px' }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> 
              Sync
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-color)' }}>
                <th onClick={() => requestSort('name')} style={{ cursor: 'pointer', userSelect: 'none', padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    Patron
                    <ArrowUpDown size={12} style={{ opacity: sortConfig.key === 'name' ? 1 : 0.3 }} />
                  </div>
                </th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Contact</th>
                <th onClick={() => requestSort('total_orders')} style={{ cursor: 'pointer', userSelect: 'none', padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    Orders
                    <ArrowUpDown size={12} style={{ opacity: sortConfig.key === 'total_orders' ? 1 : 0.3 }} />
                  </div>
                </th>
                <th onClick={() => requestSort('total_spent')} style={{ cursor: 'pointer', userSelect: 'none', padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    Gross Value
                    <ArrowUpDown size={12} style={{ opacity: sortConfig.key === 'total_spent' ? 1 : 0.3 }} />
                  </div>
                </th>
                <th onClick={() => requestSort('last_order_date')} style={{ cursor: 'pointer', userSelect: 'none', padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    Last Active
                    <ArrowUpDown size={12} style={{ opacity: sortConfig.key === 'last_order_date' ? 1 : 0.3 }} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && filteredAndSortedCustomers.length === 0 ? (
                 <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                      <RefreshCw size={28} className="spin" style={{ margin: '0 auto 1rem auto', color: 'var(--primary)' }} />
                      <p style={{ fontSize: '0.95rem' }}>Loading directory...</p>
                    </td>
                  </tr>
              ) : filteredAndSortedCustomers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <Users size={42} style={{ opacity: 0.15, margin: '0 auto 1rem auto' }} />
                    <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>No patrons found</p>
                    <p style={{ fontSize: '0.85rem' }}>Try adjusting your search</p>
                  </td>
                </tr>
              ) : (
                filteredAndSortedCustomers.map(customer => {
                  const isEmail = customer.contact.includes('@');
                  const spent = parseFloat(customer.total_spent || 0);
                  const isVIP = spent > 1000;
                  
                  return (
                    <tr key={customer.id} style={{ transition: 'background-color 0.2s', borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ 
                            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                            background: isVIP ? 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(202,138,4,0.15))' : 'rgba(167, 139, 250, 0.1)', 
                            color: isVIP ? '#EAB308' : '#A78BFA',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 'bold', fontSize: '1.1rem', textTransform: 'uppercase'
                          }}>
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                                {customer.name}
                              </span>
                              {isVIP && (
                                <span style={{ backgroundColor: 'rgba(234,179,8,0.1)', color: '#EAB308', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                                  VIP
                                </span>
                              )}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                              Joined {format(new Date(customer.created_at), 'MMM yyyy')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {isEmail ? <Mail size={14} color="var(--text-muted)" /> : <Phone size={14} color="var(--text-muted)" />}
                          {customer.contact}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 500, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {customer.total_orders || 0}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: '#10B981', fontSize: '0.95rem' }}>
                        ₹{spent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        {customer.last_order_date ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>
                              {format(new Date(customer.last_order_date), 'MMM d, yyyy')}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {format(new Date(customer.last_order_date), 'h:mm a')}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Never
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
