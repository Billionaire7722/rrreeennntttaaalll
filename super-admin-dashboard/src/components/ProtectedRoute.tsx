import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <div className="loading-screen">Authenticating...</div>;
    }

    if (!isAuthenticated || user?.role !== 'SUPER_ADMIN') {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
