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

      setShowDeleteConfirm(false);
      onClose();
    } catch (err: any) {
      toast.error(err || 'Ошибка удаления задачи');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      <div
        className="
          fixed inset-0 bg-black/60 z-[120]
          flex items-center justify-center
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
            max-w-[420px] sm:max-w-md
            rounded-3xl shadow-2xl overflow-hidden
            max-h-[calc(100vh-24px)]
          "
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр выполненной задачи"
        >
          {/* Скролл только внутри, когда контента больше max-height */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 24px)' }}>
            {/* Контент */}
            <div className="px-4 pt-4 pb-3 min-[380px]:px-5 sm:px-8 sm:pt-7 sm:pb-5">
              <h2 className="text-lg min-[380px]:text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6 tracking-[-0.02em]">
                Просмотр выполненной задачи
              </h2>

              {/* Фото питомца + имя */}
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-14 h-14 min-[380px]:w-16 min-[380px]:h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-4 border-white shadow-md flex-shrink-0">
                  <img
                    src={task.pet?.photo_url || task.pet?.photo || '/images/Cat_and_dog.png'}
                    alt={task.pet?.name || 'Питомец'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (target.src !== '/images/Cat_and_dog.png') target.src = '/images/Cat_and_dog.png';
                    }}
                  />
                </div>

                <div className="min-w-0">
                  <div className="text-[11px] min-[380px]:text-xs sm:text-sm text-gray-500 tracking-[-0.02em]">
                    Питомец
                  </div>
                  <div
                    className="font-semibold text-base min-[380px]:text-lg sm:text-xl tracking-[-0.02em] truncate"
                    title={task.pet?.name || 'Неизвестный питомец'}
                  >
                    {task.pet?.name || 'Неизвестный питомец'}
                  </div>
                </div>
              </div>

              {/* Дата и время (значение сразу правее "Дата и время:") */}
              <div className="mb-4 sm:mb-5">
                <div className="flex items-baseline gap-2 flex-wrap tracking-[-0.02em]">
                  <div className="text-xs min-[380px]:text-sm text-gray-500 whitespace-nowrap">
                    Дата и время:
                  </div>
                  <div className="font-medium text-xs min-[380px]:text-sm sm:text-base">
                    {new Date(task.start_at).toLocaleDateString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}{' '}
                    в{' '}
                    {new Date(task.start_at).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {task.completed_at && (
                  <div className="text-[11px] min-[380px]:text-xs text-emerald-600 mt-1 tracking-[-0.02em]">
                    Выполнено:{' '}
                    {new Date(task.completed_at).toLocaleDateString('ru-RU')}{' '}
                    в{' '}
                    {new Date(task.completed_at).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}
              </div>

              {/* Категория */}
              <div className="mb-4 sm:mb-5">
                <div className="text-xs min-[380px]:text-sm text-gray-500 mb-2 tracking-[-0.02em]">
                  Категория
                </div>

                <div
                  className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 rounded-2xl text-xs min-[380px]:text-sm font-medium tracking-[-0.02em]"
                  style={{
                    backgroundColor: `${getCategoryColor(task.event_type)}20`,
                    color: getCategoryColor(task.event_type),
                  }}
                >
                  <img
                    src={`/images/${task.event_type}.png`}
                    alt={task.event_type}
                    className="w-4 h-4 min-[380px]:w-5 min-[380px]:h-5 flex-shrink-0"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <span className="truncate max-w-[220px] sm:max-w-none">{task.event_type}</span>
                </div>
              </div>

              {/* Название задачи: 2 строки видно полностью, дальше — скролл */}
              <div className="mb-4 sm:mb-5">
                <div className="text-xs min-[380px]:text-sm text-gray-500 mb-1 tracking-[-0.02em]">
                  Название задачи
                </div>

                <div
                  className="
                    font-medium text-sm min-[380px]:text-base sm:text-lg
                    leading-snug tracking-[-0.02em]
                    max-h-[2.75em] overflow-y-auto
                  "
                  title={task.title}
                >
                  {task.title || '-'}
                </div>
              </div>

              {/* Примечание: стиль текста = стиль названия задачи; 3 строки видно, дальше — скролл */}
              {/* Примечание: как обычный текст (как "Название задачи"), 3 строки видно, дальше — скролл */}
<div className="mb-4 sm:mb-5">
  <div className="text-xs min-[380px]:text-sm text-gray-500 mb-1 tracking-[-0.02em]">
    Примечание
  </div>

  <div
    className="
      font-medium text-sm min-[380px]:text-base sm:text-lg
      leading-snug tracking-[-0.02em]
      max-h-[4.125em] overflow-y-auto
    "
  >
    {task.notes || '-'}
  </div>
</div>
            </div>

            {/* Кнопки */}
            <div className="px-4 pb-4 min-[380px]:px-5 sm:px-8 sm:pb-7 flex gap-3 bg-white">
              <button
                onClick={() => onEdit(task)}
                className="
                  flex-1 py-3 sm:py-3.5
                  bg-black text-white
                  rounded-2xl font-medium
                  hover:bg-gray-800 transition-colors
                  text-sm sm:text-base tracking-[-0.02em]
                "
              >
                Редактировать задачу
              </button>

              <button
                onClick={onClose}
                className="
                  flex-1 py-3 sm:py-3.5
                  border border-gray-300 text-gray-700
                  rounded-2xl font-medium
                  hover:bg-gray-50 transition-colors
                  text-sm sm:text-base tracking-[-0.02em]
                "
              >
                Закрыть
              </button>
            </div>

            {/* (Если тебе нужен delete confirm отсюда) */}
            {/* Пример кнопки открытия подтверждения:
                <button onClick={() => setShowDeleteConfirm(true)}>Удалить</button>
            */}
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