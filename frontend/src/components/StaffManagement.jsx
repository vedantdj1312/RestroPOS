import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Edit2, UserX, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

export default function StaffManagement({ currentUser, onUpdateUser }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Waiter/Server',
    salary: '',
    login_time: '',
    logout_time: '',
    status: 'Active'
  });

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStaff(res.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openAddModal = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'Waiter/Server',
      salary: '',
      login_time: '',
      logout_time: '',
      status: 'Active'
    });
    setShowModal(true);
  };

  const openEditModal = (employee) => {
    setEditingStaff(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      password: employee.password || '', // Display work password
      role: employee.role,
      salary: employee.salary,
      login_time: employee.login_time || '',
      logout_time: employee.logout_time || '',
      status: employee.status
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await axios.put(`http://localhost:5000/api/users/${editingStaff.id}`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        // If the current logged in user updated their own profile, update global state
        if (onUpdateUser && currentUser && editingStaff.id === currentUser.id) {
          onUpdateUser({ ...currentUser, ...formData });
        }
      } else {
        await axios.post('http://localhost:5000/api/users', formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
      setShowModal(false);
      fetchStaff();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save staff');
    }
  };

  const handleFire = async (employee) => {
    if (!window.confirm(`Are you sure you want to fire ${employee.name}?`)) return;
    try {
      await axios.put(`http://localhost:5000/api/users/${employee.id}`, { ...employee, status: 'Terminated' }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchStaff();
    } catch (error) {
      alert('Failed to terminate staff');
    }
  };

  const activeStaff = staff.filter(s => s.status === 'Active');
  const termStaff = staff.filter(s => s.status === 'Terminated');

  if (loading) return <div>Loading staff data...</div>;

  return (
    <div className="staff-mgmt-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>Staff Members</h2>
        <button className="primary-btn" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary)', color: 'white', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          <UserPlus size={18} /> Add Employee
        </button>
      </div>

      <div style={{ overflowX: 'auto', background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Name</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Role</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>Salary (₹)</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Shift</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Password</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...activeStaff, ...termStaff].map((emp) => (
              <tr key={emp.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: emp.status === 'Terminated' ? 0.6 : 1 }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{emp.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{emp.email} {emp.status === 'Terminated' && '(Terminated)'}</div>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-main)', fontSize: '0.9rem' }}>{emp.role}</td>
                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: 'var(--secondary)' }}>
                  ₹{(parseFloat(emp.salary) || 0).toLocaleString()}
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                  {emp.login_time || '--:--'} to {emp.logout_time || '--:--'}
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                  {emp.password || '••••••••'}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  {emp.status === 'Active' ? (
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button onClick={() => openEditModal(emp)} title="Edit" style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer' }}>
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleFire(emp)} title="Fire" style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                        <UserX size={18} />
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600 }}>Fired</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: 'var(--radius-xl)', width: '90%', maxWidth: '500px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: 'var(--text-main)' }}>
              {editingStaff ? 'Edit Employee' : 'Add New Employee'}
            </h3>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-main)', outline: 'none' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-main)', outline: 'none' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Password</label>
                  <input type="text" name="password" value={formData.password} onChange={handleInputChange} required={!editingStaff} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-main)', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Role</label>
                  <select name="role" value={formData.role} onChange={handleInputChange} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)', outline: 'none' }}>
                    <option value="Owner/Admin">Owner/Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Waiter/Server">Waiter/Server</option>
                    <option value="Kitchen Staff">Kitchen Staff</option>
                    <option value="Inventory Manager">Inventory Manager</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Salary (₹)</label>
                  <input type="number" name="salary" value={formData.salary} onChange={handleInputChange} required style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-main)', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Shift Start</label>
                  <input type="time" name="login_time" value={formData.login_time} onChange={handleInputChange} className="white-picker" style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-main)', outline: 'none' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Shift End</label>
                  <input type="time" name="logout_time" value={formData.logout_time} onChange={handleInputChange} className="white-picker" style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-main)', outline: 'none' }} />
                </div>
              </div>

              {editingStaff && (
                <div>
                   <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Status</label>
                   <select name="status" value={formData.status} onChange={handleInputChange} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)', outline: 'none' }}>
                      <option value="Active">Active</option>
                      <option value="Terminated">Terminated</option>
                   </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--secondary)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

