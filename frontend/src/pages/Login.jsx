import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await login(username, password);
        if (res.success) {
            navigate('/');
        } else {
            setError(res.message);
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: 'var(--bg-dark)'
        }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Shield size={48} color="var(--primary)" style={{ marginBottom: '16px' }} />
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Asset Management</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Secure System Access</p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Username</label>
                        <input
                            type="text"
                            className="input-field"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter ID"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                        AUTHENTICATE
                    </button>
                </form>

                <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Restricted Access Only. <br />All actions are logged.
                </div>

                <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <div style={{ color: 'var(--primary)', fontWeight: '600', marginBottom: '8px' }}>Demo Credentials</div>
                    <div style={{ display: 'grid', gap: '8px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Admin:</span>
                            <span style={{ fontFamily: 'monospace', color: 'var(--text-light)' }}>admin / password123</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Commander:</span>
                            <span style={{ fontFamily: 'monospace', color: 'var(--text-light)' }}>commander / password123</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Logistics:</span>
                            <span style={{ fontFamily: 'monospace', color: 'var(--text-light)' }}>logistics / password123</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
