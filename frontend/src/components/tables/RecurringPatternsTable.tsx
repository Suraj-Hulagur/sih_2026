import React from 'react';
import { ArrowUp } from 'lucide-react';
import type { RecurringPatternItem } from '../../types';

interface RecurringPatternsTableProps {
  data: RecurringPatternItem[];
}

export const RecurringPatternsTable: React.FC<RecurringPatternsTableProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200/90 shadow-2xs flex flex-col h-[270px]">
      <h3 className="text-[13px] font-bold text-slate-800 tracking-tight mb-2">
        Recurring Precursor Patterns
      </h3>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-[11px] text-left">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold">
              <th className="pb-2 w-6">#</th>
              <th className="pb-2">Precursor Pattern</th>
              <th className="pb-2 text-right">Count</th>
              <th className="pb-2 text-center w-12">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-700">
            {data.map((item) => (
              <tr key={item.rank} className="hover:bg-slate-50/70 transition">
                <td className="py-2.5 text-slate-400 font-medium">{item.rank}</td>
                <td className="py-2.5 font-medium text-slate-800">{item.pattern}</td>
                <td className="py-2.5 text-right font-semibold text-slate-700">
                  {item.count}
                </td>
                <td className="py-2.5 text-center">
                  <div className="inline-flex items-center justify-center text-[#ea384c] font-bold">
                    <ArrowUp size={13} strokeWidth={2.5} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
