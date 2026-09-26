import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Zap, 
  ShieldCheck, 
  MapPin, 
  Repeat, 
  Download 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenUpload: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'sif-analysis', label: 'SIF Analysis', icon: Zap },
    { id: 'life-saving-rules', label: 'Life-Saving Rules', icon: ShieldCheck },
    { id: 'sites-locations', label: 'Sites & Locations', icon: MapPin },
    { id: 'recurring-patterns', label: 'Recurring Patterns', icon: Repeat },
    { id: 'export', label: 'Export', icon: Download },
  ];

  return (
    <aside className="w-[230px] h-screen sticky top-0 left-0 bg-[#0d1a2d] text-slate-300 flex flex-col justify-between shrink-0 select-none z-30 overflow-hidden">
      {/* Top Brand Section */}
      <div>
        <div className="p-5 pb-6 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            {/* Oil India emblem */}
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-[3px] border-white flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
              </div>
              <div className="absolute -bottom-1 w-3.5 h-2 bg-[#ea384c] rounded-xs"></div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-200 tracking-tight leading-tight">
                ऑयल इंडिया लिमिटेड
              </div>
              <div className="text-sm font-extrabold text-white tracking-wider">
                OIL INDIA
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-[#1b2b48] text-white font-semibold shadow-inner border-l-4 border-blue-500 pl-2.5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#132238]'
                }`}
              >
                <Icon size={17} className={isActive ? 'text-blue-400' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Oilfield Silhouette Graphic */}
      <div className="relative p-4 pt-12 overflow-hidden border-t border-slate-800/40">
        {/* Silhouette SVG graphic */}
        <div className="absolute inset-0 opacity-20 pointer-events-none flex items-end justify-center">
          <svg viewBox="0 0 200 120" className="w-full h-24 fill-blue-300">
            {/* Derrick Rig silhouette */}
            <path d="M 60,110 L 75,30 L 85,30 L 100,110 Z" />
            <path d="M 75,30 L 77,10 L 83,10 L 85,30 Z" />
            {/* Rig Crossbars */}
            <line x1="65" y1="90" x2="95" y2="90" stroke="currentColor" strokeWidth="2" />
            <line x1="70" y1="65" x2="90" y2="65" stroke="currentColor" strokeWidth="2" />
            <line x1="73" y1="45" x2="87" y2="45" stroke="currentColor" strokeWidth="2" />
            {/* Refinery tanks and towers */}
            <rect x="110" y="70" width="30" height="40" rx="3" />
            <rect x="145" y="80" width="40" height="30" rx="6" />
            <rect x="25" y="85" width="25" height="25" rx="2" />
            <rect x="120" y="40" width="4" height="70" />
            <rect x="130" y="55" width="3" height="55" />
          </svg>
        </div>

        <div className="relative z-10 text-[11px] font-bold tracking-wider text-slate-300 uppercase leading-snug">
          SAFE PEOPLE<br />
          <span className="text-slate-400 font-semibold">SECURE TOMORROW</span>
        </div>
      </div>
    </aside>
  );
};
