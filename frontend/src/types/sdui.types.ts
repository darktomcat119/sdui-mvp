// SCIAN Catalog
export interface ScianCode {
  id: string;
  codigoScian: string;
  descripcionScian: string;
  impactoSdui: 'bajo' | 'medio' | 'alto';
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MunicipalityScian {
  id: string;
  municipalityId: string;
  scianId: string;
  activo: boolean;
  scian: ScianCode;
}

// Zone Catalog
export interface ZoneCatalog {
  id: string;
  codigoZona: string;
  nombreZona: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MunicipalityZone {
  id: string;
  municipalityId: string;
  zoneId: string;
  nivelDemanda: 'baja' | 'media' | 'alta';
  multiplicador: number;
  vigenciaDesde: string;
  vigenciaHasta: string | null;
  justificacion: string | null;
  zone: ZoneCatalog;
}

// Weight Configuration
export interface WeightConfiguration {
  id: string;
  municipalityId: string;
  pSuperficie: number;
  pZona: number;
  pGiro: number;
  pTipo: number;
  limiteVariacionPct: number;
  ejercicioFiscal: number;
  vigenciaDesde: string;
  vigenciaHasta: string | null;
  justificacion: string | null;
  folioActa: string | null;
  createdAt: string;
  updatedAt: string;
}

// Taxpayer
export interface Taxpayer {
  id: string;
  municipalityId: string;
  razonSocial: string;
  tipoPersonalidad: 'fisica' | 'moral';
  rfc: string | null;
  curp: string | null;
  tipoTramite: 'apertura' | 'renovacion';
  numeroLicencia: string | null;
  claveCatastral: string | null;
  usoSuelo: string | null;
  actividadRegulada: string | null;
  scianId: string;
  zoneId: string;
  tipoContribuyente: 'independiente' | 'franquicia' | 'cadena';
  superficieM2: number;
  cuotaVigente: number;
  estatus: 'activo' | 'inactivo' | 'suspendido';
  scian: ScianCode;
  zone: ZoneCatalog;
  createdAt: string;
  updatedAt: string;
}

export interface TaxpayerStats {
  total: number;
  byTipo: { tipo: string; count: string }[];
  byEstatus: { estatus: string; count: string }[];
  surfaceStats: { min: number; max: number; avg: number };
}

export interface BulkUploadResult {
  total: number;
  created: number;
  errors: { row: number; field: string; message: string }[];
}

// Determination
export interface Determination {
  id: string;
  municipalityId: string;
  taxpayerId: string;
  weightConfigId: string;
  ejercicioFiscal: number;
  vSuperficie: number;
  vZona: number;
  vGiro: number;
  vTipo: number;
  pSuperficie: number;
  pZona: number;
  pGiro: number;
  pTipo: number;
  itd: number;
  clasificacion: 'protegido' | 'moderado' | 'proporcional';
  cuotaVigente: number;
  cuotaBaseLegal: number | null;
  cuotaSdui: number;
  variacionPct: number;
  limitePctAplicado: number;
  estatus: 'calculada' | 'aprobada' | 'bloqueada' | 'excepcion_pendiente';
  fundamentoNormativo: string | null;
  configVersionId: string | null;
  taxpayer: Taxpayer;
  createdAt: string;
  updatedAt: string;
}

export interface DeterminationSummary {
  total: number;
  byClasificacion: { clasificacion: string; count: string }[];
  byEstatus: { estatus: string; count: string }[];
  promedioImpacto: number;
  impactoMaximo: number;
}

export interface LimitException {
  id: string;
  determinationId: string;
  municipalityId: string;
  valorPropuesto: number;
  limitePct: number;
  motivo: string;
  folio: string | null;
  resolutionOption: 'APROBAR' | 'RECHAZAR' | 'ESCALAR' | null;
  escalatedTo: string | null;
  justificacionResolucion: string | null;
  estatus: 'pendiente' | 'aprobada' | 'rechazada' | 'escalada';
  aprobadoPor: string | null;
  fechaResolucion: string | null;
  determination: Determination;
}

// Reports
export interface ExecutiveSummary {
  totalContribuyentes: number;
  totalDeterminaciones: number;
  byClasificacion: {
    protegido: number;
    moderado: number;
    proporcional: number;
  };
  promedioImpacto: number;
  impactoMaximo: number;
  limiteAplicado: number | null;
  ejercicioFiscal: number | null;
  distribucionGiros: { giro: string; count: number }[];
  distribucionZonas: { zona: string; count: number }[];
}

// Municipality
export interface Municipality {
  id: string;
  name: string;
  slug: string;
  state: string;
  officialName: string | null;
  timezone: string;
  status: string;
  cuotaBaseLegal: number | null;
  createdAt: string;
  updatedAt: string;
}

// Dashboard
export interface DashboardStats {
  totalTaxpayers: number;
  totalDeterminations: number;
  byClasificacion: { clasificacion: string; count: string }[];
  recentActivity: { action: string; timestamp: string; userName: string }[];
}
