import { useState, useEffect } from 'react';
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

  // Закрытие по Esc
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

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
      className="fixed inset-0 bg-black/60 z-[200] px-4 py-4 sm:py-6 flex items-center justify-center"
      onClick={handleBackdropClick}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div
        className="
          bg-white w-full max-w-md sm:max-w-lg
          rounded-3xl shadow-2xl relative
          p-5 sm:p-7 md:p-8
          max-h-[85dvh] overflow-auto
        "
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Удалить задачу"
      >
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600 text-center mb-2 sm:mb-3 tracking-[-0.02em]">
          Удалить задачу?
        </h2>

        <div className="text-center mb-5 sm:mb-7">
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed tracking-[-0.02em]">
            Это действие нельзя отменить.
          </p>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed tracking-[-0.02em]">
            Задача будет удалена навсегда.
          </p>
        </div>

        <div className="flex gap-3 sm:gap-4">
          <button
            onClick={onClose}
            className="
              flex-1
              py-3 sm:py-3.5 md:py-4
              border border-gray-300 text-gray-700
              rounded-2xl font-semibold
              hover:bg-gray-50 transition-colors
              text-sm sm:text-base tracking-[-0.02em]
            "
            type="button"
            disabled={isDeleting}
          >
            Отмена
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="
              flex-1
              py-3 sm:py-3.5 md:py-4
              bg-red-600 text-white
              rounded-2xl font-semibold
              hover:bg-red-700 transition-colors
              disabled:opacity-70
              text-sm sm:text-base tracking-[-0.02em]
            "
            type="button"
          >
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteTaskModal;