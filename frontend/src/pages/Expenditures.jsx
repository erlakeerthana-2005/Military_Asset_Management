import React, { useState, useEffect } from 'react';
import { DollarSign, Trash2 } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Expenditures = () => {
    const { user } = useAuth();
    const [expenditures, setExpenditures] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [metadata, setMetadata] = useState({ bases: [], assetTypes: [] });
    const [form, setForm] = useState({ asset_type_id: 1, quantity: 1, reason: '' });

    useEffect(() => {
        fetchMetadata();
        fetchData();
    }, []);

    const fetchMetadata = async () => {
        try { const res = await api.get('/metadata'); setMetadata(res.data); } catch (e) { }
    };

    const fetchData = async () => {
        try {
            const res = await api.get('/transactions', { params: { type: 'EXPEND', base_id: user.base_id } });
            setExpenditures(res.data);
        } catch (e) { }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/transactions', {
                type: 'EXPEND',
                asset_type_id: form.asset_type_id,
                quantity: form.quantity,
                base_id: user.base_id,
                notes: form.reason
            });
            setShowForm(false);
            fetchData();
        } catch (e) { alert('Error'); }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Expenditures</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Track expended resources (ammo, fuel, etc)</p>
                </div>
                <button className="btn btn-primary" style={{ background: 'var(--danger)' }} onClick={() => setShowForm(!showForm)}>
                    <Trash2 size={20} /> Report Expenditure
                </button>
            </div>

            {showForm && (
                <div className="glass-card animate-fade-in" style={{ marginBottom: '32px', borderLeft: '4px solid var(--danger)' }}>
                    <h3>Report Expenditure</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'end', marginTop: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem' }}>Asset</label>
                            <select className="input-field" value={form.asset_type_id} onChange={e => setForm({ ...form, asset_type_id: e.target.value })}>
                                {metadata.assetTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem' }}>Quantity</label>
                            <input type="number" min="1" className="input-field" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem' }}>Reason</label>
                            <input type="text" className="input-field" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Training Exercise" />
                        </div>
                        <div style={{ gridColumn: 'span 3', textAlign: 'right' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)} style={{ marginRight: '10px' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ background: 'var(--danger)' }}>Confirm Expend</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-card table-container">
                <table>
                    <thead><tr><th>Date</th><th>Asset</th><th>Qty</th><th>Reason</th><th>Reported By</th></tr></thead>
                    <tbody>
                        {expenditures.map(a => (
                            <tr key={a.id}>
                                <td>{new Date(a.timestamp).toLocaleDateString()}</td>
                                <td>{a.asset_name}</td>
                                <td>{a.quantity}</td>
                                <td>{a.notes}</td>
                                <td>{a.user}</td>
                            </tr>
                        ))}
                        {expenditures.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>No expenditure records</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Expenditures;
