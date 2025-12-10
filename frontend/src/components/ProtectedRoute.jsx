import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ roles = [] }) => {
    const { user, loading } = useAuth();

    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>Access Denied</h2>
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }

    return <Outlet />;
};

export default ProtectedRoute;
