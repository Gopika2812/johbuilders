import React from 'react';
import { Layers, BarChart3, AlertCircle } from 'lucide-react';

const SummaryPlanning = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left animate-fadeIn">
      <div className="bg-white p-6 border border-gray-100 shadow-sm rounded-3xl">
        <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
          <Layers className="w-6 h-6 text-[#0e623a]" />
          <span>Summary Planning</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1">Holistic marketing performance, budget usage, and ROI indicators overview</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-emerald-50 text-[#0e623a] rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Summary Dashboard</h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto mt-2">
          Marketing Summary analytics and report logs are being synced with budget tables.
        </p>
      </div>
    </div>
  );
};

export default SummaryPlanning;
