import React from 'react';
import { 
  Lock, 
  Flame, 
  Box, 
  Target, 
  Car, 
  HardHat, 
  ArrowRight 
} from 'lucide-react';
import type { RecentReportItem } from '../../types';

interface RecentReportsTableProps {
  reports: RecentReportItem[];
  onViewAll?: () => void;
  onSelectReport?: (report: RecentReportItem) => void;
}

export const RecentReportsTable: React.FC<RecentReportsTableProps> = ({ 
  reports, 
  onViewAll,
  onSelectReport
}) => {
  const renderRuleIcon = (iconName: string) => {
    switch (iconName) {
      case 'lock':
        return <Lock size={12} className="text-slate-800" />;
      case 'hotwork':
        return <Flame size={12} className="text-slate-800" />;
      case 'confined':
        return <Box size={12} className="text-slate-800" />;
      case 'lineoffire':
        return <Target size={12} className="text-slate-800" />;
      case 'driving':
        return <Car size={12} className="text-slate-800" />;
      case 'height':
        return <HardHat size={12} className="text-slate-800" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200/90 shadow-2xs flex flex-col h-[280px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[13px] font-bold text-slate-800 tracking-tight">
          Recent SIF-Potential Reports
        </h3>
        <button
          onClick={onViewAll}
          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight size={12} />
        </button>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-[11px] text-left">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold">
              <th className="pb-2 w-20">Date</th>
              <th className="pb-2 min-w-[200px]">Report Excerpt</th>
              <th className="pb-2 w-24">Site</th>
              <th className="pb-2 w-24">Activity</th>
              <th className="pb-2 w-32">Life-Saving Rule</th>
              <th className="pb-2 text-right w-24">Classification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-700">
            {reports.map((report) => (
              <tr 
                key={report.id} 
                onClick={() => onSelectReport?.(report)}
                className="hover:bg-slate-50/80 transition cursor-pointer"
              >
                <td className="py-2.5 text-slate-500 font-medium whitespace-nowrap">
                  {report.date}
                </td>
                <td className="py-2.5 font-medium text-slate-900 pr-2">
                  <span className="line-clamp-1" title={report.excerpt}>
                    {report.excerpt}
                  </span>
                </td>
                <td className="py-2.5 text-slate-600 font-medium whitespace-nowrap">
                  {report.site}
                </td>
                <td className="py-2.5 text-slate-600 font-medium whitespace-nowrap">
                  {report.activity}
                </td>
                <td className="py-2.5 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <span className="shrink-0">{renderRuleIcon(report.ruleIcon)}</span>
                    <span className="truncate">{report.rule}</span>
                  </div>
                </td>
                <td className="py-2.5 text-right whitespace-nowrap">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold tracking-tight ${
                      report.classification === 'SIF-Potential'
                        ? 'bg-red-50 text-[#ea384c] border border-red-200'
                        : 'bg-sky-50 text-sky-700 border border-sky-200'
                    }`}
                  >
                    {report.classification}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
