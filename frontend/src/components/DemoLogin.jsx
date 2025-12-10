import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const demoUsers = [
    { username: 'admin', label: 'Admin' },
    { username: 'commander_alpha', label: 'Commander' },
    { username: 'logistics_alpha', label: 'Logistics' }
];

const DemoLogin = ({ disabled }) => {
    const { demoLogin } = useAuth();
    const navigate = useNavigate();

    const handleClick = async (username) => {
        const result = await demoLogin(username);
        if (result?.success) {
            navigate('/dashboard');
        } else {
            // optionally handle demo login failure
            console.error('Demo login failed', result?.error);
        }
    };

    return (
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {demoUsers.map((u) => (
                <button
                    key={u.username}
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleClick(u.username)}
                    disabled={disabled}
                >
                    Login as {u.label}
                </button>
            ))}
        </div>
    );
};

export default DemoLogin;
