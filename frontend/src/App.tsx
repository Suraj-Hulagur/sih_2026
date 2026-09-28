import { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { StatCard } from './components/kpi/StatCard';
import { ClassificationDonut } from './components/charts/ClassificationDonut';
import { LSRBarChart } from './components/charts/LSRBarChart';
import { ReportTypeDonut } from './components/charts/ReportTypeDonut';
import { TopSitesTable } from './components/tables/TopSitesTable';
import { TopActivitiesTable } from './components/tables/TopActivitiesTable';
import { RecurringPatternsTable } from './components/tables/RecurringPatternsTable';
import { RecentReportsTable } from './components/tables/RecentReportsTable';
import { SIFTrendLine } from './components/charts/SIFTrendLine';
import { UploadModal } from './components/modals/UploadModal';
import { TestNarrativeModal } from './components/modals/TestNarrativeModal';

// Dedicated Sub-Pages
import { ReportsPage } from './pages/ReportsPage';
import { SIFAnalysisPage } from './pages/SIFAnalysisPage';
import { LifeSavingRulesPage } from './pages/LifeSavingRulesPage';
import { SitesLocationsPage } from './pages/SitesLocationsPage';
import { RecurringPatternsPage } from './pages/RecurringPatternsPage';
import { ExportPage } from './pages/ExportPage';

import {
  INITIAL_STATS,
  CLASSIFICATION_DATA,
  LSR_BAR_DATA,
  REPORT_TYPE_DATA,
  TOP_SITES_DATA,
  TOP_ACTIVITIES_DATA,
  RECURRING_PATTERNS_DATA,
  RECENT_REPORTS_DATA,
  TREND_DATA
} from './api/mockData';
import type { RecentReportItem, UploadedFileSummary } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSite, setSelectedSite] = useState('All Sites');
  const [selectedType, setSelectedType] = useState('All Report Types');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isTestReportOpen, setIsTestReportOpen] = useState(false);

  const [stats, setStats] = useState(INITIAL_STATS);
  const [recentReports, setRecentReports] = useState<RecentReportItem[]>(RECENT_REPORTS_DATA);
  const [classificationData, setClassificationData] = useState(CLASSIFICATION_DATA);
  const [lsrBarData, setLsrBarData] = useState(LSR_BAR_DATA);
  const [reportTypeData, setReportTypeData] = useState(REPORT_TYPE_DATA);
  const [topSitesData, setTopSitesData] = useState(TOP_SITES_DATA);
  const [topActivitiesData, setTopActivitiesData] = useState(TOP_ACTIVITIES_DATA);
  const [recurringPatternsData, setRecurringPatternsData] = useState(RECURRING_PATTERNS_DATA);
  const [trendData, setTrendData] = useState(TREND_DATA);
  const [totalCount, setTotalCount] = useState("12,482");

  // Define fetchData outside useEffect so we can call it on upload success
  const fetchDashboardData = async () => {
    try {
      const [statsRes, chartsRes, rankingsRes, reportsRes] = await Promise.all([
        fetch('https://sih-2026-o0pk.onrender.com/api/dashboard/stats'),
        fetch('https://sih-2026-o0pk.onrender.com/api/dashboard/charts'),
        fetch('https://sih-2026-o0pk.onrender.com/api/dashboard/rankings'),
        fetch('https://sih-2026-o0pk.onrender.com/api/reports?limit=5')
      ]);
        
        const statsData = await statsRes.json();
        const chartsData = await chartsRes.json();
        const rankingsData = await rankingsRes.json();
        const reportsData = await reportsRes.json();

        // Update stats
        setTotalCount(statsData.total_reports.count.toString());
        setStats([
          {
            title: "Total Reports",
            count: statsData.total_reports.count,
            changePct: statsData.total_reports.change_pct,
            changeTrend: statsData.total_reports.change_trend,
            changeLabel: statsData.total_reports.change_label,
            type: "total"
          },
          {
            title: "SIF-Potential Reports",
            count: statsData.sif_potential.count,
            subText: `(${statsData.sif_potential.pct}%)`,
            changePct: statsData.sif_potential.change_pct,
            changeTrend: statsData.sif_potential.change_trend,
            changeLabel: statsData.sif_potential.change_label,
            type: "sif"
          },
          {
            title: "Non-SIF Reports",
            count: statsData.non_sif.count,
            subText: `(${statsData.non_sif.pct}%)`,
            changePct: statsData.non_sif.change_pct,
            changeTrend: statsData.non_sif.change_trend,
            changeLabel: statsData.non_sif.change_label,
            type: "non-sif"
          },
          {
            title: "Recurring Precursor Patterns",
            count: statsData.recurring_precursor_patterns.count,
            changePct: statsData.recurring_precursor_patterns.change_pct,
            changeTrend: statsData.recurring_precursor_patterns.change_trend,
            changeLabel: statsData.recurring_precursor_patterns.change_label,
            type: "patterns"
          }
        ]);

        // Update charts
        setClassificationData(chartsData.classification);
        setLsrBarData(chartsData.by_iogp_rule);
        setReportTypeData(chartsData.by_report_type);
        setTrendData(chartsData.monthly_trend);

        // Update rankings
        setTopSitesData(rankingsData.top_sites);
        setTopActivitiesData(rankingsData.top_activities);
        setRecurringPatternsData(rankingsData.recurring_patterns);

        // Update recent reports
        setRecentReports(reportsData.reports.map((r: any) => ({
          id: r.id,
          date: r.date,
          excerpt: r.excerpt,
          site: r.site,
          activity: r.activity,
          rule: r.rule,
          ruleIcon: r.rule_icon,
          classification: r.classification
        })));

      } catch (err) {
        console.error("Failed to fetch from backend API:", err);
      }
  };

  // Fetch real data from backend on initial mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filter handlers
  const handleSiteChange = (site: string) => {
    setSelectedSite(site);
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
  };

  // Add a newly analyzed report to the recent feed
  const handleAddLiveReport = (newReport: RecentReportItem) => {
    setRecentReports(prev => [newReport, ...prev.slice(0, 4)]);
  };

  // When a batch file is uploaded
  const handleUploadSuccess = (_summary: UploadedFileSummary) => {
    // Re-fetch the live data from the backend so charts and stats update instantly
    fetchDashboardData();
  };

  // Render the appropriate view based on the active tab
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'reports':
        return <ReportsPage />;
      case 'sif-analysis':
        return <SIFAnalysisPage />;
      case 'life-saving-rules':
        return <LifeSavingRulesPage />;
      case 'sites-locations':
        return <SitesLocationsPage />;
      case 'recurring-patterns':
        return <RecurringPatternsPage />;
      case 'export':
        return <ExportPage />;
      case 'dashboard':
      default:
        return (
          <main className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Row 1: Top 4 KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, idx) => (
                <StatCard key={idx} stat={stat} />
              ))}
            </div>

            {/* Row 2: Analytics Distributions (3 Charts) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Donut 1: Classification */}
              <ClassificationDonut data={classificationData} totalCountText={totalCount} />

              {/* Bar: Life-Saving Rules Breakdown */}
              <LSRBarChart data={lsrBarData} />

              {/* Donut 2: Reports by Type */}
              <ReportTypeDonut data={reportTypeData} totalCountText={totalCount} />
            </div>

            {/* Row 3: Operational Rankings (3 Tables) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Table 1: Top Sites */}
              <TopSitesTable data={topSitesData} />

              {/* Table 2: Top Activities */}
              <TopActivitiesTable data={topActivitiesData} />

              {/* Table 3: Recurring Precursors */}
              <RecurringPatternsTable data={recurringPatternsData} />
            </div>

            {/* Row 4: Recent Incident Feed & Monthly Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left: Recent SIF Reports Table (7 cols) */}
              <div className="lg:col-span-7">
                <RecentReportsTable 
                  reports={recentReports} 
                  onViewAll={() => setActiveTab('reports')}
                />
              </div>

              {/* Right: SIF Precursor Timeline Trend (5 cols) */}
              <div className="lg:col-span-5">
                <SIFTrendLine data={trendData} />
              </div>
            </div>
          </main>
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f4f6fa] text-slate-800 font-sans relative">
      {/* 1. Left Sidebar Navigation (Static on Desktop, Off-Canvas Drawer on Mobile) */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenUpload={() => setIsUploadOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Content Canvas (Dynamic & Scrollable) */}
      <div className="flex-1 h-screen flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header & Global Filter Bar */}
        <Header
          selectedSite={selectedSite}
          setSelectedSite={handleSiteChange}
          selectedType={selectedType}
          setSelectedType={handleTypeChange}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenTestReport={() => setIsTestReportOpen(true)}
          onToggleMobileSidebar={() => setIsMobileMenuOpen(prev => !prev)}
        />

        {/* Dynamic Tab View */}
        {renderActiveTabContent()}
      </div>

      {/* Upload Modal (CSV, Excel, PDF) */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Test Single Report Modal */}
      <TestNarrativeModal
        isOpen={isTestReportOpen}
        onClose={() => setIsTestReportOpen(false)}
        onAddReportToFeed={handleAddLiveReport}
      />
    </div>
  );
}

export default App;
