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
    return (
      <div className="flex items-center justify-center py-3xl">
        <Icon name="spinner" size={24} color="var(--color-medium-gray)" />
      </div>
    );
  }

  if (!determ) {
    return (
      <div className="bg-white border border-border rounded-lg p-3xl text-center">
        <p className="text-body text-dark-gray">{t('detDetail.notFound')}</p>
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

  const protThreshold = 0.33;
  let factor = 0;
  if (itd >= protThreshold) {
    factor = (itd - protThreshold) / (1 - protThreshold);
  }

  const itdColor = determ.clasificacion === 'protegido' ? '#2C7A3E'
    : determ.clasificacion === 'moderado' ? '#C47F17' : '#A82C2C';

  return (
    <div className="flex flex-col gap-lg">
      <Button variant="secondary" onClick={() => navigate('/determinations')} className="self-start">
        <Icon name="chevronLeft" size={16} />
        {t('detDetail.backToList')}
      </Button>

      {/* Top row: Taxpayer Info + Result */}
      <div className="grid grid-cols-[1fr_320px] gap-lg">
        {/* Taxpayer Info */}
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="px-xl py-md border-b border-border-light">
            <h3 className="text-body font-semibold text-black m-0">{t('detDetail.taxpayerInfo')}</h3>
          </div>
          <div className="p-xl">
            <div className="grid grid-cols-3 gap-x-xl gap-y-md">
              <InfoItem label={t('detDetail.businessName')} value={determ.taxpayer?.razonSocial || '—'} />
              <InfoItem label={t('detDetail.zone')} value={determ.taxpayer?.zone?.nombreZona || '—'} />
              <InfoItem label={t('detDetail.giro')} value={determ.taxpayer?.scian?.descripcionScian || '—'} />
              <InfoItem label={t('detDetail.type')} value={determ.taxpayer?.tipoContribuyente || '—'} />
              <InfoItem label={t('detDetail.surface')} value={`${Number(determ.taxpayer?.superficieM2 || 0).toLocaleString()} m²`} />
              <InfoItem label={t('detDetail.fiscalYear')} value={determ.ejercicioFiscal.toString()} />
            </div>
          </div>
        </div>

        {/* Result Card */}
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="px-xl py-md border-b border-border-light">
            <h3 className="text-body font-semibold text-black m-0">{t('detDetail.result')}</h3>
          </div>
          <div className="p-xl flex flex-col items-center text-center gap-md">
            {/* ITD Circle */}
            <div
              className="w-[80px] h-[80px] rounded-full flex items-center justify-center border-[3px]"
              style={{ borderColor: itdColor, color: itdColor }}
            >
              <span className="font-mono font-bold text-[18px]">{itd.toFixed(2)}</span>
            </div>
            <div className="flex gap-md">
              <StatusBadge status={clasificacionColor(determ.clasificacion) as any} label={determ.clasificacion} />
              <StatusBadge status={estatusColor(determ.estatus) as any} label={determ.estatus} />
            </div>
            <div className="text-[22px] font-bold font-mono text-action-blue">
              ${cuotaSdui.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-caption text-medium-gray">{t('detDetail.cuotaSdui')}</span>
          </div>
        </div>
      </div>

      {/* Calculation Breakdown */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-xl py-md border-b border-border-light">
          <h3 className="text-body font-semibold text-black m-0">{t('detDetail.breakdown')}</h3>
        </div>
        <div className="p-xl">
          <table className="w-full text-small border-collapse">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-sm px-md text-caption text-medium-gray font-semibold uppercase tracking-[0.5px]">{t('detDetail.variable')}</th>
                <th className="text-right py-sm px-md text-caption text-medium-gray font-semibold uppercase tracking-[0.5px]">{t('detDetail.normalizedValue')}</th>
                <th className="text-right py-sm px-md text-caption text-medium-gray font-semibold uppercase tracking-[0.5px]">{t('detDetail.weight')}</th>
                <th className="text-right py-sm px-md text-caption text-medium-gray font-semibold uppercase tracking-[0.5px]">{t('detDetail.partial')}</th>
              </tr>
            </thead>
            <tbody>
              <CalcRow label={t('config.surface')} v={vS} p={pS} />
              <CalcRow label={t('config.zone')} v={vZ} p={pZ} />
              <CalcRow label={t('config.giro')} v={vG} p={pG} />
              <CalcRow label={t('config.type')} v={vT} p={pT} />
              <tr className="bg-surface">
                <td className="py-md px-md font-semibold text-dark-gray" colSpan={3}>
                  ITD = Σ(V × P)
                </td>
                <td className="py-md px-md text-right font-mono font-bold text-action-blue text-body">
                  {itd.toFixed(4)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Fee Calculation */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-xl py-md border-b border-border-light">
          <h3 className="text-body font-semibold text-black m-0">{t('detDetail.feeCalculation')}</h3>
        </div>
        <div className="p-xl">
          <div className="grid grid-cols-4 gap-lg">
            <FeeItem
              label={t('detDetail.cuotaBaseLegal')}
              value={cuotaBaseLegal != null ? `$${cuotaBaseLegal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—'}
            />
            <FeeItem label={t('detDetail.factor')} value={factor.toFixed(4)} />
            <FeeItem
              label={t('detDetail.formula')}
              value={itd < protThreshold ? t('detDetail.formulaProtected') : `base × (1 + ${factor.toFixed(4)})`}
              mono={false}
            />
            <FeeItem
              label={t('detDetail.cuotaSdui')}
              value={`$${cuotaSdui.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
              accent
            />
          </div>

          <div className="border-t border-border-light mt-lg pt-lg">
            <div className="grid grid-cols-3 gap-lg">
              <FeeItem
                label={t('detDetail.cuotaVigente')}
                value={`$${Number(determ.cuotaVigente).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
              />
              <FeeItem
                label={t('detDetail.variation')}
                value={`${variacion > 0 ? '+' : ''}${variacion.toFixed(2)}%`}
                color={variacion > 0 ? '#A82C2C' : '#2C7A3E'}
              />
              <FeeItem
                label={t('detDetail.limitApplied')}
                value={`${(Number(determ.limitePctAplicado) * 100).toFixed(0)}%`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalcRow({ label, v, p }: { label: string; v: number; p: number }) {
  return (
    <tr className="border-b border-border-light">
      <td className="py-sm px-md text-dark-gray">{label}</td>
      <td className="py-sm px-md text-right font-mono">{v.toFixed(4)}</td>
      <td className="py-sm px-md text-right font-mono">{(p * 100).toFixed(0)}%</td>
      <td className="py-sm px-md text-right font-mono font-semibold text-institutional-blue">{(v * p).toFixed(4)}</td>
    </tr>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-caption text-medium-gray">{label}</span>
      <p className="text-body m-0 mt-[2px] text-dark-gray">{value}</p>
    </div>
  );
}

function FeeItem({
  label, value, accent, color, mono = true,
}: {
  label: string; value: string; accent?: boolean; color?: string; mono?: boolean;
}) {
  return (
    <div>
      <span className="text-caption text-medium-gray">{label}</span>
      <p
        className={`text-body m-0 mt-[2px] ${mono ? 'font-mono' : ''} ${accent ? 'font-bold text-action-blue text-[18px]' : 'text-dark-gray'}`}
        style={color ? { color } : undefined}
      >
        {value}
      </p>
    </div>
  );
}
