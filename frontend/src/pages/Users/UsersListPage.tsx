import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usersService } from '../../services/users.service';
import { useToast } from '../../contexts/ToastContext';
import type { User } from '../../types/auth.types';
import { getAvatarUrl } from '../../config/environment';
import { Table } from '../../components/ui/Table/Table';
import { StatusBadge } from '../../components/ui/StatusBadge/StatusBadge';
import { Button } from '../../components/ui/Button/Button';
import { Icon } from '../../components/ui/Icon/Icon';
import { Avatar } from '../../components/ui/Avatar/Avatar';

export function UsersListPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { addToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadUsers = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await usersService.list(page, 20);
        if (!cancelled) {
          setUsers(response.data);
          setTotalPages(response.meta.totalPages);
          setTotal(response.meta.total);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading users:', err);
          setError(true);
          addToast({ variant: 'error', message: t('users.loadError') });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadUsers();
    return () => { cancelled = true; };
  }, [page, retryCount]);

  const dateLocale = i18n.language === 'en' ? 'en-US' : 'es-MX';

  const columns = [
    {
      key: 'name',
      label: t('users.colName'),
      render: (user: User) => (
        <div className="flex items-center gap-md">
          <Avatar
            src={getAvatarUrl(user.avatarFilename)}
            initials={`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`}
            size="md"
          />
          <span>{user.firstName} {user.lastName}</span>
        </div>
      ),
    },
    { key: 'email', label: t('users.colEmail') },
    {
      key: 'role',
      label: t('users.colRole'),
      render: (user: User) => t(`role.${user.role}`),
    },
    {
      key: 'status',
      label: t('users.colStatus'),
      render: (user: User) => (
        <StatusBadge status={user.status as any || 'active'} />
      ),
    },
    {
      key: 'lastLoginAt',
      label: t('users.colLastAccess'),
      render: (user: User) =>
        user.lastLoginAt
          ? new Date(user.lastLoginAt).toLocaleDateString(dateLocale)
          : '—',
    },
  ];

  if (loading && users.length === 0) {
    return <div className="text-medium-gray text-body p-3xl text-center">{t('users.loadingUsers')}</div>;
  }

  if (error && users.length === 0) {
    return (
      <div className="flex flex-col items-center gap-md p-3xl text-center">
        <span className="text-body text-medium-gray">{t('users.loadError')}</span>
        <Button variant="secondary" onClick={() => setRetryCount((c) => c + 1)}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-lg">
          <span className="text-small text-medium-gray">{t('users.count', { count: total })}</span>
        </div>
        <Button variant="primary" onClick={() => navigate('/users/new')}>
          <Icon name="plus" size={18} />
          {t('users.newUser')}
        </Button>
      </div>

      <Table columns={columns} data={users} rowKey={(user) => user.id} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-sm">
          <button
            className="inline-flex items-center gap-xs py-sm px-lg border border-border rounded-sm bg-white cursor-pointer font-primary text-small text-dark-gray transition-all duration-150 ease-in-out hover:bg-surface-hover hover:text-action-blue hover:border-action-blue disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <Icon name="chevronLeft" size={16} />
            {t('common.previous')}
          </button>
          <span className="px-md text-small text-medium-gray">
            {t('common.pageOf', { page, total: totalPages })}
          </span>
          <button
            className="inline-flex items-center gap-xs py-sm px-lg border border-border rounded-sm bg-white cursor-pointer font-primary text-small text-dark-gray transition-all duration-150 ease-in-out hover:bg-surface-hover hover:text-action-blue hover:border-action-blue disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            {t('common.next')}
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
