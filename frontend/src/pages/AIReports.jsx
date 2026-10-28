import React, { useState } from 'react';
import api from '../api';
import { AlertCircle, FileText, Activity } from 'lucide-react';

const AIReports = () => {
  const [shiftId, setShiftId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateReport = async () => {
    if (!shiftId) return;
    setLoading(true);
    setError('');
    setReport(null);
    try {
      const res = await api.post(`/shifts/${shiftId}/ai-report`);
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Lỗi khi gọi AI service. Hãy kiểm tra API Key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Báo cáo Ca làm việc (AI Sinh)</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 flex space-x-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Mã Ca (Shift ID)</label>
          <input 
            type="number" 
            value={shiftId} 
            onChange={e => setShiftId(e.target.value)} 
            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none" 
            placeholder="Nhập ID ca đã kết thúc..." 
          />
        </div>
        <button 
          onClick={generateReport} 
          disabled={loading} 
          className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 h-[42px]"
        >
          {loading ? 'Đang phân tích...' : 'Phân tích AI'}
        </button>
      </div>

      {error && <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-center"><AlertCircle className="mr-2" size={20}/> {error}</div>}

      {report && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b p-4 flex items-center text-primary font-bold">
              <FileText className="mr-2" size={20}/> Tóm tắt Ca
            </div>
            <div className="p-6 text-slate-700">
              {report.shift_summary}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b p-4 flex items-center text-emerald-600 font-bold">
              <Activity className="mr-2" size={20}/> Phân tích Tồn bồn
            </div>
            <div className="p-6 text-slate-700 whitespace-pre-wrap">
              {report.inventory_analysis}
            </div>
          </div>

          {report.abnormalities_detected && report.abnormalities_detected.length > 0 && (
            <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 overflow-hidden">
              <div className="bg-red-100 border-b border-red-200 p-4 flex items-center text-red-700 font-bold">
                <AlertCircle className="mr-2" size={20}/> Cảnh báo Bất thường
              </div>
              <div className="p-6">
                <ul className="list-disc pl-5 text-red-800 space-y-2">
                  {report.abnormalities_detected.map((alert, idx) => (
                    <li key={idx}>{alert}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIReports;
