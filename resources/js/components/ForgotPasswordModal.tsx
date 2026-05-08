import { useState } from 'react';
import { toast } from 'sonner';
import api from '../api/axios';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal = ({ isOpen, onClose }: ForgotPasswordModalProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Введите email');
      return;
    }

    setIsLoading(true);

    try {
      // Здесь позже будет реальный API-запрос
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast.success('Ссылка для сброса пароля отправлена на почту!');
      onClose();
      setEmail('');
    } catch (error) {
      toast.error('Ошибка при отправке ссылки');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-4">Забыли пароль?</h2>
        
        <p className="text-center text-gray-600 mb-6">
          Введите ваш email, и мы отправим ссылку для сброса пароля
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Введите ваш email..."
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 bg-emerald-500 text-white rounded-2xl font-medium hover:bg-emerald-600 disabled:opacity-70"
            >
              {isLoading ? 'Отправка...' : 'Отправить ссылку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;