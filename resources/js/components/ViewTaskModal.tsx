import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { deleteTask, fetchAllTasks } from '../store/slices/calendarEventsSlice';
import { toast } from 'sonner';
import DeleteTaskModal from './DeleteTaskModal';
import { getCategoryColor } from '../utils/categories'; 

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

  // Централизованный цвет + PNG (как на страницах и в Complete)

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-xl mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-6">
            <h2 
              className="text-xl sm:text-2xl font-bold text-center mb-5 sm:mb-6"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >
              Просмотр выполненной задачи
            </h2>

            {/* Фото питомца + имя */}
            <div className="flex items-center gap-4 mb-5 sm:mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-4 border-white shadow-md flex-shrink-0">
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
                  className="font-semibold text-lg sm:text-xl"
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                >
                  {task.pet?.name || 'Неизвестный питомец'}
                </div>
              </div>
            </div>

            {/* Дата и время */}
            <div className="mb-5">
              <div 
                className="text-sm text-gray-500 mb-1"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
              >
                Дата и время
              </div>
              <div 
                className="font-medium text-sm sm:text-base"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
              >
                {new Date(task.start_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })} в {new Date(task.start_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </div>
              {task.completed_at && (
                <div 
                  className="text-xs text-emerald-600 mt-1"
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                >
                  ✅ Выполнено: {new Date(task.completed_at).toLocaleDateString('ru-RU')} в {new Date(task.completed_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>

            {/* Категория — точный цвет + PNG */}
            <div className="mb-5">
              <div 
                className="text-sm text-gray-500 mb-2"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
              >
                Категория
              </div>
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium"
                style={{ backgroundColor: `${getCategoryColor(task.event_type)}20`, color: getCategoryColor(task.event_type) }}
              >
                <img 
                  src={`/images/${task.event_type}.png`} 
                  alt={task.event_type} 
                  className="w-5 h-5 flex-shrink-0" 
                />
                <span>{task.event_type}</span>
              </div>
            </div>

            {/* Название задачи */}
            <div className="mb-5">
              <div 
                className="text-sm text-gray-500 mb-1"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
              >
                Название задачи
              </div>
              <div 
                className="font-medium text-base sm:text-lg"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
              >
                {task.title}
              </div>
            </div>

            {/* Примечание */}
            <div className="mb-6 sm:mb-8">
              <div 
                className="text-sm text-gray-500 mb-1"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
              >
                Примечание
              </div>
              <div 
                className="bg-gray-50 rounded-2xl p-4 text-gray-700 min-h-[60px] text-sm sm:text-base"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
              >
                {task.notes || '—'}
              </div>
            </div>
          </div>

          {/* Кнопки */}
          <div className="px-6 pb-6 sm:px-8 sm:pb-8 flex gap-3">
            <button 
              onClick={() => onEdit(task)}
              className="flex-1 py-3.5 bg-black text-white rounded-2xl font-medium hover:bg-gray-800 transition-colors"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >
              Редактировать задачу
            </button>
            <button 
              onClick={onClose}
              className="flex-1 py-3.5 border border-gray-300 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
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