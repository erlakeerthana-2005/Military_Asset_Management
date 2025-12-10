import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, ArrowRightLeft, Users, LogOut, Shield, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <nav style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            height: '70px',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--glass-border)',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Shield className="text-primary" size={28} />
                <span style={{ fontSize: '1.2rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
                    Military Asset Management
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink to="/purchases" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <ShoppingCart size={18} />
                    <span>Purchases</span>
                </NavLink>

                <NavLink to="/transfers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <ArrowRightLeft size={18} />
                    <span>Transfers</span>
                </NavLink>

                {user.role !== 'logistics' && (
                    <NavLink to="/assignments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Users size={18} />
                        <span>Assignments</span>
                    </NavLink>
                )}

                <NavLink to="/expenditures" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <DollarSign size={18} />
                    <span>Expenditures</span>
                </NavLink>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user.username}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--primary)', letterSpacing: '0.05em' }}>
                        {user.role.toUpperCase().replace('_', ' ')}
                    </div>
                </div>

                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--success)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                }}>
                    {user.username[0].toUpperCase()}
                </div>

                <button
                    onClick={handleLogout}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                >
                    <LogOut size={16} />
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
