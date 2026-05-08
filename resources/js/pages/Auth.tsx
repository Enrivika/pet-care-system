import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../api/axios';
import { useDispatch } from 'react-redux';
import { login } from '../store/slices/authSlice';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const Auth = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // === LOGIN STATE ===
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // === REGISTER STATE ===
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  // === LOGIN HANDLER ===
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      await dispatch(login({ email: loginEmail, password: loginPassword }) as any).unwrap();
      toast.success('Добро пожаловать!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err || 'Ошибка входа');
    } finally {
      setLoginLoading(false);
    }
  };

  // === REGISTER HANDLER ===
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agree) {
      toast.error('Необходимо согласиться с политикой конфиденциальности');
      return;
    }
    if (regPassword !== regPasswordConfirm) {
      toast.error('Пароли не совпадают');
      return;
    }

    setRegLoading(true);

    try {
      const response = await api.post('/register', {
        name: regName,
        email: regEmail,
        password: regPassword,
        password_confirmation: regPasswordConfirm,
      });

      const { user, token } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('Регистрация успешна!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка регистрации');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E8F5E9] px-4">
      <div className="w-full max-w-md">
        {/* Логотип */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white text-4xl">🐾</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Petopia</h1>
          <p className="mt-2 text-gray-600">Уход за питомцами — просто и удобно</p>
        </div>

        {/* Карточка с вкладками */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Вкладки */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-4 font-medium text-center transition-colors ${
                activeTab === 'login' 
                  ? 'border-b-2 border-emerald-500 text-emerald-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Войти
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-4 font-medium text-center transition-colors ${
                activeTab === 'register' 
                  ? 'border-b-2 border-emerald-500 text-emerald-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Регистрация
            </button>
          </div>

          {/* Контент вкладок */}
          <div className="p-8">
            {/* ВХОД */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Введите ваш email..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Пароль</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Введите ваш пароль..."
                    required
                  />
                </div>

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

                  {/* Кнопка "Забыли пароль?" */}
                  <button 
                    type="button" 
                    onClick={() => setShowForgotModal(true)}
                    className="text-emerald-600 hover:underline"
                  >
                    Забыли пароль?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl transition-colors disabled:opacity-70 mt-2"
                >
                  {loginLoading ? 'Вход...' : 'Войти'}
                </button>
              </form>
            )}

            {/* РЕГИСТРАЦИЯ */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Имя</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Введите ваше имя"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Введите ваш email..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Пароль</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Придумайте пароль"
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Повторите</label>
                    <input
                      type="password"
                      value={regPasswordConfirm}
                      onChange={(e) => setRegPasswordConfirm(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Повторите пароль"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-emerald-500"
                  />
                  <label htmlFor="agree" className="text-sm text-gray-600">
                    Я согласен с{' '}
                    <a href="#" className="text-emerald-600 hover:underline">политикой конфиденциальности</a>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={regLoading || !agree}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl transition-colors disabled:opacity-70 mt-2"
                >
                  {regLoading ? 'Регистрация...' : 'Создать аккаунт'}
                </button>
              </form>
            )}
          </div>

          <div className="px-8 pb-6 text-center text-sm text-gray-500">
            {activeTab === 'login' ? (
              <>Нет аккаунта? <button onClick={() => setActiveTab('register')} className="text-emerald-600 hover:underline">Зарегистрироваться</button></>
            ) : (
              <>Уже есть аккаунт? <button onClick={() => setActiveTab('login')} className="text-emerald-600 hover:underline">Войти</button></>
            )}
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

export default Auth;