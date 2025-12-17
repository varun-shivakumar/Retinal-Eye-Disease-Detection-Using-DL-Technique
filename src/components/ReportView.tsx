import React from 'react';
import { Download, Activity, FileText, Calendar, User } from 'lucide-react';
import { generateReport } from '@/lib/generatereport'; // Importing your existing script
import { PredictionResult } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface ReportViewProps {
  result: PredictionResult;
  patientName: string;
  originalImage: string;
}

export const ReportView: React.FC<ReportViewProps> = ({ result, patientName, originalImage }) => {

  const handleDownload = () => {
    // This calls the function you already have in generatereport.ts
    generateReport(result, patientName);
  };

  // Format today's date for display
  const today = new Date().toLocaleDateString();

  return (
    <div className="w-full max-w-4xl mx-auto my-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* --- Header Section --- */}
      <div className="bg-slate-900 text-white p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            Medical Analysis Report
          </h2>
          <p className="text-slate-400 text-sm mt-1">AI-Assisted Retinal Screening</p>
        </div>
        
        {/* The Download Button */}
        <Button 
          onClick={handleDownload}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-lg transition-all"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* --- Meta Info Bar --- */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap gap-6 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="font-medium">Patient:</span> {patientName || "Anonymous"}
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="font-medium">Date:</span> {today}
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
        
        {/* Left Column: Findings & Text */}
        <div className="space-y-6">
          {/* Diagnosis Box */}
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Primary Diagnosis
            </p>
            <div className="flex items-baseline gap-3">
              <h3 className={`text-3xl font-bold ${
                result.predicted_disease === 'Normal' ? 'text-green-600' : 'text-red-600'
              }`}>
                {result.predicted_disease.replace(/_/g, ' ')}
              </h3>
            </div>
            <p className="text-slate-500 mt-2 text-sm">
              Confidence Score: <span className="font-mono font-medium text-slate-900">
                {(result.confidence * 100).toFixed(2)}%
              </span>
            </p>
          </div>

          {/* Clinical Notes / Explanation */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              Clinical Assessment
            </h4>
            <div className="text-sm text-slate-600 space-y-3 pl-3 border-l-2 border-slate-200">
              <p>
                Automated analysis of the fundus image indicates 
                {result.predicted_disease === 'Normal' 
                  ? ' no significant pathological features.' 
                  : ` potential signs of ${result.predicted_disease.replace(/_/g, ' ')}.`}
              </p>
              <p>
                {result.predicted_disease !== 'Normal' 
                  ? 'Segmentation analysis highlights regions of interest correlating with the predicted condition.'
                  : 'Retinal structures appear within normal limits based on the model\'s training parameters.'}
              </p>
              <p className="font-medium text-slate-800">
                Recommended Action: {result.predicted_disease === 'Normal' 
                  ? 'Routine annual follow-up.' 
                  : 'Referral to ophthalmologist for detailed examination.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Images Preview */}
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-3">Scan Visuals</p>
            <div className="grid grid-cols-2 gap-4">
              {/* Original Image */}
              <div className="space-y-2">
                <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                  <img 
                    src={originalImage} 
                    alt="Original Scan" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-center text-xs text-slate-500">Original</p>
              </div>
              
              {/* AI Heatmap (if available) */}
              {result.heatmap_png_base64 ? (
                <div className="space-y-2">
                  <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                    <img 
                      src={`data:image/png;base64,${result.heatmap_png_base64}`} 
                      alt="AI Analysis" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-center text-xs text-slate-500">AI Heatmap</p>
                </div>
              ) : (
                <div className="space-y-2">
                   <div className="aspect-square bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center">
                     <span className="text-xs text-slate-400">No Heatmap</span>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};