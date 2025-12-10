import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, ArrowRightLeft, Users, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className="sidebar">
            <div className="logo-area">
                <Shield className="w-8 h-8 text-primary" />
                <span>MILITARY<br /><span style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>ASSET MGMT</span></span>
            </div>

            <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <div style={{ fontWeight: 'bold' }}>{user.username}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{user.role.toUpperCase()}</div>
            </div>

            <nav style={{ flex: 1 }}>
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink to="/purchases" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <ShoppingCart size={20} />
                    <span>Purchases</span>
                </NavLink>

                <NavLink to="/transfers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <ArrowRightLeft size={20} />
                    <span>Transfers</span>
                </NavLink>

                {user.role !== 'logistics' && (
                    <NavLink to="/assignments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Users size={20} />
                        <span>Assignments</span>
                    </NavLink>
                )}
            </nav>

            <button onClick={handleLogout} className="nav-item" style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', marginTop: 'auto' }}>
                <LogOut size={20} />
                <span>Logout</span>
            </button>
        </div>
    );
};

export default Sidebar;
