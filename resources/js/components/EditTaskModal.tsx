import { useState, useEffect } from 'react';
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
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
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

      if (task.start_at) {
        const dateObj = new Date(task.start_at);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        setDate(`${year}-${month}-${day}`);

        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        setTime(`${hours}:${minutes}`);
      } else {
        setDate(new Date().toISOString().split('T')[0]);
        setTime('00:00');
      }

      if (task.reminder_minutes === 0) {
        setReminder('0');
      } else if (task.reminder_minutes != null) {
        setReminder(task.reminder_minutes.toString());
      } else {
        setReminder('none');
      }
      setRecurrence(task.recurrence_rule || 'none');
    }
  }, [task, isOpen]);

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

    const startAt = time 
      ? `${date}T${time}:00` 
      : `${date}T00:00:00`;

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

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-6">
          <h2 
            className="text-xl sm:text-2xl font-bold text-center mb-5 sm:mb-6"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            {isCompleted ? 'Редактирование выполненной задачи' : 'Редактировать задачу'}
          </h2>

          {/* Фото питомца + имя */}
          <div className="flex items-center gap-4 mb-5 sm:mb-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-4 border-white shadow-md flex-shrink-0">
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
                className="font-semibold text-base sm:text-lg"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
              >
                {task.pet?.name || 'Неизвестный питомец'}
              </div>
            </div>
          </div>

          {/* Название задачи */}
          <div className="mb-5">
            <label 
              className="block text-sm sm:text-base font-medium mb-2"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >
              Название задачи
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 sm:py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
              placeholder="Введите название задачи..."
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            />
          </div>

          {/* Категория — CategorySelector (точные цвета + PNG + адаптив) */}
          <div className="mb-5">
            <label 
              className="block text-sm sm:text-base font-medium mb-2"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >
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

          {/* Примечание (только для выполненных задач) */}
          {isCompleted && (
            <div className="mb-5">
              <label 
                className="block text-sm sm:text-base font-medium mb-2"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
              >
                Примечание
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Введите итоги задачи..."
                className="w-full px-4 py-2.5 sm:py-3 border rounded-2xl h-24 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
              />
            </div>
          )}

          {/* Дата и время */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label 
                className="block text-sm sm:text-base font-medium mb-2"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
              >
                Дата *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                required
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                {...(isCompleted 
                  ? { max: getTodayUTCDateString() } 
                  : { min: getTodayUTCDateString() }
                )}
              />
            </div>
            
            <div>
              <label 
                className="block text-sm sm:text-base font-medium mb-2"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
              >
                Время
              </label>
              <input
                type="time"
                value={isAllDay ? '' : time}
                onChange={(e) => setTime(e.target.value)}
                disabled={isAllDay}
                placeholder="--:--"
                className="w-full px-4 py-2.5 sm:py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 text-sm sm:text-base"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
              />
            </div>
            
            {/* Чекбокс "На весь день" */}
            <div className="flex items-center gap-2 mt-1 mb-1 col-span-2">
              <input 
                type="checkbox" 
                id="isAllDay"
                checked={isAllDay}
                onChange={(e) => {
                  setIsAllDay(e.target.checked);
                  if (e.target.checked) {
                    setTime('');
                  }
                }}
                className="w-4 h-4 accent-emerald-500"
              />
              <label 
                htmlFor="isAllDay" 
                className="text-sm text-gray-600"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
              >
                На весь день (без времени)
              </label>
            </div>            
          </div>

          {/* Напоминание и Повтор (только для обычных задач) */}
          {!isCompleted && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 sm:mb-8">
              <div>
                <label 
                  className="block text-sm sm:text-base font-medium mb-2"
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                >
                  Напоминание
                </label>
                <select 
                  value={reminder} 
                  onChange={(e) => {
                    const value = e.target.value;
                    setReminder(value);
                    setIsMomentOfEvent(value === '0');
                  }}
                  className="w-full px-4 py-2.5 sm:py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                >
                  <option value="none">Без напоминания</option>
                  <option value="0">В момент события</option>
                  <option value="30">За 30 минут</option>
                  <option value="60">За 1 час</option>
                  <option value="120">За 2 часа</option>
                  <option value="1440">За 1 день</option>
                </select>
              </div>
              <div>
                <label 
                  className="block text-sm sm:text-base font-medium mb-2"
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                >
                  Повтор
                </label>
                <select 
                  value={recurrence} 
                  onChange={(e) => setRecurrence(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
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
        </div>

        {/* Кнопки */}
        <div className="px-6 pb-6 sm:px-8 sm:pb-8 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3.5 border border-gray-300 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            Отмена
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3.5 bg-emerald-500 text-white rounded-2xl font-medium hover:bg-emerald-600 transition-colors disabled:bg-emerald-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⏳</span>
                Сохранение...
              </>
            ) : (
              'Сохранить изменения'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTaskModal;