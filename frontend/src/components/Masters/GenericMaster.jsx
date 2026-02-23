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
  exportFileName = 'data',
  onAddFollowUp, // ✅ For follow-up button
  onRowClick, // ✅ Custom row click handler
  showEditDeleteButtons = true, // ✅ NEW PROP - Hide edit/delete buttons
  refreshKey // ✅ Change this to trigger data re-fetch from parent
}) => {
  const cacheKey = `cache_${title.replace(/\s+/g, '_')}`;

  // Synchronous cache lookup for instant mount state
  const getInitialData = () => {
    const cached = sessionStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : [];
  };

  const hasCache = !!sessionStorage.getItem(cacheKey);

  const [data, setData] = useState(getInitialData);
  const [filteredData, setFilteredData] = useState(getInitialData);
  const [loading, setLoading] = useState(!hasCache);

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});

  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [refreshKey]);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [searchQuery, data, filters]);

  const fetchData = async (signal) => {
    const cacheKey = `cache_${title.replace(/\s+/g, '_')}`;
    try {
      // 1. Instantly load from cache if available (Stale-While-Revalidate)
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        setData(parsed);
        setFilteredData(parsed);
      } else {
        // Only show full-page loading spinner if we have no cache
        setLoading(true);
      }

      setFetchError(null);

      // 2. Fetch fresh data in the background
      const response = await apiService.getAll({ signal });
      const fetchedData = response.data || response || [];

      // 3. Update UI and Cache with fresh data
      setData(fetchedData);
      setFilteredData(fetchedData);
      sessionStorage.setItem(cacheKey, JSON.stringify(fetchedData));

    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        console.log('API request aborted due to component unmount');
        return;
      }
      console.error('Error fetching data:', error);
      // Only show error UI if we have absolutely nothing to display
      if (data.length === 0) {
        setFetchError('Failed to load data. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...data];

    if (searchQuery) {
      filtered = filtered.filter(item =>
        Object.values(item).some(val =>
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    Object.keys(filters).forEach(filterKey => {
      const filterValue = filters[filterKey];

      if (!filterValue) return;

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
      } else if (filterKey === 'status') {
        filtered = filtered.filter(item => {
          const itemStatus = (item.status || '').toLowerCase();
          const filterStatus = (filterValue || '').toLowerCase();
          return itemStatus === filterStatus;
        });
      } else if (filterKey === 'branch') {
        filtered = filtered.filter(item =>
          item.branch?._id === filterValue || item.branch === filterValue
        );
      } else if (filterKey === 'source') {
        filtered = filtered.filter(item => item.source === filterValue);
      } else {
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

  const handleExportToExcel = async () => {
    setExporting(true);
    try {
      const dataToExport = filteredData;

      if (dataToExport.length === 0) {
        alert('❌ No data available to export');
        setExporting(false);
        return;
      }

      const exportData = dataToExport.map(item => {
        const row = {};
        columns.forEach(col => {
          if (col.field === 'branch') {
            row[col.label] = item.branch?.name || '-';
          } else if (col.field === 'plan') {
            row[col.label] = item.plan?.planName || '-';
          } else if (col.field === 'status') {
            row[col.label] = item.status || '-';
          } else {
            row[col.label] = item[col.field] || '-';
          }
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${exportFileName}_${timestamp}.xlsx`;

      XLSX.writeFile(workbook, filename);

      alert(`✅ Exported ${dataToExport.length} records successfully!`);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('🚀 SUBMIT TRIGGERED');
    console.log('📋 Raw Form Data:', formData);
    console.log('📋 Form Fields:', formFields);

    try {
      const cleanedData = {};

      Object.keys(formData).forEach(key => {
        const value = formData[key];

        if (value !== '' && value !== null && value !== undefined) {
          cleanedData[key] = value;
        }
      });

      console.log('📤 Cleaned Data to Send:', cleanedData);

      if (editingItem) {
        const response = await apiService.update(editingItem._id, cleanedData);
        console.log('✅ Update response:', response);
        alert(response.message || 'Updated successfully');
      } else {
        const response = await apiService.create(cleanedData);
        console.log('✅ Create response:', response);
        alert(response.message || 'Created successfully');
      }

      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('❌ Error:', error);
      console.error('❌ Response:', error.response?.data);

      const errorMsg = error.response?.data?.message || error.message || 'Failed to save';
      alert(`Failed to save: ${errorMsg}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePermissionChange = (groupKey, permKey) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...(prev.permissions || {}),
        [groupKey]: {
          ...((prev.permissions || {})[groupKey] || {}),
          [permKey]: !((prev.permissions || {})[groupKey] || {})[permKey]
        }
      }
    }));
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

  // ✅ Handle row click - use custom handler if provided, otherwise default view
  const handleRowClick = (item) => {
    if (onRowClick) {
      onRowClick(item);
    } else {
      handleView(item);
    }
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

      {fetchError && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px 16px',
          margin: '16px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#dc2626',
          fontSize: '14px',
        }}>
          <span>⚠️ {fetchError}</span>
          <button
            onClick={() => {
              const controller = new AbortController();
              fetchData(controller.signal);
            }}
            style={{
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '13px',
              marginLeft: '12px',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="master-table-container">
          <table className="master-table generic-master-table">
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className={col.mobileHide ? 'col-mobile-hide' : ''}>{col.label}</th>
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
                    onClick={() => handleRowClick(item)}
                    style={{ cursor: 'pointer' }}
                    className="table-row-hover"
                  >
                    {columns.map((col, idx) => (
                      <td key={idx} className={col.mobileHide ? 'col-mobile-hide' : ''}>
                        {col.icon && <span className="icon">{col.icon}</span>}
                        {col.render ? col.render(item) : item[col.field]}
                      </td>
                    ))}
                    <td className="actions" onClick={(e) => e.stopPropagation()}>
                      {/* ✅ CONDITIONALLY SHOW EDIT/DELETE BUTTONS */}
                      {showEditDeleteButtons && (
                        <>
                          <button className="btn-edit" onClick={() => handleEdit(item)}>
                            ✏️
                          </button>
                          <button className="btn-delete" onClick={() => handleDelete(item._id)}>
                            🗑️
                          </button>
                        </>
                      )}
                      {customActions && customActions(item)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit' : 'Create'} {title.replace(' Master', '')}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-content">
                {formFields.map((field, idx) => {
                  // Support conditional visibility
                  if (field.visibleWhen && !field.visibleWhen(formData)) {
                    return null;
                  }

                  // Permission groups field type
                  if (field.type === 'permission-groups') {
                    return (
                      <div className="permission-groups-container" key={idx}>
                        {field.groups.map((group, gIdx) => (
                          <div className="permission-group-card" key={gIdx}>
                            <div className="permission-group-header">
                              <span className="permission-group-icon">{group.icon}</span>
                              <span className="permission-group-title">{group.title}</span>
                            </div>
                            <div className="permission-group-body">
                              {group.sections.map((section, sIdx) => (
                                <div className="permission-section" key={sIdx}>
                                  <div className="permission-section-title">{section.label}</div>
                                  <div className="permission-checkboxes">
                                    {section.items.map((item, iIdx) => (
                                      <label className="permission-checkbox-label" key={iIdx}>
                                        <input
                                          type="checkbox"
                                          checked={!!((formData.permissions || {})[group.key] || {})[item.key]}
                                          onChange={() => handlePermissionChange(group.key, item.key)}
                                        />
                                        <span className="permission-checkbox-custom"></span>
                                        <span className="permission-checkbox-text">{item.label}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  return (
                    <div className="form-group" key={idx}>
                      <label>{field.label} {field.required && <span className="required">*</span>}</label>

                      {field.type === 'select' ? (
                        <select
                          name={field.name}
                          value={formData[field.name] || ''}
                          onChange={handleInputChange}
                          required={field.required}
                        >
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
                      ) : field.type === 'image-upload' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                          <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            border: '3px dashed #cbd5e1',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#f1f5f9',
                            position: 'relative'
                          }}>
                            {uploadingPhoto ? (
                              <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>⏳ Uploading...</div>
                            ) : formData[field.name] ? (
                              <img
                                src={formData[field.name]}
                                alt="Profile"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '2.5rem' }}>👤</div>
                            )}
                          </div>
                          <label style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 1.2rem',
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            color: 'white',
                            borderRadius: '8px',
                            cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                            opacity: uploadingPhoto ? 0.7 : 1
                          }}
                            onMouseOver={(e) => !uploadingPhoto && (e.currentTarget.style.transform = 'translateY(-1px)')}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                          >
                            📷 {uploadingPhoto ? 'Uploading...' : (formData[field.name] ? 'Change Photo' : 'Upload Photo')}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              style={{ display: 'none' }}
                              disabled={uploadingPhoto}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 5 * 1024 * 1024) {
                                  alert('❌ File size must be less than 5MB');
                                  return;
                                }
                                setUploadingPhoto(true);
                                try {
                                  const fd = new FormData();
                                  fd.append('photo', file);
                                  const token = localStorage.getItem('token');
                                  const res = await fetch(`${import.meta.env.VITE_API_URL}/upload/profile-photo`, {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${token}` },
                                    body: fd
                                  });
                                  const result = await res.json();
                                  if (result.success) {
                                    setFormData(prev => ({ ...prev, [field.name]: result.data.url }));
                                  } else {
                                    alert('❌ ' + (result.message || 'Upload failed'));
                                  }
                                } catch (err) {
                                  console.error('Upload error:', err);
                                  alert('❌ Failed to upload photo');
                                } finally {
                                  setUploadingPhoto(false);
                                  e.target.value = '';
                                }
                              }}
                            />
                          </label>
                          {formData[field.name] && (
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, [field.name]: '' }))}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '500'
                              }}
                            >
                              🗑️ Remove Photo
                            </button>
                          )}
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
                  );
                })}
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

      {/* ✅ VIEW MODAL WITH FOLLOW-UP BUTTON */}
      {showViewModal && viewingItem && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div
            className="modal-content view-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px' }}
          >
            <div className="modal-header">
              <h2>👁️ View {title.replace(' Master', '').replace(' Management', '')} Details</h2>
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
                    if (field.type === 'image-upload') {
                      displayValue = value;
                    } else if (field.type === 'number') {
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
                        {field.type === 'image-upload' && displayValue && displayValue !== '-' ? (
                          <img
                            src={displayValue}
                            alt="Profile"
                            style={{
                              width: '80px',
                              height: '80px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid #e2e8f0'
                            }}
                          />
                        ) : displayValue}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* ✅ MODAL FOOTER WITH FOLLOW-UP BUTTON */}
            <div className="modal-footer">
              {/* ✅ Add Follow-up Button (only if onAddFollowUp prop exists) */}
              {onAddFollowUp && (
                <button
                  type="button"
                  className="btn-followup"
                  onClick={() => {
                    setShowViewModal(false);
                    onAddFollowUp(viewingItem);
                  }}
                  style={{
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    marginRight: 'auto',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#d97706';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = '#f59e0b';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  📝 Add Follow-up
                </button>
              )}

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
