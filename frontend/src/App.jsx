import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Purchases from './pages/Purchases';
import Transfers from './pages/Transfers';
import Assignments from './pages/Assignments';
import Expenditures from './pages/Expenditures';
import './index.css';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="/purchases"
                        element={
                            <PrivateRoute>
                                <Purchases />
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="/transfers"
                        element={
                            <PrivateRoute>
                                <Transfers />
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="/assignments"
                        element={
                            <PrivateRoute roles={['admin', 'base_commander']}>
                                <Assignments />
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="/expenditures"
                        element={
                            <PrivateRoute roles={['admin', 'base_commander']}>
                                <Expenditures />
                            </PrivateRoute>
                        }
                    />

                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
