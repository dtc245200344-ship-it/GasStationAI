import React, { useState, useEffect } from 'react';
import api from '../api';

const Tanks = () => {
  const [tanks, setTanks] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [showTankModal, setShowTankModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form states
  const [newProduct, setNewProduct] = useState({ name: '', price: '' });
  const [newTank, setNewTank] = useState({ name: '', capacity: '', product_id: '' });
  const [importData, setImportData] = useState({ tank_id: '', volume: '' });

  // Search states
  const [searchTank, setSearchTank] = useState('');
  const [searchProduct, setSearchProduct] = useState('');

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 15000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchData = async () => {
    try {
      const [tanksRes, productsRes] = await Promise.all([
        api.get('/tanks/'),
        api.get('/products/')
      ]);
      setTanks(tanksRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      await api.post('/products/', {
        name: newProduct.name,
        price: parseFloat(newProduct.price)
      });
      setShowProductModal(false);
      setNewProduct({ name: '', price: '' });
      fetchData();
    } catch (e) {
      alert('Lỗi khi thêm mặt hàng');
    }
  };

  const handleAddTank = async () => {
    try {
      await api.post('/tanks/', {
        name: newTank.name,
        capacity: parseFloat(newTank.capacity),
        product_id: parseInt(newTank.product_id)
      });
      setShowTankModal(false);
      setNewTank({ name: '', capacity: '', product_id: '' });
      fetchData();
    } catch (e) {
      alert('Lỗi khi thêm bồn chứa');
    }
  };

  const handleImport = async () => {
    try {
      await api.post('/imports/', {
        tank_id: parseInt(importData.tank_id),
        volume: parseFloat(importData.volume)
      });
      setShowImportModal(false);
      setImportData({ tank_id: '', volume: '' });
      fetchData();
    } catch (e) {
      alert(e.response?.data?.detail || 'Lỗi khi nhập hàng');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Quản lý bồn chứa & Mặt hàng</h1>
        <div className="space-x-2">
          <button onClick={() => setShowProductModal(true)} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300 transition">Thêm Mặt hàng</button>
          <button onClick={() => setShowTankModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Thêm Bồn chứa</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Danh sách Bồn chứa</h2>
          <input 
            type="text" 
            placeholder="Lọc bồn chứa..." 
            value={searchTank}
            onChange={e => setSearchTank(e.target.value)}
            className="w-full mb-4 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none"
          />
          <div className="space-y-4">
            {tanks.filter(t => t.name.toLowerCase().includes(searchTank.toLowerCase())).map(tank => {
              const percentage = tank.capacity > 0 ? (tank.current_volume / tank.capacity) * 100 : 0;
              const formattedPercentage = percentage.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
              const formattedVolume = tank.current_volume.toLocaleString('vi-VN');
              const formattedCapacity = tank.capacity.toLocaleString('vi-VN');
              
              return (
                <div key={tank.id} className="p-4 border rounded-lg flex flex-col hover-lift bg-slate-50 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg">{tank.name}</p>
                      <button 
                        onClick={() => { setImportData({ ...importData, tank_id: tank.id }); setShowImportModal(true); }}
                        className="mt-2 text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded hover:bg-emerald-200 transition"
                      >
                        Nhập hàng
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-accent text-xl">{formattedPercentage}%</p>
                    </div>
                  </div>
                  
                  <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden shadow-inner">
                    <div 
                      className={`h-4 rounded-full transition-all duration-500 ${percentage < 20 ? 'bg-red-500' : percentage < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-sm font-medium text-slate-600 text-center tracking-wide">
                    {formattedVolume} / {formattedCapacity} L
                  </div>
                </div>
              );
            })}
            {tanks.length === 0 && <p className="text-slate-500">Chưa có bồn chứa nào.</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Danh sách Mặt hàng</h2>
          <input 
            type="text" 
            placeholder="Lọc mặt hàng..." 
            value={searchProduct}
            onChange={e => setSearchProduct(e.target.value)}
            className="w-full mb-4 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none"
          />
          <div className="space-y-4">
            {products.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase())).map(product => (
              <div key={product.id} className="p-4 border rounded-lg flex justify-between items-center hover-lift bg-slate-50">
                <p className="font-bold text-lg">{product.name} (ID: {product.id})</p>
                <p className="font-semibold text-green-600">{product.price.toLocaleString('vi-VN')} VND/L</p>
              </div>
            ))}
             {products.length === 0 && <p className="text-slate-500">Chưa có mặt hàng nào.</p>}
          </div>
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96">
            <h3 className="text-lg font-bold mb-4">Thêm Mặt hàng mới</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Tên mặt hàng</label>
                <input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm mb-1">Đơn giá (VND)</label>
                <input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full border rounded p-2" />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button onClick={() => setShowProductModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Hủy</button>
                <button onClick={handleAddProduct} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tank Modal */}
      {showTankModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96">
            <h3 className="text-lg font-bold mb-4">Thêm Bồn chứa mới</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Tên bồn</label>
                <input value={newTank.name} onChange={e => setNewTank({...newTank, name: e.target.value})} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm mb-1">Dung tích (L)</label>
                <input type="number" value={newTank.capacity} onChange={e => setNewTank({...newTank, capacity: e.target.value})} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm mb-1">Mặt hàng chứa (ID)</label>
                <select value={newTank.product_id} onChange={e => setNewTank({...newTank, product_id: e.target.value})} className="w-full border rounded p-2">
                  <option value="">-- Chọn mặt hàng --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button onClick={() => setShowTankModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Hủy</button>
                <button onClick={handleAddTank} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96">
            <h3 className="text-lg font-bold mb-4">Nhập nhiên liệu</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Số lượng nhập (L)</label>
                <input type="number" value={importData.volume} onChange={e => setImportData({...importData, volume: e.target.value})} className="w-full border rounded p-2" />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Hủy</button>
                <button onClick={handleImport} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Xác nhận</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tanks;
