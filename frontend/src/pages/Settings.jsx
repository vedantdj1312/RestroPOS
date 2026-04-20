import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Building2, 
  Receipt, 
  CreditCard, 
  Printer, 
  Users, 
  Info 
} from 'lucide-react';
import StaffManagement from '../components/StaffManagement';

const TABS = [
  { id: 'info', label: 'Restaurant Info', icon: <Building2 size={16} /> },
  { id: 'tax', label: 'Tax & GST', icon: <Receipt size={16} /> },
  { id: 'payment', label: 'Payment Methods', icon: <CreditCard size={16} /> },
  { id: 'printing', label: 'Printing', icon: <Printer size={16} /> },
  { id: 'staff', label: 'Staff & Users', icon: <Users size={16} /> },
  { id: 'about', label: 'About', icon: <Info size={16} /> }
];

export default function Settings({ user, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    restaurant_name: '',
    address: '',
    phone: '',
    email: '',
    gstin: '',
    fssai: '',
    currency: '',
    timezone: '',
    receipt_footer: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/settings');
      setFormData(prev => ({ ...prev, ...res.data }));
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    setSaving(true);
    try {
      await axios.post('http://localhost:5000/api/settings', formData);
      const btn = e && e.target ? e.target : document.getElementById('save-btn');
      if (btn) {
        const originalText = btn.innerText;
        btn.innerText = 'Saved! ✓';
        btn.style.background = '#10B981';
        setTimeout(() => {
          btn.innerText = originalText;
          btn.style.background = '#F97316';
        }, 2000);
      }
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', animation: 'fadeIn 0.3s ease', minHeight: 'calc(100vh - 100px)' }}>
      {/* Sidebar */}
      <div style={{
        width: '240px',
        background: 'var(--surface-color)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.2rem'
      }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '1rem', paddingLeft: '1rem' }}>
          SETTINGS
        </div>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.8rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                color: isActive ? '#F97316' : 'var(--text-main)',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                opacity: isActive ? 1 : 0.7
              }}
            >
              <div style={{ color: isActive ? '#F97316' : 'var(--text-muted)' }}>
                {tab.icon}
              </div>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        background: 'var(--surface-color)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '2.5rem',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {loading ? (
          <div style={{ margin: 'auto', color: 'var(--text-muted)' }}>Loading Settings...</div>
        ) : (
          <>
            {activeTab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Restaurant Information</h2>
                
                {/* Full Width */}
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Restaurant Name</label>
                  <input
                    type="text"
                    name="restaurant_name"
                    value={formData.restaurant_name}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                {/* Full Width */}
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                {/* 2-Column Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>Email</label>
                    <input
                      type="text"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* 2-Column Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>GSTIN</label>
                    <input
                      type="text"
                      name="gstin"
                      value={formData.gstin}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>FSSAI License</label>
                    <input
                      type="text"
                      name="fssai"
                      value={formData.fssai}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* 2-Column Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>Currency</label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto', paddingRight: '1rem' }}
                    >
                      <option value="INR (₹)">INR (₹)</option>
                      <option value="USD ($)">USD ($)</option>
                      <option value="EUR (€)">EUR (€)</option>
                      <option value="GBP (£)">GBP (£)</option>
                    </select>
                  </div>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>Timezone</label>
                    <select
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleChange}
                      style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto', paddingRight: '1rem' }}
                    >
                      <option value="Asia/Kolkata (IST +5:30)">Asia/Kolkata (IST +5:30)</option>
                      <option value="America/New_York (EST -5:00)">America/New_York (EST -5:00)</option>
                      <option value="Europe/London (GMT +0:00)">Europe/London (GMT +0:00)</option>
                      <option value="Asia/Dubai (GST +4:00)">Asia/Dubai (GST +4:00)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>

                {/* Full Width */}
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Receipt Footer Text</label>
                  <input
                    type="text"
                    name="receipt_footer"
                    value={formData.receipt_footer}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="e.g. Thank you for visiting!"
                  />
                </div>

                {/* Save Button */}
                {user?.role === 'Owner/Admin' && (
                  <div style={{ marginTop: '1rem', display: 'flex' }}>
                    <button
                      id="save-btn"
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        background: '#F97316',
                        color: 'white',
                        border: 'none',
                        padding: '0.8rem 2rem',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'tax' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Tax & GST Configuration</h2>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Default GST Percentage (%)</label>
                  <input type="number" name="gst_percentage" value={formData.gst_percentage || ''} onChange={handleChange} style={inputStyle} placeholder="e.g. 5" />
                </div>
                <div style={inputGroupStyle}>
                  <label style={{...labelStyle, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'}}>
                    <input type="checkbox" name="gst_inclusive" checked={formData.gst_inclusive === 'true'} onChange={(e) => setFormData(prev => ({...prev, gst_inclusive: e.target.checked ? 'true' : 'false'}))} style={{ width: '18px', height: '18px' }} />
                    Menu Prices are inclusive of GST
                  </label>
                </div>
                {/* Save Button */}
                {user?.role === 'Owner/Admin' && (
                  <div style={{ marginTop: '1rem', display: 'flex' }}>
                    <button id="save-btn-tax" onClick={handleSave} disabled={saving} style={saveBtnStyle(saving)}>{saving ? 'Saving...' : 'Save Changes'}</button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payment' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Payment Methods</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>UPI ID (for QR Generation)</label>
                    <input type="text" name="upi_id" value={formData.upi_id || ''} onChange={handleChange} style={inputStyle} placeholder="restaurant@upi" />
                  </div>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>UPI Merchant Name</label>
                    <input type="text" name="upi_name" value={formData.upi_name || ''} onChange={handleChange} style={inputStyle} placeholder="The Grand Spice" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <label style={{...labelStyle, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'}}>
                    <input type="checkbox" name="accept_cash" checked={formData.accept_cash !== 'false'} onChange={(e) => setFormData(prev => ({...prev, accept_cash: e.target.checked ? 'true' : 'false'}))} style={{ width: '18px', height: '18px' }} />
                    Accept Cash
                  </label>
                  <label style={{...labelStyle, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'}}>
                    <input type="checkbox" name="accept_card" checked={formData.accept_card === 'true'} onChange={(e) => setFormData(prev => ({...prev, accept_card: e.target.checked ? 'true' : 'false'}))} style={{ width: '18px', height: '18px' }} />
                    Accept Credit/Debit Card
                  </label>
                  <label style={{...labelStyle, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'}}>
                    <input type="checkbox" name="accept_upi" checked={formData.accept_upi === 'true'} onChange={(e) => setFormData(prev => ({...prev, accept_upi: e.target.checked ? 'true' : 'false'}))} style={{ width: '18px', height: '18px' }} />
                    Accept UPI
                  </label>
                </div>
                {/* Save Button */}
                {user?.role === 'Owner/Admin' && (
                  <div style={{ marginTop: '1rem', display: 'flex' }}>
                    <button id="save-btn-pay" onClick={handleSave} disabled={saving} style={saveBtnStyle(saving)}>{saving ? 'Saving...' : 'Save Changes'}</button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'printing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Printing Settings</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>Printer IP / Name</label>
                    <input type="text" name="printer_ip" value={formData.printer_ip || ''} onChange={handleChange} style={inputStyle} placeholder="192.168.1.100" />
                  </div>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>Paper Width</label>
                    <select name="paper_width" value={formData.paper_width || '80mm'} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="58mm">58mm</option>
                      <option value="80mm">80mm</option>
                    </select>
                  </div>
                </div>
                <div style={inputGroupStyle}>
                  <label style={{...labelStyle, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'}}>
                    <input type="checkbox" name="auto_print_kot" checked={formData.auto_print_kot === 'true'} onChange={(e) => setFormData(prev => ({...prev, auto_print_kot: e.target.checked ? 'true' : 'false'}))} style={{ width: '18px', height: '18px' }} />
                    Automatically print KOT when order is placed
                  </label>
                </div>
                {/* Save Button */}
                {user?.role === 'Owner/Admin' && (
                  <div style={{ marginTop: '1rem', display: 'flex' }}>
                    <button id="save-btn-print" onClick={handleSave} disabled={saving} style={saveBtnStyle(saving)}>{saving ? 'Saving...' : 'Save Changes'}</button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'staff' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700, color: 'var(--text-main)' }}>Staff Settings & Security</h2>
                
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>General Permissions</h3>
                  <div style={inputGroupStyle}>
                    <label style={{...labelStyle, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)'}}>
                      <input type="checkbox" name="require_pin_voids" checked={formData.require_pin_voids === 'true'} onChange={(e) => setFormData(prev => ({...prev, require_pin_voids: e.target.checked ? 'true' : 'false'}))} style={{ width: '18px', height: '18px' }} />
                      Require Manager PIN for Order Voids
                    </label>
                  </div>
                  <div style={inputGroupStyle}>
                    <label style={{...labelStyle, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)'}}>
                      <input type="checkbox" name="allow_staff_discount" checked={formData.allow_staff_discount === 'true'} onChange={(e) => setFormData(prev => ({...prev, allow_staff_discount: e.target.checked ? 'true' : 'false'}))} style={{ width: '18px', height: '18px' }} />
                      Allow Staff to apply discounts without Manager
                    </label>
                  </div>
                  {/* Save Button */}
                  {user?.role === 'Owner/Admin' && (
                    <div style={{ marginTop: '0.5rem', display: 'flex' }}>
                      <button id="save-btn-staff" onClick={handleSave} disabled={saving} style={saveBtnStyle(saving)}>{saving ? 'Saving...' : 'Save Settings'}</button>
                    </div>
                  )}
                </div>

                <div style={{ height: '1px', background: 'var(--border-color)', margin: '1rem 0' }} />

                <StaffManagement currentUser={user} onUpdateUser={onUpdateUser} />
              </div>
            )}

            {activeTab === 'about' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <div style={{ width: '80px', height: '80px', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F97316', fontSize: '2.5rem' }}>
                  <Building2 size={40} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', fontWeight: 800 }}>RestroPOS System</h2>
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>Version 1.0.0 (Build 2026.04.13)</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
                  <p style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Developed & Maintained by</p>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#F97316' }}>Antigravity Team</h3>
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    For support, please contact:<br/>
                    <strong style={{ color: 'var(--text-main)' }}>support@antigravity-restropos.com</strong>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const labelStyle = {
  fontSize: '0.85rem',
  color: 'var(--text-muted)',
  fontWeight: 500
};

const inputStyle = {
  width: '100%',
  padding: '0.8rem 1rem',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  background: 'rgba(255, 255, 255, 0.02)',
  color: 'var(--text-main)',
  fontSize: '0.9rem',
  outline: 'none',
  transition: 'border-color 0.2s'
};

const saveBtnStyle = (saving) => ({
  background: '#F97316',
  color: 'white',
  border: 'none',
  padding: '0.8rem 2rem',
  borderRadius: '8px',
  fontWeight: 600,
  cursor: saving ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s',
});
