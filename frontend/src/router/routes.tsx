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
import { TaxpayersListPage } from '../pages/Taxpayers/TaxpayersListPage';
import { CreateTaxpayerPage } from '../pages/Taxpayers/CreateTaxpayerPage';
import { ConfigurationPage } from '../pages/Configuration/ConfigurationPage';
import { DeterminationPage } from '../pages/Determination/DeterminationPage';
import { DeterminationDetailPage } from '../pages/Determination/DeterminationDetailPage';
import { ExceptionsPage } from '../pages/Exceptions/ExceptionsPage';
import { CentralConfigPage } from '../pages/Configuration/CentralConfigPage';
import { ReportsPage } from '../pages/Reports/ReportsPage';

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
        path: 'taxpayers',
        element: (
          <ProtectedRoute
            roles={[UserRole.MUNICIPAL_ADMIN, UserRole.TREASURY_OPERATOR]}
          >
            <TaxpayersListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'taxpayers/new',
        element: (
          <ProtectedRoute
            roles={[UserRole.MUNICIPAL_ADMIN, UserRole.TREASURY_OPERATOR]}
          >
            <CreateTaxpayerPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'configuration',
        element: (
          <ProtectedRoute roles={[UserRole.MUNICIPAL_ADMIN]}>
            <ConfigurationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'determinations',
        element: (
          <ProtectedRoute
            roles={[UserRole.MUNICIPAL_ADMIN, UserRole.TREASURY_OPERATOR, UserRole.VALIDADOR_TECNICO]}
          >
            <DeterminationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'determinations/:id',
        element: (
          <ProtectedRoute
            roles={[UserRole.MUNICIPAL_ADMIN, UserRole.TREASURY_OPERATOR, UserRole.VALIDADOR_TECNICO]}
          >
            <DeterminationDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exceptions',
        element: (
          <ProtectedRoute
            roles={[UserRole.MUNICIPAL_ADMIN, UserRole.VALIDADOR_TECNICO]}
          >
            <ExceptionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute
            roles={[
              UserRole.MUNICIPAL_ADMIN,
              UserRole.TREASURY_OPERATOR,
              UserRole.LEGAL_ANALYST,
              UserRole.COMPTROLLER_AUDITOR,
              UserRole.VALIDADOR_TECNICO,
            ]}
          >
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'central-config',
        element: (
          <ProtectedRoute roles={[UserRole.SYSTEM_ADMIN]}>
            <CentralConfigPage />
          </ProtectedRoute>
        ),
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
              UserRole.VALIDADOR_TECNICO,
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
