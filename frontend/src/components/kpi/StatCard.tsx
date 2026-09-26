import React from 'react';
import { 
  FileText, 
  AlertTriangle, 
  Users, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import type { StatMetric } from '../../types';

interface StatCardProps {
  stat: StatMetric;
}

export const StatCard: React.FC<StatCardProps> = ({ stat }) => {
  const getIcon = () => {
    switch (stat.type) {
      case 'total':
        return (
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
        );
      case 'sif':
        return (
          <div className="w-10 h-10 rounded-lg bg-red-50 text-[#ea384c] flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
        );
      case 'non-sif':
        return (
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
        );
      case 'patterns':
        return (
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
        );
    }
  };

  const isFavorableDown = stat.type === 'non-sif';

  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200/90 shadow-2xs flex items-start gap-4">
      {getIcon()}

      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-slate-500 mb-1">
          {stat.title}
        </div>

        <div className="flex items-baseline gap-1.5 mb-1.5">
          <span className="text-2xl font-bold text-slate-900 tracking-tight">
            {stat.count}
          </span>
          {stat.subText && (
            <span className={`text-sm font-semibold ${stat.type === 'sif' ? 'text-[#ea384c]' : 'text-slate-600'}`}>
              {stat.subText}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px]">
          <span
            className={`inline-flex items-center font-semibold ${
              stat.changeTrend === 'up'
                ? stat.type === 'sif'
                  ? 'text-red-600'
                  : 'text-emerald-600'
                : isFavorableDown
                ? 'text-emerald-600'
                : 'text-slate-500'
            }`}
          >
            {stat.changeTrend === 'up' ? (
              <ArrowUpRight size={13} className="mr-0.5" />
            ) : (
              <ArrowDownRight size={13} className="mr-0.5" />
            )}
            {stat.changeTrend === 'up' ? '+' : '-'}{stat.changePct}%
          </span>
          <span className="text-slate-400 font-normal">
            {stat.changeLabel || 'vs previous period'}
          </span>
        </div>
      </div>
    </div>
  );
};
