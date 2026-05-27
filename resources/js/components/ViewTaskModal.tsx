import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { deleteTask, fetchAllTasks } from '../store/slices/calendarEventsSlice';
import { toast } from 'sonner';
import DeleteTaskModal from './DeleteTaskModal';   

interface ViewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  onEdit: (task: any) => void;
}

const ViewTaskModal = ({ isOpen, onClose, task, onEdit }: ViewTaskModalProps) => {
  const dispatch = useDispatch();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !task) return null;

  const handleDelete = async () => {
    try {
      await dispatch(deleteTask(task.id) as any).unwrap();
      toast.success('Задача удалена');
      dispatch(fetchAllTasks() as any);
      
      // Закрываем оба попапа
      setShowDeleteConfirm(false);
      onClose();                    // ← Закрываем ViewTaskModal
      
    } catch (err: any) {
      toast.error(err || 'Ошибка удаления задачи');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Кормление': return '🍽️';
      case 'Поение': return '💧';
      case 'Укол': return '💉';
      case 'Лекарство': return '💊';
      case 'Ветеринар': return '🩺';
      default: return '📋';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Кормление': return 'bg-orange-100 text-orange-700';
      case 'Поение': return 'bg-blue-100 text-blue-700';
      case 'Прогулка': return 'bg-green-100 text-green-700';
      case 'Укол': return 'bg-purple-100 text-purple-700';
      case 'Лекарство': return 'bg-red-100 text-red-700';
      case 'Ветеринар': return 'bg-slate-100 text-slate-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-xl">
          <div className="px-8 pt-8 pb-4">
            <h2 className="text-2xl font-bold text-center mb-6">Просмотр выполненной задачи</h2>

            {/* Фото питомца + имя */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-md flex-shrink-0">
                <img 
                  src={task.pet?.photo_url || task.pet?.photo || "/images/Cat_and_dog.png"} 
                  alt={task.pet?.name || 'Питомец'} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="text-sm text-gray-500">Питомец</div>
                <div className="font-semibold text-xl">{task.pet?.name || 'Неизвестный питомец'}</div>
              </div>
            </div>

            {/* Дата и время */}
            <div className="mb-5">
              <div className="text-sm text-gray-500 mb-1">Дата и время</div>
              <div className="font-medium">
                {new Date(task.start_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })} в {new Date(task.start_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </div>
              {task.completed_at && (
                <div className="text-xs text-emerald-600 mt-1">
                  ✅ Выполнено: {new Date(task.completed_at).toLocaleDateString('ru-RU')} в {new Date(task.completed_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>

            {/* Категория */}
            <div className="mb-5">
              <div className="text-sm text-gray-500 mb-2">Категория</div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium ${getCategoryColor(task.event_type)}`}>
                <span>{getCategoryIcon(task.event_type)}</span>
                <span>{task.event_type}</span>
              </div>
            </div>

            {/* Название задачи */}
            <div className="mb-5">
              <div className="text-sm text-gray-500 mb-1">Название задачи</div>
              <div className="font-medium text-lg">{task.title}</div>
            </div>

            {/* Примечание */}
            <div className="mb-8">
              <div className="text-sm text-gray-500 mb-1">Примечание</div>
              <div className="bg-gray-50 rounded-2xl p-4 text-gray-700 min-h-[60px]">
                {task.notes || '—'}
              </div>
            </div>
          </div>

          {/* Кнопки */}
          <div className="px-8 pb-8 flex gap-3">
            <button 
              onClick={() => onEdit(task)}
              className="flex-1 py-3.5 bg-black text-white rounded-2xl font-medium hover:bg-gray-800 transition-colors"
            >
              Редактировать задачу
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

      {/* Попап подтверждения удаления */}
      <DeleteTaskModal 
        isOpen={showDeleteConfirm} 
        onClose={() => setShowDeleteConfirm(false)} 
        task={task} 
        onSuccess={onClose}
      />
    </>
  );
};

export default ViewTaskModal;