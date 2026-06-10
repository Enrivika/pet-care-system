import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { deleteTask, fetchAllTasks } from '../store/slices/calendarEventsSlice';
import { toast } from 'sonner';

interface DeleteTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  onSuccess?: () => void;         
}

const DeleteTaskModal = ({ isOpen, onClose, task, onSuccess }: DeleteTaskModalProps) => {
  const dispatch = useDispatch();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!task) return;

    setIsDeleting(true);
    try {
      await dispatch(deleteTask(task.id) as any).unwrap();
      toast.success('Задача удалена');
      dispatch(fetchAllTasks() as any);
      
      onClose();                    
      onSuccess?.();                
      
    } catch (err: any) {
      toast.error(err || 'Ошибка удаления задачи');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-md px-6 py-6 sm:px-8 sm:py-8 shadow-xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 
          className="text-xl sm:text-2xl font-bold text-red-600 text-center mb-3 sm:mb-4"
          style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
        >
          Удалить задачу?
        </h2>
        
        <p 
          className="text-gray-600 text-center mb-6 sm:mb-8 text-sm sm:text-base"
          style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
        >
          Это действие нельзя отменить.<br />
          Задача будет удалена навсегда.
        </p>

        <div className="flex gap-3 sm:gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 sm:py-3.5 border border-gray-300 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            Отмена
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 py-3 sm:py-3.5 bg-red-600 text-white rounded-2xl font-medium hover:bg-red-700 transition-colors disabled:opacity-70"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteTaskModal;