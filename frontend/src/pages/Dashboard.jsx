import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, ArrowRightLeft, Users, Calendar } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState({
        opening_balance: 0,
        closing_balance: 0,
        net_movement: 0,
        assigned: 0
    });
    const [filters, setFilters] = useState({
        startDate: '2025-11-10',
        endDate: '2025-12-10',
        equipmentType: 'All Equipment'
    });

    useEffect(() => {
        fetchMetrics();
    }, [filters]);

    const fetchMetrics = async () => {
        try {
            const res = await api.get('/dashboard', {
                params: { base_id: user.base_id, ...filters }
            });
            setMetrics(res.data);
        } catch (error) {
            console.error("Failed to fetch metrics", error);
        }
    };

    const handleNetMovementClick = () => {
        alert(`Breakdown:\nPurchases: ${metrics.breakdown?.purchases}\nTransfer In: ${metrics.breakdown?.transfer_in}\nTransfer Out: ${metrics.breakdown?.transfer_out}`);
    };

    return (
        <div>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Dashboard</h1>
                <p style={{ color: 'var(--text-muted)' }}>Monitor and track your military assets in real-time</p>
            </div>

            {/* Filters */}
            <div className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>EQUIPMENT TYPE</label>
                        <select
                            className="input-field"
                            value={filters.equipmentType}
                            onChange={(e) => setFilters({ ...filters, equipmentType: e.target.value })}
                        >
                            <option>All Equipment</option>
                            <option>Weapons</option>
                            <option>Vehicles</option>
                            <option>Ammunition</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>START DATE</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="date"
                                className="input-field"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            />
                            <Calendar size={16} style={{ position: 'absolute', right: '12px', top: '14px', color: 'var(--text-muted)' }} />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>END DATE</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="date"
                                className="input-field"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            />
                            <Calendar size={16} style={{ position: 'absolute', right: '12px', top: '14px', color: 'var(--text-muted)' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>

                {/* Opening Balance */}
                <div className="glass-card metric-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <DollarSign size={32} color="white" />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>OPENING BALANCE</div>
                        <div style={{ fontSize: '2rem', fontWeight: '700' }}>{metrics.opening_balance}</div>
                    </div>
                </div>

                {/* Closing Balance */}
                <div className="glass-card metric-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <TrendingUp size={32} color="white" />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>CLOSING BALANCE</div>
                        <div style={{ fontSize: '2rem', fontWeight: '700' }}>{metrics.closing_balance}</div>
                    </div>
                </div>

                {/* Net Movement */}
                <div
                    className="glass-card metric-card"
                    style={{ display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }}
                    onClick={handleNetMovementClick}
                >
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #f97316, #ea580c)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <ArrowRightLeft size={32} color="white" />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>NET MOVEMENT</div>
                        <div style={{ fontSize: '2rem', fontWeight: '700' }}>{metrics.net_movement}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--warning)', fontStyle: 'italic', marginTop: '4px' }}>Click for details</div>
                    </div>
                </div>

                {/* Assigned */}
                <div className="glass-card metric-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Users size={32} color="white" />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>ASSIGNED</div>
                        <div style={{ fontSize: '2rem', fontWeight: '700' }}>{metrics.assigned}</div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
