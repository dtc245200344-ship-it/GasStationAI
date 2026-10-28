import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, Database, Clock, FileText, Users } from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Tanks from './pages/Tanks';
import Shifts from './pages/Shifts';
import AIReports from './pages/AIReports';
import Prices from './pages/Prices';
import Employees from './pages/Employees';
import Chatbot from './components/Chatbot';
import Login from './pages/Login';
import api from './api';

const Sidebar = ({ onLogout, userInfo }) => (
  <div className="w-64 bg-slate-900/80 backdrop-blur-md border-r border-white/10 text-white min-h-screen p-4 flex flex-col">
    <div className="text-xl font-bold text-accent mb-8 mt-2 px-4">GasStation AI</div>
    <nav className="flex-1 space-y-2">
      {userInfo?.role === 'manager' && (
        <>
          <Link to="/" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            <LayoutDashboard size={20} /><span>Bảng điều khiển</span>
          </Link>
          <Link to="/prices" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            <Database size={20} /><span>Giá bán</span>
          </Link>
          <Link to="/tanks" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            <Database size={20} /><span>Bồn chứa</span>
          </Link>
        </>
      )}
      <Link to="/shifts" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
        <Clock size={20} /><span>Ca làm việc</span>
      </Link>
      {userInfo?.role === 'manager' && (
        <>
          <Link to="/employees" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            <Users size={20} /><span>Nhân viên</span>
          </Link>
          <Link to="/reports" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            <FileText size={20} /><span>Báo cáo AI</span>
          </Link>
        </>
      )}
    </nav>
    <div className="mt-auto border-t border-white/10 pt-4 pb-2 px-2 flex flex-col">
      <div className="flex items-center space-x-3 mb-4 px-2">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold uppercase">
          {userInfo?.username?.charAt(0) || 'U'}
        </div>
        <div>
          <div className="text-sm font-semibold capitalize text-white">{userInfo?.username}</div>
          <div className="text-xs text-blue-400">{userInfo?.role === 'manager' ? 'Quản lý (Manager)' : 'Nhân viên ca'}</div>
        </div>
      </div>
      <button onClick={onLogout} className="flex items-center justify-center w-full py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors">
        <span className="font-medium text-sm">Đăng xuất</span>
      </button>
    </div>
  </div>
);

const getUserInfo = (token) => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { role: payload.role, username: payload.sub };
  } catch (e) {
    return null;
  }
};

function App() {
  const [token, setToken] = React.useState(localStorage.getItem('token'));

  const handleLogin = (newToken) => {
    setToken(newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    delete api.defaults.headers.common['Authorization'];
  };

  if (!token) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>
      </Router>
    );
  }

  const userInfo = getUserInfo(token);
  const role = userInfo?.role;

  return (
    <Router>
      <div className="flex min-h-screen relative bg-slate-900 overflow-hidden">
        {/* Hình nền độc lập để áp dụng bộ lọc màu sắc (Sắc nét hơn, rực rỡ hơn) */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed contrast-125 saturate-150 brightness-105 z-0 pointer-events-none" 
          style={{ backgroundImage: "url('/bg.jpg')" }}
        ></div>
        
        {/* Lớp phủ siêu mỏng chỉ để làm dịu phần quá chói */}
        <div className="absolute inset-0 bg-slate-900/10 z-0 pointer-events-none"></div>

        <div className="relative z-10 flex w-full">
          {/* Sidebar làm bán trong suốt để hòa quyện với nền */}
          <Sidebar onLogout={handleLogout} userInfo={userInfo} />
          
          {/* Khung nội dung chính sáng hơn một chút để giữ cho chữ vẫn dễ đọc trên nền trong suốt */}
          <main className="flex-1 overflow-auto bg-white/85 backdrop-blur-md m-4 rounded-xl shadow-2xl p-4 border border-white/30">
            <Routes>
              <Route path="/" element={role === 'manager' ? <Dashboard /> : <Shifts />} />
              <Route path="/prices" element={role === 'manager' ? <Prices /> : <Shifts />} />
              <Route path="/tanks" element={role === 'manager' ? <Tanks /> : <Shifts />} />
              <Route path="/shifts" element={<Shifts />} />
              <Route path="/employees" element={role === 'manager' ? <Employees /> : <Shifts />} />
              <Route path="/reports" element={role === 'manager' ? <AIReports /> : <Shifts />} />
            </Routes>
          </main>
          <Chatbot />
        </div>
      </div>
    </Router>
  );
}

export default App;
