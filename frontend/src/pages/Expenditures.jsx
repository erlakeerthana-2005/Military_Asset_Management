import React, { useState, useEffect } from 'react';
import { expendituresAPI, commonAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Expenditures = () => {
    const { user } = useAuth();
    const [expenditures, setExpenditures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);
    const [formData, setFormData] = useState({
        base_id: user?.base_id || '',
        equipment_type_id: '',
        quantity: '',
        expended_date: new Date().toISOString().split('T')[0],
        reason: '',
        authorized_by: '',
        notes: ''
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
            const res = await expendituresAPI.getAll({ base_id: user?.role === 'base_commander' ? user.base_id : '' });
            setExpenditures(res.data.expenditures);
            setLoading(false);
        } catch (error) {
            console.error('Error:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await expendituresAPI.create(formData);
            setShowModal(false);
            fetchData();
            setFormData({
                base_id: user?.base_id || '',
                equipment_type_id: '',
                quantity: '',
                expended_date: new Date().toISOString().split('T')[0],
                reason: '',
                authorized_by: '',
                notes: ''
            });
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to record expenditure');
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
                        <h1>Expenditures</h1>
                        <p style={{ color: 'var(--color-text-secondary)' }}>Track expended military assets</p>
                    </div>
                    {(user?.role === 'admin' || user?.role === 'base_commander') && (
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Record Expenditure
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
                                    <th>Reason</th>
                                    <th>Authorized By</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenditures.map(expenditure => (
                                    <tr key={expenditure.id}>
                                        <td>{new Date(expenditure.expended_date).toLocaleDateString()}</td>
                                        <td>{expenditure.base_name}</td>
                                        <td>{expenditure.equipment_name}</td>
                                        <td>{expenditure.quantity}</td>
                                        <td>
                                            <span className={`badge ${expenditure.reason.toLowerCase().includes('training') ? 'badge-info' :
                                                    expenditure.reason.toLowerCase().includes('combat') ? 'badge-danger' :
                                                        'badge-warning'
                                                }`}>
                                                {expenditure.reason}
                                            </span>
                                        </td>
                                        <td>{expenditure.authorized_by || '-'}</td>
                                        <td>{expenditure.notes || '-'}</td>
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
                                <h2 className="modal-title">Record Expenditure</h2>
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
                                        <label className="form-label">Expended Date *</label>
                                        <input type="date" className="form-input" value={formData.expended_date} onChange={(e) => setFormData({ ...formData, expended_date: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Reason *</label>
                                        <select className="form-select" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} required>
                                            <option value="">Select Reason</option>
                                            <option value="Training">Training</option>
                                            <option value="Combat">Combat</option>
                                            <option value="Maintenance">Maintenance</option>
                                            <option value="Lost/Damaged">Lost/Damaged</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Authorized By</label>
                                        <input type="text" className="form-input" value={formData.authorized_by} onChange={(e) => setFormData({ ...formData, authorized_by: e.target.value })} placeholder="Authorizing officer" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea className="form-textarea" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional details..." />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Record Expenditure</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Expenditures;
