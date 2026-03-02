import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { determinationsService } from '../../services/determinations.service';
import { useToast } from '../../contexts/ToastContext';
import { StatusBadge } from '../../components/ui/StatusBadge/StatusBadge';
import { Button } from '../../components/ui/Button/Button';
import { Icon } from '../../components/ui/Icon/Icon';
import type { Determination } from '../../types/sdui.types';

export function DeterminationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [determ, setDeterm] = useState<Determination | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await determinationsService.getById(id);
        setDeterm(res.data);
      } catch {
        addToast({ variant: 'error', message: t('detDetail.loadError') });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, addToast, t]);

  if (loading) {
    return <div className="text-medium-gray text-body p-xl text-center">{t('common.loading')}</div>;
  }

  if (!determ) {
    return (
      <div className="text-center p-3xl text-medium-gray text-body">
        {t('detDetail.notFound')}
      </div>
    );
  }

  const clasificacionColor = (c: string) => {
    if (c === 'protegido') return 'active';
    if (c === 'moderado') return 'warning';
    return 'error';
  };

  const estatusColor = (e: string) => {
    if (e === 'aprobada') return 'active';
    if (e === 'calculada') return 'info';
    if (e === 'bloqueada') return 'error';
    return 'warning';
  };

  // Calculate partial products
  const vS = Number(determ.vSuperficie);
  const vZ = Number(determ.vZona);
  const vG = Number(determ.vGiro);
  const vT = Number(determ.vTipo);
  const pS = Number(determ.pSuperficie);
  const pZ = Number(determ.pZona);
  const pG = Number(determ.pGiro);
  const pT = Number(determ.pTipo);
  const itd = Number(determ.itd);
  const cuotaBaseLegal = determ.cuotaBaseLegal != null ? Number(determ.cuotaBaseLegal) : null;
  const cuotaSdui = Number(determ.cuotaSdui);
  const variacion = Number(determ.variacionPct) * 100;

  // Calculate factor from ITD (continuous formula)
  const protThreshold = 0.33;
  let factor = 0;
  if (itd >= protThreshold) {
    factor = (itd - protThreshold) / (1 - protThreshold);
  }

  return (
    <div className="flex flex-col gap-[20px]">
      <Button variant="secondary" onClick={() => navigate('/determinations')} className="self-start">
        <Icon name="chevronLeft" size={16} />
        {t('detDetail.backToList')}
      </Button>

      {/* Taxpayer Info */}
      <div className="bg-white border border-border rounded-md p-xl">
        <h3 className="text-body font-semibold text-black m-0 mb-md">{t('detDetail.taxpayerInfo')}</h3>
        <div className="grid grid-cols-3 gap-md">
          <InfoItem label={t('detDetail.businessName')} value={determ.taxpayer?.razonSocial || '—'} />
          <InfoItem label={t('detDetail.zone')} value={determ.taxpayer?.zone?.nombreZona || '—'} />
          <InfoItem label={t('detDetail.giro')} value={determ.taxpayer?.scian?.descripcionScian || '—'} />
          <InfoItem label={t('detDetail.type')} value={determ.taxpayer?.tipoContribuyente || '—'} />
          <InfoItem label={t('detDetail.surface')} value={`${Number(determ.taxpayer?.superficieM2 || 0).toLocaleString()} m²`} />
          <InfoItem label={t('detDetail.fiscalYear')} value={determ.ejercicioFiscal.toString()} />
        </div>
      </div>

      {/* Status & Classification */}
      <div className="bg-white border border-border rounded-md p-xl">
        <h3 className="text-body font-semibold text-black m-0 mb-md">{t('detDetail.result')}</h3>
        <div className="flex items-center gap-lg mb-md">
          <div className="flex items-center gap-sm">
            <span className="text-small text-medium-gray">{t('detDetail.classification')}:</span>
            <StatusBadge status={clasificacionColor(determ.clasificacion) as any} label={determ.clasificacion} />
          </div>
          <div className="flex items-center gap-sm">
            <span className="text-small text-medium-gray">{t('detDetail.status')}:</span>
            <StatusBadge status={estatusColor(determ.estatus) as any} label={determ.estatus} />
          </div>
          <div className="flex items-center gap-sm">
            <span className="text-small text-medium-gray">ITD:</span>
            <span className="font-mono font-bold text-heading">{itd.toFixed(4)}</span>
          </div>
        </div>
      </div>

      {/* Calculation Breakdown */}
      <div className="bg-white border border-border rounded-md p-xl">
        <h3 className="text-body font-semibold text-black m-0 mb-md">{t('detDetail.breakdown')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-small border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-sm px-md text-medium-gray font-medium">{t('detDetail.variable')}</th>
                <th className="text-right py-sm px-md text-medium-gray font-medium">{t('detDetail.normalizedValue')}</th>
                <th className="text-right py-sm px-md text-medium-gray font-medium">{t('detDetail.weight')}</th>
                <th className="text-right py-sm px-md text-medium-gray font-medium">{t('detDetail.partial')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border-light">
                <td className="py-sm px-md">{t('config.surface')}</td>
                <td className="py-sm px-md text-right font-mono">{vS.toFixed(4)}</td>
                <td className="py-sm px-md text-right font-mono">{(pS * 100).toFixed(0)}%</td>
                <td className="py-sm px-md text-right font-mono font-semibold">{(vS * pS).toFixed(4)}</td>
              </tr>
              <tr className="border-b border-border-light">
                <td className="py-sm px-md">{t('config.zone')}</td>
                <td className="py-sm px-md text-right font-mono">{vZ.toFixed(4)}</td>
                <td className="py-sm px-md text-right font-mono">{(pZ * 100).toFixed(0)}%</td>
                <td className="py-sm px-md text-right font-mono font-semibold">{(vZ * pZ).toFixed(4)}</td>
              </tr>
              <tr className="border-b border-border-light">
                <td className="py-sm px-md">{t('config.giro')}</td>
                <td className="py-sm px-md text-right font-mono">{vG.toFixed(4)}</td>
                <td className="py-sm px-md text-right font-mono">{(pG * 100).toFixed(0)}%</td>
                <td className="py-sm px-md text-right font-mono font-semibold">{(vG * pG).toFixed(4)}</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-sm px-md">{t('config.type')}</td>
                <td className="py-sm px-md text-right font-mono">{vT.toFixed(4)}</td>
                <td className="py-sm px-md text-right font-mono">{(pT * 100).toFixed(0)}%</td>
                <td className="py-sm px-md text-right font-mono font-semibold">{(vT * pT).toFixed(4)}</td>
              </tr>
              <tr className="bg-surface">
                <td className="py-sm px-md font-semibold" colSpan={3}>ITD = Σ(V × P)</td>
                <td className="py-sm px-md text-right font-mono font-bold text-action-blue">{itd.toFixed(4)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Fee Calculation */}
      <div className="bg-white border border-border rounded-md p-xl">
        <h3 className="text-body font-semibold text-black m-0 mb-md">{t('detDetail.feeCalculation')}</h3>
        <div className="grid grid-cols-2 gap-lg">
          <div className="flex flex-col gap-sm">
            <InfoItem label={t('detDetail.cuotaBaseLegal')} value={cuotaBaseLegal != null ? `$${cuotaBaseLegal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—'} />
            <InfoItem label={t('detDetail.factor')} value={factor.toFixed(4)} />
            <InfoItem label={t('detDetail.formula')} value={itd < protThreshold ? `${t('detDetail.formulaProtected')}` : `base × (1 + ${factor.toFixed(4)})`} />
          </div>
          <div className="flex flex-col gap-sm">
            <InfoItem label={t('detDetail.cuotaSdui')} value={`$${cuotaSdui.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`} highlight />
            <InfoItem label={t('detDetail.cuotaVigente')} value={`$${Number(determ.cuotaVigente).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`} />
            <InfoItem label={t('detDetail.variation')} value={`${variacion > 0 ? '+' : ''}${variacion.toFixed(2)}%`} />
            <InfoItem label={t('detDetail.limitApplied')} value={`${(Number(determ.limitePctAplicado) * 100).toFixed(0)}%`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <span className="text-caption text-medium-gray">{label}</span>
      <p className={`text-body m-0 mt-[2px] font-mono ${highlight ? 'font-bold text-action-blue text-heading' : 'text-dark-gray'}`}>
        {value}
      </p>
    </div>
  );
}
