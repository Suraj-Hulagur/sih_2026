import React, { useState } from 'react';
import { 
  Search, 
  Download, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  X,
  Lock,
  Flame,
  Box,
  Target,
  Car,
  HardHat
} from 'lucide-react';

interface ReportDetail {
  id: string;
  date: string;
  excerpt: string;
  site: string;
  activity: string;
  language: string;
  rule: string;
  ruleIcon: 'lock' | 'hotwork' | 'confined' | 'lineoffire' | 'driving' | 'height';
  classification: 'SIF-Potential' | 'Non-SIF';
  energyType: string;
  energyMagnitude: string;
  barrierExpected: string;
  barrierState: string;
  evidencePhrases: string[];
  m1RuleEngine: boolean;
  m2RandomForest: boolean;
  m3RawText: boolean;
  consensus: 'SIF_CONFIRMED' | 'SAFE' | 'NEEDS_HUMAN_REVIEW';
}

const ALL_REPORTS: ReportDetail[] = [
  {
    id: "HIN-0001",
    date: "12 Jun 2024",
    excerpt: "Worker opened a high-pressure line for maintenance without isolation and without LOTO lock.",
    site: "Duliajan",
    activity: "Pipeline Maintenance",
    language: "Hinglish / EN",
    rule: "Energy Isolation",
    ruleIcon: "lock",
    classification: "SIF-Potential",
    energyType: "Pressure / Mechanical",
    energyMagnitude: "High",
    barrierExpected: "LOTO Lock & Energy Isolation Valve",
    barrierState: "Missing",
    evidencePhrases: ["without isolation", "without LOTO lock"],
    m1RuleEngine: true,
    m2RandomForest: true,
    m3RawText: true,
    consensus: "SIF_CONFIRMED"
  },
  {
    id: "HIN-0002",
    date: "10 Jun 2024",
    excerpt: "Welding chal raha tha near crude tank 4, but fire blanket missing tha. Helper bina goggles ke tha.",
    site: "Naharkatiya",
    activity: "Hot Work / Welding",
    language: "Hinglish",
    rule: "Hot Work",
    ruleIcon: "hotwork",
    classification: "SIF-Potential",
    energyType: "Thermal / Flammable Vapor",
    energyMagnitude: "High",
    barrierExpected: "Fire Blanket & Continuous Gas Monitoring",
    barrierState: "Missing",
    evidencePhrases: ["fire blanket missing tha", "bina goggles ke"],
    m1RuleEngine: true,
    m2RandomForest: true,
    m3RawText: true,
    consensus: "SIF_CONFIRMED"
  },
  {
    id: "HIN-0003",
    date: "08 Jun 2024",
    excerpt: "Confined space entry bina gas test kiye kar raha tha inside condensate separator tank.",
    site: "Moran",
    activity: "Tank Cleaning",
    language: "Hinglish",
    rule: "Confined Space",
    ruleIcon: "confined",
    classification: "SIF-Potential",
    energyType: "Chemical / Toxic Vapor",
    energyMagnitude: "High",
    barrierExpected: "Pre-entry Atmosphere Gas Test & Standby Sentry",
    barrierState: "Bypassed",
    evidencePhrases: ["bina gas test kiye kar raha tha"],
    m1RuleEngine: true,
    m2RandomForest: true,
    m3RawText: true,
    consensus: "SIF_CONFIRMED"
  },
  {
    id: "HIN-0004",
    date: "05 Jun 2024",
    excerpt: "Crane lifting ke time exclusion zone me rigger khada tha under suspended 4-inch drill pipe.",
    site: "Digboi",
    activity: "Rig Floor Lifting",
    language: "Hinglish",
    rule: "Line of Fire",
    ruleIcon: "lineoffire",
    classification: "SIF-Potential",
    energyType: "Kinetic / Suspended Gravity",
    energyMagnitude: "High",
    barrierExpected: "Exclusion Zone Barricade & Tag Line",
    barrierState: "Bypassed",
    evidencePhrases: ["exclusion zone me rigger khada tha", "under suspended drill pipe"],
    m1RuleEngine: true,
    m2RandomForest: true,
    m3RawText: true,
    consensus: "SIF_CONFIRMED"
  },
  {
    id: "HIN-0005",
    date: "03 Jun 2024",
    excerpt: "Vehicle driver followed 20 kmph speed limit and wore seatbelt during transport to well pad.",
    site: "Duliajan",
    activity: "Transport",
    language: "English",
    rule: "Driving",
    ruleIcon: "driving",
    classification: "Non-SIF",
    energyType: "Kinetic (Low)",
    energyMagnitude: "Low",
    barrierExpected: "Seatbelt & Speed Governor",
    barrierState: "Working / Intact",
    evidencePhrases: ["followed speed limit", "wore seatbelt"],
    m1RuleEngine: false,
    m2RandomForest: false,
    m3RawText: false,
    consensus: "SAFE"
  },
  {
    id: "HIN-0006",
    date: "01 Jun 2024",
    excerpt: "Scaffolding par 10 meter height par kaam kar raha tha, fall arrestor hook nahi lagaya tha.",
    site: "Baghjan",
    activity: "Erection / Painting",
    language: "Hinglish",
    rule: "Work at Height",
    ruleIcon: "height",
    classification: "SIF-Potential",
    energyType: "Gravity",
    energyMagnitude: "High",
    barrierExpected: "Full Body Harness with Dual Lanyard Fall Arrestor",
    barrierState: "Missing",
    evidencePhrases: ["10 meter height", "fall arrestor hook nahi lagaya"],
    m1RuleEngine: true,
    m2RandomForest: true,
    m3RawText: true,
    consensus: "SIF_CONFIRMED"
  },
  {
    id: "HIN-0007",
    date: "28 May 2024",
    excerpt: "Excavation trench depth exceeded 1.5 meters without shoring box or side benching near manifold.",
    site: "Duliajan",
    activity: "Civil Excavation",
    language: "English",
    rule: "Line of Fire",
    ruleIcon: "lineoffire",
    classification: "SIF-Potential",
    energyType: "Soil Collapse / Gravity",
    energyMagnitude: "High",
    barrierExpected: "Trench Shoring Box / 45-degree Benching",
    barrierState: "Missing",
    evidencePhrases: ["exceeded 1.5 meters", "without shoring box"],
    m1RuleEngine: true,
    m2RandomForest: true,
    m3RawText: true,
    consensus: "SIF_CONFIRMED"
  },
  {
    id: "HIN-0008",
    date: "24 May 2024",
    excerpt: "Electrical panel maintenance being performed. Main circuit breaker isolated and tagged with warning lock.",
    site: "Naharkatiya",
    activity: "Substation Repair",
    language: "English",
    rule: "Energy Isolation",
    ruleIcon: "lock",
    classification: "Non-SIF",
    energyType: "Electrical (High Voltage)",
    energyMagnitude: "High",
    barrierExpected: "LOTO Lockout Tagout Padlock",
    barrierState: "Working / Intact",
    evidencePhrases: ["isolated and tagged with warning lock"],
    m1RuleEngine: false,
    m2RandomForest: false,
    m3RawText: false,
    consensus: "SAFE"
  },
  {
    id: "HIN-0009",
    date: "20 May 2024",
    excerpt: "Work permit for hot tapping issued but emergency shutoff valve was partially seized.",
    site: "Moran",
    activity: "Hot Tapping",
    language: "English",
    rule: "Energy Isolation",
    ruleIcon: "lock",
    classification: "SIF-Potential",
    energyType: "Pressure / Hydrocarbon",
    energyMagnitude: "High",
    barrierExpected: "Operational Emergency Shutdown Valve (ESDV)",
    barrierState: "Degraded",
    evidencePhrases: ["shutoff valve was partially seized"],
    m1RuleEngine: true,
    m2RandomForest: true,
    m3RawText: false,
    consensus: "NEEDS_HUMAN_REVIEW"
  }
];

export const ReportsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [siteFilter, setSiteFilter] = useState('ALL');
  const [ruleFilter, setRuleFilter] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null);

  const filteredReports = ALL_REPORTS.filter((rep) => {
    const matchesSearch = 
      rep.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.rule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'SIF' && rep.classification === 'SIF-Potential') ||
      (statusFilter === 'NON_SIF' && rep.classification === 'Non-SIF') ||
      (statusFilter === 'REVIEW' && rep.consensus === 'NEEDS_HUMAN_REVIEW');

    const matchesSite = siteFilter === 'ALL' || rep.site === siteFilter;
    const matchesRule = ruleFilter === 'ALL' || rep.rule === ruleFilter;

    return matchesSearch && matchesStatus && matchesSite && matchesRule;
  });

  const renderRuleIcon = (iconName: string) => {
    switch (iconName) {
      case 'lock': return <Lock size={12} className="text-slate-700" />;
      case 'hotwork': return <Flame size={12} className="text-slate-700" />;
      case 'confined': return <Box size={12} className="text-slate-700" />;
      case 'lineoffire': return <Target size={12} className="text-slate-700" />;
      case 'driving': return <Car size={12} className="text-slate-700" />;
      case 'height': return <HardHat size={12} className="text-slate-700" />;
      default: return null;
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Safety Observations & Incident Master Ledger
          </h2>
          <p className="text-xs text-slate-500">
            Review, triage, and audit individual field reports classified by EEI Safety Chain Logic
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded text-slate-700">
            Total Records: {filteredReports.length}
          </span>
          <button 
            onClick={() => alert('Exporting active table view to CSV...')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Download size={13} />
            <span>Export Table</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search report ID, Hinglish text, site, hazard..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="SIF">SIF-Potential Only</option>
            <option value="NON_SIF">Non-SIF Only</option>
            <option value="REVIEW">Needs Human Review</option>
          </select>

          {/* Site Filter */}
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium cursor-pointer"
          >
            <option value="ALL">All Facilities</option>
            <option value="Duliajan">Duliajan Field</option>
            <option value="Naharkatiya">Naharkatiya Field</option>
            <option value="Moran">Moran Field</option>
            <option value="Digboi">Digboi Refinery</option>
            <option value="Baghjan">Baghjan Site</option>
          </select>

          {/* Rule Filter */}
          <select
            value={ruleFilter}
            onChange={(e) => setRuleFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium cursor-pointer"
          >
            <option value="ALL">All Life-Saving Rules</option>
            <option value="Energy Isolation">Energy Isolation</option>
            <option value="Hot Work">Hot Work</option>
            <option value="Confined Space">Confined Space</option>
            <option value="Line of Fire">Line of Fire</option>
            <option value="Work at Height">Work at Height</option>
            <option value="Driving">Driving</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
              <tr>
                <th className="py-2.5 px-3 w-20">ID</th>
                <th className="py-2.5 px-3 w-24">Date</th>
                <th className="py-2.5 px-3 w-28">Facility</th>
                <th className="py-2.5 px-3 w-32">Activity</th>
                <th className="py-2.5 px-3 min-w-[260px]">Field Observation Narrative</th>
                <th className="py-2.5 px-3 w-32">Energy Source</th>
                <th className="py-2.5 px-3 w-36">Life-Saving Rule</th>
                <th className="py-2.5 px-3 text-center w-28">Triage</th>
                <th className="py-2.5 px-3 text-center w-16">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-blue-50/40 transition">
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-600">
                    {report.id}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                    {report.date}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    {report.site}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 font-medium">
                    {report.activity}
                  </td>
                  <td className="py-2.5 px-3">
                    <p className="line-clamp-2 text-slate-800 font-medium leading-relaxed" title={report.excerpt}>
                      {report.excerpt}
                    </p>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 font-medium">
                    {report.energyType}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                      <span>{renderRuleIcon(report.ruleIcon)}</span>
                      <span className="truncate">{report.rule}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        report.classification === 'SIF-Potential'
                          ? 'bg-red-50 text-[#ea384c] border border-red-200'
                          : 'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}
                    >
                      {report.classification}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer"
                      title="Inspect SCL Evidence & Triangulation"
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredReports.length} of {ALL_REPORTS.length} observations</span>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded hover:bg-slate-200 disabled:opacity-30" disabled>
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-slate-700">1</span>
            <button className="p-1 rounded hover:bg-slate-200 disabled:opacity-30" disabled>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Audit Drawer / Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in duration-150 max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500">{selectedReport.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedReport.classification === 'SIF-Potential' ? 'bg-red-100 text-[#ea384c]' : 'bg-sky-100 text-sky-700'
                  }`}>
                    {selectedReport.classification}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  EEI Safety Chain Logic Audit Trail
                </h3>
              </div>
              <button 
                onClick={() => setSelectedReport(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Original Raw Text */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Original Field Observation ({selectedReport.language})
                </span>
                <p className="text-xs font-medium text-slate-900 leading-relaxed italic">
                  "{selectedReport.excerpt}"
                </p>
              </div>

              {/* SCL Two-Field Test */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Energy Type & Magnitude</div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {selectedReport.energyType} ({selectedReport.energyMagnitude})
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Barrier State</div>
                  <div className={`font-bold mt-0.5 ${selectedReport.barrierState !== 'Working / Intact' ? 'text-[#ea384c]' : 'text-emerald-600'}`}>
                    {selectedReport.barrierState}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Expected Preventive Control</div>
                  <div className="font-medium text-slate-700 mt-0.5">
                    {selectedReport.barrierExpected}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">IOGP Life-Saving Rule</div>
                  <div className="font-bold text-blue-700 mt-0.5">
                    {selectedReport.rule}
                  </div>
                </div>
              </div>

              {/* Extracted evidence phrases */}
              <div>
                <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  Extracted Evidence Phrases:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedReport.evidencePhrases.map((phrase, idx) => (
                    <span key={idx} className="bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded text-[11px] font-mono">
                      "{phrase}"
                    </span>
                  ))}
                </div>
              </div>

              {/* Triangulation Voting Engine */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  3-Way Disagreement Engine Breakdown
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <div className="text-[10px] text-slate-400">Method 1 (Rule)</div>
                    <div className="font-bold text-slate-800 mt-0.5">
                      {selectedReport.m1RuleEngine ? 'SIF' : 'Safe'}
                    </div>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <div className="text-[10px] text-slate-400">Method 2 (RF+SHAP)</div>
                    <div className="font-bold text-slate-800 mt-0.5">
                      {selectedReport.m2RandomForest ? 'SIF' : 'Safe'}
                    </div>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <div className="text-[10px] text-slate-400">Method 3 (Raw-Text)</div>
                    <div className="font-bold text-slate-800 mt-0.5">
                      {selectedReport.m3RawText ? 'SIF' : 'Safe'}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-center pt-1 text-slate-700">
                  Consensus Status: <span className="text-blue-600">{selectedReport.consensus}</span>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-slate-100"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
