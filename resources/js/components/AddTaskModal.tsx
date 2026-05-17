import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createTask, fetchAllTasks } from '../store/slices/calendarEventsSlice';
import { RootState } from '../store';
import { toast } from 'sonner';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddTaskModal = ({ isOpen, onClose }: AddTaskModalProps) => {
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

  const medicalCategories = ['Лекарство', 'Ветеринар', 'Укол']; // Категория для медицинского журнала
  
  // Сброс формы при каждом открытии модалки
  useEffect(() => {
    if (isOpen) {
      setPetId('');
      setCategory('');
      setIsMedical(false);
      setTitle('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime('');
      setReminder('none');
      setRecurrence('none');
      setIsAllDay(false);           // ← Чекбокс "На весь день" всегда выключен
    }
  }, [isOpen]);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    
    // Для медицинского журнала
    if (['Лекарство', 'Ветеринар', 'Укол'].includes(cat)) {
      setIsMedical(true);
    } else if (cat !== 'Другое') {
      setIsMedical(false);
    }
  };  

  const categories = [
    { name: 'Кормление', color: 'bg-orange-100 text-orange-700' },
    { name: 'Поение', color: 'bg-blue-100 text-blue-700' },
    { name: 'Прогулка', color: 'bg-green-100 text-green-700' },
    { name: 'Игры', color: 'bg-red-100 text-red-700' },
    { name: 'Лекарство', color: 'bg-red-100 text-red-700' },
    { name: 'Гигиена', color: 'bg-cyan-100 text-cyan-700' },
    { name: 'Ветеринар', color: 'bg-slate-100 text-slate-700' },
    { name: 'Укол', color: 'bg-purple-100 text-purple-700' },
    { name: 'Обучение', color: 'bg-violet-100 text-violet-700' },
    { name: 'Груминг', color: 'bg-amber-100 text-amber-700' },
    { name: 'Уборка', color: 'bg-stone-100 text-stone-700' },
    { name: 'Другое', color: 'bg-gray-100 text-gray-700' },
  ];

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

    const taskData = {
      pet_id: parseInt(petId),
      title: title.trim(),
      event_type: category,
      start_at: startAt,
      reminder_minutes: reminderValue,  // ← Только число или null
      recurrence_rule: recurrence !== 'none' ? recurrence : null,
      is_medical: medicalCategories.includes(category) || (category === 'Другое' && isMedical),
      is_all_day: isAllDay || time === '',
    };

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-6">Добавить задачу</h2>

          {/* Выбор питомца */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Питомец *</label>
            <select 
              value={petId} 
              onChange={(e) => setPetId(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="">Выберите питомца...</option>
              {pets.map((pet: any) => (
                <option key={pet.id} value={pet.id}>{pet.name}</option>
              ))}
            </select>
          </div>

          {/* Категория */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Категория *</label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => handleCategoryChange(cat.name)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    category === cat.name 
                      ? 'ring-2 ring-emerald-500 scale-[1.02]' 
                      : cat.color
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Галочка для "Другое" */}
            {category === 'Другое' && (
              <div className="mt-3 flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="isMedical"
                  checked={isMedical}
                  onChange={(e) => setIsMedical(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500"
                />
                <label htmlFor="isMedical" className="text-sm text-gray-600">
                  Является ли задача медицинской?
                </label>
              </div>
            )}
          </div>

          {/* Название задачи */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Название задачи</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введи название задачи..."
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Дата и время */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Дата *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Время</label>
              <input
                type="time"
                value={isAllDay ? '' : time}
                onChange={(e) => setTime(e.target.value)}
                disabled={isAllDay}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
              />
            </div>
            
            {/* Чекбокс "На весь день" */}
            <div className="flex items-center gap-2 mt-2 mb-4 col-span-2">
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
              <label htmlFor="isAllDay" className="text-sm text-gray-600">
                На весь день (без времени)
              </label>
            </div>            
          </div>

          {/* Напоминание */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Напоминание</label>
            <select 
              value={reminder} 
              onChange={(e) => setReminder(e.target.value)}
              disabled={!time}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${!time ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              {reminderOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {!time && (
              <p className="text-xs text-gray-500 mt-1">Укажите время, чтобы включить напоминание</p>
            )}
          </div>

          {/* Повтор */}
          <div className="mb-8">
            <label className="block text-sm font-medium mb-2">Повтор</label>
            <select 
              value={recurrence} 
              onChange={(e) => setRecurrence(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {recurrenceOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Кнопки */}
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-50"
            >
              Отмена
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:bg-emerald-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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