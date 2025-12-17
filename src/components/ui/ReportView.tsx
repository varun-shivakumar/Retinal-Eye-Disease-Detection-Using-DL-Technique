import React from 'react';
import { Download, Activity, FileText } from 'lucide-react';
import { generateReport } from '@/lib/generatereport'; // Import your existing script

interface ReportViewProps {
  result: any; // Replace 'any' with your PredictionResult type if available
  patientName: string;
  originalImage: string;
}

export const ReportView: React.FC<ReportViewProps> = ({ result, patientName, originalImage }) => {
  
  const handleDownload = () => {
    // Calls your existing robust function
    generateReport(result, patientName);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-4xl mx-auto my-8">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity size={20} /> Medical Analysis Report
          </h2>
          <p className="text-slate-400 text-sm mt-1">AI-Assisted Retinal Screening</p>
        </div>
        <button 
          onClick={handleDownload}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg"
        >
          <Download size={18} /> Download PDF
        </button>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8">
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Left Col: Details */}
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-sm text-slate-500 uppercase font-bold mb-1">Prediction</p>
              <p className={`text-3xl font-bold ${result.predicted_disease === 'Normal' ? 'text-green-600' : 'text-red-600'}`}>
                {result.predicted_disease}
              </p>
              <p className="text-slate-600 mt-1">
                Confidence: <span className="font-mono font-bold">{(result.confidence * 100).toFixed(2)}%</span>
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <FileText size={16} /> Clinical Findings
              </h3>
              <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
                <li>Analysis performed on fundus image provided.</li>
                {result.predicted_disease !== 'Normal' ? (
                  <li>Potential indicators of {result.predicted_disease} detected in retinal structure.</li>
                ) : (
                  <li>No significant pathological features detected.</li>
                )}
                <li>Heatmap analysis correlates with prediction regions.</li>
              </ul>
            </div>
          </div>

          {/* Right Col: Images */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Original Scan</p>
              <img src={originalImage} alt="Original" className="w-full rounded-lg border border-slate-200" />
            </div>
            {result.heatmap_png_base64 && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Lesion Heatmap</p>
                <img src={`data:image/png;base64,${result.heatmap_png_base64}`} alt="Heatmap" className="w-full rounded-lg border border-slate-200" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};