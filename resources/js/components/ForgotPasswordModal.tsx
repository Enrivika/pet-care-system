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
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] px-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
        
        <div className="absolute -top-12 -left-20 z-10">
          <img 
            src="/images/Cat_and_dog.png" 
            alt="Котик и собачка" 
            className="w-36 h-36 object-contain drop-shadow-xl" 
          />
        </div>

        <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">
          Забыли пароль?
        </h2>
        
        <p className="text-center text-gray-600 mb-8 leading-relaxed">
          Введите ваш email, и мы отправим<br />новый пароль на почту:
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg placeholder:text-gray-400"
              placeholder="Введите ваш email..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-lg rounded-2xl transition-all disabled:opacity-70 shadow-lg shadow-emerald-200"
          >
            {isLoading ? 'Отправка...' : 'Отправить новый пароль'}
          </button>
        </form>

        <button 
          onClick={onClose}
          className="block w-full text-center mt-6 text-emerald-600 hover:underline font-medium"
        >
          Вернуться на страницу входа
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;