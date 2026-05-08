import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/slices/authSlice';
import { RootState } from '../store';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true); // По умолчанию включено
  const [showForgotModal, setShowForgotModal] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(login({ email, password }) as any).unwrap();
      
      // Если "Запомнить меня" выключено — не сохраняем в localStorage надолго
      if (!rememberMe) {
        // Можно добавить логику очистки через 1 час (пока просто уведомление)
        toast.info('Сессия не будет сохранена');
      }
      
      toast.success('Добро пожаловать!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err || 'Ошибка входа');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E8F5E9] px-4">
      <div className="w-full max-w-md">
        {/* Логотип и заголовок */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white text-4xl">🐾</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Petopia</h1>
          <p className="mt-2 text-gray-600">Уход за питомцами — просто и удобно</p>
        </div>

        {/* Карточка */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">Войти в аккаунт</h2>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Введите ваш пароль..."
                required
              />
            </div>

            {/* Чекбокс "Запомнить меня" */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500"
                />
                <span className="text-gray-600">Запомнить меня</span>
              </label>

              <button 
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-emerald-600 hover:underline"
              >
                Забыли пароль?
              </button>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl transition-colors disabled:opacity-70 mt-2"
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="text-center mt-6 text-sm">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-emerald-600 hover:underline font-medium">
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>

      {/* Модалка сброса пароля */}
      <ForgotPasswordModal 
        isOpen={showForgotModal} 
        onClose={() => setShowForgotModal(false)} 
      />
    </div>
  );
};

export default Login;