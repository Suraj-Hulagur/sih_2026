import type { 
  StatMetric, 
  DonutSegment, 
  LSRRuleData, 
  ReportTypeData, 
  SiteDensityItem, 
  ActivityRiskItem, 
  RecurringPatternItem, 
  RecentReportItem, 
  TrendDataPoint 
} from '../types';

export const INITIAL_STATS: StatMetric[] = [
  {
    title: "Total Reports",
    count: "12,482",
    changePct: 18,
    changeTrend: "up",
    changeLabel: "vs previous period",
    type: "total"
  },
  {
    title: "SIF-Potential Reports",
    count: "2,781",
    subText: "(22%)",
    changePct: 12,
    changeTrend: "up",
    changeLabel: "vs previous period",
    type: "sif"
  },
  {
    title: "Non-SIF Reports",
    count: "9,701",
    subText: "(78%)",
    changePct: 8,
    changeTrend: "down",
    changeLabel: "vs previous period",
    type: "non-sif"
  },
  {
    title: "Recurring Precursor Patterns",
    count: "47",
    changePct: 27,
    changeTrend: "up",
    changeLabel: "vs previous period",
    type: "patterns"
  }
];

export const CLASSIFICATION_DATA: DonutSegment[] = [
  { name: "SIF-Potential", value: 2781, pct: 22, color: "#ea384c" },
  { name: "Non-SIF", value: 9701, pct: 78, color: "#7cb5f9" }
];

export const LSR_BAR_DATA: LSRRuleData[] = [
  { rule: "Energy Isolation", count: 460, color: "#ea384c", iconName: "lock" },
  { rule: "Line of Fire", count: 390, color: "#f97316", iconName: "lineoffire" },
  { rule: "Confined Space", count: 340, color: "#eab308", iconName: "confined" },
  { rule: "Hot Work", count: 310, color: "#0284c7", iconName: "hotwork" },
  { rule: "Work at Height", count: 280, color: "#0d9488", iconName: "height" },
  { rule: "Driving", count: 210, color: "#0891b2", iconName: "driving" },
  { rule: "Other", count: 190, color: "#94a3b8", iconName: "other" }
];

export const REPORT_TYPE_DATA: ReportTypeData[] = [
  { name: "UA Observations", count: 5620, pct: 45, color: "#1e3a8a" },
  { name: "UC Observations", count: 3140, pct: 25, color: "#2563eb" },
  { name: "Near Miss", count: 2480, pct: 20, color: "#60a5fa" },
  { name: "Incident", count: 1242, pct: 10, color: "#bfdbfe" }
];

export const TOP_SITES_DATA: SiteDensityItem[] = [
  { rank: 1, site: "Duliajan", totalReports: 2180, sifReports: 612, density: 28.1 },
  { rank: 2, site: "Naharkatiya", totalReports: 1540, sifReports: 420, density: 27.3 },
  { rank: 3, site: "Moran", totalReports: 1230, sifReports: 310, density: 25.2 },
  { rank: 4, site: "Digboi", totalReports: 980, sifReports: 210, density: 21.4 },
  { rank: 5, site: "Baghjan", totalReports: 860, sifReports: 160, density: 18.6 }
];

export const TOP_ACTIVITIES_DATA: ActivityRiskItem[] = [
  { rank: 1, activity: "Maintenance", sifReports: 620, maxSif: 650 },
  { rank: 2, activity: "Operation", sifReports: 480, maxSif: 650 },
  { rank: 3, activity: "Construction", sifReports: 320, maxSif: 650 },
  { rank: 4, activity: "Inspection", sifReports: 210, maxSif: 650 },
  { rank: 5, activity: "Material Handling", sifReports: 180, maxSif: 650 }
];

export const RECURRING_PATTERNS_DATA: RecurringPatternItem[] = [
  { rank: 1, pattern: "Bypassing isolation / LOTO", count: 182, trend: "up" },
  { rank: 2, pattern: "Working in Line of Fire", count: 160, trend: "up" },
  { rank: 3, pattern: "Inadequate gas testing (Confined Space)", count: 142, trend: "up" },
  { rank: 4, pattern: "Working at height without fall protection", count: 118, trend: "up" },
  { rank: 5, pattern: "Permit to Work violations", count: 104, trend: "up" }
];

export const RECENT_REPORTS_DATA: RecentReportItem[] = [
  {
    id: "rep-001",
    date: "12 Jun 2024",
    excerpt: "Worker opened a high-pressure line for maintenance without isolation.",
    site: "Duliajan",
    activity: "Maintenance",
    rule: "Energy Isolation",
    ruleIcon: "lock",
    classification: "SIF-Potential"
  },
  {
    id: "rep-002",
    date: "10 Jun 2024",
    excerpt: "Welding carried out near a tank without fire watch.",
    site: "Naharkatiya",
    activity: "Hot Work",
    rule: "Hot Work",
    ruleIcon: "hotwork",
    classification: "SIF-Potential"
  },
  {
    id: "rep-003",
    date: "08 Jun 2024",
    excerpt: "Worker entered confined space without gas testing.",
    site: "Moran",
    activity: "Tank Cleaning",
    rule: "Confined Space",
    ruleIcon: "confined",
    classification: "SIF-Potential"
  },
  {
    id: "rep-004",
    date: "05 Jun 2024",
    excerpt: "Person standing under suspended load during lifting.",
    site: "Digboi",
    activity: "Lifting",
    rule: "Line of Fire",
    ruleIcon: "lineoffire",
    classification: "SIF-Potential"
  },
  {
    id: "rep-005",
    date: "03 Jun 2024",
    excerpt: "Vehicle speeding inside plant area.",
    site: "Duliajan",
    activity: "Driving",
    rule: "Driving",
    ruleIcon: "driving",
    classification: "Non-SIF"
  }
];

export const TREND_DATA: TrendDataPoint[] = [
  { month: "Jan", sif: 310, nonSif: 680 },
  { month: "Feb", sif: 330, nonSif: 710 },
  { month: "Mar", sif: 350, nonSif: 790 },
  { month: "Apr", sif: 420, nonSif: 720 },
  { month: "May", sif: 460, nonSif: 820 },
  { month: "Jun", sif: 510, nonSif: 880 }
];
