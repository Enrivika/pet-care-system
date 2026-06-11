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

  // Reset state when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setLoading(false);
  }, [isOpen]);

  // Close by ESC (как в других модалках)
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Новые пароли не совпадают');
      return;
    }

    if (newPassword === currentPassword) {
      toast.error('Новый пароль не должен совпадать с текущим');
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[110] px-4 py-4 sm:py-6 flex items-center justify-center"
      onClick={handleBackdropClick}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div
        className="
          bg-white w-full max-w-md sm:max-w-lg
          rounded-3xl shadow-2xl relative
          p-5 sm:p-7 md:p-8
          max-h-[85dvh] overflow-auto
        "
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Смена пароля"
      >
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 sm:mb-6 tracking-[-0.02em] text-gray-900">
          Смена пароля
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Старый пароль */}
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 tracking-[-0.02em] text-gray-700">
              Старый пароль
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="
                  w-full
                  px-4 sm:px-5
                  py-3 sm:py-3.5
                  border border-gray-200 rounded-2xl pr-12
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  text-sm sm:text-base
                  placeholder:text-gray-400
                  tracking-[-0.02em]
                "
                placeholder="Введите старый пароль..."
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 flex items-center justify-center"
                aria-label={showCurrent ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showCurrent ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Новый пароль */}
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 tracking-[-0.02em] text-gray-700">
              Новый пароль
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="
                  w-full
                  px-4 sm:px-5
                  py-3 sm:py-3.5
                  border border-gray-200 rounded-2xl pr-12
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  text-sm sm:text-base
                  placeholder:text-gray-400
                  tracking-[-0.02em]
                "
                placeholder="Введите новый пароль..."
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 flex items-center justify-center"
                aria-label={showNew ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showNew ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Повтор нового пароля */}
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 tracking-[-0.02em] text-gray-700">
              Повторите новый пароль
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="
                  w-full
                  px-4 sm:px-5
                  py-3 sm:py-3.5
                  border border-gray-200 rounded-2xl pr-12
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  text-sm sm:text-base
                  placeholder:text-gray-400
                  tracking-[-0.02em]
                "
                placeholder="Повторите новый пароль..."
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 flex items-center justify-center"
                aria-label={showConfirm ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showConfirm ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-2 sm:pt-4">
            <button
              type="submit"
              disabled={loading || newPassword === currentPassword}
              className="
                w-full
                py-3 sm:py-3.5 md:py-4
                bg-emerald-500 hover:bg-emerald-600
                text-white font-semibold
                text-sm sm:text-base md:text-lg
                rounded-2xl transition-all
                disabled:opacity-70
                shadow-lg shadow-emerald-200
                tracking-[-0.02em]
              "
            >
              {loading ? 'Сохранение...' : 'Изменить пароль'}
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="
                w-full
                py-3 sm:py-3.5 md:py-4
                border border-gray-300 rounded-2xl
                hover:bg-gray-50
                text-sm sm:text-base md:text-lg
                tracking-[-0.02em]
              "
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