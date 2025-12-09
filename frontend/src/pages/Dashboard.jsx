import React, { useState, useEffect } from 'react';
import { dashboardAPI, commonAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import Navbar from '../components/Navbar';
import '../styles/Dashboard.css';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState(null);
    const [movementDetails, setMovementDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showMovementModal, setShowMovementModal] = useState(false);
    const [filtersInitialized, setFiltersInitialized] = useState(false);

    const [filters, setFilters] = useState({
        base_id: '',
        equipment_type_id: '',
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
    });

    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);

    const fetchCommonData = async () => {
        try {
            const [basesRes, equipmentRes] = await Promise.all([
                commonAPI.getBases(),
                commonAPI.getEquipmentTypes()
            ]);
            setBases(basesRes.data.bases);
            setEquipmentTypes(equipmentRes.data.equipment_types);
        } catch (error) {
            console.error('Error fetching common data:', error);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const metricsRes = await dashboardAPI.getMetrics(filters);
            setMetrics(metricsRes.data.metrics);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setLoading(false);
        }
    };

    // Initialize filters based on user role
    useEffect(() => {
        if (user) {
            setFilters(prev => ({
                ...prev,
                base_id: user?.role === 'base_commander' ? user.base_id : ''
            }));
            setFiltersInitialized(true);
        }
    }, [user]);

    useEffect(() => {
        if (filtersInitialized) {
            fetchData();
            fetchCommonData();
        }
    }, [filters, filtersInitialized]);

    const handleShowMovementDetails = async () => {
        try {
            const res = await dashboardAPI.getMovementDetails(filters);
            setMovementDetails(res.data);
            setShowMovementModal(true);
        } catch (error) {
            console.error('Error fetching movement details:', error);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="spinner-container">
                    <div className="spinner"></div>
                </div>
            </>
        );
    }

    const movementChartData = {
        labels: ['Purchases', 'Transfer In', 'Transfer Out'],
        datasets: [{
            data: [metrics?.purchases || 0, metrics?.transfer_in || 0, metrics?.transfer_out || 0],
            backgroundColor: ['#27ae60', '#3498db', '#e74c3c'],
            borderColor: ['#1a4d2e', '#1a4d2e', '#1a4d2e'],
            borderWidth: 2
        }]
    };

    const statusChartData = {
        labels: ['Closing Balance', 'Assigned', 'Expended'],
        datasets: [{
            label: 'Assets',
            data: [metrics?.closing_balance || 0, metrics?.assigned || 0, metrics?.expended || 0],
            backgroundColor: ['rgba(26, 77, 46, 0.8)', 'rgba(255, 107, 53, 0.8)', 'rgba(231, 76, 60, 0.8)'],
            borderColor: ['#1a4d2e', '#ff6b35', '#e74c3c'],
            borderWidth: 2
        }]
    };

    return (
        <>
            <Navbar />
            <div className="dashboard-container">
                <div className="container">
                    <div className="dashboard-header fade-in-up">
                        <div>
                            <h1>Dashboard</h1>
                            <p>Monitor and track your military assets in real-time</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="card fade-in-up mb-4">
                        <div className="filters-grid">
                            {user?.role === 'admin' && (
                                <div className="form-group">
                                    <label className="form-label">Base</label>
                                    <select
                                        name="base_id"
                                        className="form-select"
                                        value={filters.base_id}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">All Bases</option>
                                        {bases.map(base => (
                                            <option key={base.id} value={base.id}>{base.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Equipment Type</label>
                                <select
                                    name="equipment_type_id"
                                    className="form-select"
                                    value={filters.equipment_type_id}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Equipment</option>
                                    {equipmentTypes.map(eq => (
                                        <option key={eq.id} value={eq.id}>{eq.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Start Date</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    className="form-input"
                                    value={filters.start_date}
                                    onChange={handleFilterChange}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">End Date</label>
                                <input
                                    type="date"
                                    name="end_date"
                                    className="form-input"
                                    value={filters.end_date}
                                    onChange={handleFilterChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Metrics Cards */}
                    <div className="metrics-grid fade-in-up">
                        <div className="metric-card">
                            <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                            <div className="metric-content">
                                <div className="metric-label">Opening Balance</div>
                                <div className="metric-value">{metrics?.opening_balance?.toLocaleString() || 0}</div>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                    <polyline points="17 6 23 6 23 12" />
                                </svg>
                            </div>
                            <div className="metric-content">
                                <div className="metric-label">Closing Balance</div>
                                <div className="metric-value">{metrics?.closing_balance?.toLocaleString() || 0}</div>
                            </div>
                        </div>

                        <div className="metric-card clickable" onClick={handleShowMovementDetails}>
                            <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #ff6b35 0%, #e65c2e 100%)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="17 1 21 5 17 9" />
                                    <path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" />
                                </svg>
                            </div>
                            <div className="metric-content">
                                <div className="metric-label">Net Movement</div>
                                <div className="metric-value">{metrics?.net_movement?.toLocaleString() || 0}</div>
                                <div className="metric-hint">Click for details</div>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="8.5" cy="7" r="4" />
                                    <polyline points="17 11 19 13 23 9" />
                                </svg>
                            </div>
                            <div className="metric-content">
                                <div className="metric-label">Assigned</div>
                                <div className="metric-value">{metrics?.assigned?.toLocaleString() || 0}</div>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                            </div>
                            <div className="metric-content">
                                <div className="metric-label">Expended</div>
                                <div className="metric-value">{metrics?.expended?.toLocaleString() || 0}</div>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="charts-grid fade-in-up">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Movement Distribution</h3>
                            </div>
                            <div className="chart-container">
                                <Pie data={movementChartData} options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { position: 'bottom', labels: { color: '#b8c5c2' } }
                                    }
                                }} />
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Asset Status</h3>
                            </div>
                            <div className="chart-container">
                                <Bar data={statusChartData} options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { display: false }
                                    },
                                    scales: {
                                        x: { ticks: { color: '#b8c5c2' }, grid: { color: '#3a4442' } },
                                        y: { ticks: { color: '#b8c5c2' }, grid: { color: '#3a4442' } }
                                    }
                                }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Movement Details Modal */}
            {showMovementModal && movementDetails && (
                <div className="modal-overlay" onClick={() => setShowMovementModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Movement Details</h2>
                            <button className="modal-close" onClick={() => setShowMovementModal(false)}>&times;</button>
                        </div>

                        <div className="modal-body">
                            <h4>Purchases ({movementDetails.purchases?.length || 0})</h4>
                            {movementDetails.purchases?.length > 0 ? (
                                <div className="table-wrapper mb-3">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Equipment</th>
                                                <th>Quantity</th>
                                                <th>Vendor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {movementDetails.purchases.slice(0, 5).map(p => (
                                                <tr key={p.id}>
                                                    <td>{new Date(p.purchase_date).toLocaleDateString()}</td>
                                                    <td>{p.equipment_name}</td>
                                                    <td>{p.quantity}</td>
                                                    <td>{p.vendor}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : <p className="text-muted">No purchases in this period</p>}

                            <h4 className="mt-3">Transfers In ({movementDetails.transfers_in?.length || 0})</h4>
                            {movementDetails.transfers_in?.length > 0 ? (
                                <div className="table-wrapper mb-3">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Equipment</th>
                                                <th>Quantity</th>
                                                <th>From</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {movementDetails.transfers_in.slice(0, 5).map(t => (
                                                <tr key={t.id}>
                                                    <td>{new Date(t.transfer_date).toLocaleDateString()}</td>
                                                    <td>{t.equipment_name}</td>
                                                    <td>{t.quantity}</td>
                                                    <td>{t.from_base_name}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : <p className="text-muted">No incoming transfers in this period</p>}

                            <h4 className="mt-3">Transfers Out ({movementDetails.transfers_out?.length || 0})</h4>
                            {movementDetails.transfers_out?.length > 0 ? (
                                <div className="table-wrapper">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Equipment</th>
                                                <th>Quantity</th>
                                                <th>To</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {movementDetails.transfers_out.slice(0, 5).map(t => (
                                                <tr key={t.id}>
                                                    <td>{new Date(t.transfer_date).toLocaleDateString()}</td>
                                                    <td>{t.equipment_name}</td>
                                                    <td>{t.quantity}</td>
                                                    <td>{t.to_base_name}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : <p className="text-muted">No outgoing transfers in this period</p>}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Dashboard;
