import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { ReportTypeData } from '../../types';

interface ReportTypeDonutProps {
  data: ReportTypeData[];
  totalCountText?: string;
}

export const ReportTypeDonut: React.FC<ReportTypeDonutProps> = ({
  data,
  totalCountText = "12,482"
}) => {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200/90 shadow-2xs flex flex-col h-[260px]">
      <h3 className="text-[13px] font-bold text-slate-800 tracking-tight mb-2">
        Reports by Type
      </h3>

      <div className="flex-1 flex items-center justify-between">
        {/* Donut chart container with centered text */}
        <div className="relative w-[150px] h-[150px] mx-auto">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={46}
                outerRadius={68}
                paddingAngle={2}
                dataKey="count"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Centered label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[15px] font-extrabold text-slate-900 leading-tight">
              {totalCountText}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Reports
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="w-[140px] flex flex-col gap-2 text-xs pr-1">
          {data.map((item) => (
            <div key={item.name} className="flex items-start gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="leading-tight">
                <div className="font-semibold text-slate-700 text-[11px]">
                  {item.name}
                </div>
                <div className="text-slate-500 font-medium text-[11px]">
                  {item.count.toLocaleString()} ({item.pct}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
