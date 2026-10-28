import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { User, Lock, LogIn } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      
      const res = await api.post('/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      localStorage.setItem('token', res.data.access_token);
      onLogin(res.data.access_token);
      navigate('/');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Sai tên đăng nhập hoặc mật khẩu!');
      } else {
        setError(`Lỗi kết nối: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">GasStation AI</h2>
          <p className="text-blue-100">Hệ thống Quản lý Trạm Xăng thông minh</p>
        </div>
        <div className="p-8">
          <h3 className="text-xl font-semibold text-slate-800 mb-6 text-center">Đăng nhập</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên đăng nhập</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-400" />
                </div>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Nhập tên tài khoản..."
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Nhập mật khẩu..."
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Đang xử lý...' : (
                <>
                  <LogIn size={18} className="mr-2" />
                  Đăng nhập
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-slate-500">
            Tài khoản mặc định: admin / password
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
