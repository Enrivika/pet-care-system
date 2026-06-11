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
  onSuccess,
}: EmailVerificationModalProps) => {
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<number | null>(null);

  // Reset state when modal opens/closes + start timer
  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    resetForm();
    startResendTimer();

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Close by ESC (как в ForgotPasswordModal)
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const resetForm = () => {
    setCode(Array(6).fill(''));
    setLoading(false);
    setResendLoading(false);
    setTimeLeft(60);
    setCanResend(false);
    inputsRef.current = [];
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startResendTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setTimeLeft(60);
    setCanResend(false);

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
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

      onSuccess?.(response.data);
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
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const codeLength = code.join('').length;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[120] px-4 py-4 sm:py-6 flex items-center justify-center"
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
        aria-label="Подтверждение email"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl sm:text-2xl"
          type="button"
          aria-label="Закрыть"
        >
          ✕
        </button>

        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-[-0.02em]">
            Подтверждение email
          </h2>

          <p className="text-gray-600 mt-2 text-xs sm:text-sm md:text-base leading-relaxed tracking-[-0.02em]">
  Мы отправили 6-значный код на
  <span className="block font-medium text-gray-800 break-all mt-1">{email}</span>
</p>
        </div>

        <div
          className="flex justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-6"
          onPaste={handlePaste}
        >
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="
                text-center font-semibold
                border-2 border-gray-300 rounded-2xl
                focus:border-emerald-500 focus:outline-none transition-colors
                w-10 h-12 text-lg
                sm:w-12 sm:h-14 sm:text-2xl
              "
              aria-label={`Цифра кода ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || codeLength !== 6}
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
            mb-3 sm:mb-4
          "
          type="button"
        >
          {loading ? 'Проверка...' : 'Подтвердить'}
        </button>

        <div className="text-center text-xs sm:text-sm md:text-base">
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="text-emerald-600 hover:underline disabled:opacity-50 font-medium tracking-[-0.02em]"
              type="button"
            >
              {resendLoading ? 'Отправка...' : 'Отправить код повторно'}
            </button>
          ) : (
            <span className="text-gray-500 tracking-[-0.02em]">
              Отправить повторно через {timeLeft} сек.
            </span>
          )}
        </div>

        <div className="mt-4 sm:mt-5 text-center">
          <button
            onClick={handleClose}
            className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 tracking-[-0.02em]"
            type="button"
          >
            Отменить верификацию
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationModal;