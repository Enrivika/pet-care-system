import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import api from '../api/axios';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  type: 'registration' | 'email_change';
  onSuccess?: (data?: any) => void;
}

const EmailVerificationModal = ({ 
  isOpen, 
  onClose, 
  email, 
  type, 
  onSuccess 
}: EmailVerificationModalProps) => {
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      resetForm();
      startResendTimer();
    } else {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setCode(Array(6).fill(''));
    setLoading(false);
    setResendLoading(false);
    setTimeLeft(60);
    setCanResend(false);
    inputsRef.current = [];
  };

  const startResendTimer = () => {
    setTimeLeft(60);
    setCanResend(false);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto focus next input
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setCode(digits);
      inputsRef.current[5]?.focus();
      e.preventDefault();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      toast.error('Введите полный 6-значный код');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/email-verification/verify', {
        email,
        code: fullCode,
        type,
      });

      toast.success(response.data.message || 'Email успешно подтверждён');

      if (onSuccess) {
        onSuccess(response.data);
      }

      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Неверный код');
      setCode(Array(6).fill(''));
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setResendLoading(true);

    try {
      // Backend теперь сам восстанавливает name/password для регистрации из предыдущей записи при повторной отправке
      await api.post('/email-verification/send', {
        email,
        type,
      });

      toast.success('Новый код отправлен');
      startResendTimer();
      setCode(Array(6).fill(''));
      inputsRef.current[0]?.focus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Не удалось отправить код');
    } finally {
      setResendLoading(false);
    }
  };

  const handleClose = () => {
    // Important: closing means verification was not completed
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120]">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Подтверждение email</h2>
          <p className="text-gray-600 mt-2 text-sm">
            Мы отправили 6-значный код на <span className="font-medium">{email}</span>
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputsRef.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-2xl focus:border-emerald-500 focus:outline-none transition-colors"
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || code.join('').length !== 6}
          className="w-full py-3.5 bg-emerald-500 text-white rounded-2xl font-medium hover:bg-emerald-600 disabled:opacity-70 mb-4"
        >
          {loading ? 'Проверка...' : 'Подтвердить'}
        </button>

        <div className="text-center text-sm">
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="text-emerald-600 hover:underline disabled:opacity-50"
            >
              {resendLoading ? 'Отправка...' : 'Отправить код повторно'}
            </button>
          ) : (
            <span className="text-gray-500">
              Отправить повторно через {timeLeft} сек.
            </span>
          )}
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={handleClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Отменить верификацию
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationModal;
