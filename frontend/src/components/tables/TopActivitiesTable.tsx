import React from 'react';
import type { ActivityRiskItem } from '../../types';

interface TopActivitiesTableProps {
  data: ActivityRiskItem[];
}

export const TopActivitiesTable: React.FC<TopActivitiesTableProps> = ({ data }) => {
  const maxVal = 650; // max value for relative bar width

  const getBarColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-[#ea384c]';
      case 2:
        return 'bg-[#f45d48]';
      case 3:
        return 'bg-[#f97316]';
      case 4:
        return 'bg-[#f59e0b]';
      case 5:
        return 'bg-[#eab308]';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200/90 shadow-2xs flex flex-col h-[270px]">
      <h3 className="text-[13px] font-bold text-slate-800 tracking-tight mb-2">
        Top Activities by SIF-Potential
      </h3>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-[11px] text-left">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold">
              <th className="pb-2 w-6">#</th>
              <th className="pb-2">Activity</th>
              <th className="pb-2 text-right">SIF Reports</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-700">
            {data.map((item) => {
              const widthPct = Math.round((item.sifReports / maxVal) * 100);
              return (
                <tr key={item.rank} className="hover:bg-slate-50/70 transition">
                  <td className="py-2.5 text-slate-400 font-medium">{item.rank}</td>
                  <td className="py-2.5 font-medium text-slate-900">{item.activity}</td>
                  <td className="py-2.5 text-right w-[150px]">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-semibold text-slate-700 text-right w-8">
                        {item.sifReports}
                      </span>
                      {/* Horizontal progress bar */}
                      <div className="w-20 bg-slate-100 rounded-sm h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-sm ${getBarColor(item.rank)}`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
