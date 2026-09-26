export interface StatMetric {
  title: string;
  count: string | number;
  subText?: string;
  changePct: number;
  changeTrend: 'up' | 'down';
  changeLabel?: string;
  type: 'total' | 'sif' | 'non-sif' | 'patterns';
}

export interface DonutSegment {
  name: string;
  value: number;
  pct: number;
  color: string;
}

export interface LSRRuleData {
  rule: string;
  count: number;
  color: string;
  iconName: 'lock' | 'lineoffire' | 'confined' | 'hotwork' | 'height' | 'driving' | 'other';
}

export interface ReportTypeData {
  name: string;
  count: number;
  pct: number;
  color: string;
}

export interface SiteDensityItem {
  rank: number;
  site: string;
  totalReports: number;
  sifReports: number;
  density: number; // e.g. 28.1 per 100 reports
}

export interface ActivityRiskItem {
  rank: number;
  activity: string;
  sifReports: number;
  maxSif?: number;
}

export interface RecurringPatternItem {
  rank: number;
  pattern: string;
  count: number;
  trend: 'up' | 'down';
}

export interface RecentReportItem {
  id: string;
  date: string;
  excerpt: string;
  site: string;
  activity: string;
  rule: string;
  ruleIcon: 'lock' | 'hotwork' | 'confined' | 'lineoffire' | 'driving' | 'height';
  classification: 'SIF-Potential' | 'Non-SIF';
}

export interface TrendDataPoint {
  month: string;
  sif: number;
  nonSif: number;
}

export interface UploadedFileSummary {
  name: string;
  size: string;
  type: 'csv' | 'xlsx' | 'pdf';
  recordCount?: number;
  sifCount?: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
}
