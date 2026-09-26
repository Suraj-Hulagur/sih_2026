import React from 'react';
import type { SiteDensityItem } from '../../types';

interface TopSitesTableProps {
  data: SiteDensityItem[];
}

export const TopSitesTable: React.FC<TopSitesTableProps> = ({ data }) => {
  const getDensityColor = (density: number) => {
    if (density >= 28) return 'bg-[#ea384c] text-white';
    if (density >= 26) return 'bg-[#f45d48] text-white';
    if (density >= 24) return 'bg-[#f97316] text-white';
    if (density >= 20) return 'bg-[#f59e0b] text-white';
    return 'bg-[#eab308] text-white';
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200/90 shadow-2xs flex flex-col h-[270px]">
      <h3 className="text-[13px] font-bold text-slate-800 tracking-tight mb-2">
        Top 5 Sites by SIF-Precursor Density
      </h3>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-[11px] text-left">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold">
              <th className="pb-2 w-6">#</th>
              <th className="pb-2">Site</th>
              <th className="pb-2 text-right">Total Reports</th>
              <th className="pb-2 text-right">SIF Reports</th>
              <th className="pb-2 text-right pr-1">
                SIF Density <br />
                <span className="text-[9px] font-normal text-slate-400">(per 100 reports)</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-700">
            {data.map((item) => (
              <tr key={item.rank} className="hover:bg-slate-50/70 transition">
                <td className="py-2 text-slate-400 font-medium">{item.rank}</td>
                <td className="py-2 font-medium text-slate-900">{item.site}</td>
                <td className="py-2 text-right font-medium text-slate-600">
                  {item.totalReports.toLocaleString()}
                </td>
                <td className="py-2 text-right font-medium text-slate-600">
                  {item.sifReports.toLocaleString()}
                </td>
                <td className="py-2 text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-tight shadow-xs ${getDensityColor(
                      item.density
                    )}`}
                  >
                    {item.density.toFixed(1)}
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
