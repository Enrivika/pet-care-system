import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTask, fetchAllTasks } from '../store/slices/calendarEventsSlice';
import { RootState } from '../store';
import { toast } from 'sonner';
import CategorySelector from './CategorySelector';
import { MEDICAL_CATEGORIES } from '../utils/categories';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
}

const EditTaskModal = ({ isOpen, onClose, task }: EditTaskModalProps) => {
  const dispatch = useDispatch();
  const { pets } = useSelector((state: RootState) => state.pets);

  const [petId, setPetId] = useState('');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isMedical, setIsMedical] = useState(false);
  const [reminder, setReminder] = useState('none');
  const [recurrence, setRecurrence] = useState('none');
  const [isMomentOfEvent, setIsMomentOfEvent] = useState(false);
  const [isAllDay, setIsAllDay] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCompleted = task?.is_completed;

  // MEDICAL_CATEGORIES импортирован из utils/categories (единственный источник)

  // Получаем сегодняшнюю дату в UTC (YYYY-MM-DD)
  // Используем UTC, чтобы ограничение дат при редактировании истории работало последовательно с остальной логикой
  const getTodayUTCDateString = (): string => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(
      now.getUTCDate(),
    ).padStart(2, '0')}`;
  };

  // Для ограничения времени при редактировании выполненных задач на сегодняшнюю дату
  const getTodayLocalDateString = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const getCurrentLocalTimeString = (): string => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  // Заполняем форму
  useEffect(() => {
    if (task && isOpen) {
      setPetId(task.pet_id?.toString() || '');
      setCategory(task.event_type || '');
      setTitle(task.title || '');
      setNotes(task.notes || '');
      setIsAllDay(task.is_all_day || false);

      // Автоматически определяем isMedical
      const isMed = MEDICAL_CATEGORIES.includes(task.event_type) || task.is_medical;
      setIsMedical(isMed);

      // Для выполненных задач используем completed_at как источник времени (для истории),
      // иначе start_at. Это важно, чтобы редактирование времени выполненной задачи
      // отражалось в истории и в БД.
      const dateToUse = (task.is_completed && task.completed_at) ? task.completed_at : task.start_at;
      if (dateToUse) {
        const dateObj = new Date(dateToUse);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        setDate(`${year}-${month}-${day}`);

        if (task.is_all_day) {
          setTime('');
        } else {
          const hours = String(dateObj.getHours()).padStart(2, '0');
          const minutes = String(dateObj.getMinutes()).padStart(2, '0');
          setTime(`${hours}:${minutes}`);
        }
      } else {
        setDate(new Date().toISOString().split('T')[0]);
        setTime( (task.is_all_day || isAllDay) ? '' : '00:00' );
      }

      if (task.is_all_day) {
        setReminder('none');
        setIsMomentOfEvent(false);
      } else if (task.reminder_minutes === 0) {
        setReminder('0');
        setIsMomentOfEvent(true);
      } else if (task.reminder_minutes != null) {
        setReminder(task.reminder_minutes.toString());
        setIsMomentOfEvent(false);
      } else {
        setReminder('none');
        setIsMomentOfEvent(false);
      }
      setRecurrence(task.recurrence_rule || 'none');
    }
  }, [task, isOpen]);

  // Если время очищено (в т.ч. "На весь день"), сбрасываем напоминание (как в AddTaskModal)
  useEffect(() => {
    if (isAllDay || !time) {
      setReminder('none');
      setIsMomentOfEvent(false);
    }
  }, [isAllDay, time]);

  // Функция изменения категории с автоматической установкой isMedical
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);

    if (MEDICAL_CATEGORIES.includes(newCategory)) {
      setIsMedical(true);
    } else if (newCategory !== 'Другое') {
      setIsMedical(false);
    }
    // Для "Другое" оставляем текущее значение isMedical (пользователь сам решает)
  };

  const handleSubmit = async () => {
    if (!petId) {
      toast.error('Выберите питомца');
      return;
    }

    const todayUTC = getTodayUTCDateString();

    // Для выполненных задач (история) — только прошедшие даты
    if (isCompleted) {
      if (date > todayUTC) {
        toast.error('Для выполненных задач нельзя выбирать дату в будущем');
        return;
      }
    }
    // Для запланированных задач — только сегодняшние и будущие даты
    else {
      if (date < todayUTC) {
        toast.error('Для запланированных задач нельзя выбирать дату в прошлом');
        return;
      }
    }

    // Для выполненных задач на сегодняшнюю дату — время не может быть в будущем (локальное время пользователя)
    if (isCompleted && date === getTodayLocalDateString() && time) {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (time > currentTime) {
        toast.error('Для выполненных задач на сегодня нельзя выбирать время в будущем');
        return;
      }
    }

    if (!isCompleted && reminder !== 'none' && (isAllDay || !time)) {
      toast.error('Для напоминания необходимо указать время');
      return;
    }

    const startAt = time ? `${date}T${time}:00` : `${date}T00:00:00`;

    const safeTitle = title ? String(title).trim() : '';

    const taskData: any = {
      pet_id: parseInt(petId),
      title: safeTitle,
      event_type: category,
      start_at: startAt,
      is_medical: MEDICAL_CATEGORIES.includes(category) || (category === 'Другое' && isMedical),
      is_all_day: isAllDay,
    };

    if (isCompleted) {
      taskData.notes = notes.trim() || null;
      taskData.completed_at = startAt; // обновляем время выполнения для истории
    } else {
      if (reminder === 'none') {
        taskData.reminder_minutes = null;
      } else if (reminder === '0' || isMomentOfEvent) {
        taskData.reminder_minutes = 0;
      } else {
        taskData.reminder_minutes = parseInt(reminder, 10);
      }
      taskData.recurrence_rule = recurrence !== 'none' ? recurrence : null;
    }

    setIsSubmitting(true);

    try {
      await dispatch(updateTask({ id: task.id, data: taskData }) as any).unwrap();
      toast.success(isCompleted ? 'Изменения сохранены!' : 'Задача обновлена!');

      dispatch(fetchAllTasks() as any);
      onClose();
    } catch (err: any) {
      toast.error(err || 'Ошибка обновления задачи');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !task) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Для ограничения времени на сегодня при редактировании выполненных задач
  const todayLocalForTime = getTodayLocalDateString();
  const currentTimeForMax = isCompleted && date === todayLocalForTime ? getCurrentLocalTimeString() : undefined;

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
        aria-label={isCompleted ? 'Редактирование выполненной задачи' : 'Редактирование задачи'}
      >
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 24px)' }}>
          <div className="px-4 pt-4 pb-4 min-[380px]:px-5 sm:px-8 sm:pt-7 sm:pb-6">
            <h2 className="text-lg min-[380px]:text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center tracking-[-0.02em]">
              {isCompleted ? 'Редактирование выполненной задачи' : 'Редактировать задачу'}
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

            {/* Примечание — только для выполненных задач (как EditHealthRecordModal по смыслу) */}
            {isCompleted && (
              <div className="mb-4 sm:mb-6">
                <label className="block text-xs min-[380px]:text-sm sm:text-base font-medium mb-1.5 sm:mb-2 tracking-[-0.02em]">
                  Примечание
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Введите итоги задачи..."
                  className="
                    w-full
                    px-4 py-2.5 sm:py-3
                    border rounded-2xl
                    h-24 resize-none
                    focus:outline-none focus:ring-2 focus:ring-emerald-500
                    text-sm sm:text-base
                  "
                />
              </div>
            )}

            {/* Дата и время — всегда в одном ряду */}
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
                  {...(isCompleted ? { max: getTodayUTCDateString() } : { min: getTodayUTCDateString() })}
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
                  max={currentTimeForMax}
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

              {/* На весь день — показываем и для выполненных задач, чтобы можно было редактировать "время" или "на весь день" */}
              <div className="flex items-center gap-2 mt-0.5 col-span-2">
                <input
                  type="checkbox"
                  id="isAllDay"
                  checked={isAllDay}
                  onChange={(e) => {
                    setIsAllDay(e.target.checked);
                    if (e.target.checked) {
                      setTime('');
                      if (!isCompleted) {
                        setReminder('none');
                        setIsMomentOfEvent(false);
                      }
                    }
                  }}
                  className="w-4 h-4 rounded accent-[#1F2421]"
                />
                <label
                  className="text-xs min-[380px]:text-sm text-gray-600 tracking-[-0.02em]"
                  htmlFor="isAllDay"
                >
                  На весь день (без времени)
                </label>
              </div>
            </div>

            {/* Напоминание и Повтор — только для запланированных (как AddTaskModal) */}
            {!isCompleted && (
              <div className="grid grid-cols-2 gap-3 min-[380px]:gap-4 mb-5 sm:mb-8">
                <div className="min-w-0">
                  <label className="block text-xs min-[380px]:text-sm sm:text-base font-medium mb-1.5 sm:mb-2 tracking-[-0.02em]">
                    Напоминание
                  </label>
                  <select
                    value={reminder}
                    onChange={(e) => {
                      const value = e.target.value;
                      setReminder(value);
                      setIsMomentOfEvent(value === '0');
                    }}
                    disabled={isAllDay || !time}
                    className={`
                      w-full min-w-0
                      px-4 py-2.5 sm:py-3
                      border rounded-2xl
                      focus:outline-none focus:ring-2 focus:ring-emerald-500
                      text-sm sm:text-base
                      ${(isAllDay || !time) ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                    `}
                  >
                    <option value="none">Без напоминания</option>
                    <option value="0">В момент события</option>
                    <option value="30">За 30 минут</option>
                    <option value="60">За 1 час</option>
                    <option value="120">За 2 часа</option>
                    <option value="1440">За 1 день</option>
                  </select>

                  {(isAllDay || !time) && (
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
                    <option value="none">Не повторять</option>
                    <option value="daily">Ежедневно</option>
                    <option value="weekdays">По будням</option>
                    <option value="weekends">По выходным</option>
                    <option value="weekly">Еженедельно</option>
                    <option value="monthly">Ежемесячно</option>
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
                    <span className="text-sm sm:text-base">Сохранение...</span>
                  </>
                ) : (
                  'Сохранить изменения'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTaskModal;