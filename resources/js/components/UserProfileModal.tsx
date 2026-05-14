import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { toast } from 'sonner';
import api from '../api/axios';
import ChangePasswordModal from './ChangePasswordModal';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal = ({ isOpen, onClose }: UserProfileModalProps) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.post('/user/profile', { name, email });
      
      // Обновляем данные в Redux
      dispatch({ type: 'auth/updateUser', payload: response.data.user });
      
      toast.success('Профиль обновлён!');
      setEditingName(false);
      setEditingEmail(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка обновления');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth';
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative">
          {/* Кнопка закрытия */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>

          {/* Шапка */}
          <div className="px-8 pt-8 pb-6 text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-white shadow-md">
                <img 
                  src={user?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200"} 
                  alt="Фото" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <button className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                ✏️ Загрузить фото
              </button>
            </div>

            <h2 className="text-2xl font-bold mt-4">Личные данные</h2>
          </div>

          <div className="px-8 pb-8 space-y-6">
            {/* Имя */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Имя</label>
              <div className="flex items-center gap-2 border rounded-2xl px-4 py-3">
                <span className="text-emerald-600 cursor-pointer" onClick={() => setEditingName(!editingName)}>✏️</span>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  disabled={!editingName}
                  className="flex-1 outline-none disabled:bg-transparent" 
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <div className="flex items-center gap-2 border rounded-2xl px-4 py-3">
                <span className="text-emerald-600 cursor-pointer" onClick={() => setEditingEmail(!editingEmail)}>✏️</span>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!editingEmail}
                  className="flex-1 outline-none disabled:bg-transparent" 
                />
              </div>
            </div>

            {/* Безопасность */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Безопасность</label>
              <button 
                onClick={() => setShowChangePassword(true)}
                className="w-full py-3.5 bg-emerald-500 text-white rounded-2xl font-medium hover:bg-emerald-600"
              >
                Изменить пароль
              </button>
            </div>

            {/* Настройки уведомлений */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-3">Настройки уведомлений:</label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Push-уведомления</span>
                  <input type="checkbox" checked={pushEnabled} onChange={(e) => setPushEnabled(e.target.checked)} className="accent-emerald-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Email-уведомления</span>
                  <input type="checkbox" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} className="accent-emerald-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Кнопки */}
          <div className="px-8 pb-8 space-y-3">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full py-3.5 bg-emerald-500 text-white rounded-2xl font-medium hover:bg-emerald-600 disabled:opacity-70"
            >
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>

            <button 
              onClick={handleLogout}
              className="w-full py-3.5 border border-red-500 text-red-500 rounded-2xl font-medium hover:bg-red-50 flex items-center justify-center gap-2"
            >
              🚪 Выйти из аккаунта
            </button>
          </div>
        </div>
      </div>

      <ChangePasswordModal 
        isOpen={showChangePassword} 
        onClose={() => setShowChangePassword(false)} 
      />
    </>
  );
};

export default UserProfileModal;