import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { completeTask, fetchAllTasks } from '../store/slices/calendarEventsSlice';
import { toast } from 'sonner';
import { getCategoryColor } from '../utils/categories';

interface CompleteTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
}

const CompleteTaskModal = ({ isOpen, onClose, task }: CompleteTaskModalProps) => {
  const dispatch = useDispatch();
  const [notes, setNotes] = useState('');
  const [keepRecurring, setKeepRecurring] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setNotes('');
      setKeepRecurring(true);
    }
  }, [isOpen, task?.id]);

  useEffect(() => {
    if (!task?.is_recurring) {
      setKeepRecurring(true);
    }
  }, [task?.is_recurring]);

  const handleClose = () => {
    onClose();
    setNotes('');
    setKeepRecurring(true);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const handleComplete = async () => {
    try {
      await dispatch(
        completeTask({
          id: task.id,
          notes: notes.trim() || undefined,
          keep_recurring: task.is_recurring ? keepRecurring : undefined,
        }) as any
      ).unwrap();

      toast.success('Задача отмечена как выполненная!');
      dispatch(fetchAllTasks() as any);
      handleClose();
    } catch (err: any) {
      toast.error(err || 'Ошибка выполнения задачи');
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div
  className="
    fixed inset-0 bg-black/60 z-[120]
    flex items-center justify-center
  "
      style={{
        padding:
          'max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))',
        fontFamily: 'Inter, sans-serif',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="
          bg-white w-full
          max-w-[420px] sm:max-w-md
          rounded-3xl shadow-2xl overflow-hidden
          max-h-[calc(100vh-24px)]
        "
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Отметить выполненным"
      >
        {/* Скролл только внутри, когда контента больше max-height */}
        <div
          className="overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 24px)' }}
        >
          {/* Контент */}
          <div className="px-4 pt-4 pb-3 min-[380px]:px-5 sm:px-8 sm:pt-7 sm:pb-5">
            <h2
              className="text-lg min-[380px]:text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6 tracking-[-0.02em]"
            >
              Отметить выполненным
            </h2>

            {/* Фото питомца + имя */}
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="w-14 h-14 min-[380px]:w-16 min-[380px]:h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-4 border-white shadow-md flex-shrink-0">
                <img
                  src={task.pet?.photo_url || task.pet?.photo || '/images/Cat_and_dog.png'}
                  alt={task.pet?.name || 'Питомец'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (target.src !== '/images/Cat_and_dog.png') target.src = '/images/Cat_and_dog.png';
                  }}
                />
              </div>

              <div className="min-w-0">
                <div className="text-[11px] min-[380px]:text-xs sm:text-sm text-gray-500 tracking-[-0.02em]">
                  Питомец
                </div>
                <div
                  className="font-semibold text-base min-[380px]:text-lg sm:text-xl tracking-[-0.02em] truncate"
                  title={task.pet?.name || 'Неизвестный питомец'}
                >
                  {task.pet?.name || 'Неизвестный питомец'}
                </div>
              </div>
            </div>

            {/* Дата и время */}
            <div className="mb-4 sm:mb-5">
              <div className="flex items-baseline gap-2 flex-wrap tracking-[-0.02em]">
                <div className="text-xs min-[380px]:text-sm text-gray-500 whitespace-nowrap">
                  Дата и время:
                </div>
                <div className="font-medium text-xs min-[380px]:text-sm sm:text-base">
                  {new Date(task.start_at).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}{' '}
                  в{' '}
                  {new Date(task.start_at).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>

            {/* Категория */}
            <div className="mb-4 sm:mb-5">
              <div className="text-xs min-[380px]:text-sm text-gray-500 mb-2 tracking-[-0.02em]">
                Категория
              </div>
              <div
                className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 rounded-2xl text-xs min-[380px]:text-sm font-medium tracking-[-0.02em]"
                style={{
                  backgroundColor: `${getCategoryColor(task.event_type)}20`,
                  color: getCategoryColor(task.event_type),
                }}
              >
                <img
                  src={`/images/${task.event_type}.png`}
                  alt={task.event_type}
                  className="w-4 h-4 min-[380px]:w-5 min-[380px]:h-5 flex-shrink-0"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    // если нет иконки — просто скрываем, чтобы не ломало верстку
                    target.style.display = 'none';
                  }}
                />
                <span className="truncate max-w-[220px] sm:max-w-none">{task.event_type}</span>
              </div>
            </div>

            {/* Название задачи */}
            <div className="mb-4 sm:mb-5">
              <div className="text-xs min-[380px]:text-sm text-gray-500 mb-1 tracking-[-0.02em]">
                Название задачи
              </div>

              <div
                className="font-medium text-sm min-[380px]:text-base sm:text-lg leading-snug line-clamp-2 tracking-[-0.02em]"
                title={task.title}
              >
                {task.title || '-'}
              </div>
            </div>

            {/* Повтор */}
            {task.is_recurring && (
              <div className="mb-4 sm:mb-6">
                <div className="text-sm sm:text-base font-medium mb-3 tracking-[-0.02em]">
                  Продолжить повторять эту задачу в будущем?
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setKeepRecurring(true)}
                    className={`py-3 sm:py-3.5 border rounded-2xl font-medium transition-colors text-sm sm:text-base tracking-[-0.02em] ${
                      keepRecurring
                        ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Да
                  </button>
                  <button
                    type="button"
                    onClick={() => setKeepRecurring(false)}
                    className={`py-3 sm:py-3.5 border rounded-2xl font-medium transition-colors text-sm sm:text-base tracking-[-0.02em] ${
                      !keepRecurring
                        ? 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Нет
                  </button>
                </div>
              </div>
            )}

            {/* Примечание */}
            <div className="mb-4 sm:mb-5">
              <label className="block text-sm sm:text-base font-medium mb-2 tracking-[-0.02em]">
                Примечание (необязательно)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Введите итоги задачи..."
                className="
                  w-full
                  px-4 py-2.5 sm:py-3
                  border rounded-2xl
                  h-20 min-[380px]:h-24
                  resize-none
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  text-sm sm:text-base
                  tracking-[-0.02em]
                "
              />
            </div>
          </div>

          {/* Кнопки (делаем “липкими” к низу контейнера, чтобы на телефоне всегда были под рукой) */}
          <div className="px-4 pb-4 min-[380px]:px-5 sm:px-8 sm:pb-7 flex gap-3 bg-white">
            <button
              onClick={handleClose}
              className="flex-1 py-3 sm:py-3.5 border border-gray-300 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-colors text-sm sm:text-base tracking-[-0.02em]"
            >
              Отмена
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 py-3 sm:py-3.5 bg-emerald-500 text-white rounded-2xl font-medium hover:bg-emerald-600 transition-colors text-sm sm:text-base tracking-[-0.02em]"
            >
              Сохранить задачу
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteTaskModal;