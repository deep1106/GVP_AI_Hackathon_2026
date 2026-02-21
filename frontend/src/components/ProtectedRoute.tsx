import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { UserRole } from '../types';

interface Props {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return (
            <div className="flex items-center justify-center h-screen bg-surface-light dark:bg-surface-dark">
                <div className="text-center p-8 glass rounded-2xl shadow-xl max-w-md">
                    <h2 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Your role ({user.role.replace('_', ' ')}) does not have permission to access this page.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
