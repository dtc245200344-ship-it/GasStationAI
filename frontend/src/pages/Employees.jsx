import React, { useState, useEffect } from 'react';
import api from '../api';

const Employees = () => {
  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState('');
  
  // Add User State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('employee');
  
  // Shifts Modal State
  const [showShiftsModal, setShowShiftsModal] = useState(false);
  const [selectedUserShifts, setSelectedUserShifts] = useState([]);
  const [selectedUsername, setSelectedUsername] = useState('');

  useEffect(() => {
    fetchUsers();
    const intervalId = setInterval(fetchUsers, 3000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users/list');
      setUsers(res.data);
    } catch (e) {
      setMsg('Lỗi khi tải danh sách nhân viên');
    }
  };

  const handleCreateUser = async () => {
    if (!newUsername || !newPassword) {
      setMsg('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }
    try {
      await api.post('/users/', {
        username: newUsername,
        password: newPassword,
        role: newRole
      });
      setMsg('Tạo tài khoản thành công!');
      setShowAddModal(false);
      setNewUsername('');
      setNewPassword('');
      fetchUsers();
    } catch (e) {
      setMsg(e.response?.data?.detail || 'Lỗi khi tạo tài khoản');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      setMsg('Cập nhật quyền thành công!');
      fetchUsers();
    } catch (e) {
      setMsg('Lỗi cập nhật quyền');
    }
  };

  const handleStatusChange = async (userId, currentStatus) => {
    try {
      await api.put(`/users/${userId}/status`, { is_active: !currentStatus });
      setMsg('Cập nhật trạng thái thành công!');
      fetchUsers();
    } catch (e) {
      setMsg('Lỗi cập nhật trạng thái');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) return;
    try {
      await api.delete(`/users/${userId}`);
      setMsg('Xóa nhân viên thành công!');
      fetchUsers();
    } catch (e) {
      setMsg('Lỗi khi xóa nhân viên');
    }
  };

  const viewShifts = async (userId, username) => {
    try {
      const res = await api.get(`/users/${userId}/shifts`);
      setSelectedUserShifts(res.data);
      setSelectedUsername(username);
      setShowShiftsModal(true);
    } catch (e) {
      setMsg('Lỗi khi tải danh sách ca làm việc');
    }
  };

  return (
    <div className="p-6 relative h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Quản lý Tài khoản Nhân viên</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Thêm Tài khoản
        </button>
      </div>
      
      {msg && <div className="p-4 mb-6 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">{msg}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500 uppercase tracking-wider">
              <th className="p-4 font-semibold">Tên đăng nhập</th>
              <th className="p-4 font-semibold">Phân quyền</th>
              <th className="p-4 font-semibold">Trạng thái</th>
              <th className="p-4 font-semibold">Lịch sử ca làm việc</th>
              <th className="p-4 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-800">{user.username}</td>
                <td className="p-4">
                  <select 
                    value={user.role} 
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="border border-slate-300 rounded p-1 outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="manager">Manager</option>
                    <option value="accountant">Accountant</option>
                    <option value="employee">Employee</option>
                  </select>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.is_active ? 'Đang hoạt động' : 'Đã khóa'}
                  </span>
                </td>
                <td className="p-4">
                  <button 
                    onClick={() => viewShifts(user.id, user.username)}
                    className="text-blue-600 hover:text-blue-800 underline text-sm"
                  >
                    Xem thời gian làm việc
                  </button>
                </td>
                <td className="p-4 text-right space-x-3">
                  <button 
                    onClick={() => handleStatusChange(user.id, user.is_active)} 
                    className={`text-sm font-medium ${user.is_active ? 'text-amber-600 hover:text-amber-800' : 'text-green-600 hover:text-green-800'}`}
                  >
                    {user.is_active ? 'Khóa' : 'Mở khóa'}
                  </button>
                  <button onClick={() => handleDelete(user.id)} className="text-sm font-medium text-red-600 hover:text-red-800">
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan="5" className="p-4 text-center text-slate-500">Chưa có tài khoản nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[400px] shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-slate-800">Cấp tài khoản mới</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên đăng nhập (Username)</label>
                <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phân quyền</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none">
                  <option value="employee">Nhân viên ca (Employee)</option>
                  <option value="manager">Quản lý (Manager)</option>
                  <option value="accountant">Kế toán (Accountant)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowAddModal(false)} className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition">Hủy</button>
              <button onClick={handleCreateUser} className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">Tạo Tài khoản</button>
            </div>
          </div>
        </div>
      )}

      {/* Shifts View Modal */}
      {showShiftsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[600px] max-h-[80vh] overflow-y-auto shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-slate-800">Lịch sử ca làm việc: {selectedUsername}</h3>
            
            <div className="space-y-3 mb-6">
              {selectedUserShifts.length > 0 ? selectedUserShifts.map(shift => {
                const start = new Date(shift.start_time);
                const end = shift.end_time ? new Date(shift.end_time) : null;
                
                let durationStr = "Đang diễn ra";
                if (end) {
                  const diffMs = end - start;
                  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                  durationStr = `${diffHrs} giờ ${diffMins} phút`;
                }

                return (
                  <div key={shift.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-700">Ca ID: {shift.id}</div>
                      <div className="text-sm text-slate-500">
                        Bắt đầu: {start.toLocaleString('vi-VN')}
                      </div>
                      {end && (
                        <div className="text-sm text-slate-500">
                          Kết thúc: {end.toLocaleString('vi-VN')}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${shift.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                        {shift.status === 'active' ? 'Đang trực' : 'Đã đóng ca'}
                      </span>
                      <div className="text-sm font-medium text-blue-600 mt-2">
                        {durationStr}
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-slate-500 text-center py-4">Nhân viên này chưa có ca làm việc nào.</p>
              )}
            </div>

            <div className="flex justify-end">
              <button onClick={() => setShowShiftsModal(false)} className="px-5 py-2 bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 rounded-lg transition">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
