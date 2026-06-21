import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createTask, fetchAllTasks } from '../store/slices/calendarEventsSlice';
import { toast } from 'sonner';
import CategorySelector from './CategorySelector';

interface AddHealthRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pets: any[];
}

const HEALTH_CATEGORIES = [
  { name: 'Укол', color: '#625AAE' },
  { name: 'Ветеринар', color: '#5E8086' },
  { name: 'Лекарство', color: '#C4585A' },
  { name: 'Другое', color: '#6F6F6F' },
];

const AddHealthRecordModal = ({ isOpen, onClose, onSuccess, pets }: AddHealthRecordModalProps) => {
  const dispatch = useDispatch();

  const [petId, setPetId] = useState('');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Сброс формы при открытии модалки
  useEffect(() => {
    if (isOpen) {
      setPetId('');
      setCategory('');
      setTitle('');
      setDescription('');
      setDate('');
      setTime('');
    }
  }, [isOpen]);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
  };

  const handleSubmit = async () => {
    if (!petId || !category || !date) {
      toast.error('Выберите питомца, категорию и дату');
      return;
    }

    const selectedDateTime = new Date(`${date}T${time || '23:59'}`);
    if (selectedDateTime > new Date()) {
      toast.error('Дата и время не могут быть в будущем');
      return;
    }

    setIsSubmitting(true);

    const startAt = time ? `${date}T${time}:00` : `${date}T00:00:00`;

    const taskData = {
      pet_id: parseInt(petId),
      event_type: category,
      title: title.trim() || null,
      notes: description.trim() || null,
      start_at: startAt,
      completed_at: startAt, // Время выполнения = выбранное время
      is_medical: true,
      is_completed: true,
      is_all_day: !time,
    };

    try {
      await dispatch(createTask(taskData) as any).unwrap();
      toast.success('Медицинская запись добавлена!');

      dispatch(fetchAllTasks() as any);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err || 'Ошибка добавления записи');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
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
        aria-label="Добавить медицинскую запись"
      >
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 24px)' }}>
          <div className="px-4 pt-4 pb-4 min-[380px]:px-5 sm:px-8 sm:pt-7 sm:pb-6">
            <h2 className="text-lg min-[380px]:text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center tracking-[-0.02em]">
              Добавление медицинской записи
            </h2>

            {/* Питомец */}
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
                categoriesOverride={HEALTH_CATEGORIES}
                showMedicalCheckbox={false}
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
                placeholder="Введите название задачи..."
                className="
                  w-full
                  px-4 py-2.5 sm:py-3
                  border rounded-2xl
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  text-sm sm:text-base
                "
              />
            </div>

            {/* Примечание */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs min-[380px]:text-sm sm:text-base font-medium mb-1.5 sm:mb-2 tracking-[-0.02em]">
                Примечание
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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

            {/* Дата и Время */}
            <div className="grid grid-cols-2 gap-3 min-[380px]:gap-4 mb-5 sm:mb-8">
              <div className="min-w-0">
                <label className="block text-xs min-[380px]:text-sm sm:text-base font-medium mb-1.5 sm:mb-2 tracking-[-0.02em]">
                  Дата *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
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
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="
                    w-full min-w-0
                    px-4 py-2.5 sm:py-3
                    border rounded-2xl
                    focus:outline-none focus:ring-2 focus:ring-emerald-500
                    text-sm sm:text-base
                  "
                />
              </div>
            </div>

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
                  transition-colors
                  text-sm sm:text-base
                "
              >
                {isSubmitting ? 'Добавление...' : 'Добавить запись'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddHealthRecordModal;