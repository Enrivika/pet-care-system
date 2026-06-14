import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../api/axios';
import { useDispatch } from 'react-redux';
import { login, updateUser, setAuthAfterVerification } from '../store/slices/authSlice';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import EmailVerificationModal from '../components/EmailVerificationModal';
import { Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegPasswordConfirm, setShowRegPasswordConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  // Email verification state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);
  const [debugVerificationCode, setDebugVerificationCode] = useState<string | null>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setLoginEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      await dispatch(login({ email: loginEmail, password: loginPassword }) as any).unwrap();

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', loginEmail);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      toast.success('Добро пожаловать!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err || 'Ошибка входа');
    } finally {
      setLoginLoading(false);
    }
  };

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
      // Step 1: Send verification code instead of creating the account immediately
      const res = await api.post('/email-verification/send', {
        email: regEmail,
        type: 'registration',
        name: regName,
        password: regPassword,
        password_confirmation: regPasswordConfirm,
      });

      const debugCode = res.data?.debug_code || null;

      // Step 2: Store pending data and open verification modal
      setPendingRegistration({
        name: regName,
        email: regEmail,
        password: regPassword,
      });
      setDebugVerificationCode(debugCode);
      setShowVerificationModal(true);

    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка отправки кода подтверждения');
    } finally {
      setRegLoading(false);
    }
  };

  // Called after successful email verification during registration
  const handleRegistrationVerificationSuccess = (data: any) => {
    if (data.user && data.token) {
      // Use dedicated action instead of calling login thunk again.
      // The verification response already contains a valid token.
      dispatch(setAuthAfterVerification({ 
        user: data.user, 
        token: data.token 
      }) as any);

      toast.success('Регистрация успешно подтверждена!');
      setShowVerificationModal(false);
      setPendingRegistration(null);
      navigate('/dashboard');
    } else {
      toast.error('Не удалось завершить регистрацию после верификации');
    }
  };

  return (
<div className="min-h-[100dvh] bg-[#E8F5E9] px-4 py-3 relative overflow-hidden flex items-center justify-center">
    {/* Фон */}
    <div className="absolute inset-0 bg-[radial-gradient(#d1fae5_0.8px,transparent_1px)] bg-[length:4px_4px]"></div>

      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl relative z-10">
              <div 
        className="fixed bottom-20 right-0 lg:bottom-0 z-[70] pointer-events-none select-none"
        style={{ filter: 'blur(8px)' }}
      >
        <div className="rotate-[-30deg] origin-bottom-right -mr-64 -mb-10 sm:-mr-96 sm:-mb-16 md:-mr-128 md:-mb-22 lg:-mr-160 lg:-mb-26 xl:-mr-200 xl:-mb-32">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-[500px] h-[450px] sm:w-[650px] sm:h-[580px] md:w-[850px] md:h-[760px] lg:w-[900px] lg:h-[800px] xl:w-[1050px] xl:h-[930px] text-[#1F2421] opacity-10" 
            viewBox="0 0 320 280" 
            fill="currentColor"
          >
            {/* Left ear */}
            <polygon points="95,55 55,12 125,38" />
            {/* Right ear */}
            <polygon points="225,55 265,12 195,38" />
            {/* Head (main face) */}
            <ellipse cx="160" cy="155" rx="105" ry="92" />
            {/* Inner ears for better shape */}
            <polygon points="105,52 68,20 118,40" />
            <polygon points="215,52 252,20 202,40" />
          </svg>
        </div>
      </div>
        
        {/* Логотип + заголовок */}
<div className="flex flex-col items-center mb-16 sm:mb-6">
  <div className="flex items-center gap-3 sm:gap-4 mb-1.5 sm:mb-2">
    <img 
      src="/images/Petopia.png" 
      alt="Petopia" 
      className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain" 
    />
    
    <h1 
      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-[-0.03em]" 
      style={{ fontFamily: 'Itim, cursive' }}
    >
      Petopia
    </h1>
  </div>
  
  <p 
    className="text-base sm:text-lg md:text-xl text-gray-600 tracking-[-0.02em] text-center px-2"
    style={{ fontFamily: 'Inter, sans-serif' }}
  >
    Уход за питомцами — просто и удобно
  </p>
</div>

        {/* === КАРТОЧКА === */}
        <div className="relative w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto">
          
        {/* Кот и собака — десктоп */}
        <div className="absolute left-0 top-0 z-20 hidden sm:block -translate-x-1/2 -translate-y-1/2">
          <img 
            src="/images/Cat_and_dog.png" 
            alt="Котик и собачка" 
            className="w-32 h-32 object-contain drop-shadow-2xl pointer-events-none select-none" 
          />
        </div>
{/* Кот и собака — мобильный */}
<div className="absolute left-1/2 top-0 z-10 sm:hidden -translate-x-1/2 -translate-y-[65%]">
  <img 
    src="/images/Cat_and_dog.png" 
    alt="Котик и собачка" 
    className="w-32 h-32 object-contain drop-shadow-2xl pointer-events-none select-none" 
  />
</div>

          {/* Карточка */}
  <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 relative z-10">
            
            {/* Вкладки */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-3 sm:py-4 font-semibold text-base md:text-lg transition-all tracking-[-0.02em] ${activeTab === 'login' 
                  ? 'border-b-4 border-emerald-500 text-emerald-600' 
                  : 'text-gray-400 hover:text-gray-600'}`}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Войти
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-3 sm:py-4 font-semibold text-base md:text-lg transition-all tracking-[-0.02em] ${activeTab === 'register' 
                  ? 'border-b-4 border-emerald-500 text-emerald-600' 
                  : 'text-gray-400 hover:text-gray-600'}`}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Регистрация
              </button>
            </div>

            {/* Контент формы */}
            <div className="p-4 sm:p-5 md:p-8">
              
            {/* ВХОД */}
{activeTab === 'login' && (
  <form onSubmit={handleLogin} className="space-y-3.5 sm:space-y-4">
    <div>
      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 tracking-[-0.02em]" style={{ fontFamily: 'Inter, sans-serif' }}>Email</label>
      <input
        type="email"
        value={loginEmail}
        onChange={(e) => setLoginEmail(e.target.value)}
        className="w-full px-4 py-2.5 sm:py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base tracking-[-0.02em]"
        placeholder="Введите ваш email..."
        required
        style={{ fontFamily: 'Inter, sans-serif' }}
      />
    </div>

    <div>
      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 tracking-[-0.02em]" style={{ fontFamily: 'Inter, sans-serif' }}>Пароль</label>
      <div className="relative">
        <input
          type={showLoginPassword ? 'text' : 'password'}
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
          className="w-full px-4 py-2.5 sm:py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base pr-12 tracking-[-0.02em]"
          placeholder="Введите ваш пароль..."
          required
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
        <button
  type="button"
  onClick={() => setShowLoginPassword(!showLoginPassword)}
  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 flex items-center justify-center"
>
  {showLoginPassword ? <Eye size={17} /> : <EyeOff size={17} />}
</button>
      </div>
    </div>

    <div className="flex items-center justify-between text-sm pt-1">
      <label className="flex items-center gap-2 cursor-pointer">
<input
  type="checkbox"
  checked={rememberMe}
  onChange={(e) => setRememberMe(e.target.checked)}
  className="w-4 h-4 rounded border border-gray-300 accent-[#1F2421] checked:bg-[#1F2421] checked:border-[#1F2421]"
/>
        <span className="text-gray-600 tracking-[-0.02em]" style={{ fontFamily: 'Inter, sans-serif' }}>Запомнить меня</span>
      </label>

      <button 
        type="button" 
        onClick={() => setShowForgotModal(true)}
        className="text-emerald-600 hover:underline font-medium tracking-[-0.02em]"
      >
        Забыли пароль?
      </button>
    </div>

    <button
      type="submit"
      disabled={loginLoading}
      className="w-full py-3 sm:py-3.5 md:py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm sm:text-base md:text-lg rounded-2xl transition-all disabled:opacity-70 mt-1 shadow-lg shadow-emerald-200 tracking-[-0.02em]"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {loginLoading ? 'Вход...' : 'Войти'}
    </button>
  </form>
)}

            
            {/* РЕГИСТРАЦИЯ */}
{activeTab === 'register' && (
  <form onSubmit={handleRegister} className="space-y-3 sm:space-y-3.5">
    {/* Имя */}
    <div>
      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 tracking-[-0.02em]" style={{ fontFamily: 'Inter, sans-serif' }}>Имя</label>
      <input
        type="text"
        value={regName}
        onChange={(e) => setRegName(e.target.value)}
        className="w-full px-4 py-2.5 sm:py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base tracking-[-0.02em]"
        placeholder="Введите ваше имя"
        required
        style={{ fontFamily: 'Inter, sans-serif' }}
      />
    </div>

    {/* Email */}
    <div>
      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 tracking-[-0.02em]" style={{ fontFamily: 'Inter, sans-serif' }}>Email</label>
      <input
        type="email"
        value={regEmail}
        onChange={(e) => setRegEmail(e.target.value)}
        className="w-full px-4 py-2.5 sm:py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base tracking-[-0.02em]"
        placeholder="Введите ваш email..."
        required
        style={{ fontFamily: 'Inter, sans-serif' }}
      />
    </div>

    {/* Пароль */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div>
      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 tracking-[-0.02em]" style={{ fontFamily: 'Inter, sans-serif' }}>Пароль</label>
      <div className="relative">
        <input
          type={showRegPassword ? 'text' : 'password'}
          value={regPassword}
          onChange={(e) => setRegPassword(e.target.value)}
          className="w-full px-4 py-2.5 sm:py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base pr-12 tracking-[-0.02em]"
          placeholder="Придумайте пароль"
          required
          minLength={6}
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
        <button
  type="button"
  onClick={() => setShowRegPassword(!showRegPassword)}
  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 flex items-center justify-center"
>
  {showRegPassword ? <Eye size={17} /> : <EyeOff size={17} />}
</button>
      </div>
    </div>

    {/* Повторите пароль */}
    <div>
      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 tracking-[-0.02em]" style={{ fontFamily: 'Inter, sans-serif' }}>Повторите пароль</label>
      <div className="relative">
        <input
          type={showRegPasswordConfirm ? 'text' : 'password'}
          value={regPasswordConfirm}
          onChange={(e) => setRegPasswordConfirm(e.target.value)}
          className="w-full px-4 py-2.5 sm:py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base pr-12 tracking-[-0.02em]"
          placeholder="Повторите пароль"
          required
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
        <button
  type="button"
  onClick={() => setShowRegPasswordConfirm(!showRegPasswordConfirm)}
  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 flex items-center justify-center"
>
  {showRegPasswordConfirm ? <Eye size={17} /> : <EyeOff size={17} />}
</button>
      </div>
    </div>
    </div>

    {/* Согласие */}
    <div className="flex items-center gap-3 pt-0.5">
<input
  type="checkbox"
  id="agree"
  checked={agree}
  onChange={(e) => setAgree(e.target.checked)}
  className="w-4 h-4 rounded border border-gray-300 accent-[#1F2421] checked:bg-[#1F2421] checked:border-[#1F2421]"
/>
  <label htmlFor="agree" className="text-xs sm:text-sm text-gray-600 leading-tight tracking-[-0.02em]" style={{ fontFamily: 'Inter, sans-serif' }}>
    Я согласен с{' '}
    <a href="#" className="text-emerald-600 hover:underline font-medium">политикой конфиденциальности</a>
  </label>
</div>

    <button
      type="submit"
      disabled={regLoading || !agree}
      className="w-full py-3 sm:py-3.5 md:py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm sm:text-base md:text-lg rounded-2xl transition-all disabled:opacity-70 mt-1 shadow-lg shadow-emerald-200 tracking-[-0.02em]"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {regLoading ? 'Регистрация...' : 'Создать аккаунт'}
    </button>
  </form>
)}
          </div>
        </div>
      </div>
    </div>
    

      {/* Модалки */}
      <ForgotPasswordModal isOpen={showForgotModal} onClose={() => setShowForgotModal(false)} />
      <EmailVerificationModal
        isOpen={showVerificationModal}
        onClose={() => {
          setShowVerificationModal(false);
          setPendingRegistration(null);
          setDebugVerificationCode(null);
        }}
        email={pendingRegistration?.email || ''}
        type="registration"
        onSuccess={handleRegistrationVerificationSuccess}
        debugCode={debugVerificationCode}
      />
    </div>
  );
};

export default Auth;