import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Loader2 
} from 'lucide-react';
import type { UploadedFileSummary } from '../../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (summary: UploadedFileSummary) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [progress, setProgress] = useState(0);
  const [resultSummary, setResultSummary] = useState<UploadedFileSummary | null>(null);
  const [uploadHistory, setUploadHistory] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      fetch('https://sih-2026-o0pk.onrender.com/api/uploads')
        .then(res => res.json())
        .then(data => setUploadHistory(data.uploads || []))
        .catch(err => console.error("Failed to fetch upload history", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls', 'pdf'].includes(ext || '')) {
      alert('Please upload only CSV, Excel (.xlsx/.xls), or PDF files.');
      return;
    }
    setSelectedFile(file);
    setResultSummary(null);
  };

  const handleStartProcessing = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(15);
    setProcessingStage('Uploading file to backend...');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Small visual delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(45);
      setProcessingStage('Processing narratives through LLM and EEI Rule Engine...');

      const response = await fetch('https://sih-2026-o0pk.onrender.com/api/ingest/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      setProgress(85);
      setProcessingStage('Tagging IOGP Rules and triangulating...');

      const data = await response.json();

      setProgress(100);
      setIsProcessing(false);

      const summary: UploadedFileSummary = {
        name: data.file_name || selectedFile.name,
        size: `${(selectedFile.size / 1024).toFixed(1)} KB`,
        type: (data.file_type || selectedFile.name.split('.').pop()?.toLowerCase() || 'unknown'),
        recordCount: data.records_processed,
        sifCount: data.sif_precursors_flagged,
        status: 'completed'
      };

      setResultSummary(summary);
      onUploadSuccess(summary);

    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      setProgress(0);
      alert('Error uploading file. Make sure the backend is running.');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResultSummary(null);
    setIsProcessing(false);
    setProgress(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Batch Ingestion & Analysis
            </h3>
            <p className="text-xs text-slate-500">
              Upload field observation logs (CSV, Excel) or OISD incident summaries (PDF)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5">
          {!resultSummary ? (
            <div>
              {/* Dropzone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.pdf"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <UploadCloud size={24} />
                </div>

                <div className="text-sm font-semibold text-slate-800 mb-1">
                  Click to browse or drag and drop files
                </div>
                <div className="text-xs text-slate-500 max-w-xs mx-auto mb-3">
                  Supports safety reports in <strong>.CSV</strong>, <strong>.XLSX/.XLS</strong> spreadsheets, or <strong>.PDF</strong> case studies
                </div>

                <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <FileSpreadsheet size={13} className="text-emerald-600" /> Excel / CSV
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <FileText size={13} className="text-red-500" /> PDF Reports
                  </span>
                </div>
              </div>

              {/* Selected File Details */}
              {selectedFile && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedFile.name.endsWith('.pdf') ? (
                      <FileText size={20} className="text-red-500" />
                    ) : (
                      <FileSpreadsheet size={20} className="text-emerald-600" />
                    )}
                    <div>
                      <div className="text-xs font-semibold text-slate-800 line-clamp-1">
                        {selectedFile.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>

                  {!isProcessing && (
                    <button
                      onClick={handleReset}
                      className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
                    >
                      Change
                    </button>
                  )}
                </div>
              )}

              {/* Upload History */}
              {!selectedFile && uploadHistory.length > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Previous Uploads
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {uploadHistory.slice().reverse().map((upload) => (
                      <div key={upload.id} className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-100 transition">
                        <div className="flex items-center gap-3">
                          {upload.file_type === 'pdf' ? (
                            <FileText size={16} className="text-red-500" />
                          ) : (
                            <FileSpreadsheet size={16} className="text-emerald-600" />
                          )}
                          <div>
                            <div className="text-xs font-semibold text-slate-700 line-clamp-1" title={upload.filename}>
                              {upload.filename}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {upload.uploaded_at} • {upload.records_processed} records
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                          {upload.sif_count} SIF
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress Indicator */}
              {isProcessing && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Loader2 size={13} className="animate-spin text-blue-600" />
                      {processingStage}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Results Confirmation Screen */
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Batch Ingestion Successful!
              </h4>
              <p className="text-xs text-slate-600">
                Successfully parsed and applied SIF precursor logic to <strong>{selectedFile?.name}</strong>.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="p-2.5 bg-white rounded border border-emerald-100">
                  <div className="text-[11px] text-slate-500 font-medium">Records Processed</div>
                  <div className="text-lg font-extrabold text-slate-800">{resultSummary.recordCount}</div>
                </div>
                <div className="p-2.5 bg-white rounded border border-red-100">
                  <div className="text-[11px] text-red-500 font-medium flex items-center justify-center gap-1">
                    <AlertTriangle size={12} />
                    SIF Precursors
                  </div>
                  <div className="text-lg font-extrabold text-[#ea384c]">{resultSummary.sifCount}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          {!resultSummary ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartProcessing}
                disabled={!selectedFile || isProcessing}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md shadow-xs transition flex items-center gap-1.5 ${
                  !selectedFile || isProcessing
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Run SIF Analysis</span>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="px-4 py-1.5 text-xs font-semibold bg-[#0d1a2d] hover:bg-slate-800 text-white rounded-md transition cursor-pointer"
            >
              Done & View Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
