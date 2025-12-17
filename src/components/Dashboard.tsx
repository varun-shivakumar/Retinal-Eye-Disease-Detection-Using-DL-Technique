import React, { useMemo, useState, useEffect } from "react";
import { getScans, clearScans, ScanRecord } from "../lib/scanStorage"; 
import { useUser } from "@clerk/clerk-react"; 
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#A78BFA"];

function formatDate(ts?: string) {
  if (!ts) return "-";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function ImageModal({ src, alt, onClose }: { src: string | null; alt?: string; onClose: () => void }) {
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-white rounded shadow-lg max-w-3xl w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-end p-2">
          <button onClick={onClose} className="text-gray-600 hover:text-black px-3 py-1">Close</button>
        </div>
        <div className="p-4">
          <img src={src} alt={alt ?? "scan"} className="w-full h-auto max-h-[80vh] object-contain" />
        </div>
      </div>
    </div>
  );
}

export const Dashboard = (): JSX.Element => {
  const { user, isLoaded } = useUser(); 
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [modalSrc, setModalSrc] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded) {
      // Use "guest" if user is not logged in
      const userId = user ? user.id : "guest";
      setScans(getScans(userId));
    }
  }, [user, isLoaded]);

  const total = scans.length;
  const avgConfidence = total === 0 ? 0 : (scans.reduce((s, r) => s + Number(r.probability), 0) / total) * 100;
  const latestDate = scans.length ? scans[0].timestamp : null;

  const lineData = useMemo(() => {
    return scans
      .slice(0, 20)
      .slice()
      .reverse()
      .map((s) => ({
        date: new Date(s.timestamp).toLocaleDateString(),
        score: Number((Number(s.probability) * 100).toFixed(1)),
      }));
  }, [scans]);

  const counts: Record<string, number> = {};
  scans.forEach((s) => {
      const pred = s.prediction || "Unknown";
      counts[pred] = (counts[pred] || 0) + 1;
  });
  
  const pieData = Object.keys(counts).map((k, i) => ({ 
      name: k.replace(/_/g, " "), 
      value: counts[k], 
      color: COLORS[i % COLORS.length] 
  }));

  const exportCsv = () => {
    if (!scans.length) {
      alert("No scans to export.");
      return;
    }
    const rows = scans.map((s) => ({
      id: s.id,
      timestamp: s.timestamp,
      prediction: s.prediction,
      confidence: (Number(s.probability) * 100).toFixed(2),
    }));
    const header = Object.keys(rows[0]).join(",");
    const csv = [header, ...rows.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eye_scans_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const handleClear = () => {
    if (!confirm("Clear all scan history? This cannot be undone.")) return;
    const userId = user ? user.id : "guest";
    clearScans(userId);
    window.location.reload();
  };

  return (
    <div className="space-y-6 px-6 pb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-slate-800">Scan History & Trends</h3>
          <p className="text-sm text-slate-500">Overview of recent scans and risk trends</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-sm text-slate-400">Total scans</div>
            <div className="text-xl font-bold text-slate-700">{total}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-400">Avg. Confidence</div>
            <div className="text-xl font-bold text-blue-600">{avgConfidence.toFixed(1)}%</div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCsv} className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">Export CSV</button>
            <button onClick={handleClear} className="px-3 py-1 bg-rose-600 text-white rounded hover:bg-rose-700 text-sm">Clear History</button>
          </div>
        </div>
      </div>

      {scans.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded p-12 text-center text-slate-400">
            No scans recorded yet. Upload an image to get started.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h4 className="text-md font-medium mb-4 text-slate-800">Confidence Trend</h4>
              <div style={{ height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart data={lineData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value: any) => [`${value}%`, "Confidence"]} contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} itemStyle={{ color: "#1e293b" }} />
                    <Area type="monotone" dataKey="score" stroke="#6366F1" strokeWidth={2} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h4 className="text-md font-medium mb-4 text-slate-800">Diagnoses</h4>
              <div style={{ height: 260 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} innerRadius={50} paddingAngle={4}>
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36}/>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h4 className="text-lg font-medium text-slate-800 mb-4">Recent Activity</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scans.slice(0, 6).map((s) => (
                <div key={s.id} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="w-16 h-16 flex-shrink-0 rounded bg-slate-200 overflow-hidden cursor-pointer" onClick={() => setModalSrc(s.imageDataUrl || null)}>
                    {s.imageDataUrl ? (
                      <img src={s.imageDataUrl} alt="scan" className="w-full h-full object-cover hover:scale-110 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No IMG</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-medium text-slate-900 capitalize">{s.prediction.replace(/_/g, " ")}</p>
                            <p className="text-xs text-slate-500">{formatDate(s.timestamp)}</p>
                        </div>
                        <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                            {(Number(s.probability) * 100).toFixed(0)}%
                        </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      
      {modalSrc && <ImageModal src={modalSrc} alt="Scan image" onClose={() => setModalSrc(null)} />}
    </div>
  );
};

export default Dashboard;
