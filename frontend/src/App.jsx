import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Tables from './pages/Tables';
import Login from './pages/Login';
import Menu from './pages/Menu';
import Kitchen from './pages/Kitchen';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import CustomerSignup from './pages/CustomerSignup';
import CustomerMenu from './pages/CustomerMenu';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import SOP from './pages/SOP';

function App() {
  const [user, setUser] = React.useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [customer, setCustomer] = React.useState(null);

  const handleStaffLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const handleStaffLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleCustomerLogin = (customerData) => {
    setCustomer(customerData);
  };

  const handleCustomerLogout = () => {
    setCustomer(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Customer-facing routes (no auth required for browsing) */}
        <Route path="/" element={
          <CustomerSignup onCustomerLogin={handleCustomerLogin} />
        } />
        <Route path="/customer/menu" element={
          customer ? (
            <CustomerMenu customer={customer} onLogout={handleCustomerLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        } />

        {/* Staff Login */}
        <Route path="/login" element={
          user ? <Navigate to="/admin" replace /> : <Login onLogin={handleStaffLogin} />
        } />

        {/* Staff dashboard (protected & RBAC) */}
        {user && (
          <Route path="/admin" element={<Layout user={user} onLogout={handleStaffLogout} />}>
            {/* Dashboard: Owner/Admin, Manager, Cashier */}
            {['Owner/Admin', 'Manager', 'Cashier'].includes(user.role) && (
              <Route index element={<Dashboard />} />
            )}

            {/* POS & Tables: Owner/Admin, Manager, Cashier, Waiter/Server */}
            {['Owner/Admin', 'Manager', 'Cashier', 'Waiter/Server'].includes(user.role) && (
              <>
                <Route path="pos" element={<POS user={user} />} />
                <Route path="tables" element={<Tables user={user} />} />
              </>
            )}

            {/* Kitchen: Owner/Admin, Manager, Kitchen Staff, Waiter/Server */}
            {['Owner/Admin', 'Manager', 'Kitchen Staff', 'Waiter/Server'].includes(user.role) && (
              <Route path="kitchen" element={<Kitchen user={user} />} />
            )}

            {/* Orders: Owner/Admin, Manager, Waiter/Server, Kitchen Staff, Cashier */}
            {['Owner/Admin', 'Manager', 'Waiter/Server', 'Kitchen Staff', 'Cashier'].includes(user.role) && (
              <Route path="orders" element={<Orders user={user} />} />
            )}

            {/* Menu Management: Owner/Admin, Manager (others view only -> handle in Menu component) */}
            <Route path="menu" element={<Menu user={user} />} />

            {/* Inventory: Owner/Admin, Manager, Inventory Manager */}
            {['Owner/Admin', 'Manager', 'Inventory Manager'].includes(user.role) && (
              <Route path="inventory" element={<Inventory user={user} />} />
            )}

            {/* Reports: Owner/Admin, Manager, Inventory Manager */}
            {['Owner/Admin', 'Manager', 'Inventory Manager'].includes(user.role) && (
              <Route path="reports" element={<Reports user={user} />} />
            )}

            {/* Customers: Owner/Admin, Manager, Cashier, Waiter/Server */}
            {['Owner/Admin', 'Manager', 'Cashier', 'Waiter/Server'].includes(user.role) && (
              <Route path="customers" element={<Customers user={user} />} />
            )}

            {/* Settings: Owner/Admin, Manager */}
            {['Owner/Admin', 'Manager'].includes(user.role) && (
              <Route path="settings" element={<Settings user={user} onUpdateUser={handleUserUpdate} />} />
            )}

            {/* SOP: All roles */}
            <Route path="sop" element={<SOP user={user} />} />

            {/* Fallback route inside admin if they visit an unallowed route but are logged in */}
            <Route path="*" element={<div style={{ padding: '3rem', textAlign: 'center' }}><h1>403 Access Denied</h1><p>You do not have permission to view this module.</p></div>} />
          </Route>
        )}

        {/* Fallback: redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
