import React, { useState, useEffect } from 'react';
import api from '../api';

const Shifts = () => {
  const [activeShift, setActiveShift] = useState(null);
  const [saleVolume, setSaleVolume] = useState('');
  const [productId, setProductId] = useState(1);
  const [msg, setMsg] = useState('');
  const [aiReport, setAiReport] = useState(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [lastShiftId, setLastShiftId] = useState(null);
  
  // End shift states
  const [showEndShiftModal, setShowEndShiftModal] = useState(false);
  const [tanks, setTanks] = useState([]);
  const [actualVolumes, setActualVolumes] = useState({});

  useEffect(() => {
    fetchActiveShift();
    const intervalId = setInterval(fetchActiveShift, 15000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchActiveShift = async () => {
    try {
      const res = await api.get('/shifts/active');
      setActiveShift(res.data);
    } catch (e) {
      setActiveShift(null);
    }
  };

  const startShift = async () => {
    try {
      const res = await api.post('/shifts/start');
      setActiveShift(res.data);
      setAiReport(null);
      setLastShiftId(null);
      setMsg('Bắt đầu ca thành công!');
    } catch (error) {
      setMsg('Lỗi khi bắt đầu ca.');
    }
  };

  const handleEndShiftClick = async () => {
    try {
      const res = await api.get('/tanks/');
      setTanks(res.data);
      const initialVolumes = {};
      res.data.forEach(t => {
        initialVolumes[t.id] = t.current_volume;
      });
      setActualVolumes(initialVolumes);
      setShowEndShiftModal(true);
    } catch (e) {
      setMsg('Lỗi khi lấy thông tin bồn chứa.');
    }
  };

  const confirmEndShift = async () => {
    if (!activeShift) return;
    try {
      const shiftIdToClose = activeShift.id;
      const parsedVolumes = {};
      for (const key in actualVolumes) {
        parsedVolumes[key] = parseFloat(actualVolumes[key]);
      }
      
      await api.post(`/shifts/${shiftIdToClose}/end`, {
        actual_volumes: parsedVolumes
      });
      setActiveShift(null);
      setLastShiftId(shiftIdToClose);
      setShowEndShiftModal(false);
      setMsg('Kết thúc ca thành công! Bạn có thể xem báo cáo AI cho ca vừa rồi.');
    } catch (error) {
      setMsg('Lỗi khi kết thúc ca.');
    }
  };

  const recordSale = async () => {
    if (!activeShift) return;
    
    if (!productId || !saleVolume) {
      setMsg('Vui lòng nhập đầy đủ mã mặt hàng và số lượng bán.');
      return;
    }

    try {
      await api.post(`/sales/${activeShift.id}`, {
        product_id: parseInt(productId),
        volume: parseFloat(saleVolume)
      });
      setMsg('Ghi nhận bán hàng thành công!');
      setSaleVolume('');
    } catch (error) {
      const errDetail = error.response?.data?.detail;
      if (typeof errDetail === 'string') {
        setMsg(errDetail);
      } else {
        setMsg('Lỗi ghi nhận bán hàng. Vui lòng kiểm tra lại thông tin.');
      }
    }
  };

  const getAiReport = async () => {
    if (!lastShiftId) return;
    setIsLoadingReport(true);
    setMsg('Đang tạo báo cáo AI...');
    try {
      const res = await api.post(`/shifts/${lastShiftId}/ai-report`);
      setAiReport(res.data);
      setMsg('Tạo báo cáo AI thành công!');
    } catch (error) {
      setMsg(error.response?.data?.detail || 'Lỗi tạo báo cáo AI.');
    } finally {
      setIsLoadingReport(false);
    }
  };

  return (
    <div className="p-6 relative">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Quản lý Ca làm việc & Bán hàng</h1>
      
      {msg && <div className="p-4 mb-6 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">{msg}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Trạng thái Ca: {activeShift ? <span className="text-green-600">Đang hoạt động (ID: {activeShift.id})</span> : <span className="text-slate-500">Chưa bắt đầu</span>}</h2>
        <div className="space-x-4">
          <button onClick={startShift} disabled={activeShift !== null} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">Bắt đầu ca mới</button>
          <button onClick={handleEndShiftClick} disabled={activeShift === null} className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 transition">Kết thúc ca</button>
        </div>
      </div>

      {activeShift && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">Ghi nhận Bán hàng</h2>
          <div className="flex space-x-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Mặt hàng ID (VD: 1 cho RON 95)</label>
              <input type="number" value={productId} onChange={e => setProductId(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng bán (Lít)</label>
              <input type="number" value={saleVolume} onChange={e => setSaleVolume(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none" placeholder="Ví dụ: 50" />
            </div>
            <button onClick={recordSale} className="bg-emerald-500 text-white px-8 py-2 rounded-lg hover:bg-emerald-600 transition h-[42px]">Lưu</button>
          </div>
        </div>
      )}

      {!activeShift && lastShiftId && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Báo cáo AI cho Ca {lastShiftId}</h2>
          <button 
            onClick={getAiReport} 
            disabled={isLoadingReport} 
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition mb-4"
          >
            {isLoadingReport ? 'Đang phân tích...' : 'Phân tích số liệu bằng AI'}
          </button>
          
          {aiReport && (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-2">Tóm tắt ca</h3>
                <p className="text-slate-600 whitespace-pre-wrap">{aiReport.shift_summary}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-2">Phân tích tồn bồn</h3>
                <p className="text-slate-600 whitespace-pre-wrap">{aiReport.inventory_analysis}</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-amber-800 mb-2">Bất thường phát hiện</h3>
                {aiReport.abnormalities_detected && aiReport.abnormalities_detected.length > 0 ? (
                  <ul className="list-disc list-inside text-amber-700">
                    {aiReport.abnormalities_detected.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-amber-700">Không phát hiện bất thường.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* End Shift Modal */}
      {showEndShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[500px] max-h-[80vh] overflow-y-auto shadow-2xl">
            <h3 className="text-xl font-bold mb-2 text-slate-800">Kiểm kê cuối ca</h3>
            <p className="text-sm text-slate-600 mb-6">
              Vui lòng nhập số liệu tồn kho thực tế đo được (chốt bồn) trước khi đóng ca. 
              Hệ thống sẽ tính toán chênh lệch so với tồn lý thuyết.
            </p>
            <div className="space-y-4">
              {tanks.map(tank => (
                <div key={tank.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-700">{tank.name}</span>
                    <span className="text-sm font-medium text-slate-500">Tồn lý thuyết: <span className="text-blue-600">{tank.current_volume.toLocaleString('vi-VN')} L</span></span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Tồn thực tế đo được (Lít)</label>
                    <input 
                      type="number" 
                      value={actualVolumes[tank.id] ?? ''} 
                      onChange={e => setActualVolumes({...actualVolumes, [tank.id]: e.target.value})} 
                      className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg font-medium"
                    />
                  </div>
                </div>
              ))}
              
              <div className="flex justify-end space-x-3 mt-8">
                <button onClick={() => setShowEndShiftModal(false)} className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition">Hủy</button>
                <button onClick={confirmEndShift} className="px-5 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition shadow-sm hover:shadow-md">Xác nhận Đóng ca</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shifts;
