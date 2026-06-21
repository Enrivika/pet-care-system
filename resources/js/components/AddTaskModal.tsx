import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createTask, fetchAllTasks } from '../store/slices/calendarEventsSlice';
import { RootState } from '../store';
import { toast } from 'sonner';
import CategorySelector from './CategorySelector';
import { MEDICAL_CATEGORIES } from '../utils/categories';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPetId?: number | string;
}

const AddTaskModal = ({ isOpen, onClose, defaultPetId }: AddTaskModalProps) => {
  const dispatch = useDispatch();
  const { pets } = useSelector((state: RootState) => state.pets);

  const [petId, setPetId] = useState('');
  const [category, setCategory] = useState('');
  const [isMedical, setIsMedical] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [reminder, setReminder] = useState('none');
  const [recurrence, setRecurrence] = useState('none');
  const [isAllDay, setIsAllDay] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Проверяем, является ли выбранная дата прошедшей (строго по UTC, как и вся логика системы)
  const isPastDate = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const now = new Date();
    const todayUTC = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(
      now.getUTCDate()
    ).padStart(2, '0')}`;
    return dateStr < todayUTC;
  };

  const isHistoricalTask = isPastDate(date);

  // Сброс формы при каждом открытии модалки
  useEffect(() => {
    if (isOpen) {
      if (defaultPetId) {
        setPetId(defaultPetId.toString());
      } else {
        setPetId('');
      }
      setCategory('');
      setIsMedical(false);
      setTitle('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime('');
      setReminder('none');
      setRecurrence('none');
      setIsAllDay(false); // ← Чекбокс "На весь день"
    }
  }, [isOpen, defaultPetId]);

  // При выборе прошедшей даты (по UTC) автоматически сбрасываем напоминание и повтор
  useEffect(() => {
    if (isHistoricalTask) {
      setReminder('none');
      setRecurrence('none');
    }
  }, [isHistoricalTask]);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);

    // Для медицинского журнала
    if (MEDICAL_CATEGORIES.includes(cat)) {
      setIsMedical(true);
    } else if (cat !== 'Другое') {
      setIsMedical(false);
    }
    // Для "Другое" оставляем текущее значение isMedical (пользователь решает)
  };

  const reminderOptions = [
    { value: 'none', label: 'Без напоминания' },
    { value: '0', label: 'В момент события' },
    { value: '30', label: 'За 30 минут' },
    { value: '60', label: 'За 1 час' },
    { value: '120', label: 'За 2 часа' },
    { value: '1440', label: 'За 1 день' },
    { value: '10080', label: 'За 1 неделю' },
  ];

  const recurrenceOptions = [
    { value: 'none', label: 'Не повторять' },
    { value: 'daily', label: 'Ежедневно' },
    { value: 'weekdays', label: 'По будням' },
    { value: 'weekends', label: 'По выходным' },
    { value: 'weekly', label: 'Еженедельно' },
    { value: 'monthly', label: 'Ежемесячно' },
    { value: 'yearly', label: 'Ежегодно' },
  ];

  const handleSubmit = async () => {
    if (!petId || !category) {
      toast.error('Выберите питомца и категорию');
      return;
    }

    if (reminder !== 'none' && !time) {
      toast.error('Для напоминания необходимо указать время');
      return;
    }

    setIsSubmitting(true);

    let reminderValue: number | null = null;
    if (reminder === 'none') {
      reminderValue = null;
    } else if (reminder === '0') {
      reminderValue = 0;
    } else {
      reminderValue = parseInt(reminder, 10);
    }

    const startAt = time ? `${date}T${time}:00` : `${date}T00:00:00`;

    const taskData: any = {
      pet_id: parseInt(petId),
      title: title.trim(),
      event_type: category,
      start_at: startAt,
      // Для прошедших дат (по UTC) принудительно отключаем напоминания и повторы
      reminder_minutes: isHistoricalTask ? null : reminderValue,
      recurrence_rule: isHistoricalTask ? null : recurrence !== 'none' ? recurrence : null,
      is_medical: MEDICAL_CATEGORIES.includes(category) || (category === 'Другое' && isMedical),
      is_all_day: isAllDay || time === '',
    };

    // Если пользователь добавил задачу с прошедшей датой — сразу помечаем как выполненную (в историю)
    if (isHistoricalTask) {
      taskData.is_completed = true;
      taskData.completed_at = startAt;
    }

    try {
      await dispatch(createTask(taskData) as any).unwrap();
      toast.success('Задача успешно добавлена!');

      // Перезагружаем все задачи, чтобы список сразу обновился
      dispatch(fetchAllTasks() as any);

      onClose();

      // Сброс формы
      setPetId('');
      setCategory('');
      setTitle('');
      setTime('');
      setReminder('none');
      setRecurrence('none');
      setIsMedical(false);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const firstError = Object.values(errors)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        toast.error(err || 'Ошибка создания задачи');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="
        fixed inset-0 bg-black/50 z-[200]
        flex items-center justify-center
        max-[360px]:items-end
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
          max-w-[520px] sm:max-w-2xl
          rounded-3xl shadow-2xl overflow-hidden
          max-h-[calc(100vh-24px)]
          max-[360px]:max-h-[calc(100vh-16px)]
        "
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Добавить задачу"
      >
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 24px)' }}>
          <div className="px-4 pt-4 pb-4 min-[380px]:px-5 sm:px-8 sm:pt-7 sm:pb-6">
            <h2 className="text-lg min-[380px]:text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center tracking-[-0.02em]">
              Добавить задачу
            </h2>

            {/* Выбор питомца */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs min-[380px]:text-sm sm:text-base font-medium mb-1.5 sm:mb-2 tracking-[-0.02em]">
                Питомец *
              </label>
              <select
                value={petId}
                onChange={(e) => setPetId(e.target.value)}
                className="
                  w-full
                  px-4 py-2.5 sm:py-3
                  border rounded-2xl
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  text-sm sm:text-base
                "
                required
              >
                <option value="">Выберите питомца...</option>
                {pets.map((pet: any) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Категория */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs min-[380px]:text-sm sm:text-base font-medium mb-1.5 sm:mb-2 tracking-[-0.02em]">
                Категория *
              </label>
              <CategorySelector
                selected={category}
                onSelect={handleCategoryChange}
                isMedical={isMedical}
                onIsMedicalChange={setIsMedical}
                showMedicalCheckbox={true}
              />
            </div>

            {/* Название задачи */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs min-[380px]:text-sm sm:text-base font-medium mb-1.5 sm:mb-2 tracking-[-0.02em]">
                Название задачи
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Введи название задачи..."
                className="
                  w-full
                  px-4 py-2.5 sm:py-3
                  border rounded-2xl
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  text-sm sm:text-base
                "
              />
            </div>

            {/* Дата и время */}
            <div className="grid grid-cols-2 gap-3 min-[380px]:gap-4 mb-4 sm:mb-6">
              <div className="min-w-0">
                <label className="block text-xs min-[380px]:text-sm sm:text-base font-medium mb-1.5 sm:mb-2 tracking-[-0.02em]">
                  Дата *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="
                    w-full min-w-0
                    px-4 py-2.5 sm:py-3
                    border rounded-2xl
                    focus:outline-none focus:ring-2 focus:ring-emerald-500
                    text-sm sm:text-base
                  "
                  required
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs min-[380px]:text-sm sm:text-base font-medium mb-1.5 sm:mb-2 tracking-[-0.02em]">
                  Время
                </label>
                <input
                  type="time"
                  value={isAllDay ? '' : time}
                  onChange={(e) => setTime(e.target.value)}
                  disabled={isAllDay}
                  className="
                    w-full min-w-0
                    px-4 py-2.5 sm:py-3
                    border rounded-2xl
                    focus:outline-none focus:ring-2 focus:ring-emerald-500
                    disabled:bg-gray-100
                    text-sm sm:text-base
                  "
                />
              </div>

              {/* На весь день */}
              <div className="flex items-center gap-2 mt-0.5 col-span-2">
                <input
                  type="checkbox"
                  id="isAllDay"
                  checked={isAllDay}
                  onChange={(e) => {
                    setIsAllDay(e.target.checked);
                    if (e.target.checked) setTime('');
                  }}
                  className="w-4 h-4 rounded accent-[#1F2421]"
                />
                <label className="text-xs min-[380px]:text-sm text-gray-600 tracking-[-0.02em]" htmlFor="isAllDay">
                  На весь день (без времени)
                </label>
              </div>
            </div>

            {/* Напоминание и Повтор */}
            {!isHistoricalTask && (
              <div className="grid grid-cols-2 gap-3 min-[380px]:gap-4 mb-5 sm:mb-8">
                <div className="min-w-0">
                  <label className="block text-xs min-[380px]:text-sm sm:text-base font-medium mb-1.5 sm:mb-2 tracking-[-0.02em]">
                    Напоминание
                  </label>
                  <select
                    value={reminder}
                    onChange={(e) => setReminder(e.target.value)}
                    disabled={!time}
                    className={`
                      w-full min-w-0
                      px-4 py-2.5 sm:py-3
                      border rounded-2xl
                      focus:outline-none focus:ring-2 focus:ring-emerald-500
                      text-sm sm:text-base
                      ${!time ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                    `}
                  >
                    {reminderOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {!time && (
                    <p className="text-center text-[11px] min-[380px]:text-xs text-gray-500 mt-1 tracking-[-0.02em]">
                      Укажите время
                    </p>
                  )}
                </div>

                <div className="min-w-0">
                  <label className="block text-xs min-[380px]:text-sm sm:text-base font-medium mb-1.5 sm:mb-2 tracking-[-0.02em]">
                    Повтор
                  </label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value)}
                    className="
                      w-full min-w-0
                      px-4 py-2.5 sm:py-3
                      border rounded-2xl
                      focus:outline-none focus:ring-2 focus:ring-emerald-500
                      text-sm sm:text-base
                      bg-white
                    "
                  >
                    {recurrenceOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Кнопки */}
            <div className="flex gap-2 min-[380px]:gap-3 sm:gap-4 pt-0.5">
              <button
                onClick={onClose}
                className="
                  flex-1
                  py-2.5 min-[380px]:py-3 sm:py-3.5
                  border border-gray-300 text-gray-700
                  rounded-2xl font-medium
                  hover:bg-gray-50 transition-colors
                  text-sm sm:text-base
                "
              >
                Отмена
              </button>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="
                  flex-1
                  py-2.5 min-[380px]:py-3 sm:py-3.5
                  bg-emerald-500 text-white
                  rounded-2xl font-medium
                  hover:bg-emerald-600
                  disabled:bg-emerald-300 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2
                  transition-colors
                  text-sm sm:text-base
                "
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span className="text-sm sm:text-base">Добавление...</span>
                  </>
                ) : (
                  'Добавить задачу'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;