import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Determination } from '../determinations/entities/determination.entity';
import { Taxpayer } from '../taxpayers/entities/taxpayer.entity';
import { WeightConfiguration } from '../weights/entities/weight-configuration.entity';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Determination)
    private readonly determRepo: Repository<Determination>,
    @InjectRepository(Taxpayer)
    private readonly taxpayerRepo: Repository<Taxpayer>,
    @InjectRepository(WeightConfiguration)
    private readonly weightRepo: Repository<WeightConfiguration>,
  ) {}

  async getExecutiveSummary(currentUser: RequestUser): Promise<any> {
    const municipalityId = currentUser.municipalityId;
    if (!municipalityId) {
      throw new ForbiddenException('User must belong to a municipality');
    }

    const totalContribuyentes = await this.taxpayerRepo.count({
      where: { municipalityId, estatus: 'activo' },
    });

    const determinations = await this.determRepo.find({
      where: { municipalityId },
      relations: ['taxpayer', 'taxpayer.scian', 'taxpayer.zone'],
    });

    const byClasificacion = {
      protegido: 0,
      moderado: 0,
      proporcional: 0,
    };
    let totalVariacion = 0;
    let maxVariacion = 0;

    for (const d of determinations) {
      byClasificacion[d.clasificacion] =
        (byClasificacion[d.clasificacion] || 0) + 1;
      const v = Number(d.variacionPct);
      totalVariacion += v;
      if (v > maxVariacion) maxVariacion = v;
    }

    const promedioImpacto =
      determinations.length > 0
        ? totalVariacion / determinations.length
        : 0;

    // Get current weight config for limit info
    const weightConfig = await this.weightRepo.findOne({
      where: { municipalityId },
      order: { ejercicioFiscal: 'DESC' },
    });

    // Distribution by SCIAN
    const giroMap = new Map<string, number>();
    for (const d of determinations) {
      if (d.taxpayer?.scian) {
        const key = d.taxpayer.scian.descripcionScian;
        giroMap.set(key, (giroMap.get(key) || 0) + 1);
      }
    }
    const distribucionGiros = Array.from(giroMap.entries())
      .map(([giro, count]) => ({ giro, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Distribution by zone
    const zonaMap = new Map<string, number>();
    for (const d of determinations) {
      if (d.taxpayer?.zone) {
        const key = d.taxpayer.zone.nombreZona;
        zonaMap.set(key, (zonaMap.get(key) || 0) + 1);
      }
    }
    const distribucionZonas = Array.from(zonaMap.entries())
      .map(([zona, count]) => ({ zona, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalContribuyentes,
      totalDeterminaciones: determinations.length,
      byClasificacion,
      promedioImpacto: Math.round(promedioImpacto * 10000) / 10000,
      impactoMaximo: Math.round(maxVariacion * 10000) / 10000,
      limiteAplicado: weightConfig
        ? Number(weightConfig.limiteVariacionPct)
        : null,
      ejercicioFiscal: weightConfig?.ejercicioFiscal || null,
      distribucionGiros,
      distribucionZonas,
    };
  }

  async exportDeterminationsCsv(currentUser: RequestUser): Promise<string> {
    const municipalityId = currentUser.municipalityId;
    if (!municipalityId) {
      throw new ForbiddenException('User must belong to a municipality');
    }

    const determinations = await this.determRepo.find({
      where: { municipalityId },
      relations: ['taxpayer', 'taxpayer.scian', 'taxpayer.zone'],
      order: { itd: 'DESC' },
    });

    const headers = [
      'razon_social',
      'rfc',
      'codigo_scian',
      'descripcion_scian',
      'zona',
      'tipo_contribuyente',
      'superficie_m2',
      'cuota_vigente',
      'itd',
      'clasificacion',
      'cuota_sdui',
      'variacion_pct',
      'estatus',
    ];

    const rows = determinations.map((d) => [
      `"${d.taxpayer?.razonSocial || ''}"`,
      d.taxpayer?.rfc || '',
      d.taxpayer?.scian?.codigoScian || '',
      `"${d.taxpayer?.scian?.descripcionScian || ''}"`,
      `"${d.taxpayer?.zone?.nombreZona || ''}"`,
      d.taxpayer?.tipoContribuyente || '',
      d.taxpayer?.superficieM2 || '',
      d.cuotaVigente,
      d.itd,
      d.clasificacion,
      d.cuotaSdui,
      (Number(d.variacionPct) * 100).toFixed(2) + '%',
      d.estatus,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
