import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-dark)' }}>
            <Navbar />
            <div className="main-content" style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '32px' }}>
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;
