import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { toast } from 'sonner';
import api from '../api/axios';
import ChangePasswordModal from './ChangePasswordModal';
import { subscribeToPush, unsubscribeFromPush } from '../utils/pushNotifications';

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
  const [pushLoading, setPushLoading] = useState(false);

  // Загружаем актуальные данные при открытии
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPushEnabled(user.notify_push ?? true);
      setEmailEnabled(user.notify_email ?? false);
    }
  }, [isOpen, user]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Web Push-уведомления [переключатель]
  const handlePushToggle = async () => {
    const newValue = !pushEnabled;
    
    // Сразу меняем состояние (оптимистично)
    setPushEnabled(newValue);
    setPushLoading(true);

    try {
      if (newValue) {
        const success = await subscribeToPush();
        if (!success) {
          // Если не получилось — возвращаем назад
          setPushEnabled(false);
          toast.error('Не удалось включить Push-уведомления');
          return;
        }
      } else {
        await unsubscribeFromPush();
      }

      // Сохраняем в БД
      await api.post('/user/profile', {
        name: name,
        email: email,
        notify_push: newValue,
      });

      toast.success(newValue ? 'Push-уведомления включены' : 'Push-уведомления отключены');
    } catch (error: any) {
      // При ошибке возвращаем предыдущее состояние
      setPushEnabled(!newValue);
      toast.error(error.response?.data?.message || 'Ошибка при изменении настроек');
    } finally {
      setPushLoading(false);
    }
  };

  // Email-уведомления [переключатель]
  const handleEmailToggle = async () => {
    const newValue = !emailEnabled;
    
    try {
      await api.post('/user/profile', { 
        name: name,
        email: email,
        notify_email: newValue,
      });
      setEmailEnabled(newValue);
      toast.success(newValue ? 'Email-уведомления включены' : 'Email-уведомления отключены');
    } catch (erro: any) {
      toast.error(error.response?.data?.message || 'Ошибка при сохранении');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.post('/user/profile', { name, email });
      
      // Обновляем данные в Redux
      dispatch({ type: 'auth/updateUser', payload: response.data.user });
      
      toast.success('Профиль обновлён!');   
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={handleBackdropClick}>
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
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
              <label className="block text-sm font-medium text-gray-600 mb-4">Настройки уведомлений:</label>
              
              <div className="space-y-4">
                {/* Push */}
                <div className="flex items-center justify-between">
                  <span className="text-sm">Push-уведомления</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={pushEnabled} 
                      onChange={handlePushToggle}
                      disabled={pushLoading}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Email */}
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email-уведомления</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={emailEnabled} 
                      onChange={handleEmailToggle}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
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