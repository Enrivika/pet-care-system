import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout, updateUser } from '../store/slices/authSlice';
import { toast } from 'sonner';
import api from '../api/axios';
import ChangePasswordModal from './ChangePasswordModal';
import { subscribeToPush, unsubscribeFromPush } from '../utils/pushNotifications';
import { User, Pencil, Check, LogOut } from 'lucide-react';

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
  const [pushLoading, setPushLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  // Новое состояние для редактирования полей (по одному за раз)
  const [editingField, setEditingField] = useState<'name' | 'email' | null>(null);

  // Фото
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Загружаем актуальные данные при открытии
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPushEnabled(user.notify_push ?? true);
      setEmailEnabled(user.notify_email ?? false);
      setAvatarFile(null);
      setAvatarPreview(null);
      setEditingField(null);
    }
  }, [isOpen, user]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // === Работа с аватаром ===
  const handleAvatarButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите изображение');
      return;
    }

    setAvatarFile(file);

    // Превью
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const currentAvatarSrc = avatarPreview || (user?.avatar ? user.avatar : null);

  // === Inline editing для имени и email ===
  const startEditing = (field: 'name' | 'email') => {
    setEditingField(field);
  };

  const finishEditing = () => {
    setEditingField(null);
  };

  // === Web Push ===
  const handlePushToggle = async () => {
    const newValue = !pushEnabled;

    setPushEnabled(newValue);
    setPushLoading(true);

    try {
      if (newValue) {
        const success = await subscribeToPush();
        if (!success) {
          setPushEnabled(false);
          toast.error('Не удалось включить Push-уведомления');
          return;
        }
      } else {
        await unsubscribeFromPush();
      }

      await api.post('/user/profile', {
        name,
        email,
        notify_push: newValue,
      });

      dispatch(updateUser({ notify_push: newValue }));
      toast.success(newValue ? 'Push-уведомления включены' : 'Push-уведомления отключены');
    } catch (error: any) {
      setPushEnabled(!newValue);
      toast.error(error.response?.data?.message || 'Ошибка при изменении настроек');
    } finally {
      setPushLoading(false);
    }
  };

  // === Email уведомления ===
  const handleEmailToggle = async () => {
    const newValue = !emailEnabled;

    setEmailEnabled(newValue);
    setEmailLoading(true);

    try {
      await api.post('/user/profile', {
        name,
        email,
        notify_email: newValue,
      });
      dispatch(updateUser({ notify_email: newValue }));
      toast.success(newValue ? 'Email-уведомления включены' : 'Email-уведомления отключены');
    } catch (error: any) {
      // Откатываем визуальное состояние при ошибке
      setEmailEnabled(!newValue);
      toast.error(error.response?.data?.message || 'Ошибка при сохранении');
    } finally {
      setEmailLoading(false);
    }
  };

  // === Сохранение профиля (включая аватар) ===
  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('notify_email', emailEnabled ? '1' : '0');
      formData.append('notify_push', pushEnabled ? '1' : '0');

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await api.post('/user/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Обновляем Redux (включая новый avatar)
      dispatch(updateUser(response.data.user));

      toast.success('Профиль обновлён!');
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка обновления профиля');
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
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
        onClick={handleBackdropClick}
      >
        <div
          className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Кнопка закрытия */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
          >
            ✕
          </button>

          {/* Аватар + кнопка загрузки */}
          <div className="px-8 pt-8 pb-4 flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-emerald-100 flex items-center justify-center">
                {currentAvatarSrc ? (
                  <img
                    src={currentAvatarSrc}
                    alt="Аватар"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-emerald-600" />
                )}
              </div>

              <button
                onClick={handleAvatarButtonClick}
                className="absolute -bottom-1 -right-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow"
              >
                Загрузить фото
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <h2 className="text-2xl font-bold mt-4">Личные данные</h2>
          </div>

          <div className="px-8 pb-8 space-y-6">
            {/* Имя */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Имя</label>
              <div className={`flex items-center gap-2 border rounded-2xl px-4 py-3 transition-colors ${editingField === 'name' ? 'bg-white border-emerald-300' : 'bg-gray-100 border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => (editingField === 'name' ? finishEditing() : startEditing('name'))}
                  className="text-emerald-600 hover:text-emerald-700 flex-shrink-0"
                >
                  {editingField === 'name' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Pencil className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={editingField !== 'name'}
                  className={`flex-1 outline-none bg-transparent ${editingField === 'name' ? 'text-gray-900' : 'text-gray-700'}`}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <div className={`flex items-center gap-2 border rounded-2xl px-4 py-3 transition-colors ${editingField === 'email' ? 'bg-white border-emerald-300' : 'bg-gray-100 border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => (editingField === 'email' ? finishEditing() : startEditing('email'))}
                  className="text-emerald-600 hover:text-emerald-700 flex-shrink-0"
                >
                  {editingField === 'email' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Pencil className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={editingField !== 'email'}
                  className={`flex-1 outline-none bg-transparent ${editingField === 'email' ? 'text-gray-900' : 'text-gray-700'}`}
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
                <div className={`flex items-center justify-between ${pushLoading ? 'opacity-60 pointer-events-none' : ''}`}>
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
                <div className={`flex items-center justify-between ${emailLoading ? 'opacity-60 pointer-events-none' : ''}`}>
                  <span className="text-sm">Email-уведомления</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailEnabled}
                      onChange={handleEmailToggle}
                      disabled={emailLoading}
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
              <LogOut className="w-4 h-4" />
              Выйти из аккаунта
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