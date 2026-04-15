import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Tag, 
  Calendar, 
  Upload, 
  X, 
  Percent, 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ImageIcon
} from 'lucide-react';
import { offerApi } from '../../services/offerApi';
import { planCategoryAPI } from '../../services/mastersApi';
import { compressImage } from '../../utils/compressImage';
import './OffersMaster.css';

export default function OffersMaster() {
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    discountType: 'percentage',
    discountAmount: '',
    validFrom: '',
    validTo: '',
    planCategories: [],
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [offersRes, categoriesRes] = await Promise.all([
        offerApi.getAll(true), // true to include expired for admin
        planCategoryAPI.getAll()
      ]);
      setOffers(offersRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (offer = null) => {
    if (offer) {
      setEditingOffer(offer);
      setFormData({
        title: offer.title,
        description: offer.description || '',
        imageUrl: offer.imageUrl,
        discountType: offer.discountType,
        discountAmount: offer.discountAmount,
        validFrom: new Date(offer.validFrom).toISOString().split('T')[0],
        validTo: new Date(offer.validTo).toISOString().split('T')[0],
        planCategories: offer.planCategories.map(c => typeof c === 'object' ? c._id : c),
      });
    } else {
      setEditingOffer(null);
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        discountType: 'percentage',
        discountAmount: '',
        validFrom: '',
        validTo: '',
        planCategories: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOffer(null);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype || file.type)) {
      alert('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
      return;
    }

    try {
      setIsSubmitting(true);
      // Compress the image to < 1MB
      const compressedFile = await compressImage(file);
      const res = await offerApi.uploadImage(compressedFile);
      if (res.success) {
        setFormData(prev => ({ ...prev, imageUrl: res.data.url }));
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.imageUrl) {
      alert('Please upload an image for the offer');
      return;
    }

    if (formData.planCategories.length === 0) {
      alert('Please select at least one plan category');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingOffer) {
        await offerApi.update(editingOffer._id, formData);
      } else {
        await offerApi.create(formData);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    try {
      await offerApi.delete(id);
      fetchData();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete offer');
    }
  };

  const toggleCategory = (id) => {
    setFormData(prev => {
      const isSelected = prev.planCategories.includes(id);
      if (isSelected) {
        return { ...prev, planCategories: prev.planCategories.filter(c => c !== id) };
      } else {
        return { ...prev, planCategories: [...prev.planCategories, id] };
      }
    });
  };

  const filteredOffers = offers.filter(offer => 
    offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isExpired = (date) => new Date(date) < new Date().setHours(0, 0, 0, 0);

  const stats = {
    total: offers.length,
    active: offers.filter(o => !isExpired(o.validTo)).length,
    expired: offers.filter(o => isExpired(o.validTo)).length
  };

  return (
    <div className="offers-master">
      <div className="offers-header-section">
        <div className="offers-title-block">
          <h2>Offers Management</h2>
          <p>Create and manage promotional offers for your members</p>
        </div>
        <button className="create-offer-btn" onClick={() => handleOpenModal()}>
          <Plus size={20} />
          <span>Create New Offer</span>
        </button>
      </div>

      {/* Stats Row */}
      <div className="offers-stats-row">
        <div className="offer-stat-card">
          <div className="stat-icon-wrapper blue">
            <Tag size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Offers</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="offer-stat-card">
          <div className="stat-icon-wrapper green">
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Active</span>
            <span className="stat-value">{stats.active}</span>
          </div>
        </div>
        <div className="offer-stat-card">
          <div className="stat-icon-wrapper amber">
            <AlertCircle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Expired</span>
            <span className="stat-value">{stats.expired}</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="offers-search-bar">
        <Search size={20} className="search-icon" />
        <input 
          type="text" 
          placeholder="Search offers by title or description..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="offers-loading">
          <div className="spinner"></div>
          <p>Loading offers...</p>
        </div>
      ) : filteredOffers.length > 0 ? (
        <div className="offers-grid">
          {filteredOffers.map(offer => {
            const expired = isExpired(offer.validTo);
            return (
              <div key={offer._id} className={`offer-card ${expired ? 'expired' : ''}`}>
                <div className="offer-image-wrapper">
                  <img src={offer.imageUrl} alt={offer.title} />
                  <div className={`offer-badge ${offer.discountType}`}>
                    {offer.discountType === 'percentage' ? (
                      <><Percent size={14} /> <span>{offer.discountAmount} OFF</span></>
                    ) : (
                      <><span>₹{offer.discountAmount} OFF</span></>
                    )}
                  </div>
                  {expired && <div className="expired-overlay">EXPIRED</div>}
                </div>
                <div className="offer-content">
                  <div className="offer-header">
                    <h3>{offer.title}</h3>
                    <div className="offer-actions">
                      <button className="offer-action-btn edit" onClick={() => handleOpenModal(offer)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="offer-action-btn delete" onClick={() => handleDelete(offer._id)}>
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="offer-desc">{offer.description || 'No description provided.'}</p>
                  
                  <div className="offer-footer">
                    <div className="offer-validity">
                      <Calendar size={14} />
                      <span>{new Date(offer.validFrom).toLocaleDateString('en-IN')} - {new Date(offer.validTo).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="offer-cats">
                      {offer.planCategories.map(cat => (
                        <span key={cat._id} className="cat-tag">{cat.categoryName}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-offers">
          <div className="empty-icon-wrapper">
             <Tag size={48} />
          </div>
          <h3>No Offers Found</h3>
          <p>Start by creating a new promotional offer for your plans.</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="offer-modal">
            <div className="modal-header">
              <h3>{editingOffer ? 'Edit Offer' : 'Create New Offer'}</h3>
              <button className="close-btn" onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="offer-form">
              <div className="modal-body">
                <div className="form-grid">
                  {/* Left: Image Upload */}
                  <div className="image-upload-section">
                    <label>Offer Image / GIF <span className="required">*</span></label>
                    <div 
                      className="image-drop-zone"
                      onClick={() => !isSubmitting && fileInputRef.current.click()}
                    >
                      {formData.imageUrl ? (
                        <div className="preview-container">
                          <img src={formData.imageUrl} alt="Preview" />
                          <div className="upload-overlay">
                            <Upload size={20} />
                            <span>Change Image</span>
                          </div>
                        </div>
                      ) : (
                        <div className="upload-placeholder">
                          <ImageIcon size={40} />
                          <p>Click to upload JPG, PNG, WebP or GIF</p>
                          <span>Max size: 5MB</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        style={{ display: 'none' }} 
                        accept="image/*"
                      />
                    </div>
                  </div>

                  {/* Right: Info */}
                  <div className="info-section">
                    <div className="form-group">
                      <label>Offer Title <span className="required">*</span></label>
                      <input 
                        type="text" 
                        placeholder="e.g. Summer Special" 
                        required
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <textarea 
                        placeholder="Explain the offer details..."
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>

                    <div className="discount-fields row">
                      <div className="form-group flex-1">
                        <label>Discount Type <span className="required">*</span></label>
                        <select 
                          value={formData.discountType}
                          onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="value">Flat Value (₹)</option>
                        </select>
                      </div>
                      <div className="form-group flex-1">
                        <label>Discount Amount <span className="required">*</span></label>
                        <div className="input-with-symbol">
                          {formData.discountType === 'value' && <span className="symbol-prefix">₹</span>}
                          <input 
                            type="number" 
                            placeholder={formData.discountType === 'percentage' ? '20' : '500'} 
                            required
                            value={formData.discountAmount}
                            onChange={(e) => setFormData(prev => ({ ...prev, discountAmount: e.target.value }))}
                          />
                          {formData.discountType === 'percentage' && <span className="symbol-suffix">%</span>}
                        </div>
                      </div>
                    </div>

                    <div className="date-fields row">
                      <div className="form-group flex-1">
                        <label>Valid From <span className="required">*</span></label>
                        <input 
                          type="date" 
                          required
                          value={formData.validFrom}
                          onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                        />
                      </div>
                      <div className="form-group flex-1">
                        <label>Valid To <span className="required">*</span></label>
                        <input 
                          type="date" 
                          required
                          value={formData.validTo}
                          onChange={(e) => setFormData(prev => ({ ...prev, validTo: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="plan-cats-section">
                  <label>Plan Categories <span className="required">*</span> (Multi-select)</label>
                  <div className="cats-checkbox-grid">
                    {categories.map(cat => (
                      <div 
                        key={cat._id} 
                        className={`cat-checkbox-item ${formData.planCategories.includes(cat._id) ? 'active' : ''}`}
                        onClick={() => toggleCategory(cat._id)}
                      >
                        <div className="checkbox-marker">
                          {formData.planCategories.includes(cat._id) && <CheckCircle2 size={16} />}
                        </div>
                        <span>{cat.categoryName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="save-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingOffer ? 'Update Offer' : 'Create Offer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
