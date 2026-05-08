import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { deleteTask, fetchAllTasks } from '../store/slices/calendarEventsSlice';
import { toast } from 'sonner';
import DeleteTaskModal from './DeleteTaskModal';

interface ViewHealthRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  onUpdated: () => void;
  onEdit: (record: any) => void;  
}

const ViewHealthRecordModal = ({ isOpen, onClose, record, onUpdated, onEdit }: ViewHealthRecordModalProps) => {
  const dispatch = useDispatch();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !record) return null;

  const handleDelete = async () => {
    try {
      await dispatch(deleteTask(record.id) as any).unwrap();
      toast.success('Медицинская запись удалена');
      dispatch(fetchAllTasks() as any);
      setShowDeleteConfirm(false);
      onClose();
      onUpdated();
    } catch (err: any) {
      toast.error(err || 'Ошибка удаления записи');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Укол': return '💉';
      case 'Лекарство': return '💊';
      case 'Ветеринар': return '🩺';
      default: return '📋';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Укол': return 'bg-purple-100 text-purple-700';
      case 'Лекарство': return 'bg-red-100 text-red-700';
      case 'Ветеринар': return 'bg-teal-100 text-teal-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Отображение даты и времени выполнения
  const formatCompletedDate = (record: any) => {
    const dateStr = record.completed_at || record.updated_at;
    if (!dateStr) return '—';

    const date = new Date(dateStr);
    return `${date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-xl">
          <div className="px-8 pt-8 pb-4">
            <h2 className="text-2xl font-bold text-center mb-6">Просмотр медицинской записи</h2>

            {/* Фото питомца + имя */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-md flex-shrink-0">
                <img 
                  src={record.pet?.photo_url || record.pet?.photo || "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200"} 
                  alt={record.pet?.name || 'Питомец'} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="text-sm text-gray-500">Питомец</div>
                <div className="font-semibold text-xl">{record.pet?.name || 'Неизвестный питомец'}</div>
              </div>
            </div>

            {/* Дата и время выполнения */}
            <div className="mb-5">
              <div className="text-sm text-gray-500 mb-1">Дата и время выполнения</div>
              <div className="font-medium text-lg">
                {formatCompletedDate(record)}
              </div>
            </div>

            {/* Категория */}
            <div className="mb-5">
              <div className="text-sm text-gray-500 mb-2">Категория</div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium ${getCategoryColor(record.event_type)}`}>
                <span>{getCategoryIcon(record.event_type)}</span>
                <span>{record.event_type}</span>
              </div>
            </div>

            {/* Название задачи */}
            <div className="mb-5">
              <div className="text-sm text-gray-500 mb-1">Название задачи</div>
              <div className="font-medium text-lg">{record.title || '—'}</div>
            </div>

            {/* Примечание */}
            <div className="mb-8">
              <div className="text-sm text-gray-500 mb-1">Примечание</div>
              <div className="bg-gray-50 rounded-2xl p-4 text-gray-700 min-h-[80px]">
                {record.notes || '—'}
              </div>
            </div>
          </div>

          {/* Кнопки */}
          <div className="px-8 pb-8 flex gap-3">
            <button 
              onClick={() => onEdit(record)}           
              className="flex-1 py-3.5 bg-black text-white rounded-2xl font-medium hover:bg-gray-800"
            >
              Редактировать запись
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 py-3.5 bg-red-500 text-white rounded-2xl font-medium hover:bg-red-600 transition-colors"
            >
              Удалить
            </button>
            <button 
              onClick={onClose}
              className="flex-1 py-3.5 border border-gray-300 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>

      <DeleteTaskModal 
        isOpen={showDeleteConfirm} 
        onClose={() => setShowDeleteConfirm(false)} 
        task={record} 
        onSuccess={onClose}
      />
    </>
  );
};

export default ViewHealthRecordModal;