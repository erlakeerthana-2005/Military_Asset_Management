import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(username, password);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
            setLoading(false);
        }
    };

    const demoLogin = async (demoUsername) => {
        setError('');
        setLoading(true);
        // all demo users use the same demo password in mock data
        const result = await login(demoUsername, 'password123');
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-background"></div>
            <div className="login-card fade-in-up">
                <div className="login-header">
                    <div className="login-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                        </svg>
                    </div>
                    <h1>Military Asset Management</h1>
                    <p>Secure Access Portal</p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="username" className="form-label">Username</label>
                        <input
                            id="username"
                            type="text"
                            className="form-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            required
                            autoFocus
                            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => demoLogin('admin')} disabled={loading}>Login as Admin</button>
                                <button type="button" className="btn btn-secondary" onClick={() => demoLogin('commander_alpha')} disabled={loading}>Login as Commander</button>
                                <button type="button" className="btn btn-secondary" onClick={() => demoLogin('logistics_alpha')} disabled={loading}>Login as Logistics</button>
                            </div>
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button className="btn btn-secondary" onClick={() => demoLogin('admin')} disabled={loading}>Login as Admin</button>
                    <button className="btn btn-secondary" onClick={() => demoLogin('commander_alpha')} disabled={loading}>Login as Commander</button>
                    <button className="btn btn-secondary" onClick={() => demoLogin('logistics_alpha')} disabled={loading}>Login as Logistics</button>
                </div>
            </div>
        </div>
    );
};

export default Login;
