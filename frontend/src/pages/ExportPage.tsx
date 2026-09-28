import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Database, 
  CheckCircle, 
  ShieldCheck,
  Layers,
  Loader2,
  History,
  FileBox
} from 'lucide-react';

export const ExportPage: React.FC = () => {
  const [format, setFormat] = useState<'xlsx' | 'csv' | 'pdf' | 'json'>('xlsx');
  const [onlySif, setOnlySif] = useState(false);
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/uploads');
        if (res.ok) {
          const data = await res.json();
          setUploadHistory(data.uploads || []);
        }
      } catch (err) {
        console.error("Failed to fetch upload history", err);
      }
    };
    fetchHistory();
  }, []);

  const handleExport = async () => {
    setGenerating(true);
    setDownloadSuccess(false);

    try {
      const response = await fetch('http://localhost:8000/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: format,
          only_sif: onlySif,
          include_evidence: includeEvidence,
          site: 'All Sites'
        })
      });

      if (!response.ok) {
        throw new Error('Export failed on the backend');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      const extension = format;
      downloadAnchor.download = `oil_india_hsse_sif_report.${extension}`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      window.URL.revokeObjectURL(url);
      
      setDownloadSuccess(true);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to generate export. Please ensure the backend is running.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
              DGMS & Corporate HSE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
              Audit Compliance
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-1">
            Data Export & Regulatory Dossier Generator
          </h2>
          <p className="text-xs text-slate-500">
            Export structured triage databases, SCL feature extractions, and executive safety summaries
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Export Configuration Form (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-lg border border-slate-200/90 shadow-2xs space-y-5">
          {/* Format Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Select Export Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`p-3 rounded-lg border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                  format === 'xlsx'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/10'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <FileSpreadsheet size={22} className={format === 'xlsx' ? 'text-emerald-600' : 'text-slate-400'} />
                <span className="text-xs font-bold text-slate-800">Excel (.xlsx)</span>
                <span className="text-[10px] text-slate-500">Full 12-col schema</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-lg border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                  format === 'csv'
                    ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/10'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <Database size={22} className={format === 'csv' ? 'text-blue-600' : 'text-slate-400'} />
                <span className="text-xs font-bold text-slate-800">CSV Ledger</span>
                <span className="text-[10px] text-slate-500">Clean flat text</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`p-3 rounded-lg border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                  format === 'pdf'
                    ? 'border-red-500 bg-red-50/60 ring-2 ring-red-500/10'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <FileText size={22} className={format === 'pdf' ? 'text-red-600' : 'text-slate-400'} />
                <span className="text-xs font-bold text-slate-800">PDF Dossier</span>
                <span className="text-[10px] text-slate-500">Board executive view</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`p-3 rounded-lg border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                  format === 'json'
                    ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/10'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <Layers size={22} className={format === 'json' ? 'text-indigo-600' : 'text-slate-400'} />
                <span className="text-xs font-bold text-slate-800">JSON Feed</span>
                <span className="text-[10px] text-slate-500">SCL parsed objects</span>
              </button>
            </div>
          </div>

          {/* Filtering Options */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              2. Filter Export Scope
            </label>
            <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlySif}
                  onChange={(e) => setOnlySif(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>Export only confirmed <strong>SIF-Potential Precursors (2,781 records)</strong></span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeEvidence}
                  onChange={(e) => setIncludeEvidence(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>Include auditable Hinglish/Assamese <strong>evidence quote snippets</strong></span>
              </label>
            </div>
          </div>

          {/* Trigger Button */}
          <button
            type="button"
            onClick={handleExport}
            disabled={generating}
            className={`w-full py-2.5 rounded-lg text-xs font-bold text-white shadow-xs transition flex items-center justify-center gap-2 cursor-pointer ${
              generating
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-[#0f172a] hover:bg-slate-800'
            }`}
          >
            {generating ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Compiling & Packaging Dossier...</span>
              </>
            ) : (
              <>
                <Download size={15} />
                <span>Generate & Download Export</span>
              </>
            )}
          </button>

          {downloadSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-600 shrink-0" />
              <span>Dossier successfully packaged and dispatched to your browser downloads!</span>
            </div>
          )}
        </div>

        {/* Right Column: 5 cols */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Upload History Box */}
          <div className="bg-white p-5 rounded-lg border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <History size={16} className="text-slate-600" />
              <h3 className="text-sm font-bold text-slate-900">Upload History</h3>
            </div>
            
            {uploadHistory.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {uploadHistory.map((h, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded border border-slate-200 flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileBox size={13} className="text-blue-500" /> 
                        <span className="truncate max-w-[140px]" title={h.filename}>{h.filename}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        {new Date(h.upload_date).toLocaleString()} • {h.records_processed} records
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-red-600">{h.sif_count} SIFs</span>
                      <span className="text-[10px] text-slate-500 block uppercase tracking-wider">{h.file_type}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-6 bg-slate-50 rounded border border-slate-100 border-dashed">
                No files uploaded yet.
              </p>
            )}
          </div>

          {/* Right Info Box: Corporate Governance */}
          <div className="bg-white p-5 rounded-lg border border-slate-200/90 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              Corporate HSE Regulatory Compliance
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Exported data bundles comply with Oil Industry Safety Directorate (OISD-GDN-166) and Directorate General of Mines Safety (DGMS) requirements for serious bodily injury and dangerous occurrence reporting.
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-xs font-bold text-slate-800 block">Auditable Traceability</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Every SIF classification links directly to the extracted high-energy magnitude and the specific physical barrier missing.
                </span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Cryptographic checksums generated on export</span>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

