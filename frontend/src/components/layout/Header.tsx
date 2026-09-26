import React from 'react';
import { Calendar, ChevronDown, UploadCloud, PlusCircle, Menu } from 'lucide-react';

interface HeaderProps {
  selectedSite: string;
  setSelectedSite: (site: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  onOpenUpload: () => void;
  onOpenTestReport: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedSite,
  setSelectedSite,
  selectedType,
  setSelectedType,
  onOpenUpload,
  onOpenTestReport,
  onToggleMobileSidebar
}) => {
  return (
    <header className="px-4 py-3 sm:px-6 sm:pt-5 sm:pb-4 bg-[#f4f6fa]/95 backdrop-blur-xs sticky top-0 z-20 border-b border-slate-200/80 flex flex-col gap-3 sm:gap-4">
      {/* Top row: Hamburger Button, Title, and Corporate Slogan */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Hamburger toggle button for mobile */}
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 active:bg-slate-300 rounded-lg transition"
            aria-label="Toggle navigation menu"
          >
            <Menu size={22} />
          </button>

          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
              HSSE Insight
            </h1>
            <p className="text-[11px] sm:text-[13px] text-slate-500 font-medium">
              From Observations to Prevention
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
            ENERGY
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-blue-900 tracking-tight">
            FOR A SAFER TOMORROW
          </span>
        </div>
      </div>

      {/* Bottom row: Filter Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Dropdowns / Date Picker */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Picker Button */}
          <div className="flex items-center gap-2 bg-white px-2.5 sm:px-3 py-1.5 rounded-md border border-slate-200 shadow-xs text-[11px] sm:text-xs font-medium text-slate-700 hover:border-slate-300 cursor-pointer transition">
            <Calendar size={14} className="text-slate-400 shrink-0" />
            <span>01 Jan 2024 – 30 Jun 2024</span>
          </div>

          {/* Sites Dropdown */}
          <div className="relative">
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="appearance-none bg-white pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-1.5 rounded-md border border-slate-200 shadow-xs text-[11px] sm:text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All Sites">All Sites</option>
              <option value="Duliajan">Duliajan Field</option>
              <option value="Naharkatiya">Naharkatiya Field</option>
              <option value="Moran">Moran Field</option>
              <option value="Digboi">Digboi Refinery</option>
              <option value="Baghjan">Baghjan Well Site</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 sm:right-2.5 top-2.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Report Types Dropdown */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="appearance-none bg-white pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-1.5 rounded-md border border-slate-200 shadow-xs text-[11px] sm:text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All Report Types">All Report Types</option>
              <option value="UA Observations">UA Observations</option>
              <option value="UC Observations">UC Observations</option>
              <option value="Near Miss">Near Miss</option>
              <option value="Incident">Incident</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 sm:right-2.5 top-2.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Action Buttons for Ingestion */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={onOpenTestReport}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md text-xs font-semibold shadow-xs transition"
          >
            <PlusCircle size={14} className="text-blue-600 shrink-0" />
            <span className="truncate">Test Single Narrative</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-[#0f172a] hover:bg-[#1e293b] text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-xs transition"
          >
            <UploadCloud size={14} className="text-blue-400 shrink-0" />
            <span className="truncate">Upload (CSV/Excel/PDF)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
