import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  CheckCircle, 
  Sparkles
} from 'lucide-react';

export const SIFAnalysisPage: React.FC = () => {
  const shapFeatures = [
    { name: "barrier_state == 'missing'", weight: 0.42, category: "Barrier" },
    { name: "energy_magnitude == 'high'", weight: 0.39, category: "Energy" },
    { name: "energy_type == 'gravity'", weight: 0.33, category: "Energy" },
    { name: "keyword 'bina' (Hinglish: without)", weight: 0.29, category: "NLP Raw Text" },
    { name: "activity == 'crane lifting'", weight: 0.28, category: "Activity" },
    { name: "keyword 'nahi' (Hinglish: no/not)", weight: 0.24, category: "NLP Raw Text" },
    { name: "barrier_state == 'bypassed'", weight: 0.22, category: "Barrier" },
    { name: "energy_type == 'electrical'", weight: 0.19, category: "Energy" }
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Page Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-[#ea384c]">
              EEI Safety Chain Logic
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
              Triangulated Voting
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-1">
            SIF Potential & High-Energy Precursor Analysis
          </h2>
          <p className="text-xs text-slate-500">
            Audit how the AI distinguishes routine unsafe acts from catastrophic Serious Injury & Fatality (SIF) precursors
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Classification Principle</span>
            <span className="text-xs font-bold text-slate-800">"LLM is a reader, Rule is the judge"</span>
          </div>
        </div>
      </div>

      {/* Row 1: The Safety Chain Logic 2x2 Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* The Matrix Canvas (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-lg border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                EEI Safety Chain Logic Matrix
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">
                Energy Magnitude × Barrier Reliability
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              A report is triaged as a SIF precursor only when a <strong>high-energy source</strong> was present AND the <strong>barrier</strong> was missing, damaged, or bypassed.
            </p>
          </div>

          {/* Matrix Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* Quadrant 1: SIF PRECURSOR */}
            <div className="p-4 rounded-lg bg-red-50/80 border-2 border-red-400 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-[#ea384c] tracking-wide flex items-center gap-1.5">
                  <ShieldAlert size={16} />
                  SIF PRECURSOR ZONE
                </span>
                <span className="text-xs font-bold px-2 py-0.5 bg-[#ea384c] text-white rounded">
                  CRITICAL
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-700">
                High Energy + Failed Barrier
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                E.g. Scaffolding &gt;2m without harness, crane load over personnel, LOTO not isolated.
              </p>
              <div className="mt-3 pt-2 border-t border-red-200 flex items-baseline justify-between">
                <span className="text-[11px] text-slate-500">Reports in Zone:</span>
                <span className="text-base font-extrabold text-[#ea384c]">2,781 (22%)</span>
              </div>
            </div>

            {/* Quadrant 2: High Energy with Barrier Intact */}
            <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle size={16} className="text-emerald-600" />
                  Controlled High Energy
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                  DEFENSE IN DEPTH
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-700">
                High Energy + Barrier Intact
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Heavy lifting with certified rigging, high-pressure line with dual block & bleed.
              </p>
              <div className="mt-3 pt-2 border-t border-emerald-200 flex items-baseline justify-between">
                <span className="text-[11px] text-slate-500">Reports in Zone:</span>
                <span className="text-base font-bold text-emerald-700">840 (7%)</span>
              </div>
            </div>

            {/* Quadrant 3: Low Energy with Failed Barrier */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Activity size={16} className="text-slate-500" />
                  Minor Hazard (Low Energy)
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                  STANDARD UA/UC
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-700">
                Low Energy + Barrier Missing
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Tripping hazard in workshop walkway, hand tool missing wrist strap at ground level.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-200 flex items-baseline justify-between">
                <span className="text-[11px] text-slate-500">Reports in Zone:</span>
                <span className="text-base font-bold text-slate-800">4,620 (37%)</span>
              </div>
            </div>

            {/* Quadrant 4: Safe Routine Operations */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle size={16} className="text-slate-400" />
                  Safe Routine Compliance
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                  NORMAL
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-700">
                Low Energy + Barrier Intact
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Standard warehouse housekeeping, compliant PPE usage on routine office-to-rig transit.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-200 flex items-baseline justify-between">
                <span className="text-[11px] text-slate-500">Reports in Zone:</span>
                <span className="text-base font-bold text-slate-800">4,241 (34%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Triangulation Voting Engine (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-lg border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900">
                3-Way Disagreement Engine
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                Cross-Validated
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              To prevent AI hallucinations, three independent models cross-check each report. Disagreement routes directly to a human safety officer.
            </p>

            {/* The 3 Methods cards */}
            <div className="space-y-2.5">
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Method 1: Deterministic Rule Engine</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">100% Traceable</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Hand-written high-energy × failed-barrier logic. Zero black-box bias.
                </p>
              </div>

              <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Method 2: Random Forest + SHAP</span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Explainable ML</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Trained on structured SCL features with SHAP game-theoretic explainability.
                </p>
              </div>

              <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Method 3: Raw-Text Fallback Classifier</span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">Fail-Safe Net</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Reads unstructured Hinglish text directly; catches cases where JSON extraction failed.
                </p>
              </div>
            </div>
          </div>

          {/* Voting Consensus bar */}
          <div className="pt-4 border-t border-slate-100 mt-4">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-700">Consensus Rate:</span>
              <span className="text-emerald-600">96.0% Unanimous</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 flex overflow-hidden">
              <div className="bg-[#ea384c] h-full" style={{ width: '22%' }} title="SIF Confirmed: 22%" />
              <div className="bg-sky-500 h-full" style={{ width: '74%' }} title="Safe Confirmed: 74%" />
              <div className="bg-amber-400 h-full" style={{ width: '4%' }} title="Needs Human Review: 4%" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>SIF Confirmed (22%)</span>
              <span>Safe Confirmed (74%)</span>
              <span className="text-amber-600 font-semibold">Review Queue (4%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: SHAP Feature Importance & Empirical Energy Fatalities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* SHAP Weights (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-lg border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600" />
              SHAP Explainability: Top Features Driving SIF Decisions
            </h3>
            <span className="text-[10px] font-mono text-slate-400">TreeExplainer (n=100)</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Shows which extracted parameters and Hinglish keywords most strongly increase the model's likelihood of flagging a SIF precursor.
          </p>

          <div className="space-y-2.5">
            {shapFeatures.map((f, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs">
                <div className="w-56 truncate font-medium text-slate-800" title={f.name}>
                  {f.name}
                </div>
                <div className="flex-1 bg-slate-100 rounded-sm h-3.5 overflow-hidden">
                  <div 
                    className="bg-[#ea384c] h-full rounded-sm transition-all"
                    style={{ width: `${f.weight * 200}%` }}
                  />
                </div>
                <div className="w-12 text-right font-mono font-bold text-slate-700">
                  +{f.weight.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empirical Fatality Benchmark from Independent Data (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-lg border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Empirical Energy vs. Fatality Benchmark
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Independent government accident database verification: measured fatality rates when different energy types go unmitigated.
            </p>

            <div className="space-y-2">
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Electrical Arc / High Voltage</span>
                <span className="font-bold text-[#ea384c]">79.0% Fatal</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Suspended Load / Falling Object</span>
                <span className="font-bold text-[#ea384c]">77.8% Fatal</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Mobile Equipment & Vehicles</span>
                <span className="font-bold text-[#ea384c]">75.9% Fatal</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Chemical & Toxic Vapor</span>
                <span className="font-bold text-orange-600">74.2% Fatal</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Gravity Fall from Height</span>
                <span className="font-bold text-orange-600">64.5% Fatal</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs opacity-75">
                <span className="font-semibold text-slate-600">Mechanical Motion (Guarding)</span>
                <span className="font-bold text-slate-500">30.5% Fatal</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 italic">
            *This empirical spread justifies why high-energy sources must be prioritized over routine minor mechanical citations.
          </div>
        </div>
      </div>
    </div>
  );
};
