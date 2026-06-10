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

  // MEDICAL_CATEGORIES импортирован из utils/categories (единственный источник)

  // Проверяем, является ли выбранная дата прошедшей (строго по UTC, как и вся логика системы)
  const isPastDate = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const now = new Date();
    const todayUTC = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
    return dateStr < todayUTC;
  };

  const isHistoricalTask = isPastDate(date);
  
  // Сброс формы при каждом открытии модалки
  useEffect(() => {
    if (isOpen) {
      if (defaultPetId){
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
      setIsAllDay(false);           // ← Чекбокс "На весь день" всегда выключен
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
    
    // Для медицинского журнала (используем централизованный список)
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

    const startAt = time 
      ? `${date}T${time}:00` 
      : `${date}T00:00:00`;

    const taskData: any = {
      pet_id: parseInt(petId),
      title: title.trim(),
      event_type: category,
      start_at: startAt,
      // Для прошедших дат (по UTC) принудительно отключаем напоминания и повторы
      reminder_minutes: isHistoricalTask ? null : reminderValue,
      recurrence_rule: isHistoricalTask ? null : (recurrence !== 'none' ? recurrence : null),
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-6">
          <h2 
            className="text-xl sm:text-2xl font-bold mb-5 sm:mb-6"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            Добавить задачу
          </h2>

          {/* Выбор питомца */}
          <div className="mb-5 sm:mb-6">
            <label 
              className="block text-sm sm:text-base font-medium mb-2"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >
              Питомец *
            </label>
            <select 
              value={petId} 
              onChange={(e) => setPetId(e.target.value)}
              className="w-full px-4 py-2.5 sm:py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
              required
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >
              <option value="">Выберите питомца...</option>
              {pets.map((pet: any) => (
                <option key={pet.id} value={pet.id}>{pet.name}</option>
              ))}
            </select>
          </div>

          {/* Категория — используем CategorySelector для точных цветов + PNG + адаптив */}
          <div className="mb-5 sm:mb-6">
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

          {/* Название задачи */}
          <div className="mb-5 sm:mb-6">
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
              placeholder="Введи название задачи..."
              className="w-full px-4 py-2.5 sm:py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            />
          </div>

          {/* Дата и время */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 sm:mb-6">
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

          {/* Напоминание и Повтор — показываем только для сегодняшних и будущих задач */}
          {!isHistoricalTask && (
            <>
              {/* Напоминание */}
              <div className="mb-5 sm:mb-6">
                <label 
                  className="block text-sm sm:text-base font-medium mb-2"
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                >
                  Напоминание
                </label>
                <select 
                  value={reminder} 
                  onChange={(e) => setReminder(e.target.value)}
                  disabled={!time}
                  className={`w-full px-4 py-2.5 sm:py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base ${!time ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                >
                  {reminderOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {!time && (
                  <p 
                    className="text-xs text-gray-500 mt-1"
                    style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                  >
                    Укажите время, чтобы включить напоминание
                  </p>
                )}
              </div>

              {/* Повтор */}
              <div className="mb-6 sm:mb-8">
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
                  {recurrenceOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}



          {/* Кнопки */}
          <div className="flex gap-3 sm:gap-4 pt-1">
            <button 
              onClick={onClose}
              className="flex-1 py-3 sm:py-3.5 border border-gray-300 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >
              Отмена
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3 sm:py-3.5 bg-emerald-500 text-white rounded-2xl font-medium hover:bg-emerald-600 disabled:bg-emerald-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Добавление...
                </>
              ) : (
                'Добавить задачу'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;