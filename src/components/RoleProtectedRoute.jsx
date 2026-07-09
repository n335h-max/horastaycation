import { Navigate } from 'react-router-dom';
import { RouteLoadingFallback } from './RouteLoadingFallback';

export function RoleProtectedRoute({
  authUser,
  availableRoles,
  requiredRole,
  fallbackPath,
  isAuthLoading = false,
  children,
}) {
  if (isAuthLoading) {
    return <RouteLoadingFallback />;
  }

  if (!authUser) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (!availableRoles.includes(requiredRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}
