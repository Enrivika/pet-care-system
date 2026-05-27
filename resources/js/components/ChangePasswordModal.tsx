import { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Сброс формы каждый раз, когда модалка открывается заново
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setLoading(false);
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    // Полный сброс состояния при закрытии
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Новые пароли не совпадают');
      return;
    }

    setLoading(true);

    try {
      await api.post('/user/password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      toast.success('Пароль успешно изменён!');
      handleClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка смены пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110]"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-center mb-6">Смена пароля</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Старый пароль */}
          <div>
            <label className="block text-sm font-medium mb-2">Старый пароль</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 border rounded-2xl pr-12"
                placeholder="Введите старый пароль..."
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Новый пароль */}
          <div>
            <label className="block text-sm font-medium mb-2">Новый пароль</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border rounded-2xl pr-12"
                placeholder="Введите новый пароль..."
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Повтор нового пароля */}
          <div>
            <label className="block text-sm font-medium mb-2">Повторите новый пароль</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border rounded-2xl pr-12"
                placeholder="Повторите новый пароль..."
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-500 text-white rounded-2xl font-medium hover:bg-emerald-600 disabled:opacity-70"
            >
              {loading ? 'Сохранение...' : 'Изменить пароль'}
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3.5 border border-gray-300 rounded-2xl hover:bg-gray-50"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;