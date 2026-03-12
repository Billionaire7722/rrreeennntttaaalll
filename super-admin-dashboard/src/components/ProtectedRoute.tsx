import React from 'react';
import { useAuth } from '../context/useAuth';
import { AccessRequired } from '../pages/AccessRequired';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return <div className="loading-screen">Authenticating...</div>;
    }

    if (!isAuthenticated || user?.role !== 'SUPER_ADMIN') {
        return <AccessRequired />;
    }

    return <>{children}</>;
};
