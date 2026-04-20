import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  ChevronRight,
  Filter
} from 'lucide-react';

export default function Menu({ user }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItemId, setCurrentItemId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category_id: '',
    is_veg: true,
    description: '',
    is_available: true,
    ingredients: [] // { inventory_item_id, quantity_required }
  });

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const [itemsRes, catRes, invRes] = await Promise.all([
        axios.get('http://localhost:5000/api/items'),
        axios.get('http://localhost:5000/api/categories'),
        axios.get('http://localhost:5000/api/inventory')
      ]);
      setItems(itemsRes.data);
      setCategories(catRes.data);
      setInventoryItems(invRes.data.items || []);
    } catch (error) {
      console.error('Error fetching menu data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentItemId(null);
    setFormData({
      name: '',
      price: '',
      category_id: categories[0]?.id || '',
      is_veg: true,
      description: '',
      is_available: true,
      ingredients: []
    });
    setShowModal(true);
  };

  const handleOpenEdit = async (item) => {
    setIsEditing(true);
    setCurrentItemId(item.id);
    
    // Default form data before recipe loads
    setFormData({
      name: item.name,
      price: item.price,
      category_id: item.category_id,
      is_veg: Boolean(item.is_veg),
      description: item.description || '',
      is_available: Boolean(item.is_available),
      ingredients: []
    });
    setShowModal(true);

    try {
      const res = await axios.get(`http://localhost:5000/api/items/${item.id}/recipe`);
      setFormData(prev => ({
        ...prev,
        ingredients: res.data || []
      }));
    } catch (err) {
      console.error('Failed to load recipe', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item? Items with order history cannot be deleted to preserve records.')) return;
    try {
      await axios.delete(`http://localhost:5000/api/items/${id}`);
      fetchMenuData();
    } catch (error) {
      const msg = error.response?.data?.error || error.message;
      alert('Failed to delete item: ' + msg);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let itemId = currentItemId;
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/items/${itemId}`, formData);
      } else {
        const res = await axios.post('http://localhost:5000/api/items', formData);
        itemId = res.data.id;
      }
      
      // Save Recipe Ingredients
      await axios.put(`http://localhost:5000/api/items/${itemId}/recipe`, {
        ingredients: formData.ingredients
      });

      setShowModal(false);
      fetchMenuData();
    } catch (error) {
      alert('Error saving item');
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      // Optimistic update
      const newStatus = !item.is_available;
      
      // Update backend via the patch route we saw earlier
      await axios.patch(`http://localhost:5000/api/items/${item.id}/availability`, {
        is_available: newStatus
      });
      
      // Re-fetch to recalculate computed_available
      fetchMenuData();
    } catch (error) {
      alert('Failed to update availability');
    }
  };

  const addIngredientField = () => {
    if (inventoryItems.length === 0) return alert('No inventory items exist.');
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { inventory_item_id: inventoryItems[0].id, quantity_required: 1 }]
    }));
  };

  const updateIngredientField = (index, field, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index][field] = value;
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const removeIngredientField = (index) => {
    const newIngredients = [...formData.ingredients];
    newIngredients.splice(index, 1);
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category_id === parseInt(activeCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Toolbar & Add Section */}
      {['Owner/Admin', 'Manager'].includes(user?.role) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
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
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)'
            }}
          >
            <Plus size={18} /> Add New Item
          </button>
        </div>
      )}

      {/* Toolbar Section */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        background: 'var(--surface-color)',
        padding: '1rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        alignItems: 'center'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by item name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '0.6rem 1rem 0.6rem 2.5rem', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-color)', 
              background: 'var(--bg-color)', 
              color: 'var(--text-main)',
              fontSize: '0.9rem'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} color="var(--text-muted)" />
          <select 
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            style={{ 
              padding: '0.6rem 1rem', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-color)', 
              background: 'var(--bg-color)', 
              color: 'var(--text-main)',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading menu items...</div>
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
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Item Name</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Category</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Price</th>
                {['Owner/Admin', 'Manager'].includes(user?.role) && (
                  <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="menu-row">
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{item.description || 'No description'}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {item.computed_available ? (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', textTransform: 'uppercase' }}>
                        Available
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', textTransform: 'uppercase' }}>
                        {item.is_available ? 'Out of Stock (Ingr)' : 'Disabled'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
                      {item.category_name}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        border: `1px solid ${item.is_veg ? '#4ade80' : '#f87171'}`,
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: item.is_veg ? '#4ade80' : '#f87171' }} />
                      </div>
                      <span style={{ fontSize: '0.85rem' }}>{item.is_veg ? 'Veg' : 'Non-Veg'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--primary)' }}>
                    ₹{parseFloat(item.price).toFixed(2)}
                  </td>
                  {['Owner/Admin', 'Manager'].includes(user?.role) && (
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {/* Quick Toggle */}
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          style={{
                            marginRight: '0.5rem',
                            background: item.is_available ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: item.is_available ? '#10B981' : '#EF4444',
                            border: `1px solid ${item.is_available ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            padding: '0.3rem 0.6rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                          title={item.is_available ? "Click to Disable" : "Click to Enable"}
                        >
                          <div style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: item.is_available ? '#10B981' : '#EF4444'
                          }}></div>
                          {item.is_available ? 'Active' : 'Disabled'}
                        </button>

                        <button 
                          onClick={() => handleOpenEdit(item)}
                          style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                          title="Edit Item"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #fee2e2', background: 'transparent', cursor: 'pointer', color: '#f87171' }}
                          title="Delete Item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filteredItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No items found matching your criteria.
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
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
            background: 'var(--surface-color)', 
            width: '90%', 
            maxWidth: '500px', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden'
          }}>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{isEditing ? 'Edit Menu Item' : 'Add New Item'}</h3>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Item Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Item Name*</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Butter Chicken"
                    style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  {/* Price */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Price (₹)*</label>
                    <input 
                      type="number" 
                      required 
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="0.00"
                      style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)' }}
                    />
                  </div>
                  {/* Category */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Category*</label>
                    <select 
                      required
                      value={formData.category_id}
                      onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                      style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)' }}
                    >
                      <option value="" disabled>Select</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Veg / Non-Veg Toggle */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Dietary Type</label>
                  <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-color)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, is_veg: true})}
                      style={{ 
                        flex: 1, 
                        padding: '0.5rem', 
                        borderRadius: '4px', 
                        border: 'none', 
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        background: formData.is_veg ? '#4ade80' : 'transparent',
                        color: formData.is_veg ? 'white' : 'var(--text-muted)',
                        transition: 'all 0.2s'
                      }}
                    >
                      Veg
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, is_veg: false})}
                      style={{ 
                        flex: 1, 
                        padding: '0.5rem', 
                        borderRadius: '4px', 
                        border: 'none', 
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        background: !formData.is_veg ? '#f87171' : 'transparent',
                        color: !formData.is_veg ? 'white' : 'var(--text-muted)',
                        transition: 'all 0.2s'
                      }}
                    >
                      Non-Veg
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Description</label>
                  <textarea 
                    rows="2"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Short description of the dish..."
                    style={{ 
                      padding: '0.75rem', 
                      borderRadius: 'var(--radius-md)', 
                      border: '1px solid var(--border-color)', 
                      background: 'var(--bg-color)', 
                      color: 'var(--text-main)',
                      resize: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* Recipe Mapping */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Inventory Linking (Recipe)</label>
                    <button type="button" onClick={addIngredientField} style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#F97316', border: '1px dashed rgba(249, 115, 22, 0.4)', borderRadius: '4px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Plus size={14}/> Add Ingredient
                    </button>
                  </div>
                  {formData.ingredients.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No ingredients linked. Item will be always available unless manually disabled.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {formData.ingredients.map((ing, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <select 
                            value={ing.inventory_item_id}
                            onChange={(e) => updateIngredientField(idx, 'inventory_item_id', e.target.value)}
                            style={{ flex: 2, padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                          >
                            {inventoryItems.map(inv => (
                              <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>
                            ))}
                          </select>
                          <input 
                            type="number"
                            step="0.001"
                            placeholder="Qty req"
                            value={ing.quantity_required}
                            onChange={(e) => updateIngredientField(idx, 'quantity_required', parseFloat(e.target.value) || 0)}
                            style={{ flex: 1, padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                          />
                          <button type="button" onClick={() => removeIngredientField(idx)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0.4rem' }}>
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Availability Toggle overriding everything else */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Manual Availability</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Disable to force block ordering.</div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <div style={{ position: 'relative' }}>
                      <input type="checkbox" checked={formData.is_available} onChange={(e) => setFormData({...formData, is_available: e.target.checked})} style={{ opacity: 0, width: 0, height: 0 }} />
                      <div style={{ width: '40px', height: '22px', background: formData.is_available ? '#10B981' : '#4B5563', borderRadius: '22px', transition: 'all 0.3s' }}>
                        <div style={{ position: 'absolute', top: '3px', left: formData.is_available ? '21px' : '3px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: 'all 0.3s' }}></div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ 
                    padding: '0.75rem 1.5rem', 
                    borderRadius: 'var(--radius-md)', 
                    border: 'none', 
                    background: 'var(--primary)', 
                    color: 'white', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)'
                  }}
                >
                  {isEditing ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styled animation for smooth entry */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .menu-row:hover {
          background: rgba(255,255,255,0.03) !important;
        }
      `}</style>
    </div>
  );
}
