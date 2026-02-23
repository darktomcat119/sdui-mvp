import { createBrowserRouter, Navigate } from 'react-router-dom';
import { UserRole } from '../types/auth.types';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout/AppLayout';
import { LoginPage } from '../pages/Login/LoginPage';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { UsersListPage } from '../pages/Users/UsersListPage';
import { CreateUserPage } from '../pages/Users/CreateUserPage';
import { AuditLogPage } from '../pages/AuditLog/AuditLogPage';
import { ProfilePage } from '../pages/Profile/ProfilePage';
import { NotFoundPage } from '../pages/NotFound/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute
            roles={[UserRole.SYSTEM_ADMIN, UserRole.MUNICIPAL_ADMIN]}
          >
            <UsersListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'users/new',
        element: (
          <ProtectedRoute
            roles={[UserRole.SYSTEM_ADMIN, UserRole.MUNICIPAL_ADMIN]}
          >
            <CreateUserPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'audit-log',
        element: (
          <ProtectedRoute
            roles={[
              UserRole.SYSTEM_ADMIN,
              UserRole.MUNICIPAL_ADMIN,
              UserRole.COMPTROLLER_AUDITOR,
            ]}
          >
            <AuditLogPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
