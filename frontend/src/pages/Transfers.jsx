import React, { useState, useEffect } from 'react';
import { transfersAPI, commonAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Transfers = () => {
    const { user } = useAuth();
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);
    const [formData, setFormData] = useState({
        from_base_id: user?.base_id || '',
        to_base_id: '',
        equipment_type_id: '',
        quantity: '',
        transfer_date: new Date().toISOString().split('T')[0],
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
            const res = await transfersAPI.getAll();
            setTransfers(res.data.transfers);
            setLoading(false);
        } catch (error) {
            console.error('Error:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await transfersAPI.create(formData);
            setShowModal(false);
            fetchData();
            setFormData({
                from_base_id: user?.base_id || '',
                to_base_id: '',
                equipment_type_id: '',
                quantity: '',
                transfer_date: new Date().toISOString().split('T')[0],
                notes: ''
            });
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to create transfer');
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await transfersAPI.updateStatus(id, { status, received_date: new Date().toISOString().split('T')[0] });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to update status');
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            pending: 'badge-warning',
            in_transit: 'badge-info',
            completed: 'badge-success',
            cancelled: 'badge-danger'
        };
        return `badge ${statusMap[status] || 'badge-info'}`;
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
                        <h1>Transfers</h1>
                        <p style={{ color: 'var(--color-text-secondary)' }}>Manage asset transfers between bases</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        New Transfer
                    </button>
                </div>

                <div className="card">
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Equipment</th>
                                    <th>Quantity</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transfers.map(transfer => (
                                    <tr key={transfer.id}>
                                        <td>{new Date(transfer.transfer_date).toLocaleDateString()}</td>
                                        <td>{transfer.equipment_name}</td>
                                        <td>{transfer.quantity}</td>
                                        <td>{transfer.from_base_name}</td>
                                        <td>{transfer.to_base_name}</td>
                                        <td><span className={getStatusBadge(transfer.status)}>{transfer.status}</span></td>
                                        <td>
                                            {transfer.status === 'pending' && (
                                                <button className="btn btn-sm btn-success" onClick={() => handleStatusUpdate(transfer.id, 'in_transit')}>
                                                    In Transit
                                                </button>
                                            )}
                                            {transfer.status === 'in_transit' && (
                                                <button className="btn btn-sm btn-primary" onClick={() => handleStatusUpdate(transfer.id, 'completed')}>
                                                    Complete
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
                                <h2 className="modal-title">New Transfer</h2>
                                <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="form-group">
                                        <label className="form-label">From Base *</label>
                                        <select className="form-select" value={formData.from_base_id} onChange={(e) => setFormData({ ...formData, from_base_id: e.target.value })} required disabled={user?.role === 'base_commander'}>
                                            <option value="">Select Base</option>
                                            {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">To Base *</label>
                                        <select className="form-select" value={formData.to_base_id} onChange={(e) => setFormData({ ...formData, to_base_id: e.target.value })} required>
                                            <option value="">Select Base</option>
                                            {bases.filter(b => b.id !== parseInt(formData.from_base_id)).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
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
                                        <label className="form-label">Transfer Date *</label>
                                        <input type="date" className="form-input" value={formData.transfer_date} onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea className="form-textarea" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Create Transfer</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Transfers;
