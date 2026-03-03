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

    // Use aggregate queries instead of loading all records into memory
    const totalContribuyentes = await this.taxpayerRepo.count({
      where: { municipalityId, estatus: 'activo' },
    });

    const totalDeterminaciones = await this.determRepo.count({
      where: { municipalityId },
    });

    // Classification counts
    const byClasificacionRaw = await this.determRepo
      .createQueryBuilder('d')
      .select('d.clasificacion', 'clasificacion')
      .addSelect('COUNT(*)::int', 'count')
      .where('d.municipalityId = :municipalityId', { municipalityId })
      .groupBy('d.clasificacion')
      .getRawMany();

    const byClasificacion: Record<string, number> = {
      protegido: 0,
      moderado: 0,
      proporcional: 0,
    };
    for (const row of byClasificacionRaw) {
      byClasificacion[row.clasificacion] = row.count;
    }

    // Aggregate stats
    const stats = await this.determRepo
      .createQueryBuilder('d')
      .select('AVG(d.variacionPct)', 'avg')
      .addSelect('MAX(d.variacionPct)', 'max')
      .where('d.municipalityId = :municipalityId', { municipalityId })
      .getRawOne();

    const promedioImpacto = parseFloat(stats?.avg) || 0;
    const impactoMaximo = parseFloat(stats?.max) || 0;

    // Get current weight config for limit info
    const weightConfig = await this.weightRepo.findOne({
      where: { municipalityId },
      order: { ejercicioFiscal: 'DESC' },
    });

    // Distribution by SCIAN (top 10, via aggregate query)
    const distribucionGiros = await this.determRepo
      .createQueryBuilder('d')
      .innerJoin('d.taxpayer', 't')
      .innerJoin('t.scian', 's')
      .select('s.descripcionScian', 'giro')
      .addSelect('COUNT(*)::int', 'count')
      .where('d.municipalityId = :municipalityId', { municipalityId })
      .groupBy('s.descripcionScian')
      .orderBy('"count"', 'DESC')
      .limit(10)
      .getRawMany();

    // Distribution by zone (via aggregate query)
    const distribucionZonas = await this.determRepo
      .createQueryBuilder('d')
      .innerJoin('d.taxpayer', 't')
      .innerJoin('t.zone', 'z')
      .select('z.nombreZona', 'zona')
      .addSelect('COUNT(*)::int', 'count')
      .where('d.municipalityId = :municipalityId', { municipalityId })
      .groupBy('z.nombreZona')
      .orderBy('"count"', 'DESC')
      .getRawMany();

    return {
      totalContribuyentes,
      totalDeterminaciones,
      byClasificacion,
      promedioImpacto: Math.round(promedioImpacto * 10000) / 10000,
      impactoMaximo: Math.round(impactoMaximo * 10000) / 10000,
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

    const escapeCsv = (val: unknown): string => {
      const str = String(val ?? '');
      if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = determinations.map((d) => [
      escapeCsv(d.taxpayer?.razonSocial),
      escapeCsv(d.taxpayer?.rfc),
      escapeCsv(d.taxpayer?.scian?.codigoScian),
      escapeCsv(d.taxpayer?.scian?.descripcionScian),
      escapeCsv(d.taxpayer?.zone?.nombreZona),
      escapeCsv(d.taxpayer?.tipoContribuyente),
      d.taxpayer?.superficieM2 || '',
      d.cuotaVigente,
      d.itd,
      escapeCsv(d.clasificacion),
      d.cuotaSdui,
      (Number(d.variacionPct) * 100).toFixed(2) + '%',
      escapeCsv(d.estatus),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
