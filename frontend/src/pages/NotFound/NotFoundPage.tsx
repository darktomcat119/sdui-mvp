import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button/Button';

export function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="p-3xl text-center">
      <h1>404</h1>
      <p className="my-lg text-medium-gray">
        {t('notFound.message')}
      </p>
      <Button variant="primary" onClick={() => navigate('/dashboard')}>
        {t('notFound.backToDashboard')}
      </Button>
    </div>
  );
}
