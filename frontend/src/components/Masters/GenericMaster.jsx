import React, { useState, useEffect } from 'react';
import './GenericMaster.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import * as XLSX from 'xlsx';

const GenericMaster = ({ 
  title, 
  apiService, 
  columns, 
  formFields, 
  searchPlaceholder = 'Search...',
  icon,
  customActions,
  filterConfig = [],
  showCreateButton = true,
  showExportButton = false,
  exportFileName = 'data'
}) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [searchQuery, data, filters]);

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

  const applyFiltersAndSearch = () => {
    let filtered = [...data];

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(item => 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply filters
    Object.keys(filters).forEach(filterKey => {
      const filterValue = filters[filterKey];
      
      if (!filterValue) return;

      const filterField = filterConfig.find(f => f.name === filterKey);
      
      if (filterKey === 'startDate') {
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.createdAt || item.joiningDate || item.date);
          return itemDate >= new Date(filterValue);
        });
      } else if (filterKey === 'endDate') {
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.createdAt || item.joiningDate || item.date);
          return itemDate <= new Date(filterValue);
        });
      } else if (filterKey === 'paymentStatus') {
        filtered = filtered.filter(item => {
          if (filterValue === 'paid') {
            return item.paymentRemaining === 0 || !item.paymentRemaining;
          } else if (filterValue === 'pending') {
            return item.paymentRemaining > 0;
          }
          return true;
        });
      } else if (filterKey === 'status') {
        filtered = filtered.filter(item => item.status === filterValue);
      } else if (filterKey === 'branch') {
        filtered = filtered.filter(item => 
          item.branch?._id === filterValue || item.branch === filterValue
        );
      } else if (filterKey === 'plan') {
        filtered = filtered.filter(item => 
          item.plan?._id === filterValue || item.plan === filterValue
        );
      } else {
        // Generic filter for other fields
        filtered = filtered.filter(item => {
          const itemValue = item[filterKey];
          if (typeof itemValue === 'object' && itemValue?._id) {
            return itemValue._id === filterValue;
          }
          return itemValue === filterValue;
        });
      }
    });

    setFilteredData(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '' && v !== null).length;

  // ✅ FIXED: Export ALL data from database
  const handleExportToExcel = async () => {
    setExporting(true);
    try {
      // Fetch ALL data from database (bypass filters)
      const response = await apiService.getAll();
      const allData = response.data || [];

      if (allData.length === 0) {
        alert('❌ No data available to export');
        setExporting(false);
        return;
      }

      // Prepare data for export
      const exportData = allData.map(item => {
        const row = {};
        columns.forEach(col => {
          if (col.field === 'branch') {
            row[col.label] = item.branch?.name || '-';
          } else if (col.field === 'plan') {
            row[col.label] = item.plan?.planName || '-';
          } else if (col.field === 'status') {
            row[col.label] = item.status || '-';
          } else if (col.field === 'payment') {
            row['Payment Received'] = item.paymentReceived || 0;
            row['Payment Remaining'] = item.paymentRemaining || 0;
          } else if (col.field === 'dateOfBirth' || col.field === 'joiningDate' || col.field === 'createdAt') {
            // Format dates properly
            if (item[col.field]) {
              const date = new Date(item[col.field]);
              row[col.label] = date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
            } else {
              row[col.label] = '-';
            }
          } else if (typeof item[col.field] === 'object' && item[col.field] !== null) {
            // Handle nested objects
            row[col.label] = item[col.field]?.name || item[col.field]?.planName || item[col.field]?.branchName || '-';
          } else {
            row[col.label] = item[col.field] || '-';
          }
        });
        return row;
      });

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const colWidths = columns.map(() => ({ wch: 20 }));
      worksheet['!cols'] = colWidths;
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${exportFileName}_${timestamp}.xlsx`;
      
      // Download file
      XLSX.writeFile(workbook, filename);
      
      alert(`✅ Exported ${allData.length} records successfully!`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('❌ Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({});
    setShowModal(true);
  };

  const handleView = (item) => {
    setViewingItem(item);
    setShowViewModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    
    const formattedItem = { ...item };
    formFields.forEach(field => {
      if (field.type === 'date' && item[field.name]) {
        try {
          const date = new Date(item[field.name]);
          if (!isNaN(date.getTime())) {
            formattedItem[field.name] = date.toISOString().split('T')[0];
          }
        } catch (error) {
          console.error('Date formatting error:', error);
        }
      }
      // ✅ Handle ObjectId fields (branch, plan, etc.)
      if (field.type === 'select' && typeof item[field.name] === 'object' && item[field.name]?._id) {
        formattedItem[field.name] = item[field.name]._id;
      }
    });
    
    setFormData(formattedItem);
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

  // ✅ UPDATED: Handle empty select values properly
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // ✅ Clean formData - remove empty strings for select fields
      const cleanedData = { ...formData };
      
      formFields.forEach(field => {
        if (field.type === 'select' && !field.required) {
          // For optional select fields, remove if empty
          if (cleanedData[field.name] === '' || cleanedData[field.name] === null || cleanedData[field.name] === undefined) {
            delete cleanedData[field.name];
          }
        }
      });

      console.log('📤 Submitting data:', cleanedData);
      
      if (editingItem) {
        const response = await apiService.update(editingItem._id, cleanedData);
        console.log('✅ Update response:', response);
        alert('Updated successfully');
      } else {
        const response = await apiService.create(cleanedData);
        console.log('✅ Create response:', response);
        alert('Created successfully');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('❌ Error saving:', error);
      console.error('Error details:', error.response?.data);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save';
      alert(`Failed to save: ${errorMsg}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (date, fieldName) => {
    setFormData({ 
      ...formData, 
      [fieldName]: date ? date.toISOString().split('T')[0] : '' 
    });
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setFormData((prev) => ({
          ...prev,
          latitude: latitude,
          longitude: longitude,
        }));

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'MuscleTimeERP/1.0'
              }
            }
          );
          const data = await response.json();

          if (data && data.address) {
            const address = data.address;
            
            setFormData((prev) => ({
              ...prev,
              latitude: latitude,
              longitude: longitude,
              city: address.city || address.town || address.village || address.suburb || '',
              state: address.state || '',
              zipCode: address.postcode || '',
            }));

            setLoadingLocation(false);
            alert('✅ Location and address details captured successfully!');
          } else {
            setLoadingLocation(false);
            alert('✅ Location captured! But unable to fetch address details.');
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          setLoadingLocation(false);
          alert('✅ Location captured! But unable to fetch address details.');
        }
      },
      (error) => {
        setLoadingLocation(false);
        alert('❌ Unable to retrieve your location. Please enter manually.');
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
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
        <div className="control-buttons">
          {filterConfig.length > 0 && (
            <button 
              className={`btn-filter ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              🔽 Filters
              {activeFilterCount > 0 && (
                <span className="filter-badge">{activeFilterCount}</span>
              )}
            </button>
          )}
          {showExportButton && (
            <button 
              className="btn-export" 
              onClick={handleExportToExcel}
              disabled={exporting || data.length === 0}
            >
              {exporting ? '⏳ Exporting...' : '📊 Export to Excel'}
            </button>
          )}
          {showCreateButton && (
            <button className="btn-create" onClick={handleCreate}>
              + Create {title.replace(' Master', '').replace(' Management', '')}
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && filterConfig.length > 0 && (
        <div className="filter-panel">
          <div className="filter-grid">
            {filterConfig.map((filter, idx) => (
              <div className="filter-item" key={idx}>
                <label>{filter.label}</label>
                {filter.type === 'select' ? (
                  <select
                    value={filters[filter.name] || ''}
                    onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                  >
                    {filter.options.map((opt, i) => (
                      <option key={i} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : filter.type === 'date' ? (
                  <div className="filter-date-wrapper">
                    <DatePicker
                      selected={filters[filter.name] ? new Date(filters[filter.name]) : null}
                      onChange={(date) => handleFilterChange(filter.name, date ? date.toISOString().split('T')[0] : '')}
                      dateFormat="dd-MM-yyyy"
                      placeholderText="dd-mm-yyyy"
                      className="filter-date-input"
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                      isClearable
                      showPopperArrow={false}
                    />
                    <svg 
                      className="filter-calendar-icon"
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={filters[filter.name] || ''}
                    onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                    placeholder={filter.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="filter-actions">
            <button className="clear-filters-btn" onClick={clearFilters}>
              ✕ Clear All Filters
            </button>
            <span className="results-count">
              Showing {filteredData.length} of {data.length} results
            </span>
          </div>
        </div>
      )}

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
                  <tr 
                    key={item._id}
                    onClick={() => handleView(item)}
                    style={{ cursor: 'pointer' }}
                    className="table-row-hover"
                  >
                    {columns.map((col, idx) => (
                      <td key={idx}>
                        {col.icon && <span className="icon">{col.icon}</span>}
                        {col.render ? col.render(item) : item[col.field]}
                      </td>
                    ))}
                    <td className="actions" onClick={(e) => e.stopPropagation()}>
                      <button className="btn-edit" onClick={() => handleEdit(item)}>
                        ✏️
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(item._id)}>
                        🗑️
                      </button>
                      {customActions && customActions(item)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit/Create Modal */}
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
                        {field.options?.map((opt, i) => (
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
                    ) : field.type === 'date' ? (
                      <div className="date-input-wrapper">
                        <DatePicker
                          selected={formData[field.name] ? new Date(formData[field.name]) : null}
                          onChange={(date) => handleDateChange(date, field.name)}
                          dateFormat="dd-MM-yyyy"
                          placeholderText={field.placeholder || "Select date"}
                          className="form-input date-input-with-icon"
                          showYearDropdown
                          showMonthDropdown
                          dropdownMode="select"
                          minDate={field.futureOnly ? new Date() : null}
                          maxDate={field.futureOnly ? null : new Date()}
                          isClearable
                          required={field.required}
                          showPopperArrow={false}
                        />
                        <svg 
                          className="calendar-icon-svg"
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                      </div>                    
                    ) : field.type === 'location-button' ? (
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={loadingLocation}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: loadingLocation 
                            ? '#ccc' 
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          cursor: loadingLocation ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          transition: 'transform 0.2s',
                        }}
                        onMouseOver={(e) => !loadingLocation && (e.target.style.transform = 'scale(1.02)')}
                        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                      >
                        📍 {loadingLocation ? 'Getting Location...' : 'Get Current Location'}
                      </button>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleInputChange}
                        required={field.required}
                        placeholder={field.placeholder}
                        step={field.step}
                        min={field.min}
                        max={field.max}
                        disabled={field.disabled}
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
                  {editingItem ? 'Update' : 'Save & Close'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && viewingItem && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div 
            className="modal-content view-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px' }}
          >
            <div className="modal-header">
              <h2>👁️ View {title.replace(' Master', '')} Details</h2>
              <button className="btn-close" onClick={() => setShowViewModal(false)}>✕</button>
            </div>
            
            <div 
              className="form-content view-form-content"
              style={{ 
                maxHeight: '60vh', 
                overflowY: 'auto',
              }}
            >
              {formFields
                .filter(f => f.type !== 'location-button')
                .map((field, idx) => {
                  const value = viewingItem[field.name];
                  let displayValue = '-';

                  if (field.displayValue && typeof field.displayValue === 'function') {
                    displayValue = field.displayValue(viewingItem);
                  } else if (value !== null && value !== undefined && value !== '') {
                    if (field.type === 'number') {
                      displayValue = String(value);
                    } else if (field.type === 'select' && field.options) {
                      const option = field.options.find(opt => opt.value === value || opt.value === value?._id);
                      displayValue = option ? option.label : (typeof value === 'object' ? value.name || value.planName || value._id : value);
                    } else if (field.type === 'date') {
                      try {
                        const date = new Date(value);
                        if (!isNaN(date.getTime())) {
                          displayValue = date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          });
                        } else {
                          displayValue = '-';
                        }
                      } catch (error) {
                        console.error('Date parsing error:', error);
                        displayValue = '-';
                      }
                    } else if (typeof value === 'object' && value !== null) {
                      displayValue = value.name || value.planName || value.designationName || value.shiftName || value.branchName || value._id || String(value);
                    } else {
                      displayValue = String(value);
                    }
                  }

                  return (
                    <div 
                      key={idx} 
                      className="view-detail-row"
                      style={{ 
                        marginBottom: '0.75rem', 
                        display: 'grid',
                        gridTemplateColumns: '40% 60%',
                        gap: '1rem',
                        borderBottom: '1px solid #e5e7eb',
                        paddingBottom: '0.75rem',
                        padding: '0.75rem',
                        background: idx % 2 === 0 ? '#f8fafc' : '#ffffff',
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#1e293b',
                        fontSize: '0.95rem'
                      }}>
                        {field.label}:
                      </div>
                      <div style={{ 
                        color: '#334155',
                        fontSize: '0.95rem',
                        wordBreak: 'break-word'
                      }}>
                        {displayValue}
                      </div>
                    </div>
                  );
                })}
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={() => setShowViewModal(false)}>
                Close
              </button>
              <button type="button" className="btn-save" onClick={() => {
                setShowViewModal(false);
                handleEdit(viewingItem);
              }}>
                ✏️ Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenericMaster;
