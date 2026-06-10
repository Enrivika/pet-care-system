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

  // Сбрасываем состояние при каждом открытии модалки или при смене задачи
  useEffect(() => {
    if (isOpen) {
      setNotes('');
      setKeepRecurring(true); // всегда по умолчанию "продолжать повтор"
    }
  }, [isOpen, task?.id]);

  // Дополнительная защита: если задача внезапно перестала быть повторяющейся — сбрасываем выбор
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
    if (e.target === e.currentTarget) {
      handleClose();
    }
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

  // Используем централизованный getCategoryColor + PNG-иконки (как на страницах)

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-6">
          <h2 
            className="text-xl sm:text-2xl font-bold text-center mb-5 sm:mb-6"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            Отметить выполненным
          </h2>

          {/* Фото питомца + имя */}
          <div className="flex items-center gap-4 mb-5 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-4 border-white shadow-md flex-shrink-0">
              <img 
                src={task.pet?.photo_url || task.pet?.photo || "/images/Cat_and_dog.png"} 
                alt={task.pet?.name || 'Питомец'} 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div 
                className="text-xs sm:text-sm text-gray-500"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
              >
                Питомец
              </div>
              <div 
                className="font-semibold text-lg sm:text-xl"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
              >
                {task.pet?.name || 'Неизвестный питомец'}
              </div>
            </div>
          </div>

          {/* Дата и время */}
          <div className="mb-5">
            <div 
              className="text-sm text-gray-500 mb-1"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >
              Дата и время
            </div>
            <div 
              className="font-medium text-sm sm:text-base"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >
              {new Date(task.start_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })} в {new Date(task.start_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Категория — точный цвет + PNG иконка (как на страницах) */}
          <div className="mb-5">
            <div 
              className="text-sm text-gray-500 mb-2"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >
              Категория
            </div>
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium"
              style={{ backgroundColor: `${getCategoryColor(task.event_type)}20`, color: getCategoryColor(task.event_type) }}
            >
              <img 
                src={`/images/${task.event_type}.png`} 
                alt={task.event_type} 
                className="w-5 h-5 flex-shrink-0" 
              />
              <span>{task.event_type}</span>
            </div>
          </div>

          {/* Название задачи */}
          <div className="mb-5">
            <div 
              className="text-sm text-gray-500 mb-1"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >
              Название задачи
            </div>
            <div 
              className="font-medium text-base sm:text-lg"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >
              {task.title}
            </div>
          </div>

          {/* === Вопрос про повтор (только для повторяющихся задач) === */}
          {task.is_recurring && (
            <div className="mb-6">
              <div 
                className="text-sm sm:text-base font-medium text-gray-700 mb-3"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
              >
                Продолжить повторять эту задачу в будущем?
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setKeepRecurring(true)}
                  className={`py-3 sm:py-3.5 rounded-2xl font-medium text-sm sm:text-base transition-all border ${
                    keepRecurring
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                >
                  Да
                </button>
                <button
                  type="button"
                  onClick={() => setKeepRecurring(false)}
                  className={`py-3 sm:py-3.5 rounded-2xl font-medium text-sm sm:text-base transition-all border ${
                    !keepRecurring
                      ? 'bg-rose-500 text-white border-rose-500 shadow'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                >
                  Нет
                </button>
              </div>
            </div>
          )}

          {/* Примечание */}
          <div className="mb-6 sm:mb-8">
            <label 
              className="block text-sm sm:text-base font-medium mb-2"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >
              Примечание (необязательно)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Введите итоги задачи..."
              className="w-full px-4 py-2.5 sm:py-3 border rounded-2xl h-24 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            />
          </div>
        </div>

        {/* Кнопки */}
        <div className="px-6 pb-6 sm:px-8 sm:pb-8 flex gap-3">
          <button 
            onClick={handleClose}
            className="flex-1 py-3.5 border border-gray-300 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            Отмена
          </button>
          <button 
            onClick={handleComplete}
            className="flex-1 py-3.5 bg-emerald-500 text-white rounded-2xl font-medium hover:bg-emerald-600 transition-colors"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            Сохранить задачу
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteTaskModal;