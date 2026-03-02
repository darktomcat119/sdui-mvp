import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { municipalitiesService } from '../../../services/municipalities.service';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import type { Municipality } from '../../../types/sdui.types';

export function MunicipalityTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [municipality, setMunicipality] = useState<Municipality | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cuotaBaseLegal, setCuotaBaseLegal] = useState('');

  useEffect(() => {
    if (user?.municipalityId) {
      loadMunicipality(user.municipalityId);
    } else {
      setLoading(false);
    }
  }, [user?.municipalityId]);

  const loadMunicipality = async (id: string) => {
    setLoading(true);
    try {
      const response = await municipalitiesService.getById(id);
      setMunicipality(response.data);
      setCuotaBaseLegal(response.data.cuotaBaseLegal?.toString() || '');
    } catch {
      addToast({ variant: 'error', message: t('config.municipalityLoadError') });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!municipality) return;
    const value = parseFloat(cuotaBaseLegal);
    if (isNaN(value) || value < 0) {
      addToast({ variant: 'error', message: t('config.cuotaBaseLegalInvalid') });
      return;
    }

    setSaving(true);
    try {
      const response = await municipalitiesService.update(municipality.id, {
        cuotaBaseLegal: value,
      });
      setMunicipality(response.data);
      addToast({ variant: 'success', message: t('config.municipalitySaved') });
    } catch {
      addToast({ variant: 'error', message: t('config.municipalityError') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-medium-gray text-body p-xl text-center">{t('common.loading')}</div>;
  }

  if (!user?.municipalityId) {
    return (
      <div className="text-center p-3xl text-medium-gray text-body">
        {t('config.noMunicipality')}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      <div className="bg-white border border-border rounded-md p-xl">
        <h3 className="text-body font-semibold text-black m-0 mb-lg">
          {t('config.generalSettings')}
        </h3>

        {municipality && (
          <div className="flex flex-col gap-md">
            <div className="grid grid-cols-2 gap-md">
              <div>
                <span className="text-small text-medium-gray">{t('config.municipalityName')}</span>
                <p className="text-body font-medium text-black mt-xs mb-0">{municipality.name}</p>
              </div>
              <div>
                <span className="text-small text-medium-gray">{t('config.municipalityState')}</span>
                <p className="text-body font-medium text-black mt-xs mb-0">{municipality.state}</p>
              </div>
            </div>

            <div className="border-t border-border-light pt-lg">
              <h4 className="text-small font-semibold text-dark-gray m-0 mb-sm">
                {t('config.cuotaBaseLegalTitle')}
              </h4>
              <p className="text-small text-medium-gray mb-md">
                {t('config.cuotaBaseLegalDesc')}
              </p>
              <div className="flex items-end gap-md">
                <div className="w-64">
                  <Input
                    label={t('config.cuotaBaseLegalLabel')}
                    type="number"
                    value={cuotaBaseLegal}
                    onChange={(e) => setCuotaBaseLegal(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={saving || !cuotaBaseLegal}
                >
                  {saving ? t('common.saving') : t('common.save')}
                </Button>
              </div>
              {municipality.cuotaBaseLegal != null && (
                <p className="text-caption text-medium-gray mt-sm">
                  {t('config.currentValue')}: ${Number(municipality.cuotaBaseLegal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
