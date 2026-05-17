import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTask, fetchAllTasks } from '../store/slices/calendarEventsSlice';
import { RootState } from '../store';
import { toast } from 'sonner';

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

  const medicalCategories = ['Лекарство', 'Ветеринар', 'Укол'];

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

  // Заполняем форму
  useEffect(() => {
    if (task && isOpen) {
      setPetId(task.pet_id?.toString() || '');
      setCategory(task.event_type || '');
      setTitle(task.title || '');
      setNotes(task.notes || ''); 
      setIsAllDay(task.is_all_day || false);

      // Автоматически определяем isMedical
      const isMed = medicalCategories.includes(task.event_type) || task.is_medical;
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

    if (medicalCategories.includes(newCategory)) {
      setIsMedical(true);
    } else if (newCategory !== 'Другое') {
      setIsMedical(false);
    }
    // Для "Другое" оставляем текущее значение isMedical (пользователь сам решает)
  };

  const handleSubmit = async () => {

    const startAt = time 
      ? `${date}T${time}:00` 
      : `${date}T00:00:00`;

    const safeTitle = title ? String(title).trim() : '';

    const taskData: any = {
      pet_id: parseInt(petId),
      title: safeTitle,
      event_type: category,
      start_at: startAt,
      is_medical: medicalCategories.includes(category) || (category === 'Другое' && isMedical),
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-xl">
        <div className="px-8 pt-8 pb-6">
          <h2 className="text-2xl font-bold text-center mb-6">
            {isCompleted ? 'Редактирование выполненной задачи' : 'Редактировать задачу'}
          </h2>

          {/* Фото питомца + имя */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-4 border-white shadow-md flex-shrink-0">
              <img 
                src={task.pet?.photo_url || task.pet?.photo || "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200"} 
                alt={task.pet?.name || 'Питомец'} 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="text-sm text-gray-500">Питомец</div>
              <div className="font-semibold text-lg">{task.pet?.name || 'Неизвестный питомец'}</div>
            </div>
          </div>

          {/* Название задачи */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-2">Название задачи</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Введите название задачи..."
            />
          </div>

          {/* Категория */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-2">Категория *</label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => handleCategoryChange(cat.name)}
                  className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                    category === cat.name 
                      ? 'ring-2 ring-emerald-500 scale-[1.02]' 
                      : cat.color
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Галочка "Является ли задача медицинской?" только для "Другое" */}
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

          {/* Примечание (только для выполненных задач) */}
          {isCompleted && (
            <div className="mb-5">
              <label className="block text-sm font-medium mb-2">Примечание</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Введите итоги задачи..."
                className="w-full px-4 py-3 border rounded-2xl h-24 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Дата и время */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium mb-2">Дата *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                placeholder="--:--"
                className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
              />
            </div>
            
            {/* Чекбокс "На весь день" */}
            <div className="flex items-center gap-2 mt-2 mb-5 col-span-2">
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

          {/* Напоминание и Повтор (только для обычных задач) */}
          {!isCompleted && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block text-sm font-medium mb-2">Напоминание</label>
                <select 
                  value={reminder} 
                  onChange={(e) => {
                    const value = e.target.value;
                    setReminder(value);
                    setIsMomentOfEvent(value === '0');
                  }}
                  className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                <label className="block text-sm font-medium mb-2">Повтор</label>
                <select 
                  value={recurrence} 
                  onChange={(e) => setRecurrence(e.target.value)}
                  className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
        <div className="px-8 pb-8 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3.5 border border-gray-300 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3.5 bg-emerald-500 text-white rounded-2xl font-medium hover:bg-emerald-600 transition-colors disabled:bg-emerald-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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