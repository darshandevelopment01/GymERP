import React, { useState, useEffect } from 'react';
import { workoutPlanAPI } from '../../services/mastersApi';
import { usePermissions } from '../../hooks/usePermissions';
import SkeletonLoader from '../../components/SkeletonLoader';
import './WorkoutPlanMaster.css';
import '../../components/Masters/GenericMaster.css'; // Reuse modal and button styles

const WorkoutPlanMaster = () => {
    const { can } = usePermissions();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        planName: '',
        difficulty: 'Beginner',
        daysPerWeek: '',
        duration: '',
        exercises: [{ exercise: '', sets: '', reps: '' }]
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await workoutPlanAPI.getAll();
            setPlans(response.data || []);
        } catch (error) {
            console.error('Error fetching workout plans:', error);
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
            difficulty: 'Beginner',
            daysPerWeek: '',
            duration: '',
            exercises: [{ exercise: '', sets: '', reps: '' }]
        });
        setShowModal(true);
    };

    const handleEdit = (plan) => {
        setEditingItem(plan);
        setFormData({
            planName: plan.planName,
            difficulty: plan.difficulty,
            daysPerWeek: plan.daysPerWeek,
            duration: plan.duration,
            exercises: plan.exercises.length > 0 ? plan.exercises : [{ exercise: '', sets: '', reps: '' }]
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this workout plan?')) return;
        try {
            await workoutPlanAPI.delete(id);
            alert('Deleted successfully');
            fetchData();
        } catch (error) {
            console.error('Error deleting workout plan:', error);
            alert('Failed to delete');
        }
    };

    const handleExerciseChange = (index, field, value) => {
        const newExercises = [...formData.exercises];
        newExercises[index][field] = value;
        setFormData({ ...formData, exercises: newExercises });
    };

    const addExerciseRow = () => {
        setFormData({
            ...formData,
            exercises: [...formData.exercises, { exercise: '', sets: '', reps: '' }]
        });
    };

    const removeExerciseRow = (index) => {
        const newExercises = formData.exercises.filter((_, i) => i !== index);
        setFormData({ ...formData, exercises: newExercises });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await workoutPlanAPI.update(editingItem._id, formData);
                alert('Updated successfully');
            } else {
                await workoutPlanAPI.create(formData);
                alert('Created successfully');
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Error saving workout plan:', error);
            alert('Failed to save');
        }
    };

    const getDifficultyClass = (difficulty) => {
        switch (difficulty) {
            case 'Beginner': return 'difficulty-beginner';
            case 'Intermediate': return 'difficulty-intermediate';
            case 'Advanced': return 'difficulty-advanced';
            default: return '';
        }
    };

    if (loading) return <SkeletonLoader variant="list" />;

    return (
        <div className="workout-plan-master">
            <div className="master-controls" style={{ justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                {can('createWorkoutPlan') && (
                    <button className="btn-create" onClick={handleCreate}>
                        + Create Workout Plan
                    </button>
                )}
            </div>

            <div className="workout-plans-grid">
                {plans.length === 0 ? (
                    <div style={{ textAlign: 'center', gridColumn: '1/-1', color: '#64748b', padding: '3rem' }}>
                        No workout plans created yet.
                    </div>
                ) : (
                    plans.map((plan) => (
                        <div key={plan._id} className="plan-card">
                            <div className="plan-card-header">
                                <h2 className="plan-title">{plan.planName}</h2>
                                <span className={`difficulty-badge ${getDifficultyClass(plan.difficulty)}`}>
                                    {plan.difficulty}
                                </span>
                            </div>

                            <div className="workout-info-row">
                                <div className="workout-info-item">
                                    📅 <strong>{plan.daysPerWeek} days/week</strong>
                                </div>
                                <div className="workout-info-item">
                                    ⏱ <strong>{plan.duration}</strong>
                                </div>
                            </div>

                            <table className="exercise-mini-table">
                                <thead>
                                    <tr>
                                        <th>Exercise</th>
                                        <th>Sets</th>
                                        <th>Reps</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plan.exercises.slice(0, 4).map((ex, idx) => (
                                        <tr key={idx}>
                                            <td>{ex.exercise}</td>
                                            <td>{ex.sets}</td>
                                            <td>{ex.reps}</td>
                                        </tr>
                                    ))}
                                    {plan.exercises.length > 4 && (
                                        <tr>
                                            <td colSpan="3" style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', paddingTop: '0.4rem' }}>
                                                + {plan.exercises.length - 4} more exercises
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            <div className="plan-card-actions">
                                {can('editWorkoutPlan') && (
                                    <button className="btn-edit" onClick={() => handleEdit(plan)}>✏️</button>
                                )}
                                {can('deleteWorkoutPlan') && (
                                    <button className="btn-delete" onClick={() => handleDelete(plan._id)}>🗑️</button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                        <div className="modal-header">
                            <h2>{editingItem ? 'Edit' : 'Create'} Workout Plan</h2>
                            <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="label">Plan Name</label>
                                        <input
                                            className="input"
                                            value={formData.planName}
                                            onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                                            placeholder="e.g., Beginner Full Body"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Difficulty</label>
                                        <select
                                            className="input"
                                            value={formData.difficulty}
                                            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                            required
                                        >
                                            <option value="Beginner">Beginner</option>
                                            <option value="Intermediate">Intermediate</option>
                                            <option value="Advanced">Advanced</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Days Per Week</label>
                                        <input
                                            className="input"
                                            type="number"
                                            max="7"
                                            min="1"
                                            value={formData.daysPerWeek}
                                            onChange={(e) => setFormData({ ...formData, daysPerWeek: e.target.value })}
                                            placeholder="e.g., 3"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Duration</label>
                                        <input
                                            className="input"
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                            placeholder="e.g., 8 weeks"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="meals-form-header">
                                    <h3>Exercise Schedule</h3>
                                </div>

                                <div className="exercise-table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                    <table className="exercise-form-table">
                                        <thead>
                                            <tr>
                                                <th>Exercise Name</th>
                                                <th>Sets</th>
                                                <th>Reps/Time</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.exercises.map((ex, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <input
                                                            className="input"
                                                            value={ex.exercise}
                                                            onChange={(e) => handleExerciseChange(index, 'exercise', e.target.value)}
                                                            placeholder="e.g., Bench Press"
                                                            required
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            className="input sets-input"
                                                            type="number"
                                                            value={ex.sets}
                                                            onChange={(e) => handleExerciseChange(index, 'sets', e.target.value)}
                                                            placeholder="3"
                                                            required
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            className="input reps-input"
                                                            value={ex.reps}
                                                            onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                                                            placeholder="12"
                                                            required
                                                        />
                                                    </td>
                                                    <td>
                                                        {formData.exercises.length > 1 && (
                                                            <button type="button" className="btn-remove-row" onClick={() => removeExerciseRow(index)}>✕</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button type="button" className="btn-add-row" onClick={addExerciseRow} style={{ marginTop: '1rem' }}>
                                    + Add Another Exercise
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

export default WorkoutPlanMaster;
