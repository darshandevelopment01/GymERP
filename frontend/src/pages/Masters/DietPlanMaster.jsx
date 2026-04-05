import React, { useState, useEffect } from 'react';
import { dietPlanAPI } from '../../services/mastersApi';
import { usePermissions } from '../../hooks/usePermissions';
import SkeletonLoader from '../../components/SkeletonLoader';
import './DietPlanMaster.css';
import '../../components/Masters/GenericMaster.css'; // Reuse modal and button styles

const DietPlanMaster = () => {
    const { can } = usePermissions();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        planName: '',
        subtitle: '',
        calories: '',
        duration: '',
        meals: [{ time: '', description: '' }]
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await dietPlanAPI.getAll();
            setPlans(response.data || []);
        } catch (error) {
            console.error('Error fetching diet plans:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = () => {
        setEditingItem(null);
        setFormData({
            planName: '',
            subtitle: '',
            calories: '',
            duration: '',
            meals: [{ time: '', description: '' }]
        });
        setShowModal(true);
    };

    const handleEdit = (plan) => {
        setEditingItem(plan);
        setFormData({
            planName: plan.planName,
            subtitle: plan.subtitle,
            calories: plan.calories,
            duration: plan.duration,
            meals: plan.meals.length > 0 ? plan.meals : [{ time: '', description: '' }]
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this diet plan?')) return;
        try {
            await dietPlanAPI.delete(id);
            alert('Deleted successfully');
            fetchData();
        } catch (error) {
            console.error('Error deleting diet plan:', error);
            alert('Failed to delete');
        }
    };

    const handleMealChange = (index, field, value) => {
        const newMeals = [...formData.meals];
        newMeals[index][field] = value;
        setFormData({ ...formData, meals: newMeals });
    };

    const addMealRow = () => {
        setFormData({
            ...formData,
            meals: [...formData.meals, { time: '', description: '' }]
        });
    };

    const removeMealRow = (index) => {
        const newMeals = formData.meals.filter((_, i) => i !== index);
        setFormData({ ...formData, meals: newMeals });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await dietPlanAPI.update(editingItem._id, formData);
                alert('Updated successfully');
            } else {
                await dietPlanAPI.create(formData);
                alert('Created successfully');
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Error saving diet plan:', error);
            alert('Failed to save');
        }
    };

    if (loading) return <SkeletonLoader variant="list" />;

    return (
        <div className="diet-plan-master">
            <div className="master-controls" style={{ justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                {can('createDietPlan') && (
                    <button className="btn-create" onClick={handleCreate}>
                        + Create Diet Plan
                    </button>
                )}
            </div>

            <div className="plans-grid">
                {plans.length === 0 ? (
                    <div style={{ textAlign: 'center', gridColumn: '1/-1', color: '#64748b', padding: '3rem' }}>
                        No diet plans created yet.
                    </div>
                ) : (
                    plans.map((plan) => (
                        <div key={plan._id} className="plan-card">
                            <div className="plan-card-header">
                                <h2 className="plan-title">{plan.planName}</h2>
                                <span className="calorie-badge">{plan.calories} kcal</span>
                            </div>
                            <p className="plan-subtitle">{plan.subtitle}</p>
                            <div className="plan-info">
                                <span>⏱ Duration: <strong>{plan.duration}</strong></span>
                            </div>

                            <div className="meals-list">
                                {plan.meals.slice(0, 3).map((meal, idx) => (
                                    <div key={idx} className="meal-item">
                                        <span className="meal-time">{meal.time}</span>
                                        <span className="meal-description">{meal.description}</span>
                                    </div>
                                ))}
                                {plan.meals.length > 3 && (
                                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.5rem 0 0 0', textAlign: 'center' }}>
                                        + {plan.meals.length - 3} more meals
                                    </p>
                                )}
                            </div>

                            <div className="plan-card-actions">
                                {can('editDietPlan') && (
                                    <button className="btn-edit" onClick={() => handleEdit(plan)}>✏️</button>
                                )}
                                {can('deleteDietPlan') && (
                                    <button className="btn-delete" onClick={() => handleDelete(plan._id)}>🗑️</button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h2>{editingItem ? 'Edit' : 'Create'} Diet Plan</h2>
                            <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="label">Plan Name</label>
                                        <input
                                            className="input"
                                            value={formData.planName}
                                            onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                                            placeholder="e.g., Weight Loss Diet"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Calories (kcal)</label>
                                        <input
                                            className="input"
                                            type="number"
                                            value={formData.calories}
                                            onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                                            placeholder="e.g., 1800"
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="label">Subtitle</label>
                                        <input
                                            className="input"
                                            value={formData.subtitle}
                                            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                            placeholder="e.g., Fat Loss & Lean Muscle"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Duration</label>
                                        <input
                                            className="input"
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                            placeholder="e.g., 12 weeks"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="meals-form-header">
                                    <h3>Meals Schedule</h3>
                                </div>

                                <div className="meals-items-container" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                    {formData.meals.map((meal, index) => (
                                        <div key={index} className="dynamic-row">
                                            <input
                                                className="input time-input"
                                                value={meal.time}
                                                onChange={(e) => handleMealChange(index, 'time', e.target.value)}
                                                placeholder="7:00 AM"
                                                required
                                            />
                                            <input
                                                className="input desc-input"
                                                value={meal.description}
                                                onChange={(e) => handleMealChange(index, 'description', e.target.value)}
                                                placeholder="Oats with fruits..."
                                                required
                                            />
                                            {formData.meals.length > 1 && (
                                                <button type="button" className="btn-remove-row" onClick={() => removeMealRow(index)}>✕</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button type="button" className="btn-add-row" onClick={addMealRow}>
                                    + Add Another Meal
                                </button>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-save">
                                    {editingItem ? 'Save Changes' : 'Create Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DietPlanMaster;
