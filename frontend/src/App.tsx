import { useState } from 'react';
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
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isTestReportOpen, setIsTestReportOpen] = useState(false);

  const [stats, setStats] = useState(INITIAL_STATS);
  const [recentReports, setRecentReports] = useState<RecentReportItem[]>(RECENT_REPORTS_DATA);

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
  const handleUploadSuccess = (summary: UploadedFileSummary) => {
    const recCount = summary.recordCount;
    const sifCount = summary.sifCount;
    if (typeof recCount === 'number' && typeof sifCount === 'number') {
      // Increment stats dynamically
      setStats(prev => [
        {
          ...prev[0],
          count: (12482 + recCount).toLocaleString()
        },
        {
          ...prev[1],
          count: (2781 + sifCount).toLocaleString()
        },
        prev[2],
        prev[3]
      ]);
    }
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
          <main className="p-6 space-y-5">
            {/* Row 1: Top 4 KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, idx) => (
                <StatCard key={idx} stat={stat} />
              ))}
            </div>

            {/* Row 2: Analytics Distributions (3 Charts) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Donut 1: Classification */}
              <ClassificationDonut data={CLASSIFICATION_DATA} totalCountText="12,482" />

              {/* Bar: Life-Saving Rules Breakdown */}
              <LSRBarChart data={LSR_BAR_DATA} />

              {/* Donut 2: Reports by Type */}
              <ReportTypeDonut data={REPORT_TYPE_DATA} totalCountText="12,482" />
            </div>

            {/* Row 3: Operational Rankings (3 Tables) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Table 1: Top Sites */}
              <TopSitesTable data={TOP_SITES_DATA} />

              {/* Table 2: Top Activities */}
              <TopActivitiesTable data={TOP_ACTIVITIES_DATA} />

              {/* Table 3: Recurring Precursors */}
              <RecurringPatternsTable data={RECURRING_PATTERNS_DATA} />
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
                <SIFTrendLine data={TREND_DATA} />
              </div>
            </div>
          </main>
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f4f6fa] text-slate-800 font-sans">
      {/* 1. Left Sidebar Navigation (Static & Fixed) */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenUpload={() => setIsUploadOpen(true)} 
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
