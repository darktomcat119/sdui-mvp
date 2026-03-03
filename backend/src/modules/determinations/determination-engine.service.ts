import { Injectable } from '@nestjs/common';
import { Taxpayer } from '../taxpayers/entities/taxpayer.entity';
import { WeightConfiguration } from '../weights/entities/weight-configuration.entity';

// Fixed mappings (not editable per spec)
const IMPACT_MAP: Record<string, number> = {
  bajo: 0.4,
  medio: 0.6,
  alto: 0.9,
};

const TAXPAYER_TYPE_MAP: Record<string, number> = {
  independiente: 0.5,
  franquicia: 0.7,
  cadena: 0.85,
};

// Zone normalization constants
const ZONE_MULT_MIN = 0.6;
const ZONE_MULT_MAX = 1.5;

// Classification thresholds (central defaults)
const DEFAULT_PROTEGIDO_THRESHOLD = 0.33;
const DEFAULT_PROPORCIONAL_THRESHOLD = 0.66;

export interface ITDResult {
  vSuperficie: number;
  vZona: number;
  vGiro: number;
  vTipo: number;
  itd: number;
  clasificacion: string;
  cuotaBaseLegal: number;
  cuotaSdui: number;
  variacionPct: number;
}

export interface SurfaceContext {
  minM2: number;
  maxM2: number;
}

export interface CalculationThresholds {
  protegido: number;
  proporcional: number;
}

export interface ZoneNormBounds {
  min: number;
  max: number;
}

@Injectable()
export class DeterminationEngineService {
  /**
   * Calculate the ITD (Índice de Determinación Técnica) for a single taxpayer.
   *
   * Formula: ITD = (V_sup × P_sup) + (V_zona × P_zona) + (V_giro × P_giro) + (V_tipo × P_tipo)
   *
   * Fee Formula (continuous linear model per spec):
   *   If ITD < 0.33: cuota_final = cuota_base_legal (no change)
   *   If ITD >= 0.33: factor = (ITD - 0.33) / 0.67
   *                   cuota_final = cuota_base_legal × (1 + factor)
   *   Max = 2× cuota_base_legal when ITD = 1.0
   */
  calculate(
    taxpayer: Taxpayer,
    weightConfig: WeightConfiguration,
    surfaceContext: SurfaceContext,
    multiplicadorZona: number,
    cuotaBaseLegal: number,
    thresholds?: CalculationThresholds,
    zoneNormBounds?: ZoneNormBounds,
  ): ITDResult {
    const protegidoThreshold = thresholds?.protegido ?? DEFAULT_PROTEGIDO_THRESHOLD;

    // 1. Normalize surface
    const vSuperficie = this.normalizeSurface(
      Number(taxpayer.superficieM2),
      surfaceContext.minM2,
      surfaceContext.maxM2,
    );

    // 2. Normalize zone (use central config bounds if provided)
    const zMin = zoneNormBounds?.min ?? ZONE_MULT_MIN;
    const zMax = zoneNormBounds?.max ?? ZONE_MULT_MAX;
    const vZona = this.normalizeZone(multiplicadorZona, zMin, zMax);

    // 3. Map SCIAN impact
    const vGiro = IMPACT_MAP[taxpayer.scian?.impactoSdui] ?? 0.4;

    // 4. Map taxpayer type
    const vTipo = TAXPAYER_TYPE_MAP[taxpayer.tipoContribuyente] ?? 0.5;

    // 5. Calculate ITD
    const pSup = Number(weightConfig.pSuperficie);
    const pZona = Number(weightConfig.pZona);
    const pGiro = Number(weightConfig.pGiro);
    const pTipo = Number(weightConfig.pTipo);

    const itd =
      vSuperficie * pSup + vZona * pZona + vGiro * pGiro + vTipo * pTipo;

    // 6. Classify (labels for reporting only — does not affect formula)
    const clasificacion = this.classify(itd, thresholds);

    // 7. Calculate fee using continuous formula
    const cuotaSdui = this.calculateCuota(cuotaBaseLegal, itd, protegidoThreshold);

    // 8. Calculate variation percentage (against cuota_base_legal)
    const variacionPct =
      cuotaBaseLegal > 0 ? (cuotaSdui - cuotaBaseLegal) / cuotaBaseLegal : 0;

    return {
      vSuperficie: this.round4(vSuperficie),
      vZona: this.round4(vZona),
      vGiro: this.round4(vGiro),
      vTipo: this.round4(vTipo),
      itd: this.round4(itd),
      clasificacion,
      cuotaBaseLegal: this.round2(cuotaBaseLegal),
      cuotaSdui: this.round2(cuotaSdui),
      variacionPct: this.round4(variacionPct),
    };
  }

  private normalizeSurface(m2: number, min: number, max: number): number {
    if (max === min) return 0.5;
    const v = (m2 - min) / (max - min);
    return Math.max(0, Math.min(1, v));
  }

  private normalizeZone(
    multiplicador: number,
    min: number = ZONE_MULT_MIN,
    max: number = ZONE_MULT_MAX,
  ): number {
    const range = max - min;
    if (range <= 0) return 0.5;
    const v = (multiplicador - min) / range;
    return Math.max(0, Math.min(1, v));
  }

  private classify(itd: number, thresholds?: CalculationThresholds): string {
    const protegido = thresholds?.protegido ?? DEFAULT_PROTEGIDO_THRESHOLD;
    const proporcional = thresholds?.proporcional ?? DEFAULT_PROPORCIONAL_THRESHOLD;
    if (itd < protegido) return 'protegido';
    if (itd < proporcional) return 'moderado';
    return 'proporcional';
  }

  /**
   * Continuous linear fee formula per spec:
   *   If ITD < threshold: cuota_final = cuota_base_legal (no adjustment)
   *   If ITD >= threshold: factor = (ITD - threshold) / (1 - threshold)
   *                        cuota_final = cuota_base_legal × (1 + factor)
   *   Max = 2× cuota_base_legal when ITD = 1.0
   */
  private calculateCuota(
    cuotaBaseLegal: number,
    itd: number,
    protegidoThreshold: number,
  ): number {
    if (itd < protegidoThreshold) {
      return cuotaBaseLegal;
    }
    const divisor = 1 - protegidoThreshold;
    if (divisor <= 0) return cuotaBaseLegal;
    const factor = (itd - protegidoThreshold) / divisor;
    return cuotaBaseLegal * (1 + factor);
  }

  private round4(n: number): number {
    return Math.round(n * 10000) / 10000;
  }

  private round2(n: number): number {
    return Math.round(n * 100) / 100;
  }
}
