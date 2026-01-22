import React, { useState, useEffect } from 'react';
import './GenericMaster.css';

const GenericMaster = ({ 
  title, 
  apiService, 
  columns, 
  formFields, 
  searchPlaceholder = 'Search...',
  icon 
}) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Search filter
  useEffect(() => {
    if (searchQuery) {
      const filtered = data.filter(item => 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  }, [searchQuery, data]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAll();
      setData(response.data || []);
      setFilteredData(response.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({});
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await apiService.delete(id);
      alert('Deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        await apiService.update(editingItem._id, formData);
        alert('Updated successfully');
      } else {
        await apiService.create(formData);
        alert('Created successfully');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="generic-master">
      <div className="master-header">
        <h1>{icon} {title}</h1>
        <span className="date">{new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</span>
      </div>

      <div className="master-controls">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="btn-create" onClick={handleCreate}>
          + Create {title.replace(' Master', '')}
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="master-table-container">
          <table className="master-table">
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx}>{col.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} style={{ textAlign: 'center' }}>
                    No data available
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item._id}>
                    {columns.map((col, idx) => (
                      <td key={idx}>
                        {col.icon && <span className="icon">{col.icon}</span>}
                        {col.render ? col.render(item) : item[col.field]}
                      </td>
                    ))}
                    <td className="actions">
                      <button className="btn-edit" onClick={() => handleEdit(item)}>
                        ✏️
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(item._id)}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit' : 'Create'} {title.replace(' Master', '')}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-content">
                {formFields.map((field, idx) => (
                  <div className="form-group" key={idx}>
                    <label>{field.label} {field.required && <span className="required">*</span>}</label>
                    
                    {field.type === 'select' ? (
                      <select
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleInputChange}
                        required={field.required}
                      >
                        <option value="">Select {field.label}</option>
                        {field.options.map((opt, i) => (
                          <option key={i} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleInputChange}
                        required={field.required}
                        placeholder={field.placeholder}
                      />
                    ) : (
                      <input
                        type={field.type || 'text'}
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleInputChange}
                        required={field.required}
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenericMaster;
