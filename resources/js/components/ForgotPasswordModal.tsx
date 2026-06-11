import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '../api/axios';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal = ({ isOpen, onClose }: ForgotPasswordModalProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // (Опционально, но полезно) — закрывать по Esc
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Введите email');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/forgot-password', { email });

      toast.success('Новый пароль отправлен на вашу почту!');
      onClose();
      setEmail('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка при отправке');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[100] px-4 py-4 sm:py-6 flex items-center justify-center"
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
        role="dialog"
        aria-modal="true"
        aria-label="Забыли пароль"
      >
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-gray-900 mb-2 sm:mb-3 tracking-[-0.02em]">
          Забыли пароль?
        </h2>

        <p className="text-center text-sm sm:text-base md:text-lg text-gray-600 mb-5 sm:mb-7 leading-relaxed tracking-[-0.02em]">
          Введите ваш email, и мы отправим новый пароль на почту:
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full
                px-4 sm:px-5
                py-3 sm:py-3.5 md:py-4
                border border-gray-200 rounded-2xl
                focus:outline-none focus:ring-2 focus:ring-emerald-500
                text-sm sm:text-base md:text-lg
                placeholder:text-gray-400
                tracking-[-0.02em]
              "
              placeholder="Введите ваш email..."
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
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
            {isLoading ? 'Отправка...' : 'Отправить новый пароль'}
          </button>
        </form>

        <button
          onClick={onClose}
          className="block w-full text-center mt-4 sm:mt-5 md:mt-6 text-emerald-600 hover:underline font-medium text-sm sm:text-base tracking-[-0.02em]"
          type="button"
        >
          Вернуться на страницу входа
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;