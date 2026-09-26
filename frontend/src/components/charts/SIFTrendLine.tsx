import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { TrendDataPoint } from '../../types';

interface SIFTrendLineProps {
  data: TrendDataPoint[];
}

export const SIFTrendLine: React.FC<SIFTrendLineProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200/90 shadow-2xs flex flex-col h-[280px]">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[13px] font-bold text-slate-800 tracking-tight">
          SIF-Precursor Trend
        </h3>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ea384c]" />
            <span className="text-slate-600 font-semibold">SIF-Potential</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
            <span className="text-slate-600 font-semibold">Non-SIF</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
            />
            <YAxis
              domain={[0, 1000]}
              ticks={[0, 200, 400, 600, 800, 1000]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              label={{
                value: 'Number of Reports',
                angle: -90,
                position: 'insideLeft',
                offset: 25,
                fill: '#94a3b8',
                fontSize: 9
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '6px',
                fontSize: '11px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Line
              type="linear"
              dataKey="nonSif"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 3.5, fill: '#2563eb', strokeWidth: 1.5, stroke: '#ffffff' }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="linear"
              dataKey="sif"
              stroke="#ea384c"
              strokeWidth={2}
              dot={{ r: 3.5, fill: '#ea384c', strokeWidth: 1.5, stroke: '#ffffff' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
