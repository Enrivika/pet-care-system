import { useState } from 'react';
import api from '../api/axios';
import { toast } from 'sonner';

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
      onClose();
      
      // Очистка полей
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка смены пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110]">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Смена пароль</h2>

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
                className="absolute right-4 top-4 text-gray-400"
              >
                {showCurrent ? '🙈' : '👁️'}
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
                className="absolute right-4 top-4 text-gray-400"
              >
                {showNew ? '🙈' : '👁️'}
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
                className="absolute right-4 top-4 text-gray-400"
              >
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3.5 border rounded-2xl"
            >
              Отмена
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 bg-emerald-500 text-white rounded-2xl disabled:opacity-70"
            >
              {loading ? 'Сохранение...' : 'Изменить пароль'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;