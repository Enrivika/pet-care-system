import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateTask, fetchAllTasks } from '../store/slices/calendarEventsSlice';
import { toast } from 'sonner';

interface EditHealthRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  onSuccess: () => void;
  pets: any[];                   
}

const EditHealthRecordModal = ({ isOpen, onClose, record, onSuccess, pets }: EditHealthRecordModalProps) => {
  const dispatch = useDispatch();

  const [petId, setPetId] = useState('');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { name: 'Укол', color: '#625AAE' },
    { name: 'Ветеринар', color: '#5E8086' },
    { name: 'Лекарство', color: '#C4585A' },
    { name: 'Другое', color: '#6F6F6F' },
  ];

  useEffect(() => {
    if (record && isOpen) {
      setPetId(record.pet_id?.toString() || '');
      setCategory(record.event_type || '');
      setTitle(record.title || '');
      setDescription(record.notes || '');  

      // Используем дату выполнения (completed_at), а не start_at
      const dateToUse = record.completed_at || record.updated_at || record.start_at;

      if (dateToUse) {
        const dateObj = new Date(dateToUse);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        
        setDate(`${year}-${month}-${day}`);
        setTime(dateObj.toTimeString().slice(0, 5));
      }
    }
  }, [record, isOpen]);

  const handleSubmit = async () => {
    if (!petId || !category || !date) {
      toast.error('Выберите питомца, категорию и дату');
      return;
    }

    setIsSubmitting(true);

    const startAt = time ? `${date}T${time}:00` : `${date}T00:00:00`;

    const taskData: any = {
      pet_id: parseInt(petId),
      event_type: category,
      title: title.trim() || null,
      notes: description.trim() || null,
      start_at: startAt,
      completed_at: startAt,           // ← время выполнения = выбранное время
      is_medical: true,
      is_all_day: !time,
    };

    try {
      await dispatch(updateTask({ id: record.id, data: taskData }) as any).unwrap();
      toast.success('Запись обновлена!');
      dispatch(fetchAllTasks() as any);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err || 'Ошибка обновления');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !record) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 pt-8 pb-6">
          <h2 className="text-2xl font-bold text-center mb-6">Редактирование медицинской записи</h2>

          {/* Питомец */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-2">Питомец: *</label>
            <select
              value={petId}
              onChange={(e) => setPetId(e.target.value)}
              className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Выберите питомца...</option>
              {pets.map((pet: any) => (
                <option key={pet.id} value={pet.id}>{pet.name}</option>
              ))}
            </select>
          </div>

          {/* Категория */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-2">Категория: *</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className={`px-5 py-2 rounded-2xl text-sm font-medium transition-all ${category === cat.name ? 'ring-2 ring-emerald-500' : ''}`}
                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Название задачи */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-2">Название задачи:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border rounded-2xl"
            />
          </div>

          {/* Примечание */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-2">Примечание:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border rounded-2xl h-24 resize-none"
            />
          </div>

          {/* Дата и Время */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
              <label className="block text-sm font-medium mb-2">Дата: *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Время:</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 border rounded-2xl"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3.5 border rounded-2xl">Отмена</button>
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="flex-1 py-3.5 bg-emerald-500 text-white rounded-2xl disabled:opacity-50"
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditHealthRecordModal;