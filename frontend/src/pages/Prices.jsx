import React, { useState, useEffect } from 'react';
import api from '../api';

const Prices = () => {
  const [products, setProducts] = useState([]);
  const [msg, setMsg] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingPrice, setEditingPrice] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
    const intervalId = setInterval(fetchProducts, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products/');
      setProducts(res.data);
      const initialEditing = {};
      res.data.forEach(p => {
        initialEditing[p.id] = p.price;
      });
      setEditingPrice(initialEditing);
    } catch (error) {
      setMsg('Lỗi khi tải danh sách mặt hàng.');
    }
  };

  const handlePriceChange = (id, value) => {
    setEditingPrice({ ...editingPrice, [id]: value });
  };

  const savePrice = async (id) => {
    try {
      await api.put(`/products/${id}/price`, { price: parseFloat(editingPrice[id]) });
      setMsg(`Cập nhật giá mặt hàng ID ${id} thành công!`);
      fetchProducts();
    } catch (error) {
      setMsg('Lỗi cập nhật giá. Vui lòng thử lại.');
    }
  };

  const syncPrices = async () => {
    setIsSyncing(true);
    setMsg('Đang lấy dữ liệu từ Petrolimex...');
    try {
      // Simulate delay for scraping
      await new Promise(r => setTimeout(r, 1500));
      await api.post('/products/sync-prices');
      setMsg('Đã đồng bộ giá thành công với thị trường Petrolimex!');
      fetchProducts();
    } catch (error) {
      setMsg('Lỗi khi đồng bộ giá thị trường.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Quản lý Giá Xăng Dầu</h1>
        <button 
          onClick={syncPrices}
          disabled={isSyncing}
          className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition flex items-center space-x-2 shadow-sm"
        >
          <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ giá thị trường (Petrolimex)'}</span>
        </button>
      </div>

      {msg && (
        <div className="p-4 mb-6 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
          {msg}
        </div>
      )}

      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Tìm kiếm mặt hàng theo tên..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none shadow-sm"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-700">Mã ID</th>
              <th className="p-4 font-semibold text-slate-700">Tên Mặt Hàng</th>
              <th className="p-4 font-semibold text-slate-700">Giá Hiện Tại (VNĐ/Lít)</th>
              <th className="p-4 font-semibold text-slate-700">Giá Mới (VNĐ)</th>
              <th className="p-4 font-semibold text-slate-700 w-32">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
              <tr key={product.id} className="hover:bg-slate-50 transition">
                <td className="p-4 font-medium text-slate-800">{product.id}</td>
                <td className="p-4 text-slate-600 font-semibold">{product.name}</td>
                <td className="p-4 text-slate-600">
                  {product.price ? product.price.toLocaleString() + ' đ' : 'Chưa có giá'}
                </td>
                <td className="p-4">
                  <input 
                    type="number" 
                    value={editingPrice[product.id] || ''}
                    onChange={(e) => handlePriceChange(product.id, e.target.value)}
                    className="border border-slate-300 rounded p-2 w-32 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </td>
                <td className="p-4">
                  <button 
                    onClick={() => savePrice(product.id)}
                    className="bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-600 transition"
                  >
                    Lưu
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Prices;
