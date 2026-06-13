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
      return dateB.getTime() - dateA.getTime();
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

  const getCategoryIcon = (category: string) => (
    <img 
      src={`/images/${category}.png`} 
      alt={category}
      className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12" 
    />
  );

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Кормление': '#DA985D',
      'Поение': '#4CA9B3',
      'Прогулка': '#6D8967',
      'Укол': '#625AAE',
      'Лекарство': '#C4585A',
      'Ветеринар': '#5E8086',
      'Игры': '#984343',
      'Гигиена': '#11759D',
      'Обучение': '#906889',
      'Груминг': '#847452',
      'Уборка': '#8F5E5E',
      'Другое': '#6F6F6F',
    };
    return colors[category] || '#6F6F6F';
  };

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
    if (taskDateStr === todayStr) dateLabel = 'Сегодня';
    else if (taskDateStr === tomorrowStr) dateLabel = 'Завтра';
    else dateLabel = taskDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

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
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-[99%] sm:max-w-[560px] md:max-w-4xl lg:max-w-5xl 
                   max-h-[94dvh] overflow-hidden shadow-2xl flex flex-col mx-1 sm:mx-4"
        onClick={(e) => e.stopPropagation()}
      >
{/* Шапка профиля */}
<div className="px-3 sm:px-4 md:px-5 lg:px-6 pt-5 pb-5 border-b flex items-center gap-4 flex-shrink-0">
  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden border-4 border-white shadow-md flex-shrink-0">
    <img src={getPetAvatar(pet)} alt={pet.name} className="w-full h-full object-cover" />
  </div>

  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2 flex-wrap">
      
      {/* Имя + Возраст */}
      <div className="flex items-center gap-1.5 min-w-0">
        <h1 className="text-lg min-[327px]:text-xl sm:text-2xl md:text-3xl font-bold text-[#1F2421] truncate">
          {pet.name}
        </h1>
        {formatAge(pet.age) && (
          <span className="font-normal text-[#1F2421]/80 text-base min-[327px]:text-lg sm:text-xl md:text-2xl whitespace-nowrap">{formatAge(pet.age)}
          </span>
        )}
      </div>

      {/* Карандаш — теперь СПРАВА от имени */}
      <button 
        onClick={() => onEditPet(pet)} 
        className="text-[#1F2421] hover:text-gray-500 transition-colors p-1 flex-shrink-0"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="w-4 h-4 min-[327px]:w-[18px] min-[327px]:h-[18px]"
        >
          <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
          <path d="m15 5 4 4"/>
        </svg>
      </button>

    </div>

    <div className="mt-1.5">
      {upcomingTasks.length > 0 ? (
        <span className="px-3 py-0.5 bg-[#4BBB71] text-white text-xs font-medium rounded-full">Есть задача</span>
      ) : (
        <span className="px-3 py-0.5 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">Нет задач</span>
      )}
    </div>
  </div>
</div>

        {/* Вкладки */}
        <div className="flex border-b px-2 sm:px-4 flex-shrink-0">
          <button 
            onClick={() => setActiveTab('tasks')} 
            className={`flex-1 py-3 sm:py-3.5 font-medium border-b-2 transition-all text-center text-sm sm:text-base
              ${activeTab === 'tasks' ? 'border-[#4BBB71] text-[#4BBB71]' : 'border-transparent text-[#1F2421]/70 hover:text-[#1F2421]'}`}
          >
            Задачи ({upcomingTasks.length})
          </button>
          <button 
            onClick={() => setActiveTab('history')} 
            className={`flex-1 py-3 sm:py-3.5 font-medium border-b-2 transition-all text-center text-sm sm:text-base
              ${activeTab === 'history' ? 'border-[#4BBB71] text-[#4BBB71]' : 'border-transparent text-[#1F2421]/70 hover:text-[#1F2421]'}`}
          >
            История ({historyTasks.length})
          </button>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-5 py-4">
          {activeTab === 'tasks' && (
            <div>
              <div className="px-3 py-2 min-[325px]:px-4 min-[325px]:py-2.5 bg-[#4BBB71]/10 flex items-center justify-center gap-2 text-[9px] min-[325px]:text-[10px] min-[373px]:text-xs sm:text-sm text-[#4BBB71] border-b mb-3">
                <span>Нажми на задачу, чтобы отметить её выполненной</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-[14px] h-[14px] min-[325px]:w-[15px] min-[373px]:w-4 min-[373px]:h-4 text-[#4BBB71] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              </div>

              {upcomingTasks.length > 0 ? (
                <div>
                  {upcomingTasks.map((task: any) => {
                    const catColor = getCategoryColor(task.event_type);
                    const { dateLabel, timeLabel } = formatDateForProfile(task.start_at);
                    return (
                      <div 
                        key={task.id} 
                        onClick={() => handleCheckboxClick(task)}
                        className="bg-white border-b last:border-b-0 flex overflow-hidden hover:bg-gray-50 cursor-pointer relative min-h-[68px]"
                      >
                        <div className="w-1.5 flex-shrink-0 self-stretch" style={{ backgroundColor: catColor }} />

                        <div className="flex items-center pl-2 pr-1.5">
                          <div className="flex-shrink-0">
                            {getCategoryIcon(task.event_type)}
                          </div>
                        </div>

                        <div className="w-20 min-[438px]:w-24 flex-shrink-0 flex flex-col items-center justify-center px-1 text-center">
                          <div className="text-[10px] min-[438px]:text-xs sm:text-sm font-medium text-gray-700 leading-tight">
                            {dateLabel}
                          </div>
                          {timeLabel && (
                            <div className="text-[10px] min-[438px]:text-xs text-gray-500 mt-0.5">
                              ({timeLabel})
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 pr-14 md:pr-16 py-2.5 flex flex-col justify-center">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span 
                              className="px-2 py-0.5 rounded-full text-[10px] min-[438px]:text-xs sm:text-sm font-medium flex-shrink-0"
                              style={{ backgroundColor: `${catColor}20`, color: catColor }}
                            >
                              {task.event_type}
                            </span>
                          </div>

                          {task.title && (
                            <div className="text-[10px] min-[438px]:text-xs sm:text-sm text-gray-700 mt-0.5 line-clamp-2">
                              {task.title}
                            </div>
                          )}
                        </div>

                        <div className="absolute top-1/2 -translate-y-1/2 right-3 md:right-5 flex flex-col md:flex-row items-center gap-0.5 md:gap-1 z-10 py-1 md:py-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditTask(task); }}
                            className="w-8 h-8 flex items-center justify-center text-[#1F2421] hover:text-emerald-600 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
                              <path d="m15 5 4 4"/>
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTask(task); }}
                            className="w-8 h-8 flex items-center justify-center text-[#1F2421] hover:text-red-600 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                            </svg>
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
    {/* Плашка-подсказка */}
    <div className="px-4 py-2.5 bg-[#1F2421]/10 flex items-center justify-center gap-2 text-[10px] min-[360px]:text-xs sm:text-sm text-[#1F2421] border-b mb-3">
      <span>Нажми на задачу, чтобы посмотреть её</span>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-[15px] h-[15px] min-[360px]:w-4 min-[360px]:h-4 text-[#1F2421] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    </div>

    {historyTasks.length > 0 ? (
      <div>
        {historyTasks.map((task: any) => {
          const completedDate = new Date(task.completed_at || task.updated_at);
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          let dateLabel = completedDate.toDateString() === today.toDateString() ? 'Сегодня' 
            : completedDate.toDateString() === yesterday.toDateString() ? 'Вчера' 
            : completedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

          const timeLabel = completedDate.getHours() !== 0 || completedDate.getMinutes() !== 0 
            ? completedDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';

          const catColor = getCategoryColor(task.event_type);

          return (
            <div 
              key={task.id} 
              onClick={() => { setSelectedTask(task); setShowViewModal(true); }}
              className="bg-white border-b last:border-b-0 flex overflow-hidden hover:bg-gray-50 cursor-pointer relative"
            >
              {/* Цветовая полоска */}
              <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: catColor }} />

              <div className="flex-1 p-3 pr-12 sm:p-4 sm:pr-14 flex items-center gap-0.5 sm:gap-1">
                {/* Иконка категории */}
                <div className="flex-shrink-0">
                  {getCategoryIcon(task.event_type)}
                </div>

                {/* Дата и время */}
                <div className="w-14 min-[438px]:w-16 sm:w-20 md:w-28 text-[10px] min-[438px]:text-xs sm:text-sm flex-shrink-0 text-center">
                  <div className="font-semibold text-gray-900">{dateLabel}</div>
                  {timeLabel && <div className="text-gray-500 text-[10px] min-[438px]:text-xs sm:text-sm mt-0.5">({timeLabel})</div>}
                </div>

                {/* Информация о задаче (БЕЗ имени питомца и БЕЗ примечаний) */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Цветная плашка категории */}
                    <span 
                      className="px-2 py-0.5 rounded-full text-[10px] min-[438px]:text-xs sm:text-sm font-medium flex-shrink-0"
                      style={{ backgroundColor: `${catColor}20`, color: catColor }}
                    >
                      {task.event_type}
                    </span>
                  </div>
                  
                  {task.title && (
                    <div className="text-[10px] min-[438px]:text-xs sm:text-sm text-gray-700 mt-0.5 line-clamp-2">
                      {task.title}
                    </div>
                  )}
                </div>
              </div>

              {/* Кнопка удаления */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTask(task);
                }}
                className="absolute top-1/2 -translate-y-1/2 right-4 w-8 h-8 flex items-center justify-center group text-[#1F2421] hover:text-red-600 transition-colors z-10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </button>
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

        {/* Прилипшие кнопки внизу */}
        <div className="p-4 sm:p-5 border-t bg-white flex-shrink-0 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 sm:py-3.5 border border-gray-300 rounded-2xl hover:bg-gray-50 font-medium text-xs min-[334px]:text-sm transition-all"
          >
            Отмена
          </button>
          <button 
            onClick={() => setShowAddTaskModal(true)} 
            className="flex-1 px-4 py-2.5 sm:py-3.5 bg-gradient-to-r from-[#00A063] to-[#4BBB71] text-[#E9F5ED] rounded-2xl 
                      hover:from-[#009055] hover:to-[#3DA35E] hover:shadow-md active:scale-[0.985] 
                      flex items-center justify-center gap-2 text-xs min-[334px]:text-sm sm:text-base font-medium shadow-sm transition-all"
          >
            + Добавить задачу
          </button>
        </div>
      </div>

      {/* Модалки */}
      <AddTaskModal isOpen={showAddTaskModal} onClose={() => setShowAddTaskModal(false)} defaultPetId={pet.id} />
      <EditTaskModal isOpen={showEditTaskModal} onClose={() => { setShowEditTaskModal(false); setSelectedTask(null); }} task={selectedTask} />
      <CompleteTaskModal isOpen={showCompleteModal} onClose={handleCompleteModalClose} task={selectedTask} />
      <ViewTaskModal isOpen={showViewModal} onClose={() => { setShowViewModal(false); setSelectedTask(null); }} task={selectedTask} onEdit={handleEditTask} />
      <DeleteTaskModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} task={selectedTask} />
    </div>
  );
};

export default PetProfileModal;