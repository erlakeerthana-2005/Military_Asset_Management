import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Send, Search, Filter } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Transfers = () => {
    const { user } = useAuth();
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [metadata, setMetadata] = useState({ bases: [], assetTypes: [] });

    // New Transfer State
    const [newTransfer, setNewTransfer] = useState({
        asset_type_id: 1,
        quantity: 1,
        related_base_id: '',
        notes: ''
    });

    useEffect(() => {
        fetchMetadata();
        fetchTransfers();
    }, []);

    const fetchMetadata = async () => {
        try {
            const res = await api.get('/metadata');
            setMetadata(res.data);
        } catch (e) {
            console.error("Failed to load metadata");
        }
    };

    const fetchTransfers = async () => {
        try {
            // Fetch relevant transfers (Type=TRANSFER)
            // Note: Our backend currently separates TRANSFER_IN and TRANSFER_OUT or just TRANSFER?
            // The dashboard logic uses 'TRANSFER' type but distinguishes direction by base_id.
            // Let's stick to recording 'TRANSFER' type for inter-base movements.

            // However, to make it easy to list, let's fetch all transactions of type TRANSFER
            const res = await api.get('/transactions', { params: { type: 'TRANSFER', base_id: user.base_id } });
            setTransfers(res.data);
        } catch (e) {
            console.error("Failed to load transfers");
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        if (!newTransfer.related_base_id) {
            alert("Please select a destination base");
            return;
        }
        try {
            await api.post('/transactions', {
                type: 'TRANSFER',
                asset_type_id: newTransfer.asset_type_id,
                quantity: newTransfer.quantity,
                base_id: user.base_id, // Origin (From here)
                related_base_id: newTransfer.related_base_id, // Destination
                notes: newTransfer.notes
            });
            setShowForm(false);
            fetchTransfers();
        } catch (error) {
            alert('Failed to record transfer');
        }
    };

    // Helper to determine direction relative to current user
    const getDirection = (txn) => {
        if (!user.base_id) return 'N/A'; // Admin viewing all?
        if (txn.base_name === metadata.bases.find(b => b.id === user.base_id)?.name) return 'OUT';
        return 'IN';
        // Note: The backend logic for 'base_id' vs 'related_base_id' in a single TRANSFER record:
        // By convention: base_id = Source, related_base_id = Destination.
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Transfers</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage inter-base asset movements</p>
                </div>
                {(user.role === 'admin' || user.role === 'logistics') && (
                    <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                        <Send size={20} />
                        Initiate Transfer
                    </button>
                )}
            </div>

            {/* Transfer Form */}
            {showForm && (
                <div className="glass-card animate-fade-in" style={{ marginBottom: '32px', borderLeft: '4px solid var(--info)' }}>
                    <h3 style={{ marginBottom: '20px' }}>Transfer Request</h3>
                    <form onSubmit={handleTransfer} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', alignItems: 'end' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem' }}>Asset Type</label>
                            <select
                                className="input-field"
                                value={newTransfer.asset_type_id}
                                onChange={e => setNewTransfer({ ...newTransfer, asset_type_id: e.target.value })}
                            >
                                {metadata.assetTypes.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem' }}>Destination Base</label>
                            <select
                                className="input-field"
                                value={newTransfer.related_base_id}
                                onChange={e => setNewTransfer({ ...newTransfer, related_base_id: e.target.value })}
                            >
                                <option value="">Select Destination...</option>
                                {metadata.bases
                                    .filter(b => b.id !== user.base_id) // Don't transfer to self
                                    .map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem' }}>Quantity</label>
                            <input
                                type="number"
                                min="1"
                                className="input-field"
                                value={newTransfer.quantity}
                                onChange={e => setNewTransfer({ ...newTransfer, quantity: parseInt(e.target.value) })}
                            />
                        </div>
                        <div style={{ gridColumn: 'span 4' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem' }}>Reason / Authorization</label>
                            <input
                                type="text"
                                className="input-field"
                                value={newTransfer.notes}
                                onChange={e => setNewTransfer({ ...newTransfer, notes: e.target.value })}
                                placeholder="Details..."
                            />
                        </div>
                        <div style={{ gridColumn: 'span 4', textAlign: 'right', marginTop: '10px' }}>
                            <button type="button" className="btn btn-secondary" style={{ marginRight: '10px' }} onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Send Assets</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-card table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Direction</th>
                            <th>Asset</th>
                            <th>Qty</th>
                            <th>Source</th>
                            <th>Destination</th>
                            <th>Officer</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transfers.length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>No transfer history.</td></tr>
                        ) : (
                            transfers.map(t => (
                                <tr key={t.id}>
                                    <td>{new Date(t.timestamp).toLocaleDateString()}</td>
                                    <td>
                                        {/* Logic check: Is it incoming or outgoing for THIS user? */}
                                        {/* Since we don't have easy context here, simplistic view: */}
                                        <span style={{
                                            color: t.base_name === metadata.bases.find(b => b.id === user.base_id)?.name ? 'var(--warning)' : 'var(--success)',
                                            fontWeight: 'bold'
                                        }}>
                                            {/* If current user base is origin, it is OUT. Else IN */}
                                            <ArrowRightLeft size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                            TRANSFER
                                        </span>
                                    </td>
                                    <td>{t.asset_name}</td>
                                    <td>{t.quantity}</td>
                                    <td>{t.base_name}</td>
                                    <td>{t.related_base_name}</td>
                                    <td>{t.user}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
};

export default Transfers;
