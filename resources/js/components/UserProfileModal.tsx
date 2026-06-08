import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout, updateUser } from '../store/slices/authSlice';
import { toast } from 'sonner';
import api from '../api/axios';
import ChangePasswordModal from './ChangePasswordModal';
import { subscribeToPush, unsubscribeFromPush } from '../utils/pushNotifications';
import { User, Pencil, Check, LogOut, Trash2 } from 'lucide-react';
import EmailVerificationModal from './EmailVerificationModal';

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

  // Email verification for profile change
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [pendingNewEmail, setPendingNewEmail] = useState<string | null>(null);

  // Фото
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Загружаем актуальные данные при открытии
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setEmail(user.email || '');
      // Уведомления по умолчанию выключены для всех новых пользователей
      setPushEnabled(user.notify_push ?? false);
      setEmailEnabled(user.notify_email ?? false);
      setAvatarFile(null);
      setAvatarPreview(null);
      setRemoveAvatar(false);
      setEditingField(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

    // Максимальный размер аватарки — 5 МБ
    const MAX_SIZE = 5 * 1024 * 1024;

    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите изображение');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_SIZE) {
      toast.error('Файл слишком большой. Максимальный размер аватарки — 5 МБ.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setAvatarFile(file);
    setRemoveAvatar(false);

    // Превью
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Удаление аватара (или отмена выбора нового)
  const handleRemoveAvatar = () => {
    if (avatarFile || avatarPreview) {
      // Отменяем выбор нового файла
      setAvatarFile(null);
      setAvatarPreview(null);
    } else if (user?.avatar) {
      setRemoveAvatar(true);
    }
    // Сбрасываем value инпута, чтобы можно было выбрать тот же файл повторно
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelRemoval = () => {
    setRemoveAvatar(false);
  };

  const currentAvatarSrc = avatarPreview || (user?.avatar && !removeAvatar ? user.avatar : null);

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
    const originalEmail = user?.email;

    // If email has changed, trigger verification instead of direct save.
    // We set loading=true immediately to prevent the user from clicking "Сохранить изменения" multiple times
    // (spam protection while waiting for email verification).
    if (email !== originalEmail) {
      setLoading(true);
      setPendingNewEmail(email);

      try {
        await api.post('/email-verification/send', {
          email: email,
          type: 'email_change',
        });

        setShowEmailVerification(true);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Не удалось отправить код подтверждения');
        // Revert email in form and release the button
        setEmail(originalEmail || '');
        setLoading(false);
      }
      return;
    }

    // Normal save (name, notifications, avatar)
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('notify_email', emailEnabled ? '1' : '0');
      formData.append('notify_push', pushEnabled ? '1' : '0');

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      } else if (removeAvatar) {
        formData.append('remove_avatar', '1');
      }

      const response = await api.post('/user/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      dispatch(updateUser(response.data.user));

      toast.success('Профиль обновлён!');
      setAvatarFile(null);
      setAvatarPreview(null);
      setRemoveAvatar(false);
    } catch (error: any) {
      const data = error.response?.data;
      let errorMsg = data?.message || 'Ошибка обновления профиля';

      // Если это ошибка валидации — берём первое сообщение из errors
      if (data?.errors) {
        const firstKey = Object.keys(data.errors)[0];
        const firstErr = data.errors[firstKey];
        if (Array.isArray(firstErr) && firstErr[0]) {
          errorMsg = firstErr[0];
        }
      }

      // Переводим типичные английские сообщения Laravel на русский
      if (typeof errorMsg === 'string') {
        if (errorMsg.includes('must not be greater than') || errorMsg.includes('kilobytes')) {
          errorMsg = 'Файл слишком большой. Максимальный размер аватарки — 5 МБ.';
        } else if (errorMsg.toLowerCase().includes('the given data was invalid')) {
          errorMsg = 'Пожалуйста, проверьте введённые данные.';
        }
      }

      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Called after successful email verification in profile
  const handleEmailVerificationSuccess = (data: any) => {
    if (data.user) {
      dispatch(updateUser(data.user));
      toast.success('Email успешно изменён и подтверждён!');
    }
    setShowEmailVerification(false);
    setPendingNewEmail(null);
    // Release the Save button after successful verification
    setLoading(false);
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
          className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative mx-4"
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

              {/* Кнопка удаления сохранённого аватара */}
              {user?.avatar && !removeAvatar && !avatarPreview && (
                <button
                  onClick={handleRemoveAvatar}
                  className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow flex items-center justify-center"
                  title="Удалить фото"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Кнопка отмены выбора нового фото */}
              {(avatarFile || avatarPreview) && (
                <button
                  onClick={handleRemoveAvatar}
                  className="absolute -top-1 -right-1 bg-gray-500 hover:bg-gray-600 text-white p-1.5 rounded-full shadow flex items-center justify-center"
                  title="Отменить выбор"
                >
                  <span className="text-[10px] leading-none font-bold">✕</span>
                </button>
              )}

              <button
                onClick={handleAvatarButtonClick}
                className="absolute -bottom-1 -right-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow"
              >
                {currentAvatarSrc ? 'Изменить фото' : 'Загрузить фото'}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Подсказка при удалении */}
            {removeAvatar && (
              <div className="mt-2 flex items-center gap-2 text-center">
                <span className="text-xs text-red-600">Фото будет удалено при сохранении</span>
                <button
                  onClick={handleCancelRemoval}
                  className="text-xs text-emerald-600 hover:underline"
                >
                  Отменить
                </button>
              </div>
            )}

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

      <EmailVerificationModal
        isOpen={showEmailVerification}
        onClose={() => {
          // Important: closing means email change was not verified
          setShowEmailVerification(false);
          setPendingNewEmail(null);
          // Revert the email in the form to original
          setEmail(user?.email || '');
          // Release the Save button (spam protection ends when verification modal is dismissed)
          setLoading(false);
        }}
        email={pendingNewEmail || ''}
        type="email_change"
        onSuccess={handleEmailVerificationSuccess}
      />
    </>
  );
};

export default UserProfileModal;