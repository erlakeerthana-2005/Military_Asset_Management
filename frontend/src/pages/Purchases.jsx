import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Search, Filter } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Purchases = () => {
    const { user } = useAuth();
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [newItem, setNewItem] = useState({
        asset_type_id: 1, // Default to M4
        quantity: 1,
        notes: ''
    });

    // Metadata
    const [metadata, setMetadata] = useState({ bases: [], assetTypes: [] });

    useEffect(() => {
        fetchMetadata();
        fetchPurchases();
    }, []);

    const fetchMetadata = async () => {
        try {
            const res = await api.get('/metadata');
            setMetadata(res.data);
        } catch (e) {
            console.error("Failed to load metadata");
        }
    };

    const fetchPurchases = async () => {
        setLoading(true);
        try {
            const res = await api.get('/transactions', { params: { type: 'PURCHASE', base_id: user.base_id } });
            setPurchases(res.data);
        } catch (e) {
            console.error("Failed to load purchases");
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (e) => {
        e.preventDefault();
        try {
            await api.post('/transactions', {
                type: 'PURCHASE',
                asset_type_id: newItem.asset_type_id,
                quantity: newItem.quantity,
                base_id: user.base_id || 1, // Default if admin
                notes: newItem.notes
            });
            setShowForm(false);
            fetchPurchases();
        } catch (error) {
            alert('Failed to record purchase');
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Purchases</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Record and view asset acquisitions</p>
                </div>
                {(user.role === 'admin' || user.role === 'logistics') && (
                    <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                        <Plus size={20} />
                        Record New Purchase
                    </button>
                )}
            </div>

            {/* Purchase Form */}
            {showForm && (
                <div className="glass-card animate-fade-in" style={{ marginBottom: '32px', borderLeft: '4px solid var(--success)' }}>
                    <h3 style={{ marginBottom: '20px' }}>New Acquisition Record</h3>
                    <form onSubmit={handlePurchase} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', alignItems: 'end' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem' }}>Asset Type</label>
                            <select
                                className="input-field"
                                value={newItem.asset_type_id}
                                onChange={e => setNewItem({ ...newItem, asset_type_id: e.target.value })}
                            >
                                {metadata.assetTypes.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem' }}>Quantity</label>
                            <input
                                type="number"
                                min="1"
                                className="input-field"
                                value={newItem.quantity}
                                onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                            />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem' }}>Notes / PO Number</label>
                            <input
                                type="text"
                                className="input-field"
                                value={newItem.notes}
                                onChange={e => setNewItem({ ...newItem, notes: e.target.value })}
                                placeholder="Optional details..."
                            />
                        </div>
                        <div style={{ gridColumn: 'span 4', textAlign: 'right', marginTop: '10px' }}>
                            <button type="button" className="btn btn-secondary" style={{ marginRight: '10px' }} onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Confirm Purchase</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters Bar (Visual Only for now) */}
            <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Search records..." className="input-field" style={{ paddingLeft: '40px' }} />
                </div>
                <button className="btn btn-secondary"><Filter size={18} /> Filter</button>
            </div>

            {/* Table */}
            <div className="glass-card table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Date</th>
                            <th>Asset</th>
                            <th>Quantity</th>
                            <th>Base</th>
                            <th>Officer</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchases.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    No purchase records found.
                                </td>
                            </tr>
                        ) : (
                            purchases.map(p => (
                                <tr key={p.id}>
                                    <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>#{p.id.toString().padStart(4, '0')}</td>
                                    <td>{new Date(p.timestamp).toLocaleDateString()}</td>
                                    <td>
                                        <span style={{ fontWeight: 'bold' }}>{p.asset_name}</span>
                                    </td>
                                    <td>
                                        <div style={{
                                            display: 'inline-block', padding: '4px 12px',
                                            background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7',
                                            borderRadius: '20px', fontSize: '0.85rem'
                                        }}>
                                            +{p.quantity}
                                        </div>
                                    </td>
                                    <td>{p.base_name}</td>
                                    <td>{p.user}</td>
                                    <td style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{p.notes || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Purchases;
