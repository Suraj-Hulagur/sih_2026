import React from 'react';
import { 
  Lock, 
  Target, 
  Box, 
  Flame, 
  HardHat, 
  Car, 
  MoreHorizontal 
} from 'lucide-react';
import type { LSRRuleData } from '../../types';

interface LSRBarChartProps {
  data: LSRRuleData[];
}

export const LSRBarChart: React.FC<LSRBarChartProps> = ({ data }) => {
  const maxCount = 500; // matching axis max in mockup

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'lock':
        return <Lock size={13} className="text-slate-700" />;
      case 'lineoffire':
        return <Target size={13} className="text-slate-700" />;
      case 'confined':
        return <Box size={13} className="text-slate-700" />;
      case 'hotwork':
        return <Flame size={13} className="text-slate-700" />;
      case 'height':
        return <HardHat size={13} className="text-slate-700" />;
      case 'driving':
        return <Car size={13} className="text-slate-700" />;
      default:
        return <MoreHorizontal size={13} className="text-slate-700" />;
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200/90 shadow-2xs flex flex-col h-[260px] overflow-hidden">
      <h3 className="text-[13px] font-bold text-slate-800 tracking-tight mb-2">
        SIF-Potential Reports by Life-Saving Rule
      </h3>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="min-w-[280px] h-full flex flex-col justify-between">
          <div className="flex-1 flex gap-2 pt-1 pb-1">
            {/* Y Axis Labels */}
            <div className="flex flex-col justify-between text-[10px] text-slate-400 font-medium h-[150px] shrink-0 text-right pr-1 select-none">
              <span>500</span>
              <span>400</span>
              <span>300</span>
              <span>200</span>
              <span>100</span>
              <span>0</span>
            </div>

            {/* Bars Container */}
            <div className="flex-1 flex items-end justify-between border-b border-l border-slate-200 pl-2 pr-1 h-[150px]">
              {data.map((item) => {
                const heightPct = (item.count / maxCount) * 100;
                return (
                  <div key={item.rule} className="flex flex-col items-center flex-1 max-w-[42px] h-full justify-end group">
                    {/* Count number label on top of bar */}
                    <span className="text-[11px] font-bold text-slate-700 mb-1 group-hover:text-blue-600 transition">
                      {item.count}
                    </span>

                    {/* The Bar */}
                    <div
                      className="w-full rounded-t-sm transition-all duration-300 hover:brightness-110"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* X Axis Icons & Labels */}
          <div className="flex justify-between pl-6 pr-1 pt-1.5">
            {data.map((item) => (
              <div key={item.rule} className="flex flex-col items-center flex-1 max-w-[42px] text-center">
                <div className="w-5 h-5 flex items-center justify-center mb-0.5">
                  {renderIcon(item.iconName)}
                </div>
                <span className="text-[9px] font-medium text-slate-500 leading-tight block truncate w-full" title={item.rule}>
                  {item.rule === 'Energy Isolation' ? 'Energy Isolation' : 
                   item.rule === 'Line of Fire' ? 'Line of Fire' :
                   item.rule === 'Confined Space' ? 'Confined Space' :
                   item.rule === 'Hot Work' ? 'Hot Work' :
                   item.rule === 'Work at Height' ? 'Work at Height' :
                   item.rule === 'Driving' ? 'Driving' : 'Other'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
