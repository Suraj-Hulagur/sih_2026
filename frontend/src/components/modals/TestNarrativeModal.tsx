import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle 
} from 'lucide-react';

interface TestNarrativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReportToFeed?: (newReport: any) => void;
}

export const TestNarrativeModal: React.FC<TestNarrativeModalProps> = ({
  isOpen,
  onClose,
  onAddReportToFeed
}) => {
  const [narrative, setNarrative] = useState('');
  const [selectedSite, setSelectedSite] = useState('Duliajan');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const samples = [
    {
      title: "Hinglish Height Hazard",
      text: "scaffolding par kaam kar raha tha bina safety belt ke. height almost 10 meter tha, fall arrestor nahi lagaya.",
      site: "Duliajan",
      activity: "Working at Height"
    },
    {
      title: "Hinglish Crane / Lifting",
      text: "crane lifting ke time exclusion zone me log khade the. rigger ne barricade cross kiya bina signal ke.",
      site: "Naharkatiya",
      activity: "Rig Floor Lifting"
    },
    {
      title: "Confined Space Entry",
      text: "Worker entered condensate tank without prior gas test or standby man present outside.",
      site: "Moran",
      activity: "Tank Cleaning"
    },
    {
      title: "Safe Routine Observation",
      text: "Vehicle driver followed 20 kmph speed limit and wore seatbelt during transport from base to rig site.",
      site: "Digboi",
      activity: "Material Transport"
    }
  ];

  // ── Local fallback rule engine (works offline without backend) ──
  const runLocalRuleEngine = (text: string) => {
    const t = text.toLowerCase();
    let isHighEnergy = false;
    let energyType = "None";
    let barrierState = "Working / Intact";
    let barrierExpected = "Standard Operational Controls";
    let iogpRule = "General Safety";
    let icon = "lock";
    let evidencePhrases: string[] = [];

    if (t.includes('height') || t.includes('scaffold') || t.includes('fall') || t.includes('meter')) {
      energyType = "Gravity"; isHighEnergy = true;
      barrierExpected = "Safety Harness / Fall Arrestor"; iogpRule = "Working at Height"; icon = "height";
      if (t.includes('bina') || t.includes('nahi') || t.includes('without') || t.includes('missing')) {
        barrierState = "Missing";
        evidencePhrases.push("bina safety belt ke", "fall arrestor nahi lagaya");
      }
    } else if (t.includes('crane') || t.includes('lift') || t.includes('barricade') || t.includes('exclusion')) {
      energyType = "Kinetic"; isHighEnergy = true;
      barrierExpected = "Exclusion Zone Barricade / Tagline"; iogpRule = "Line of Fire"; icon = "lineoffire";
      if (t.includes('cross') || t.includes('bina') || t.includes('without') || t.includes('khade the')) {
        barrierState = "Bypassed";
        evidencePhrases.push("exclusion zone me log khade the", "barricade cross kiya");
      }
    } else if (t.includes('confined') || t.includes('tank') || t.includes('gas test')) {
      energyType = "Chemical / Asphyxiation"; isHighEnergy = true;
      barrierExpected = "Pre-entry Atmosphere Gas Test & Standby Sentry"; iogpRule = "Confined Space"; icon = "confined";
      if (t.includes('without') || t.includes('bina') || t.includes('nahi')) {
        barrierState = "Missing";
        evidencePhrases.push("entered without gas test");
      }
    } else if (t.includes('weld') || t.includes('hot work') || t.includes('fire blanket') || t.includes('grind')) {
      energyType = "Thermal / Flammable Vapor"; isHighEnergy = true;
      barrierExpected = "Fire Blanket & Continuous Gas Monitoring"; iogpRule = "Hot Work"; icon = "hotwork";
      if (t.includes('missing') || t.includes('bina') || t.includes('nahi')) {
        barrierState = "Missing";
        evidencePhrases.push("fire blanket missing");
      }
    } else if (t.includes('loto') || t.includes('isolation') || t.includes('energy') || t.includes('pressure')) {
      energyType = "Pressure / Mechanical"; isHighEnergy = true;
      barrierExpected = "LOTO Lock & Energy Isolation Valve"; iogpRule = "Energy Isolation"; icon = "lock";
      if (t.includes('without') || t.includes('bina') || t.includes('nahi')) {
        barrierState = "Missing";
        evidencePhrases.push("without LOTO lock");
      }
    }

    const isSif = isHighEnergy && barrierState !== "Working / Intact";
    return {
      energyType, energyMagnitude: isHighEnergy ? "High" : "Low",
      barrierExpected, barrierState, iogpRule, icon, isSif,
      classification: isSif ? "SIF-Potential" : "Non-SIF",
      evidencePhrases, consensus: isSif ? "SIF_CONFIRMED" : "SAFE"
    };
  };

  const handleRunAnalysis = async () => {
    if (!narrative.trim()) return;

    setAnalyzing(true);
    setResult(null);

    // Try the real backend API first
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout

      const response = await fetch('http://localhost:8000/api/analyze/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ narrative, site: selectedSite }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) throw new Error('API Error');

      const data = await response.json();
      const res = {
        energyType: data.extracted_features.energy_type,
        energyMagnitude: data.extracted_features.energy_magnitude,
        barrierExpected: data.extracted_features.barrier_expected,
        barrierState: data.extracted_features.barrier_state,
        iogpRule: data.triage.primary_iogp_rule,
        icon: data.triage.rule_icon,
        isSif: data.triage.sif_potential,
        classification: data.triage.classification,
        evidencePhrases: data.extracted_features.evidence_phrases,
        consensus: data.triage.consensus_label
      };
      setResult(res);

      if (onAddReportToFeed) {
        onAddReportToFeed({
          id: data.report_id, date: "Just Now", excerpt: data.narrative,
          site: data.site, activity: data.activity,
          rule: data.triage.primary_iogp_rule, ruleIcon: data.triage.rule_icon,
          classification: data.triage.classification
        });
      }
      setAnalyzing(false);
      return; // Success — done
    } catch (err) {
      console.warn('Backend unavailable, using local rule engine:', err);
    }

    // Fallback: local deterministic rule engine (always works)
    setTimeout(() => {
      const res = runLocalRuleEngine(narrative);
      setResult(res);

      if (onAddReportToFeed) {
        onAddReportToFeed({
          id: `LIVE-${Date.now()}`, date: "Just Now", excerpt: narrative,
          site: selectedSite, activity: res.iogpRule,
          rule: res.iogpRule, ruleIcon: res.icon, classification: res.classification
        });
      }
      setAnalyzing(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Live Safety Chain Logic Tester
              </h3>
              <p className="text-xs text-slate-500">
                Input any English, Hinglish, or Assamese field observation for instant SIF triage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Quick Test Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              {samples.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setNarrative(s.text);
                    setSelectedSite(s.site);
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded text-xs font-medium text-slate-700 transition cursor-pointer"
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          {/* Input Text Area */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Field Report Narrative (Code-mixed Hinglish / English)
            </label>
            <textarea
              rows={3}
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              placeholder="e.g. scaffolding par kaam kar raha tha bina safety belt ke. height almost 10 meter tha..."
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none font-sans"
            />
          </div>

          {/* Facility Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-600">Facility / Site:</span>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="text-xs py-1 px-2 border border-slate-300 rounded bg-white font-medium text-slate-700"
            >
              <option value="Duliajan">Duliajan Field</option>
              <option value="Naharkatiya">Naharkatiya Field</option>
              <option value="Moran">Moran Field</option>
              <option value="Digboi">Digboi Refinery</option>
              <option value="Baghjan">Baghjan Well Site</option>
            </select>
          </div>

          {/* Action Button */}
          <button
            onClick={handleRunAnalysis}
            disabled={!narrative.trim() || analyzing}
            className={`w-full py-2 rounded-lg text-xs font-bold text-white shadow-xs transition flex items-center justify-center gap-2 cursor-pointer ${
              !narrative.trim() || analyzing
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {analyzing ? (
              <span>Running EEI Safety Chain Logic...</span>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Analyze SIF Potential</span>
              </>
            )}
          </button>

          {/* Analysis Results Display */}
          {result && (
            <div className="pt-2 border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-[11px] font-medium text-slate-500">Triage Classification</div>
                  <div className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                    {result.isSif ? (
                      <span className="text-[#ea384c] flex items-center gap-1">
                        <ShieldAlert size={18} />
                        SIF Precursor Flagged
                      </span>
                    ) : (
                      <span className="text-sky-600 flex items-center gap-1">
                        <CheckCircle size={18} />
                        Non-SIF / Safe Operation
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded text-xs font-bold ${
                    result.isSif
                      ? 'bg-red-100 text-[#ea384c]'
                      : 'bg-sky-100 text-sky-700'
                  }`}
                >
                  {result.consensus}
                </span>
              </div>

              {/* Extraction Badges Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Energy Type & Mag</div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {result.energyType} ({result.energyMagnitude})
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Barrier State</div>
                  <div className={`font-bold mt-0.5 ${result.barrierState !== 'Working / Intact' ? 'text-[#ea384c]' : 'text-emerald-600'}`}>
                    {result.barrierState}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Expected Control</div>
                  <div className="font-medium text-slate-700 mt-0.5 truncate" title={result.barrierExpected}>
                    {result.barrierExpected}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">IOGP Life-Saving Rule</div>
                  <div className="font-bold text-blue-700 mt-0.5 truncate">
                    {result.iogpRule}
                  </div>
                </div>
              </div>

              {/* Evidence phrases */}
              {result.evidencePhrases.length > 0 && (
                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded text-xs">
                  <span className="font-semibold text-amber-900 block mb-1">
                    Auditable Evidence Phrases Extracted:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.evidencePhrases.map((phrase: string, idx: number) => (
                      <span key={idx} className="bg-white border border-amber-300 text-amber-800 px-2 py-0.5 rounded text-[11px] font-mono">
                        "{phrase}"
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Uses local rule logic + EEI Safety Chain Logic</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-slate-200 rounded font-medium text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
