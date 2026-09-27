import React from 'react';
import { 
  ArrowUp, 
  ShieldAlert, 
  Lightbulb, 
  Clock, 
  Users2, 
  Wrench,
  CheckCircle2
} from 'lucide-react';

interface PatternCluster {
  id: string;
  title: string;
  count: number;
  trend: 'up';
  dominantRule: string;
  behavioralDriver: string;
  driverPct: number;
  description: string;
  evidenceSnippets: string[];
  recommendedAction: string;
}

const PATTERNS_LIST: PatternCluster[] = [
  {
    id: "pat-1",
    title: "Bypassing Isolation & LOTO during Routine Maintenance",
    count: 182,
    trend: "up",
    dominantRule: "Energy Isolation",
    behavioralDriver: "Time pressure & rushing to resume production",
    driverPct: 42,
    description: "Maintenance technicians and fitters cracking flanges or opening pump casings under the assumption that lines are zero-energy without attaching physical padlocks or testing bleeders.",
    evidenceSnippets: ["without isolation", "without LOTO lock", "depressurize nahi kiya", "valve open tha"],
    recommendedAction: "Mandatory zero-energy physical lockout with photo-verification on work-permit mobile app before flange opening."
  },
  {
    id: "pat-2",
    title: "Personnel Inside Crane Exclusion Zones (Line of Fire)",
    count: 160,
    trend: "up",
    dominantRule: "Line of Fire",
    behavioralDriver: "Complacency in confined rig floor footprints",
    driverPct: 35,
    description: "Riggers and helpers stepping directly into the drop trajectory of tubulars and drill pipes without maintaining visual contact with the crane operator.",
    evidenceSnippets: ["under suspended load", "rigger ne barricade cross kiya", "bina tag line ke"],
    recommendedAction: "Enforce physical red exclusion zone drop-barriers and wireless crane anti-two-block proximity sensors."
  },
  {
    id: "pat-3",
    title: "Vessel & Separator Entry Without Pre-entry Gas Testing",
    count: 142,
    trend: "up",
    dominantRule: "Confined Space",
    behavioralDriver: "Missing or uncalibrated multi-gas detector at site",
    driverPct: 30,
    description: "Personnel entering crude oil storage tanks, mud pits, and separator vessels without waiting for atmospheric LEL, H2S, and O2 clearance tests.",
    evidenceSnippets: ["bina gas test kiye", "no standby sentry", "tank entry without permit"],
    recommendedAction: "Install digital interlocked gas detectors that log atmosphere readings directly to the electronic PTW system prior to manhole unlocking."
  },
  {
    id: "pat-4",
    title: "Working at Heights >2m Without Dual Lanyard Fall Arrestor",
    count: 118,
    trend: "up",
    dominantRule: "Working at Height",
    behavioralDriver: "Lack of 100% tie-off anchorage points on older rigs",
    driverPct: 28,
    description: "Painters and scaffolding erectors working at elevations up to 10 meters unhooking their single lanyard while moving across staging beams.",
    evidenceSnippets: ["fall arrestor nahi lagaya", "bina safety belt", "scaffolding 10 meter height"],
    recommendedAction: "Upgrade all rig workover masts with permanent continuous-run vertical lifeline cables."
  },
  {
    id: "pat-5",
    title: "Permit to Work (PTW) Sign-off Without Physical Field Verification",
    count: 104,
    trend: "up",
    dominantRule: "Work Authorisation",
    behavioralDriver: "Administrative shortcutting during shift handovers",
    driverPct: 40,
    description: "Hot work and electrical permits signed off in control rooms before the issuing authority conducts joint physical inspection on the well pad.",
    evidenceSnippets: ["permit issued without fire watch", "permit sign-off delayed", "started before SOIC approval"],
    recommendedAction: "Implement geo-tagged digital permit authorization requiring field supervisor QR-code scan at the actual work location."
  }
];

export const RecurringPatternsPage: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
              Pattern Intelligence
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-[#ea384c]">
              SIH Problem Statement Focus
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-1">
            Recurring SIF Precursor Patterns & Behavioral Root Causes
          </h2>
          <p className="text-xs text-slate-500">
            Automated cluster discovery pinpointing systemic near-miss failure modes before an actual fatality occurs
          </p>
        </div>
      </div>

      {/* Behavioral Drivers Top Summary Banner */}
      <div className="bg-white p-5 rounded-lg border border-slate-200/90 shadow-2xs">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Underlying Sharp-End Behavioral Factors (Why Workers Skip Controls)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg">
            <Clock size={16} className="text-[#ea384c] mx-auto mb-1" />
            <div className="text-lg font-extrabold text-[#ea384c]">38%</div>
            <div className="text-[11px] font-semibold text-slate-700">Time Pressure</div>
            <div className="text-[10px] text-slate-500">Rushing to resume flow</div>
          </div>

          <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-lg">
            <Users2 size={16} className="text-orange-600 mx-auto mb-1" />
            <div className="text-lg font-extrabold text-orange-700">24%</div>
            <div className="text-[11px] font-semibold text-slate-700">Complacency</div>
            <div className="text-[10px] text-slate-500">"Done it 100 times before"</div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
            <Wrench size={16} className="text-amber-600 mx-auto mb-1" />
            <div className="text-lg font-extrabold text-amber-700">18%</div>
            <div className="text-[11px] font-semibold text-slate-700">Equipment Gap</div>
            <div className="text-[10px] text-slate-500">Missing/uncalibrated gear</div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
            <ShieldAlert size={16} className="text-blue-600 mx-auto mb-1" />
            <div className="text-lg font-extrabold text-blue-800">12%</div>
            <div className="text-[11px] font-semibold text-slate-700">Supervision Gap</div>
            <div className="text-[10px] text-slate-500">Shift handover lapses</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <Lightbulb size={16} className="text-slate-600 mx-auto mb-1" />
            <div className="text-lg font-extrabold text-slate-800">8%</div>
            <div className="text-[11px] font-semibold text-slate-700">Training & Slang</div>
            <div className="text-[10px] text-slate-500">Non-native documentation</div>
          </div>
        </div>
      </div>

      {/* Deep-Dive Pattern Clusters Cards */}
      <div className="space-y-4">
        {PATTERNS_LIST.map((pat, idx) => (
          <div key={pat.id} className="bg-white rounded-lg p-5 border border-slate-200/90 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  #{idx + 1}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">
                    {pat.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Rule: {pat.dominantRule}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      Driver: {pat.behavioralDriver} ({pat.driverPct}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start">
                <div className="text-right">
                  <div className="text-lg font-extrabold text-[#ea384c] flex items-center gap-1 justify-end">
                    <span>{pat.count}</span>
                    <ArrowUp size={16} className="text-[#ea384c]" />
                  </div>
                  <span className="text-[10px] text-slate-400">Reports Tagged</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed mb-3">
              {pat.description}
            </p>

            {/* Recurring Hinglish keyword snippets */}
            <div className="mb-3">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                Common Trigger Expressions from Worker Reports:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {pat.evidenceSnippets.map((snippet, sIdx) => (
                  <span key={sIdx} className="bg-slate-100 text-slate-700 font-mono text-[11px] px-2 py-0.5 rounded border border-slate-200">
                    "{snippet}"
                  </span>
                ))}
              </div>
            </div>

            {/* AI Recommended Intervention */}
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-emerald-900 block">
                  Recommended Engineering / Administrative Intervention:
                </span>
                <span className="text-xs text-emerald-800 font-medium">
                  {pat.recommendedAction}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
