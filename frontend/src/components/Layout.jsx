import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  Utensils, 
  ChefHat, 
  ClipboardList, 
  Pizza, 
  Package, 
  LineChart, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  BookOpen
} from 'lucide-react';

export default function Layout({ user, onLogout }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [kitchenCount, setKitchenCount] = useState(0);
  
  // Fast Switch State
  const [switchingRole, setSwitchingRole] = useState(null);
  const [switchPassword, setSwitchPassword] = useState('');
  const [switchError, setSwitchError] = useState('');
  const [isSwitching, setIsSwitching] = useState(false);

  const location = useLocation();

  const FAST_SWITCH_ROLES = [
    { name: 'Owner/Admin', email: 'admin@restpos.com', icon: <LayoutDashboard size={14} /> },
    { name: 'Manager', email: 'manager@restpos.com', icon: <Users size={14} /> },
    { name: 'Cashier', email: 'cashier@restpos.com', icon: <Receipt size={14} /> },
    { name: 'Waiter/Server', email: 'waiter@restpos.com', icon: <Utensils size={14} /> },
    { name: 'Kitchen Staff', email: 'kitchen@restpos.com', icon: <ChefHat size={14} /> },
    { name: 'Inventory Manager', email: 'inventory@restpos.com', icon: <Package size={14} /> }
  ];

  const handleSwitchSubmit = async (e) => {
    e.preventDefault();
    setIsSwitching(true);
    setSwitchError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: switchingRole.email, password: switchPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid credentials');
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/admin'; // Force full reload to reset App state cleanly
    } catch (err) {
      setSwitchError(err.message);
      setIsSwitching(false);
    }
  };

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/kitchen/count');
        const data = await res.json();
        setKitchenCount(data.count || 0);
      } catch (e) { /* ignore */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/') return 'Dashboard Overview';
    if (path === '/admin/pos') return 'Billing / POS';
    if (path === '/admin/tables') return 'Table Management';
    if (path === '/admin/menu') return 'Menu Management';
    if (path === '/admin/kitchen') return 'Kitchen / KOT';
    if (path === '/admin/orders') return 'Order History';
    if (path === '/admin/inventory') return 'Inventory System';
    if (path === '/admin/reports') return 'Analytics & Reports';
    if (path === '/admin/customers') return 'Customer Database';
    if (path === '/admin/settings') return 'System Settings';
    if (path === '/admin/sop') return 'Standard Operating Procedures (SOP)';
    return 'Management Desk';
  };

  return (
    <div className="app-container">
      <aside className={`sidebar ${isMinimized ? 'minimized' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ 
            backgroundColor: '#F97316', 
            minWidth: '36px', 
            width: '36px',
            height: '36px', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'white', 
            fontWeight: 'bold', 
            fontSize: '1rem',
            flexShrink: 0
          }}>
            RP
          </div>
          {!isMinimized && <span style={{ color: '#F97316', fontWeight: 700, fontSize: '1.25rem' }}>RestoPOS</span>}
        </div>
        
        <nav className="nav-links" style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {['Owner/Admin', 'Manager', 'Cashier'].includes(user?.role) && (
            <NavLink to="/admin" end title="Dashboard" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <LayoutDashboard size={20} color="#4ADE80" style={{ flexShrink: 0 }} />
              {!isMinimized && <span>Dashboard</span>}
            </NavLink>
          )}
          {['Owner/Admin', 'Manager', 'Cashier', 'Waiter/Server'].includes(user?.role) && (
            <>
              <NavLink to="/admin/pos" title="Billing / POS" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                <Receipt size={20} color="#93C5FD" style={{ flexShrink: 0 }} />
                {!isMinimized && <span>Billing / POS</span>}
              </NavLink>
              <NavLink to="/admin/tables" title="Tables" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                <Utensils size={20} color="#C4B5FD" style={{ flexShrink: 0 }} />
                {!isMinimized && <span>Tables</span>}
              </NavLink>
            </>
          )}
          {['Owner/Admin', 'Manager', 'Kitchen Staff', 'Waiter/Server'].includes(user?.role) && (
            <NavLink to="/admin/kitchen" title="Kitchen / KOT" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <ChefHat size={20} color="#FBBF24" style={{ flexShrink: 0 }} />
              {!isMinimized && <span>Kitchen / KOT</span>}
              {!isMinimized && kitchenCount > 0 && <span className="nav-badge">{kitchenCount}</span>}
            </NavLink>
          )}
          {['Owner/Admin', 'Manager', 'Waiter/Server', 'Kitchen Staff', 'Cashier'].includes(user?.role) && (
            <NavLink to="/admin/orders" title="Orders" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <ClipboardList size={20} color="#FCA5A5" style={{ flexShrink: 0 }} />
              {!isMinimized && <span>Orders</span>}
            </NavLink>
          )}
          <NavLink to="/admin/menu" title="Menu Management" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
            <Pizza size={20} color="#FDE047" style={{ flexShrink: 0 }} />
            {!isMinimized && <span>Menu {['Owner/Admin', 'Manager'].includes(user?.role) ? 'Management' : 'View'}</span>}
          </NavLink>

          {['Owner/Admin', 'Manager', 'Inventory Manager'].includes(user?.role) && (
            <NavLink to="/admin/inventory" title="Inventory" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <Package size={20} color="#D97706" style={{ flexShrink: 0 }} />
              {!isMinimized && <span>Inventory</span>}
            </NavLink>
          )}
          {['Owner/Admin', 'Manager', 'Inventory Manager'].includes(user?.role) && (
            <NavLink to="/admin/reports" title="Reports" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <LineChart size={20} color="#60A5FA" style={{ flexShrink: 0 }} />
              {!isMinimized && <span>Reports</span>}
            </NavLink>
          )}
          {['Owner/Admin', 'Manager', 'Cashier', 'Waiter/Server'].includes(user?.role) && (
            <NavLink to="/admin/customers" title="Customers" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <Users size={20} color="#A78BFA" style={{ flexShrink: 0 }} />
              {!isMinimized && <span>Customers</span>}
            </NavLink>
          )}
          <NavLink to="/admin/sop" title="SOP / Recipes" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
            <BookOpen size={20} color="#34D399" style={{ flexShrink: 0 }} />
            {!isMinimized && <span>SOP / Recipes</span>}
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          {['Owner/Admin', 'Manager'].includes(user?.role) && (
            <NavLink to="/admin/settings" title="Settings" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <Settings size={20} color="#9CA3AF" style={{ flexShrink: 0 }} />
              {!isMinimized && <span>Settings</span>}
            </NavLink>
          )}
          <button onClick={onLogout} title="Logout" className="nav-link" style={{ background: 'transparent', border: 'none', borderLeft: '4px solid transparent', width: '100%', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
            <LogOut size={20} color="#D97706" style={{ flexShrink: 0 }} />
            {!isMinimized && <span>Logout</span>}
          </button>
        </div>
      </aside>
      
      <main className="main-content">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => setIsMinimized(!isMinimized)} 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Menu size={24} />
            </button>
            <div className="page-title">{getPageTitle()}</div>
          </div>
          <div style={{ position: 'relative' }}>
            <div 
              className="user-profile" 
              onClick={() => {
                setShowDropdown(!showDropdown);
                setSwitchingRole(null);
                setSwitchPassword('');
                setSwitchError('');
              }}
              style={{ display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer' }}
              title="Click to manage account"
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                <span style={{ fontWeight: 500 }}>{user?.name || 'Staff User'}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role || ''}</span>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {user?.name ? user.name[0].toUpperCase() : 'S'}
              </div>
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                background: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                width: '180px',
                zIndex: 100,
                overflow: 'hidden'
              }}>
                {switchingRole ? (
                  <form onSubmit={handleSwitchSubmit} style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      Switching to <strong style={{color:'var(--text-main)'}}>{switchingRole.name}</strong>
                    </div>
                    {switchError && <div style={{ color: '#EF4444', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{switchError}</div>}
                    <input 
                      type="password" 
                      placeholder="Enter password..."
                      value={switchPassword}
                      onChange={(e) => setSwitchPassword(e.target.value)}
                      autoFocus
                      required
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        marginBottom: '0.75rem',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        type="button" 
                        onClick={() => {
                          setSwitchingRole(null);
                          setSwitchPassword('');
                          setSwitchError('');
                        }}
                        style={{ flex: 1, padding: '0.4rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={isSwitching}
                        style={{ flex: 1, padding: '0.4rem', background: 'var(--primary)', border: 'none', color: 'white', borderRadius: '4px', cursor: isSwitching ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                      >
                        {isSwitching ? '...' : 'Switch'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' }}>
                      Fast Switch Role
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {FAST_SWITCH_ROLES.map(role => {
                        const isActive = user?.role === role.name;
                        return (
                          <button 
                            key={role.name}
                            onClick={() => {
                              if (!isActive) setSwitchingRole(role);
                            }} 
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              width: '100%',
                              padding: '0.5rem 1rem',
                              background: isActive ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                              border: 'none',
                              color: isActive ? '#F97316' : 'var(--text-main)',
                              cursor: isActive ? 'default' : 'pointer',
                              textAlign: 'left',
                              fontSize: '0.85rem',
                              fontFamily: 'inherit'
                            }}
                            onMouseOver={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                            onMouseOut={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ opacity: isActive ? 1 : 0.6 }}>{role.icon}</span>
                              <span style={{ fontWeight: isActive ? 600 : 400 }}>{role.name}</span>
                            </div>
                            {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F97316' }} />}
                          </button>
                        );
                      })}
                    </div>
                    
                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '0.2rem' }}>
                      <button 
                        onClick={() => {
                          setShowDropdown(false);
                          onLogout();
                        }} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: 'transparent',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '0.85rem',
                          fontFamily: 'inherit',
                          fontWeight: 600
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <LogOut size={14} />
                        Logout Completely
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>
        
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
