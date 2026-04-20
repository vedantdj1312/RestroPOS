import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  Calendar, 
  TrendingUp, 
  ShoppingBag, 
  IndianRupee,
  Percent,
  Clock,
  CalendarDays,
  CalendarRange
} from 'lucide-react';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';

const API = 'http://localhost:5000/api';

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  
  const [activePreset, setActivePreset] = useState('week');
  
  const [report, setReport] = useState({
    summary: { totalRevenue: 0, totalOrders: 0, validOrders: 0, avgOrderValue: 0, totalGst: 0, cancelledOrders: 0 },
    dailyData: [],
    itemWiseData: [],
    gstData: []
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales');

  // ─── Quick date presets ───
  const applyPreset = (preset) => {
    const today = new Date();
    let start;
    switch (preset) {
      case 'today':
        start = format(today, 'yyyy-MM-dd');
        break;
      case 'week':
        start = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        break;
      case 'month':
        start = format(startOfMonth(today), 'yyyy-MM-dd');
        break;
      default:
        return;
    }
    setActivePreset(preset);
    setDateRange({ startDate: start, endDate: format(today, 'yyyy-MM-dd') });
  };

  const handleDateChange = (field, value) => {
    setActivePreset('custom');
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  // ─── Fetch on date range change ───
  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/reports/sales`, { params: dateRange });
      setReport(res.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'sales', label: 'Sales Overview' },
    { id: 'item-wise', label: 'Item-wise' },
    { id: 'gst', label: 'GST / Tax' }
  ];

  // ─── Derive period label ───
  const getPeriodLabel = () => {
    if (activePreset === 'today') return "Today's";
    if (activePreset === 'week') return "This Week's";
    if (activePreset === 'month') return "This Month's";
    return 'Selected Period';
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', padding: '0.5rem' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.85rem', letterSpacing: '-0.02em' }}>Reports & Analytics</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            {getPeriodLabel()} performance breakdown • {dateRange.startDate} to {dateRange.endDate}
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'flex-end' }}>
          {/* Quick Presets */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <PresetButton label="Today" icon={<Clock size={13} />} active={activePreset === 'today'} onClick={() => applyPreset('today')} />
            <PresetButton label="This Week" icon={<CalendarDays size={13} />} active={activePreset === 'week'} onClick={() => applyPreset('week')} />
            <PresetButton label="This Month" icon={<CalendarRange size={13} />} active={activePreset === 'month'} onClick={() => applyPreset('month')} />
          </div>

          {/* Date Range Picker */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            background: 'var(--surface-color)', 
            padding: '0.5rem 1.1rem', 
            borderRadius: 'var(--radius-lg)',
            border: `1px solid ${activePreset === 'custom' ? 'var(--primary)' : 'var(--border-color)'}`,
            boxShadow: 'var(--shadow-sm)',
            transition: 'border-color 0.2s ease'
          }}>
            <Calendar size={16} color="var(--primary)" />
            <input 
              type="date" 
              value={dateRange.startDate} 
              onChange={(e) => handleDateChange('startDate', e.target.value)} 
              style={dateInputStyle} 
              className="white-picker"
            />
            <span style={{ color: 'var(--border-color)', fontWeight: 300 }}>→</span>
            <input 
              type="date" 
              value={dateRange.endDate} 
              onChange={(e) => handleDateChange('endDate', e.target.value)} 
              style={dateInputStyle} 
              className="white-picker"
            />
          </div>
        </div>
      </div>

      {/* Metric Highlights — always synced with date range */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <MetricCard 
          label={`${getPeriodLabel()} Revenue`} 
          value={`₹${report.summary.totalRevenue.toLocaleString('en-IN')}`} 
          icon={<IndianRupee />} 
          color="#F97316" 
        />
        <MetricCard 
          label="Total Orders" 
          value={report.summary.totalOrders} 
          icon={<ShoppingBag />} 
          color="#3B82F6"
          sub={report.summary.cancelledOrders > 0 ? `${report.summary.cancelledOrders} cancelled` : null}
          subColor="#EF4444"
        />
        <MetricCard 
          label="Avg Order Value" 
          value={`₹${report.summary.avgOrderValue.toLocaleString('en-IN')}`} 
          icon={<TrendingUp />} 
          color="#10B981" 
        />
        <MetricCard 
          label="GST Liability" 
          value={`₹${report.summary.totalGst.toLocaleString('en-IN')}`} 
          icon={<Percent />} 
          color="#8B5CF6" 
        />
      </div>

      {/* Premium Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', padding: '0.4rem', background: 'var(--surface-color)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', width: 'fit-content' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.6rem 1.75rem',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(249, 115, 22, 0.25)' : 'none',
              fontFamily: 'inherit'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: '8rem', textAlign: 'center' }}>
          <div className="spinner" style={{ marginBottom: '1.5rem' }}></div>
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Generating analytical reports...</p>
        </div>
      ) : (
        <div style={{ animation: 'slideIn 0.4s ease-out' }}>
          {activeTab === 'sales' && <SalesOverview data={report.dailyData} />}
          {activeTab === 'item-wise' && <ItemWiseView data={report.itemWiseData} totalRevenue={report.summary.totalRevenue} />}
          {activeTab === 'gst' && <GstTaxView data={report.gstData} summary={report.summary} />}
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.05); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ═══════ View Components ═══════

function SalesOverview({ data }) {
  if (!data || data.length === 0) {
    return <EmptyState message="No sales data found for the selected period. Try adjusting the date range." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '1.5rem' }}>
        <ChartCard title="Daily Revenue">
          <div style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d3748" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }} 
                  contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)' }} 
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={data.length > 15 ? 16 : 40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Order Frequency">
          <div style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d3748" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px' }} 
                  formatter={(value, name) => {
                    if (name === 'orders') return [value, 'Orders'];
                    if (name === 'cancelled') return [value, 'Cancelled'];
                    return [value, name];
                  }}
                />
                <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: 'var(--bg-color)' }} name="orders" />
                <Line type="monotone" dataKey="cancelled" stroke="#EF4444" strokeWidth={2} dot={{ r: 3, fill: '#EF4444', strokeWidth: 2, stroke: 'var(--bg-color)' }} strokeDasharray="5 5" name="cancelled" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <TableCard title="Day-by-Day Performance">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Total Orders</th>
              <th style={thStyle}>Cancellations</th>
              <th style={thStyle}>Net Revenue</th>
              <th style={thStyle}>Average Bill</th>
              <th style={thStyle}>Estimated GST</th>
            </tr>
          </thead>
          <tbody>
            {data.map((day, ix) => (
              <tr key={ix} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="report-row">
                <td style={tdStyle}>{day.fullDate || day.date}</td>
                <td style={tdStyle}>{day.orders}</td>
                <td style={{ ...tdStyle, color: day.cancelled > 0 ? '#EF4444' : 'var(--text-muted)' }}>{day.cancelled}</td>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#10B981' }}>₹{day.revenue.toLocaleString('en-IN')}</td>
                <td style={tdStyle}>₹{day.avgOrder.toLocaleString('en-IN')}</td>
                <td style={tdStyle}>₹{day.gst.toLocaleString('en-IN')}</td>
              </tr>
            ))}
            {/* Totals row */}
            <tr style={{ background: 'rgba(249, 115, 22, 0.08)', fontWeight: 800, borderTop: '2px solid var(--border-color)' }}>
              <td style={tdStyle}>TOTAL</td>
              <td style={tdStyle}>{data.reduce((s, d) => s + d.orders, 0)}</td>
              <td style={{ ...tdStyle, color: '#EF4444' }}>{data.reduce((s, d) => s + d.cancelled, 0)}</td>
              <td style={{ ...tdStyle, color: '#10B981' }}>₹{data.reduce((s, d) => s + d.revenue, 0).toLocaleString('en-IN')}</td>
              <td style={tdStyle}>—</td>
              <td style={tdStyle}>₹{data.reduce((s, d) => s + d.gst, 0).toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

function ItemWiseView({ data, totalRevenue }) {
  if (!data || data.length === 0) {
    return <EmptyState message="No item sales data found for the selected period." />;
  }

  const top8 = data.slice(0, 8);
  const COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#14B8A6', '#EF4444'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '1.5rem' }}>
        <ChartCard title="Top Selling Dishes">
          <div style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top8} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#2d3748" />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={10} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-main)" fontSize={11} axisLine={false} width={130} />
                <Tooltip 
                  cursor={{ fill: 'rgba(249, 115, 22, 0.05)' }} 
                  contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px' }} 
                  formatter={(value) => [value, 'Qty Sold']}
                />
                <Bar dataKey="quantity" radius={[0, 4, 4, 0]} barSize={24}>
                  {top8.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Revenue Share by Dish">
          <div style={{ height: '350px', display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie 
                  data={top8} 
                  innerRadius={70} 
                  outerRadius={110} 
                  paddingAngle={3} 
                  dataKey="revenue"
                  nameKey="name"
                >
                  {top8.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '40%' }}>
              {top8.slice(0, 5).map((item, ix) => (
                <div key={ix} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[ix], flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-main)', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0 }}>₹{item.revenue.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      <TableCard title="Dish-wise Revenue Breakdown">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Dish Name</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Units Sold</th>
              <th style={thStyle}>Total Revenue</th>
              <th style={thStyle}>Contribution %</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, ix) => (
              <tr key={ix} style={{ borderBottom: '1px solid var(--border-color)' }} className="report-row">
                <td style={{ ...tdStyle, color: 'var(--text-muted)', fontWeight: 700 }}>{ix + 1}</td>
                <td style={tdStyle}><strong>{item.name}</strong></td>
                <td style={tdStyle}>
                  <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', fontWeight: 600 }}>
                    {item.category}
                  </span>
                </td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{item.quantity}</td>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#F97316' }}>₹{item.revenue.toLocaleString('en-IN')}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1, height: 6, background: 'var(--bg-color)', borderRadius: 99, overflow: 'hidden', maxWidth: 80 }}>
                      <div style={{ width: `${totalRevenue > 0 ? (item.revenue / totalRevenue * 100) : 0}%`, height: '100%', background: 'var(--primary)', borderRadius: 99, transition: 'width 0.5s ease' }} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{totalRevenue > 0 ? (item.revenue / totalRevenue * 100).toFixed(1) : 0}%</span>
                  </div>
                </td>
              </tr>
            ))}
            {/* Totals row */}
            {data.length > 0 && (
              <tr style={{ background: 'rgba(249, 115, 22, 0.08)', fontWeight: 800, borderTop: '2px solid var(--border-color)' }}>
                <td style={tdStyle}></td>
                <td style={tdStyle}>TOTAL ({data.length} items)</td>
                <td style={tdStyle}></td>
                <td style={tdStyle}>{data.reduce((s, d) => s + d.quantity, 0)}</td>
                <td style={{ ...tdStyle, color: '#F97316' }}>₹{data.reduce((s, d) => s + d.revenue, 0).toLocaleString('en-IN')}</td>
                <td style={tdStyle}>100%</td>
              </tr>
            )}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

function GstTaxView({ data, summary }) {
  if (!data || data.length === 0) {
    return <EmptyState message="No tax data found for the selected period." />;
  }

  const totalTaxable = data.reduce((s, d) => s + d.taxable, 0);
  const totalCgst = data.reduce((s, d) => s + d.cgst, 0);
  const totalSgst = data.reduce((s, d) => s + d.sgst, 0);
  const totalGst = data.reduce((s, d) => s + d.total, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* GST summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <GstMiniCard label="Taxable Amount" value={`₹${totalTaxable.toLocaleString('en-IN')}`} color="#3B82F6" />
        <GstMiniCard label="CGST (2.5%)" value={`₹${totalCgst.toLocaleString('en-IN')}`} color="#10B981" />
        <GstMiniCard label="SGST (2.5%)" value={`₹${totalSgst.toLocaleString('en-IN')}`} color="#F59E0B" />
        <GstMiniCard label="Total GST Liability" value={`₹${totalGst.toLocaleString('en-IN')}`} color="#8B5CF6" />
      </div>

      <TableCard title="Detailed GST Compliance Report">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={thStyle}>Transaction Date</th>
              <th style={thStyle}>Taxable Amount</th>
              <th style={thStyle}>CGST (2.5%)</th>
              <th style={thStyle}>SGST (2.5%)</th>
              <th style={thStyle}>Total GST</th>
              <th style={thStyle}>Net Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, ix) => (
              <tr key={ix} style={{ borderBottom: '1px solid var(--border-color)' }} className="report-row">
                <td style={tdStyle}>{row.date}</td>
                <td style={tdStyle}>₹{row.taxable.toLocaleString('en-IN')}</td>
                <td style={tdStyle}>₹{row.cgst.toLocaleString('en-IN')}</td>
                <td style={tdStyle}>₹{row.sgst.toLocaleString('en-IN')}</td>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#8B5CF6' }}>₹{row.total.toLocaleString('en-IN')}</td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>₹{(row.taxable + row.total).toLocaleString('en-IN')}</td>
              </tr>
            ))}
            {/* Totals */}
            <tr style={{ background: 'rgba(139, 92, 246, 0.1)', fontWeight: 800, borderTop: '2px solid var(--border-color)' }}>
              <td style={tdStyle}>TOTAL</td>
              <td style={tdStyle}>₹{totalTaxable.toLocaleString('en-IN')}</td>
              <td style={tdStyle}>₹{totalCgst.toLocaleString('en-IN')}</td>
              <td style={tdStyle}>₹{totalSgst.toLocaleString('en-IN')}</td>
              <td style={{ ...tdStyle, color: '#8B5CF6' }}>₹{totalGst.toLocaleString('en-IN')}</td>
              <td style={tdStyle}>₹{(totalTaxable + totalGst).toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

// ═══════ Shared Components ═══════

function PresetButton({ label, icon, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.4rem 0.85rem',
        borderRadius: '999px',
        border: `1px solid ${active ? 'var(--primary)' : 'var(--border-color)'}`,
        background: active ? 'rgba(249, 115, 22, 0.12)' : 'var(--surface-color)',
        color: active ? 'var(--primary)' : 'var(--text-muted)',
        fontWeight: 700,
        fontSize: '0.75rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
        letterSpacing: '0.02em'
      }}
    >
      {icon} {label}
    </button>
  );
}

function EmptyState({ message }) {
  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '5rem 2rem', color: 'var(--text-muted)', gap: '1rem', textAlign: 'center'
    }}>
      <ShoppingBag size={48} strokeWidth={1} />
      <p style={{ fontSize: '0.95rem', maxWidth: 400 }}>{message}</p>
    </div>
  );
}

function MetricCard({ label, value, icon, color, sub, subColor }) {
  return (
    <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: '-15px', bottom: '-15px', width: '90px', height: '90px', background: `${color}05`, borderRadius: '50%' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>{label}</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>{value}</div>
          {sub && <div style={{ fontSize: '0.72rem', fontWeight: 600, color: subColor || 'var(--text-muted)', marginTop: '0.25rem' }}>{sub}</div>}
        </div>
        <div style={{ background: `${color}15`, color: color, padding: '0.75rem', borderRadius: '16px', boxShadow: `0 4px 12px ${color}10` }}>{React.cloneElement(icon, { size: 22 })}</div>
      </div>
    </div>
  );
}

function GstMiniCard({ label, value, color }) {
  return (
    <div style={{ 
      background: 'var(--surface-color)', padding: '1.25rem', borderRadius: 'var(--radius-xl)', 
      border: '1px solid var(--border-color)', borderLeft: `4px solid ${color}` 
    }}>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>{value}</div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={{ background: 'var(--surface-color)', padding: '1.75rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
      <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', borderLeft: '4px solid var(--primary)', paddingLeft: '1rem' }}>{title}</h4>
      {children}
    </div>
  );
}

function TableCard({ title, children }) {
  return (
    <div style={{ background: 'var(--surface-color)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
       <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{title}</h4>
      </div>
      <div style={{ overflowX: 'auto' }}>{children}</div>
    </div>
  );
}

const dateInputStyle = { background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700, outline: 'none', cursor: 'pointer' };
const thStyle = { padding: '1.25rem 1rem', textAlign: 'left', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' };
const tdStyle = { padding: '1.25rem 1rem', fontSize: '0.9rem', color: 'var(--text-main)' };
