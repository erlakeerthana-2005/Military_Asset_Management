import React, { useState, useEffect } from 'react';
import { assignmentsAPI, commonAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Assignments = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);
    const [formData, setFormData] = useState({
        base_id: user?.base_id || '',
        equipment_type_id: '',
        quantity: '',
        assigned_to: '',
        assigned_date: new Date().toISOString().split('T')[0],
        purpose: ''
    });

    useEffect(() => {
        fetchData();
        fetchCommonData();
    }, []);

    const fetchCommonData = async () => {
        try {
            const [basesRes, equipmentRes] = await Promise.all([
                commonAPI.getBases(),
                commonAPI.getEquipmentTypes()
            ]);
            setBases(basesRes.data.bases);
            setEquipmentTypes(equipmentRes.data.equipment_types);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const fetchData = async () => {
        try {
            const res = await assignmentsAPI.getAll({ base_id: user?.role === 'base_commander' ? user.base_id : '' });
            setAssignments(res.data.assignments);
            setLoading(false);
        } catch (error) {
            console.error('Error:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await assignmentsAPI.create(formData);
            setShowModal(false);
            fetchData();
            setFormData({
                base_id: user?.base_id || '',
                equipment_type_id: '',
                quantity: '',
                assigned_to: '',
                assigned_date: new Date().toISOString().split('T')[0],
                purpose: ''
            });
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to create assignment');
        }
    };

    const handleReturn = async (id) => {
        try {
            await assignmentsAPI.returnAssignment(id, { return_date: new Date().toISOString().split('T')[0] });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to return assignment');
        }
    };

    if (loading) return (
        <>
            <Navbar />
            <div className="spinner-container"><div className="spinner"></div></div>
        </>
    );

    return (
        <>
            <Navbar />
            <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1>Assignments</h1>
                        <p style={{ color: 'var(--color-text-secondary)' }}>Manage asset assignments to personnel</p>
                    </div>
                    {(user?.role === 'admin' || user?.role === 'base_commander') && (
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            New Assignment
                        </button>
                    )}
                </div>

                <div className="card">
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Base</th>
                                    <th>Equipment</th>
                                    <th>Quantity</th>
                                    <th>Assigned To</th>
                                    <th>Purpose</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignments.map(assignment => (
                                    <tr key={assignment.id}>
                                        <td>{new Date(assignment.assigned_date).toLocaleDateString()}</td>
                                        <td>{assignment.base_name}</td>
                                        <td>{assignment.equipment_name}</td>
                                        <td>{assignment.quantity}</td>
                                        <td>{assignment.assigned_to}</td>
                                        <td>{assignment.purpose || '-'}</td>
                                        <td>
                                            <span className={`badge ${assignment.status === 'active' ? 'badge-info' : 'badge-success'}`}>
                                                {assignment.status}
                                            </span>
                                        </td>
                                        <td>
                                            {assignment.status === 'active' && (user?.role === 'admin' || user?.role === 'base_commander') && (
                                                <button className="btn btn-sm btn-success" onClick={() => handleReturn(assignment.id)}>
                                                    Return
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2 className="modal-title">New Assignment</h2>
                                <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="form-group">
                                        <label className="form-label">Base *</label>
                                        <select className="form-select" value={formData.base_id} onChange={(e) => setFormData({ ...formData, base_id: e.target.value })} required disabled={user?.role === 'base_commander'}>
                                            <option value="">Select Base</option>
                                            {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Equipment *</label>
                                        <select className="form-select" value={formData.equipment_type_id} onChange={(e) => setFormData({ ...formData, equipment_type_id: e.target.value })} required>
                                            <option value="">Select Equipment</option>
                                            {equipmentTypes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Quantity *</label>
                                        <input type="number" className="form-input" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Assigned To *</label>
                                        <input type="text" className="form-input" value={formData.assigned_to} onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })} required placeholder="Personnel name/ID" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Assignment Date *</label>
                                        <input type="date" className="form-input" value={formData.assigned_date} onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Purpose</label>
                                    <textarea className="form-textarea" value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} placeholder="Training, mission, etc." />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Create Assignment</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Assignments;
