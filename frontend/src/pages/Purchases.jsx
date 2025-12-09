import React, { useState, useEffect } from 'react';
import { purchasesAPI, commonAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Purchases = () => {
    const { user } = useAuth();
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);
    const [formData, setFormData] = useState({
        base_id: user?.base_id || '',
        equipment_type_id: '',
        quantity: '',
        unit_price: '',
        vendor: '',
        purchase_date: new Date().toISOString().split('T')[0],
        received_date: '',
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
            const res = await purchasesAPI.getAll({ base_id: user?.role === 'base_commander' ? user.base_id : '' });
            setPurchases(res.data.purchases);
            setLoading(false);
        } catch (error) {
            console.error('Error:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await purchasesAPI.create(formData);
            setShowModal(false);
            fetchData();
            setFormData({
                base_id: user?.base_id || '',
                equipment_type_id: '',
                quantity: '',
                unit_price: '',
                vendor: '',
                purchase_date: new Date().toISOString().split('T')[0],
                received_date: '',
                notes: ''
            });
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to create purchase');
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
                        <h1>Purchases</h1>
                        <p style={{ color: 'var(--color-text-secondary)' }}>Manage asset purchases</p>
                    </div>
                    {(user?.role === 'admin' || user?.role === 'logistics_officer' || user?.role === 'base_commander') && (
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            New Purchase
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
                                    <th>Unit Price</th>
                                    <th>Total</th>
                                    <th>Vendor</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchases.map(purchase => (
                                    <tr key={purchase.id}>
                                        <td>{new Date(purchase.purchase_date).toLocaleDateString()}</td>
                                        <td>{purchase.base_name}</td>
                                        <td>{purchase.equipment_name}</td>
                                        <td>{purchase.quantity}</td>
                                        <td>${purchase.unit_price?.toFixed(2) || '-'}</td>
                                        <td>${purchase.total_price?.toFixed(2) || '-'}</td>
                                        <td>{purchase.vendor || '-'}</td>
                                        <td>
                                            <span className={`badge ${purchase.received_date ? 'badge-success' : 'badge-warning'}`}>
                                                {purchase.received_date ? 'Received' : 'Pending'}
                                            </span>
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
                                <h2 className="modal-title">New Purchase</h2>
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
                                        <label className="form-label">Unit Price</label>
                                        <input type="number" step="0.01" className="form-input" value={formData.unit_price} onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Vendor</label>
                                        <input type="text" className="form-input" value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Purchase Date *</label>
                                        <input type="date" className="form-input" value={formData.purchase_date} onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Received Date</label>
                                        <input type="date" className="form-input" value={formData.received_date} onChange={(e) => setFormData({ ...formData, received_date: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea className="form-textarea" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Create Purchase</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Purchases;
