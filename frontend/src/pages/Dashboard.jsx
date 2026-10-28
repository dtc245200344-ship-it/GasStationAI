import React, { useState, useEffect } from 'react';
import api from '../api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const intervalId = setInterval(fetchStats, 3000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!stats) return <div className="p-8">Error loading dashboard stats.</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Tổng quan Trạm xăng</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg hover-lift">
          <h3 className="text-blue-100 font-medium mb-1">Doanh thu hôm nay</h3>
          <p className="text-3xl font-bold">{stats.revenue_today.toLocaleString('vi-VN')} đ</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl p-6 text-white shadow-lg hover-lift">
          <h3 className="text-emerald-100 font-medium mb-1">Xăng đã bán</h3>
          <p className="text-3xl font-bold">{stats.volume_sold_today.toLocaleString()} Lít</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-400 rounded-xl p-6 text-white shadow-lg hover-lift">
          <h3 className="text-amber-100 font-medium mb-1">Cảnh báo bất thường</h3>
          <p className="text-3xl font-bold">{stats.alerts_count}</p>
        </div>
      </div>

      {stats.alerts && stats.alerts.length > 0 && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-red-700 font-bold mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Chi tiết cảnh báo hệ thống
          </h3>
          <ul className="list-disc list-inside space-y-1 text-red-600 font-medium ml-2">
            {stats.alerts.map((alertMsg, idx) => (
              <li key={idx}>{alertMsg}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-slate-700">Sản lượng bán 7 ngày gần nhất (Lít)</h2>
          <div className="h-64 bg-slate-50 rounded border border-dashed border-slate-300 flex items-end p-4 space-x-2">
            {stats.weekly_chart.map((val, idx) => {
              const maxVal = Math.max(...stats.weekly_chart, 1);
              const heightPercentage = (val / maxVal) * 100;
              // Tính ngày thật: 6 ngày trước → hôm nay
              const dayDate = new Date();
              dayDate.setDate(dayDate.getDate() - (6 - idx));
              const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
              const dayLabel = dayNames[dayDate.getDay()];
              const dateLabel = `${dayDate.getDate()}/${dayDate.getMonth() + 1}`;
              return (
                <div key={idx} className="flex-1 flex flex-col justify-end items-center h-full group">
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {Math.round(val).toLocaleString('vi-VN')} L
                  </span>
                  <div 
                    className="w-full bg-blue-500 hover:bg-blue-600 transition-all rounded-t-sm relative flex items-end justify-center pb-2" 
                    style={{ height: `${Math.max(heightPercentage, 2)}%` }}
                  >
                    {heightPercentage > 20 && (
                      <span className="text-[10px] sm:text-xs font-bold text-white/90">
                        {Math.round(val).toLocaleString('vi-VN')}L
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-600 mt-1">{dayLabel}</span>
                  <span className="text-[9px] text-slate-400">{dateLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
          <h2 className="text-xl font-bold mb-4 text-slate-700">Lịch sử giao dịch gần đây</h2>
          <div className="overflow-y-auto flex-1 max-h-[300px]">
            {stats.recent_transactions && stats.recent_transactions.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 text-slate-600 font-semibold border-b">Loại</th>
                    <th className="p-3 text-slate-600 font-semibold border-b">Chi tiết</th>
                    <th className="p-3 text-slate-600 font-semibold border-b text-right">Khối lượng</th>
                    <th className="p-3 text-slate-600 font-semibold border-b text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recent_transactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${tx.type === 'SALE' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                          {tx.type === 'SALE' ? 'BÁN HÀNG' : 'NHẬP KHO'}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-700">{tx.description}</td>
                      <td className="p-3 text-right font-semibold text-slate-700">{tx.volume.toLocaleString('vi-VN')} L</td>
                      <td className="p-3 text-right text-slate-500">
                        {new Date(tx.timestamp).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-slate-500 text-center py-8">Chưa có giao dịch nào.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
