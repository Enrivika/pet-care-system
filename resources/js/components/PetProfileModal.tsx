import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { fetchAllTasks } from '../store/slices/calendarEventsSlice';
import { toast } from 'sonner';
import AddTaskModal from './AddTaskModal';
import EditTaskModal from './EditTaskModal';
import CompleteTaskModal from './CompleteTaskModal';
import ViewTaskModal from './ViewTaskModal';
import DeleteTaskModal from './DeleteTaskModal';

interface PetProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: any;
  onEditPet: (pet: any) => void;
}

const PetProfileModal = ({ isOpen, onClose, pet, onEditPet }: PetProfileModalProps) => {
  const dispatch = useDispatch();
  const { events } = useSelector((state: RootState) => state.calendarEvents);

  const [activeTab, setActiveTab] = useState<'tasks' | 'history'>('tasks');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [pendingCompleteTask, setPendingCompleteTask] = useState<any>(null);

  useEffect(() => {
    if (isOpen) setActiveTab('tasks');
  }, [isOpen]);

  if (!isOpen || !pet) return null;

  const petTasks = events.filter((task: any) => task.pet_id === pet.id);
  const upcomingTasks = petTasks.filter((t: any) => !t.is_completed);
  const historyTasks = petTasks
    .filter((t: any) => t.is_completed)
    .sort((a: any, b: any) => {
      const dateA = new Date(a.completed_at || a.updated_at);
      const dateB = new Date(b.completed_at || b.updated_at);
      return dateB.getTime() - dateA.getTime(); // ← самые новые сверху
    });

  const formatAge = (age: number | null | undefined): string => {
    if (!age || age <= 0) return '';
    const lastDigit = age % 10;
    const lastTwoDigits = age % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return `${age} лет`;
    if (lastDigit === 1) return `${age} год`;
    if (lastDigit >= 2 && lastDigit <= 4) return `${age} года`;
    return `${age} лет`;
  };

  const getPetAvatar = (pet: any) => {
    if (pet.photo_url) return pet.photo_url;
    return "/images/Cat_and_dog.png";
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
      case 'Укол': return 'bg-purple-100 text-purple-700';
      case 'Лекарство': return 'bg-red-100 text-red-700';
      case 'Ветеринар': return 'bg-teal-100 text-teal-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Кормление': 'bg-orange-100 text-orange-700',
      'Поение': 'bg-blue-100 text-blue-700',
      'Прогулка': 'bg-green-100 text-green-700',
      'Укол': 'bg-purple-100 text-purple-700',
      'Лекарство': 'bg-red-100 text-red-700',
      'Ветеринар': 'bg-slate-100 text-slate-700',
      default: 'bg-gray-100 text-gray-700',
    };
    return colors[type] || colors.default;
  };  

  // Умное форматирование даты для профиля питомца
  const formatDateForProfile = (startAt: string) => {
    if (!startAt) return { dateLabel: '—', timeLabel: '' };

    const taskDate = new Date(startAt);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const taskDateStr = taskDate.toDateString();
    const todayStr = today.toDateString();
    const tomorrowStr = tomorrow.toDateString();

    let dateLabel = '';
    if (taskDateStr === todayStr) {
      dateLabel = 'Сегодня';
    } else if (taskDateStr === tomorrowStr) {
      dateLabel = 'Завтра';
    } else {
      dateLabel = taskDate.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    }

    const timeLabel = taskDate.getHours() !== 0 || taskDate.getMinutes() !== 0 
      ? taskDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      : '';

    return { dateLabel, timeLabel };
  };

  const handleCheckboxClick = (task: any) => {
    setPendingCompleteTask(task);
    setSelectedTask(task);
    setShowCompleteModal(true);
  };

  const handleCompleteModalClose = () => {
    setShowCompleteModal(false);
    setPendingCompleteTask(null);
  };

  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    setShowViewModal(false);
    setShowEditTaskModal(true);
  };

  const handleDeleteTask = (task: any) => {
    setSelectedTask(task);
    setShowDeleteModal(true);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка профиля */}
        <div className="p-8 border-b flex items-center gap-6">
          <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-md flex-shrink-0">
            <img src={getPetAvatar(pet)} alt={pet.name} className="w-full h-full object-cover" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <button onClick={() => onEditPet(pet)} className="text-gray-400 hover:text-emerald-600 transition-colors p-1">✏️</button>
              <h1 className="text-3xl font-bold">{pet.name}</h1>
              <span className="px-4 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
                {formatAge(pet.age) || 'Возраст не указан'}
              </span>
            </div>

            <div className="mt-2">
              {upcomingTasks.length > 0 ? (
                <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full">Есть задача!</span>
              ) : (
                <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">Задач нет</span>
              )}
            </div>
          </div>

          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>

        {/* Вкладки */}
        <div className="flex border-b px-8">
          <button 
            onClick={() => setActiveTab('tasks')} 
            className={`px-8 py-4 font-medium border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-600'}`}
          >
            Задачи ({upcomingTasks.length})
          </button>
          <button 
            onClick={() => setActiveTab('history')} 
            className={`px-8 py-4 font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-600'}`}
          >
            История ({historyTasks.length})
          </button>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-auto p-8">
          {activeTab === 'tasks' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Предстоящие задачи</h2>
                <button 
                  onClick={() => setShowAddTaskModal(true)} 
                  className="px-5 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 text-sm"
                >
                  + Добавить задачу
                </button>
              </div>

              {upcomingTasks.length > 0 ? (
                <div className="space-y-3">
                  {upcomingTasks.map((task: any) => {
                    const { dateLabel, timeLabel } = formatDateForProfile(task.start_at);
                    
                    return (
                      <div key={task.id} className="flex items-start justify-between p-4 border rounded-2xl hover:bg-gray-50 group">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Чекбокс */}
                          <input
                            type="checkbox"
                            checked={pendingCompleteTask?.id === task.id}
                            onChange={() => handleCheckboxClick(task)}
                            className="w-5 h-5 accent-emerald-500 cursor-pointer mt-1 flex-shrink-0"
                          />

                          {/* Иконка категории */}
                          <div className="text-3xl flex-shrink-0 mt-0.5">
                            {getCategoryIcon(task.event_type)}
                          </div>

                          {/* Дата и время (по центру) */}
                          <div className="w-28 md:w-36 text-sm flex-shrink-0 text-center">
                            <div className="font-medium text-gray-900">{dateLabel}</div>
                            {timeLabel && (
                              <div className="text-gray-500 text-xs mt-0.5">в {timeLabel}</div>
                            )}
                          </div>

                          {/* Информация о задаче */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">{pet.name}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(task.event_type)}`}>
                                {task.event_type}
                              </span>
                            </div>
                            
                            <div className="text-sm text-gray-700 mt-1">
                              <span className="text-gray-500">Задача:</span> {task.title || '—'}
                            </div>
                          </div>
                        </div>

                        {/* Кнопки действий */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 ml-4">
                          <button 
                            onClick={() => handleEditTask(task)} 
                            className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDeleteTask(task)} 
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">У питомца пока нет предстоящих задач</div>
              )}
            </div>
          )}

            {activeTab === 'history' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">История выполненных задач</h2>

                {historyTasks.length > 0 ? (
                  <div className="space-y-3">
                    {historyTasks.map((task: any) => {
                      const completedDate = new Date(task.completed_at || task.updated_at);
                      const today = new Date();
                      const yesterday = new Date(today);
                      yesterday.setDate(yesterday.getDate() - 1);

                      let dateLabel = '';
                      if (completedDate.toDateString() === today.toDateString()) {
                        dateLabel = 'Сегодня';
                      } else if (completedDate.toDateString() === yesterday.toDateString()) {
                        dateLabel = 'Вчера';
                      } else {
                        dateLabel = completedDate.toLocaleDateString('ru-RU', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        });
                      }

                      const timeLabel = completedDate.getHours() !== 0 || completedDate.getMinutes() !== 0 
                        ? completedDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                        : '';

                      return (
                        <div key={task.id} className="flex items-start justify-between p-4 border rounded-2xl hover:bg-gray-50">
                          <div className="flex items-start gap-3 flex-1">
                            {/* Зелёная галочка */}
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-emerald-600 text-xl">✓</span>
                            </div>

                            {/* Иконка категории */}
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${getCategoryColor(task.event_type)}`}>
                              {getCategoryIcon(task.event_type)}
                            </div>

                            {/* Дата и время — по центру */}
                            <div className="w-20 md:w-28 flex-shrink-0 text-sm text-center">
                              <div className="font-medium text-gray-900">{dateLabel}</div>
                              {timeLabel && (
                                <div className="text-gray-500 text-xs">({timeLabel})</div>
                              )}
                            </div>

                            {/* Информация о задаче */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{pet.name}</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(task.event_type)}`}>
                                  {task.event_type}
                                </span>
                              </div>
                              
                              {task.title && (
                                <div className="text-sm text-gray-800 mt-1">
                                  <span className="text-gray-500">Задача:</span> {task.title}
                                </div>
                              )}
                              
                              {task.notes && (
                                <div className="text-xs text-gray-600 mt-1">
                                  <span className="text-gray-500">Примечание:</span> {task.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Кнопка "Просмотр" */}
                          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                            <button 
                              onClick={() => {
                                setSelectedTask(task);
                                setShowViewModal(true);
                              }} 
                              className="px-4 py-1.5 text-sm bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 font-medium"
                            >
                              Просмотр
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">Пока нет выполненных задач</div>
                )}
              </div>
            )}
        </div>
      </div>

      {/* Модалки */}
      <AddTaskModal isOpen={showAddTaskModal} onClose={() => setShowAddTaskModal(false)} defaultPetId={pet.id} />
      <EditTaskModal isOpen={showEditTaskModal} onClose={() => setShowEditTaskModal(false)} task={selectedTask} />
      <CompleteTaskModal isOpen={showCompleteModal} onClose={handleCompleteModalClose} task={selectedTask} />
      <ViewTaskModal isOpen={showViewModal} onClose={() => setShowViewModal(false)} task={selectedTask} onEdit={handleEditTask} />
      <DeleteTaskModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} task={selectedTask} />
    </div>
  );
};

export default PetProfileModal;