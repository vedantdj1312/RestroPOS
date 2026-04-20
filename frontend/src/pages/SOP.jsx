import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  ChevronRight, 
  Save, 
  Plus, 
  Trash2, 
  AlertCircle,
  Database,
  ChefHat
} from 'lucide-react';

export default function SOP() {
  const [sops, setSops] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [servingSize, setServingSize] = useState('');
  const [ingredients, setIngredients] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sopRes, invRes] = await Promise.all([
        axios.get('http://localhost:5000/api/sop', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        axios.get('http://localhost:5000/api/inventory', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      ]);
      setSops(sopRes.data);
      setInventory(invRes.data.items);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setServingSize(item.serving_size || 'Standard Portion');
    setIngredients(item.ingredients.map(ing => ({
      inventory_item_id: ing.inventory_item_id,
      ingredient_name: ing.ingredient_name,
      quantity_required: ing.quantity_required,
      unit: ing.unit
    })));
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { inventory_item_id: '', ingredient_name: '', quantity_required: 0, unit: 'pcs' }]);
  };

  const handleRemoveIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    
    if (field === 'inventory_item_id') {
      const invItem = inventory.find(i => i.id === parseInt(value));
      if (invItem) {
        newIngredients[index].inventory_item_id = invItem.id;
        newIngredients[index].ingredient_name = invItem.name;
        newIngredients[index].unit = invItem.unit;
      } else {
        newIngredients[index].inventory_item_id = '';
      }
    } else {
      newIngredients[index][field] = value;
    }
    
    setIngredients(newIngredients);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`http://localhost:5000/api/sop/${selectedItem.id}`, {
        serving_size: servingSize,
        ingredients
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      
      setSelectedItem(null);
      fetchData();
    } catch (error) {
      alert('Failed to save SOP');
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = sops.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
      <ChefHat className="animate-pulse" size={48} />
    </div>
  );

  return (
    <div style={{ padding: '1rem', animation: 'fadeIn 0.5s ease' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 800 }}>SOP & Recipe Deck</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Manage preparation standards and ingredient portions for all menu items.</p>
        </div>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
          <input 
            type="text" 
            placeholder="Search dish or category..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '0.8rem 1rem 0.8rem 2.5rem', 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)', 
              background: 'var(--surface-color)', 
              color: 'var(--text-main)',
              outline: 'none'
            }} 
          />
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {filteredItems.map(item => (
          <div 
            key={item.id}
            onClick={() => handleEditClick(item)}
            style={{ 
              background: 'var(--surface-color)', 
              borderRadius: '16px', 
              border: '1px solid var(--border-color)', 
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            className="sop-card"
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.category_name}</span>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.1rem', fontWeight: 700 }}>{item.name}</h3>
              </div>
              <ChevronRight size={20} color="var(--text-muted)" />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Serving Size</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.serving_size || 'Not Set'}</span>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Materials</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.ingredients.length} items</span>
              </div>
            </div>

            {item.ingredients.length === 0 && (
              <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EF4444', fontSize: '0.8rem' }}>
                <AlertCircle size={14} /> Recipe Not Configured
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedItem && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.8)', 
          backdropFilter: 'blur(8px)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{ 
            background: 'var(--bg-color)', 
            borderRadius: '24px', 
            width: '100%', 
            maxWidth: '800px', 
            maxHeight: '90vh', 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid var(--border-color)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <div style={{ padding: '2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Recipe Standard: {selectedItem.name}</h2>
                <span style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600 }}>{selectedItem.category_name}</span>
              </div>
              <button onClick={() => setSelectedItem(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <Plus style={{ transform: 'rotate(45deg)' }} size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Amount of Dish Served (Serving Size)</label>
                <input 
                  type="text" 
                  value={servingSize}
                  onChange={(e) => setServingSize(e.target.value)}
                  placeholder="e.g. 1 Full Plate, 250ml Bowl, 2 Pieces"
                  required
                  style={{ 
                    width: '100%', 
                    padding: '1rem', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)', 
                    background: 'var(--surface-color)', 
                    color: 'var(--text-main)',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Materials & Ingredients</h3>
                <button 
                  type="button" 
                  onClick={handleAddIngredient}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    background: 'var(--primary)', 
                    color: 'white', 
                    border: 'none', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  <Plus size={16} /> Add Material
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {ingredients.map((ing, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--surface-color)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ flex: 2 }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Material Name</label>
                      <div style={{ position: 'relative' }}>
                        <select 
                          value={ing.inventory_item_id}
                          onChange={(e) => handleIngredientChange(idx, 'inventory_item_id', e.target.value)}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
                        >
                          <option value="">-- Choose or Enter Below --</option>
                          {inventory.map(i => (
                            <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                          ))}
                        </select>
                        <input 
                          type="text"
                          placeholder="Or type new material name..."
                          value={ing.inventory_item_id ? '' : ing.ingredient_name}
                          onChange={(e) => handleIngredientChange(idx, 'ingredient_name', e.target.value)}
                          disabled={!!ing.inventory_item_id}
                          style={{ 
                            width: '100%', 
                            marginTop: '0.5rem',
                            display: ing.inventory_item_id ? 'none' : 'block',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            color: 'var(--text-main)',
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.85rem'
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Quantity</label>
                      <input 
                        type="number" 
                        step="0.001"
                        value={ing.quantity_required}
                        onChange={(e) => handleIngredientChange(idx, 'quantity_required', e.target.value)}
                        style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', fontSize: '0.9rem' }}
                        placeholder="0.000"
                      />
                    </div>
                    <div style={{ flex: 0.5 }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Unit</label>
                      <input 
                        type="text"
                        value={ing.unit}
                        onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                        readOnly={!!ing.inventory_item_id}
                        style={{ width: '100%', background: 'transparent', border: !!ing.inventory_item_id ? 'none' : '1px solid var(--border-color)', color: 'var(--text-main)', outline: 'none', fontSize: '0.9rem' }}
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleRemoveIngredient(idx)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.5rem' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>

              {ingredients.length === 0 && (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', border: '2px dashed var(--border-color)', borderRadius: '16px' }}>
                  <Database size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>No materials linked to this recipe yet.</p>
                </div>
              )}

              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button 
                  type="submit" 
                  disabled={saving}
                  style={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.5rem', 
                    background: 'var(--primary)', 
                    color: 'white', 
                    border: 'none', 
                    padding: '1rem', 
                    borderRadius: '12px', 
                    fontSize: '1rem', 
                    fontWeight: 700, 
                    cursor: saving ? 'not-allowed' : 'pointer' 
                  }}
                >
                  <Save size={20} /> {saving ? 'Saving Standards...' : 'Save SOP Standards'}
                </button>
                <button 
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  style={{ 
                    padding: '1rem 2rem', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)', 
                    background: 'transparent', 
                    color: 'var(--text-main)', 
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
