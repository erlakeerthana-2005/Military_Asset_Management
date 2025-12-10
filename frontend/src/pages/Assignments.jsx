import React, { useState, useEffect } from 'react';
import { Users, UserPlus } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Assignments = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [metadata, setMetadata] = useState({ bases: [], assetTypes: [] });
    const [form, setForm] = useState({ asset_type_id: 1, quantity: 1, assignee: '' });

    useEffect(() => {
        fetchMetadata();
        fetchData();
    }, []);

    const fetchMetadata = async () => {
        try { const res = await api.get('/metadata'); setMetadata(res.data); } catch (e) { }
    };

    const fetchData = async () => {
        try {
            const res = await api.get('/transactions', { params: { type: 'ASSIGN', base_id: user.base_id } });
            setAssignments(res.data);
        } catch (e) { }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/transactions', {
                type: 'ASSIGN',
                asset_type_id: form.asset_type_id,
                quantity: form.quantity,
                base_id: user.base_id,
                notes: `Assigned to: ${form.assignee}`
            });
            setShowForm(false);
            fetchData();
        } catch (e) { alert('Error'); }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Assignments</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Assign assets to personnel</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    <UserPlus size={20} /> New Assignment
                </button>
            </div>

            {showForm && (
                <div className="glass-card animate-fade-in" style={{ marginBottom: '32px', borderLeft: '4px solid var(--secondary)' }}>
                    <h3>Assign Details</h3>
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
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem' }}>Personnel Name / ID</label>
                            <input type="text" className="input-field" value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })} placeholder="e.g. Sgt. Miller" />
                        </div>
                        <div style={{ gridColumn: 'span 3', textAlign: 'right' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)} style={{ marginRight: '10px' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Assign</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-card table-container">
                <table>
                    <thead><tr><th>Date</th><th>Asset</th><th>Qty</th><th>Assigned To (Notes)</th><th>Authorized By</th></tr></thead>
                    <tbody>
                        {assignments.map(a => (
                            <tr key={a.id}>
                                <td>{new Date(a.timestamp).toLocaleDateString()}</td>
                                <td>{a.asset_name}</td>
                                <td>{a.quantity}</td>
                                <td>{a.notes}</td>
                                <td>{a.user}</td>
                            </tr>
                        ))}
                        {assignments.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>No active assignments</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Assignments;
