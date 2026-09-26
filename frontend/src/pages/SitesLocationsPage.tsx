import React, { useState } from 'react';
import { 
  MapPin, 
  Building2 
} from 'lucide-react';

interface SiteInfo {
  id: string;
  name: string;
  type: string;
  district: string;
  totalReports: number;
  sifReports: number;
  density: number;
  topHazard: string;
  topRule: string;
  riskStatus: 'Critical Watch' | 'Moderate' | 'Good Compliance';
  description: string;
}

const OIL_SITES: SiteInfo[] = [
  {
    id: "duliajan",
    name: "Duliajan Operational Hub",
    type: "HQ & Major Field Headquarters",
    district: "Dibrugarh, Assam",
    totalReports: 2180,
    sifReports: 612,
    density: 28.1,
    topHazard: "Gravity / Work at Height",
    topRule: "Working at Height",
    riskStatus: "Critical Watch",
    description: "Central processing facilities, central workshops, drilling services, and major gas gathering stations."
  },
  {
    id: "naharkatiya",
    name: "Naharkatiya Oilfield",
    type: "Mature Production & OCS",
    district: "Dibrugarh, Assam",
    totalReports: 1540,
    sifReports: 420,
    density: 27.3,
    topHazard: "Stored Pressure / LOTO",
    topRule: "Energy Isolation",
    riskStatus: "Critical Watch",
    description: "Multi-well pads, high-pressure flowlines, separation units, and artificial lift maintenance jobs."
  },
  {
    id: "moran",
    name: "Moran Oilfield",
    type: "Drilling & Workover Rigs",
    district: "Charaideo, Assam",
    totalReports: 1230,
    sifReports: 310,
    density: 25.2,
    topHazard: "Confined Space / Toxic Gas",
    topRule: "Confined Space",
    riskStatus: "Critical Watch",
    description: "Active workover operations, heavy crude storage tanks, and separator vessel turnaround repairs."
  },
  {
    id: "digboi",
    name: "Digboi Refinery & Field",
    type: "Refining & Petrochemical",
    district: "Tinsukia, Assam",
    totalReports: 980,
    sifReports: 210,
    density: 21.4,
    topHazard: "Thermal / Flammable Gas",
    topRule: "Hot Work",
    riskStatus: "Moderate",
    description: "Distillation units, wax plants, pipeline manifolds, and ongoing infrastructure maintenance."
  },
  {
    id: "baghjan",
    name: "Baghjan Gas Well Site",
    type: "High-Pressure Gas Wells",
    district: "Tinsukia, Assam",
    totalReports: 860,
    sifReports: 160,
    density: 18.6,
    topHazard: "High-Pressure Gas Release",
    topRule: "Bypassing Safety Controls",
    riskStatus: "Moderate",
    description: "Deep exploratory and development gas wells with stringent blowout preventer (BOP) controls."
  },
  {
    id: "tengakhat",
    name: "Tengakhat OCS (Oil Collecting Station)",
    type: "Gathering & Pumping Station",
    district: "Dibrugarh, Assam",
    totalReports: 620,
    sifReports: 110,
    density: 17.7,
    topHazard: "Hydrocarbon Manifolds",
    topRule: "Energy Isolation",
    riskStatus: "Good Compliance",
    description: "Gathering crude oil from surrounding well clusters and boosting transmission into trunklines."
  }
];

export const SitesLocationsPage: React.FC = () => {
  const [selectedSite, setSelectedSite] = useState<SiteInfo | null>(OIL_SITES[0]);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
              Assam Asset Operations
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
              Field & Refinery Facilities
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-1">
            Operational Sites & SIF-Precursor Risk Density
          </h2>
          <p className="text-xs text-slate-500">
            Geographic safety intelligence mapping precursor rates across Upper Assam oilfields and processing installations
          </p>
        </div>
      </div>

      {/* Facilities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {OIL_SITES.map((site) => (
          <div
            key={site.id}
            onClick={() => setSelectedSite(site)}
            className={`bg-white rounded-lg p-4 border transition cursor-pointer flex flex-col justify-between ${
              selectedSite?.id === site.id
                ? 'border-blue-600 ring-2 ring-blue-500/10 shadow-sm'
                : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      {site.name}
                    </h4>
                    <span className="text-[10px] text-slate-500">
                      {site.district}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    site.riskStatus === 'Critical Watch'
                      ? 'bg-red-50 text-[#ea384c] border border-red-200'
                      : site.riskStatus === 'Moderate'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {site.riskStatus}
                </span>
              </div>

              <p className="text-[11px] text-slate-600 font-medium mb-3 line-clamp-2">
                {site.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded border border-slate-100 mb-3">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Total Reports</span>
                  <span className="font-bold text-slate-800">{site.totalReports.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-red-500 block font-medium">SIF Precursors</span>
                  <span className="font-extrabold text-[#ea384c]">{site.sifReports.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">SIF Density:</span>
              <span className="font-bold text-slate-800 text-[11px] px-2 py-0.5 rounded bg-slate-100">
                {site.density.toFixed(1)} per 100
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Site Detail Inspection Banner */}
      {selectedSite && (
        <div className="bg-white p-5 rounded-lg border border-slate-200/90 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-red-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Facility Safety Profile: {selectedSite.name}
                </h3>
              </div>
              <span className="text-xs text-slate-500">{selectedSite.type} — {selectedSite.district}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Primary Precursor Hazard</span>
                <span className="text-xs font-bold text-slate-800">{selectedSite.topHazard}</span>
              </div>
              <div className="text-right pl-3 border-l border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Dominant IOGP Rule</span>
                <span className="text-xs font-bold text-blue-700">{selectedSite.topRule}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            {selectedSite.description} Field observations from this location show that <strong>{selectedSite.density.toFixed(1)}%</strong> of all logged unsafe act/condition observations possess life-threatening SIF precursor potential. Preventative interventions must focus specifically on {selectedSite.topRule}.
          </p>
        </div>
      )}
    </div>
  );
};
