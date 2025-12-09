import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, roles = [] }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="spinner-container">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
        return (
            <div className="container" style={{ marginTop: '2rem' }}>
                <div className="card">
                    <h2>Access Denied</h2>
                    <p>You do not have permission to access this page.</p>
                </div>
            </div>
        );
    }

    return children;
};

export default PrivateRoute;
