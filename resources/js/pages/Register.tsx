import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../api/axios';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agree) {
      toast.error('Необходимо согласиться с политикой конфиденциальности');
      return;
    }

    if (password !== passwordConfirmation) {
      toast.error('Пароли не совпадают');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/register', {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      const { user, token } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('Регистрация успешна!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
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
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">Создать аккаунт</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Имя</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Введите ваше имя"
                required
              />
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Повторите пароль"
                  required
                />
              </div>
            </div>

            {/* Чекбокс согласия */}
            <div className="flex items-start gap-2 pt-2">
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
              disabled={isLoading || !agree}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl transition-colors disabled:opacity-70 mt-2"
            >
              {isLoading ? 'Регистрация...' : 'Создать аккаунт'}
            </button>
          </form>

          <div className="text-center mt-6 text-sm">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-emerald-600 hover:underline font-medium">
              Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;