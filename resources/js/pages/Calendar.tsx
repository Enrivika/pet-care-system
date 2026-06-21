import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllTasks, deleteTask, completeTask } from '../store/slices/calendarEventsSlice';
import { RootState } from '../store';
import { toast } from 'sonner';
import AddTaskModal from '../components/AddTaskModal';
import EditTaskModal from '../components/EditTaskModal';
import CompleteTaskModal from '../components/CompleteTaskModal';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { fetchPets } from '../store/slices/petsSlice';
import ViewTaskModal from '../components/ViewTaskModal';
import DeleteTaskModal from '../components/DeleteTaskModal';

const Calendar = () => {
  const dispatch = useDispatch();
  const { events, isLoading, error } = useSelector((state: RootState) => state.calendarEvents);
  const { pets } = useSelector((state: RootState) => state.pets);
  
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'all' | 'calendar' | 'history'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [pendingCompleteTask, setPendingCompleteTask] = useState<number | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false); // ← Тихое обновление страницы
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());


  // Загружаем питомцев
  useEffect(() => {
    if (pets.length === 0) {
      dispatch(fetchPets() as any);
    }
  }, [dispatch, pets.length]);

  // Загружаем все события (первый раз)
  useEffect(() => {
    dispatch(fetchAllTasks() as any).then(() => {
      setHasInitialLoaded(true);
    });
  }, [dispatch]);

  // Автоматическое обновление списка каждые 60 секунд (БЕЗ "Загрузка...")
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchAllTasks() as any);
    }, 60000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // === АВТОМАТИЧЕСКИЙ ПЕРЕНОС В ИСТОРИЮ ===
  useEffect(() => {
    const checkOverdueTasks = async () => {
      const now = new Date();
      const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const overdueTasks = events.filter((task: any) => {
        if (task.is_completed) return false;

        const startDate = new Date(task.start_at);
        const endDate = task.end_at ? new Date(task.end_at) : new Date(startDate.getTime() + 60 * 60 * 1000);

        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

        // Определяем all-day по флагу из БД
        const isAllDayTask = task.is_all_day === true || (startDate.getHours() === 0 && startDate.getMinutes() === 0);

        if (isAllDayTask) {
          
          return endDate < now || startDateOnly < todayOnly;
        } else {
          return endDate < now;
        }
      });

      for (const task of overdueTasks) {
        try {
          await dispatch(completeTask({ 
            id: task.id, 
            notes: 'Автоматически завершено' 
          }) as any).unwrap();
        } catch (e) {
          console.error('Ошибка авто-выполнения', e);
        }
      }

      if (overdueTasks.length > 0) {
        dispatch(fetchAllTasks() as any);
      }
    };

    checkOverdueTasks();
    const interval = setInterval(checkOverdueTasks, 45000);

    return () => clearInterval(interval);
  }, [events, dispatch]);

  // Форматирование времени (прочерк вместо 00:00)
  const formatTime = (startAt: string) => {
    if (!startAt) return '–';
    const date = new Date(startAt);
    const hours = date.getHours();
    const minutes = date.getMinutes();

    if (hours === 0 && minutes === 0) {
      return '—';
    }
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  // Умное форматирование даты для вкладок "Неделя" и "Все"
  const formatDateLabel = (startAt: string) => {
    if (!startAt) return '—';

    const taskDate = new Date(startAt);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const taskDateStr = taskDate.toDateString();
    const todayStr = today.toDateString();
    const tomorrowStr = tomorrow.toDateString();

    const timeStr = taskDate.getHours() === 0 && taskDate.getMinutes() === 0 
      ? '' 
      : ` (${taskDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })})`;

    if (taskDateStr === todayStr) {
      return `Сегодня${timeStr}`;
    }
    if (taskDateStr === tomorrowStr) {
      return `Завтра${timeStr}`;
    }

    // Полная дата (например: 1 мая 2026)
    const dateLabel = taskDate.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

    return `${dateLabel}${timeStr}`;
  };  

  const filteredEvents = events.filter(event => 
    (event.pet?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tasksForSelectedDate = filteredEvents
    .filter(e => 
      new Date(e.start_at).toDateString() === selectedDate.toDateString() && 
      !e.is_completed
    )
    .sort((a, b) => {
      const aIsAllDay = new Date(a.start_at).getHours() === 0 && new Date(a.start_at).getMinutes() === 0;
      const bIsAllDay = new Date(b.start_at).getHours() === 0 && new Date(b.start_at).getMinutes() === 0;
      if (aIsAllDay && !bIsAllDay) return -1;
      if (!aIsAllDay && bIsAllDay) return 1;
      return 0;
    });  

  const todayTasks = filteredEvents
    .filter(e => {
      const eventDate = new Date(e.start_at).toDateString();
      const today = new Date().toDateString();
      return eventDate === today && !e.is_completed;
    })
    .sort((a, b) => {
      const aIsAllDay = new Date(a.start_at).getHours() === 0 && new Date(a.start_at).getMinutes() === 0;
      const bIsAllDay = new Date(b.start_at).getHours() === 0 && new Date(b.start_at).getMinutes() === 0;

      if (aIsAllDay && !bIsAllDay) return -1; // a (без времени) идёт первым
      if (!aIsAllDay && bIsAllDay) return 1;
      return 0;
    });

  const weekTasks = filteredEvents.filter(e => {
    const eventDate = new Date(e.start_at);
    const today = new Date();
        
    const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const weekLater = new Date(todayOnly.getTime() + 7 * 24 * 60 * 60 * 1000);

    return eventDateOnly >= todayOnly && eventDateOnly <= weekLater && !e.is_completed;
  });

  const allTasks = filteredEvents.filter(e => !e.is_completed);
  const historyTasks = filteredEvents
    .filter(e => e.is_completed)
    .sort((a, b) => {      
      const dateA = new Date(a.completed_at || a.updated_at);
      const dateB = new Date(b.completed_at || b.updated_at);
      return dateB.getTime() - dateA.getTime();
    });

  const handleEdit = (task: any) => {
    setSelectedTask(task);
    if (task.is_completed) {
      setShowViewModal(true);
    } else {
      setShowEditModal(true);
    }
  };

  const handleDelete = async (task: any) => {
    if (!confirm(`Удалить задачу "${task.title}"?`)) return;
    try {
      await dispatch(deleteTask(task.id) as any).unwrap();
      toast.success('Задача удалена');
    } catch (err: any) {
      toast.error(err || 'Ошибка удаления задачи');
    }
  };

  const handleComplete = (task: any) => {
    setPendingCompleteTask(task.id);
    setSelectedTask(task);
    setShowCompleteModal(true);
  };

const renderTaskRow = (task: any) => {
  const catColor = getCategoryColor(task.event_type);

  // === Логика отображения даты ===
  let displayDate = '';

  if (activeTab === 'calendar') {
    displayDate = formatDateLabel(task.start_at);
  } else {
    const isAllOrWeek = activeTab === 'week' || activeTab === 'all';
    const fullLabel = isAllOrWeek 
      ? formatDateLabel(task.start_at) 
      : (formatTime(task.start_at) === '–' ? '—' : formatTime(task.start_at));
    displayDate = fullLabel;
  }

  // Разделяем дату и время (как в истории)
  let dateLabel = displayDate;
  let timeLabel = '';

  if (displayDate.includes('(')) {
    const match = displayDate.match(/(.+?)\s*\((.+?)\)/);
    if (match) {
      dateLabel = match[1].trim();
      timeLabel = match[2].trim();
    }
  } else if (activeTab === 'today') {
    dateLabel = 'Сегодня';
    timeLabel = displayDate !== '—' ? displayDate : '';
  }

  return (
    <div 
      key={task.id} 
      onClick={() => handleComplete(task)}
      className="bg-white border-b last:border-b-0 flex overflow-hidden hover:bg-gray-50 cursor-pointer relative min-h-[72px]"
    >
      {/* Цветовая полоска */}
      <div className="w-1.5 flex-shrink-0 self-stretch" style={{ backgroundColor: catColor }} />

      {/* Иконка категории */}
      <div className="flex items-center pl-3 pr-2">
        <div className="flex-shrink-0">
          <img 
            src={`/images/${task.event_type}.png`} 
            alt={task.event_type}
            className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12" 
          />
        </div>
      </div>

      {/* Дата и время */}
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

      {/* Основная информация */}
      <div className="flex-1 min-w-0 pr-16 md:pr-20 py-3 flex flex-col justify-center">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 text-[10px] min-[438px]:text-xs sm:text-sm truncate">
            {task.pet?.name}
          </span>
          <span 
            className="px-2 py-0.5 rounded-full text-[10px] min-[438px]:text-xs sm:text-sm font-medium flex-shrink-0"
            style={{ backgroundColor: `${catColor}20`, color: catColor }}
          >
            {task.event_type}
          </span>
        </div>

        {task.title && (
          <div className="text-[10px] min-[438px]:text-xs sm:text-sm text-gray-700 mt-1 line-clamp-2">
            {task.title}
          </div>
        )}
      </div>

      {/* Кнопки */}
      <div className="absolute top-1/2 -translate-y-1/2 right-3 md:right-5 flex flex-col md:flex-row items-center gap-0.5 md:gap-1 z-10 py-1 md:py-0">
        <button
          onClick={(e) => { e.stopPropagation(); handleEdit(task); }}
          className="w-8 h-8 flex items-center justify-center text-[#1F2421] hover:text-emerald-600 transition-colors"
          title="Редактировать"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
            <path d="m15 5 4 4"/>
          </svg>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); setSelectedTask(task); setShowDeleteModal(true); }}
          className="w-8 h-8 flex items-center justify-center text-[#1F2421] hover:text-red-600 transition-colors"
          title="Удалить"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
};

const renderHistoryTaskRow = (task: any) => {
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

  const catColor = getCategoryColor(task.event_type);

  return (
    <div 
      key={task.id} 
      onClick={() => handleEdit(task)}
      className="bg-white border-b last:border-b-0 flex overflow-hidden hover:bg-gray-50 cursor-pointer relative"
    >
      {/* Цветовая полоска слева (как в мед. журнале) */}
      <div 
        className="w-1.5 flex-shrink-0" 
        style={{ backgroundColor: catColor }} 
      />

      

      <div className="flex-1 p-3 pr-12 sm:p-4 sm:pr-14 flex items-center gap-0.5 sm:gap-1">
        {/* Иконка категории */}
        <div className="flex-shrink-0">
          <img 
            src={`/images/${task.event_type}.png`} 
            alt={task.event_type}
            className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12" 
          />
        </div>

        {/* Дата и время */}
        <div className="w-14 min-[438px]:w-16 sm:w-20 md:w-28 text-[10px] min-[438px]:text-xs sm:text-sm flex-shrink-0 text-center">
          <div className="font-semibold text-gray-900">{dateLabel}</div>
          {timeLabel && (
            <div className="text-gray-500 text-[10px] min-[438px]:text-xs sm:text-sm mt-0.5">({timeLabel})</div>
          )}
        </div>

        {/* Информация о задаче */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-[10px] min-[438px]:text-xs sm:text-sm truncate">
              {task.pet?.name}
            </span>
            <span 
              className="px-2 py-0.5 sm:px-3 sm:py-0.5 rounded-full text-[10px] min-[438px]:text-xs sm:text-sm font-medium flex-shrink-0"
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
          setSelectedTask(task);
          setShowDeleteModal(true);
        }}
        className="absolute top-1/2 -translate-y-1/2 right-4 w-8 h-8 flex items-center justify-center group text-[#1F2421] hover:text-red-600 transition-colors z-10"
        aria-label={`Удалить задачу для ${task.pet?.name}`}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-5 h-5 transition-transform group-hover:scale-110"
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M3 6h18" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </button>
    </div>
  );
};

  // Вспомогательные функции для цветов и иконок
  const getCategoryColor = (type: string) => {
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
    return colors[type] || '#6F6F6F';
  };


  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Заголовок */}
        <div className="mb-4 md:mb-5">
          <h1 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold text-[#1F2421]" 
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
            Календарь и задачи
          </h1>

          {/* Динамический текст в зависимости от вкладки */}
          <p className="mt-1 sm:mt-1.5 text-[#1F2421]/70 text-sm sm:text-base md:text-lg max-w-2xl"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
            {activeTab === 'today' && (
              <>Всего запланировано задач на сегодня: <span className="font-semibold text-[#4BBB71]">{todayTasks.length}</span></>
            )}
            {activeTab === 'week' && (
              <>Всего запланировано задач на неделю: <span className="font-semibold text-[#4BBB71]">{weekTasks.length}</span></>
            )}
            {activeTab === 'all' && (
              <>Всего запланировано задач: <span className="font-semibold text-[#4BBB71]">{allTasks.length}</span></>
            )}
            {activeTab === 'calendar' && (
              <>Всего запланировано задач на {selectedDate.toLocaleDateString('ru-RU', { 
                day: '2-digit', month: '2-digit', year: 'numeric' 
              })}: <span className="font-semibold text-[#4BBB71]">{tasksForSelectedDate.length}</span></>
            )}
            {activeTab === 'history' && (
              <>Всего задач в истории: <span className="font-semibold text-[#4BBB71]">{historyTasks.length}</span></>
            )}
          </p>
        </div>

        {/* Поиск + Кнопка "Добавить задачу" */}
        <div className="flex flex-col gap-3 min-[510px]:flex-row min-[510px]:items-center mb-6 md:mb-8">
          {/* Поисковая строка */}
          <div className="relative flex-1 min-w-0">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1F2421]/60 pointer-events-none">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-[18px] h-[18px] min-[325px]:w-5 min-[325px]:h-5" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.34-4.34" />
              </svg>
            </div>

            <input
              type="text"
              placeholder="Поиск задачи по имени питомца..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 min-[325px]:pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl 
                        text-[#1F2421] placeholder:text-[#1F2421]/60 
                        hover:border-gray-300 hover:shadow-sm
                        focus:outline-none focus:ring-2 focus:ring-[#4BBB71] focus:border-[#4BBB71]
                        transition-all text-xs min-[325px]:text-sm sm:text-base"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            />
          </div>

          {/* Кнопка добавить */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3.5 sm:px-6 sm:py-3.5 
                      bg-gradient-to-r from-[#00A063] to-[#4BBB71] text-[#E9F5ED] rounded-2xl 
                      hover:from-[#009055] hover:to-[#3DA35E] hover:shadow-md
                      active:from-[#007a4f] active:to-[#2E8B57] active:scale-[0.985]
                      flex items-center justify-center gap-2 text-sm sm:text-base font-medium 
                      whitespace-nowrap flex-shrink-0 w-full min-[510px]:w-auto shadow-sm transition-all 
                      min-h-[48px] min-[510px]:min-h-0"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            + Добавить задачу
          </button>
        </div>

      <div 
        className="fixed bottom-20 right-0 lg:bottom-0 z-[70] pointer-events-none select-none"
        style={{ filter: 'blur(8px)' }}
      >
        <div className="rotate-[-30deg] origin-bottom-right -mr-64 -mb-10 sm:-mr-96 sm:-mb-16 md:-mr-128 md:-mb-22 lg:-mr-160 lg:-mb-26 xl:-mr-200 xl:-mb-32">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-[500px] h-[450px] sm:w-[650px] sm:h-[580px] md:w-[850px] md:h-[760px] lg:w-[900px] lg:h-[800px] xl:w-[1050px] xl:h-[930px] text-[#1F2421] opacity-10" 
            viewBox="0 0 320 280" 
            fill="currentColor"
          >
            {/* Left ear */}
            <polygon points="95,55 55,12 125,38" />
            {/* Right ear */}
            <polygon points="225,55 265,12 195,38" />
            {/* Head (main face) */}
            <ellipse cx="160" cy="155" rx="105" ry="92" />
            {/* Inner ears for better shape */}
            <polygon points="105,52 68,20 118,40" />
            <polygon points="215,52 252,20 202,40" />
          </svg>
        </div>
      </div>

<div className="bg-white rounded-2xl border shadow-sm">
  
{/* ==================== ВКЛАДКИ ==================== */}
<div className="flex border-b overflow-x-auto whitespace-nowrap">
  {[
    { id: 'today', label: 'Сегодня' },
    { id: 'week', label: 'Неделя' },
    { id: 'all', label: 'Все' },
    { id: 'calendar', label: 'Календарь' },
    { id: 'history', label: 'История' },
  ].map(tab => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id as any)}
      className={`flex-1 px-2 py-3.5 font-medium border-b-2 transition-all text-center
        text-[10px] min-[365px]:text-xs sm:text-sm md:text-base
        ${activeTab === tab.id 
          ? 'border-[#4BBB71] text-[#4BBB71]' 
          : 'border-transparent text-[#1F2421]/70 hover:text-[#1F2421] hover:border-gray-300'}`}
      style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
    >
      {tab.label}
    </button>
  ))}
</div>

  {/* Показываем "Загрузка..." только при первой загрузке */}
  {!hasInitialLoaded && isLoading && <div className="p-8 text-center">Загрузка...</div>}
  {error && <div className="p-8 text-center text-red-500">{error}</div>}

{/* ==================== ВКЛАДКА "СЕГОДНЯ" ==================== */}
{activeTab === 'today' && (
  <>
{/* Зелёная подсказка */}
<div className="px-3 py-2 min-[325px]:px-4 min-[325px]:py-2.5 bg-[#4BBB71]/10 flex items-center justify-center gap-2 text-[9px] min-[325px]:text-[10px] min-[373px]:text-xs sm:text-sm text-[#4BBB71] border-b">
  <span>Нажми на задачу, чтобы отметить её выполненной</span>
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className="w-[14px] h-[14px] min-[325px]:w-[15px] min-[373px]:w-4 min-[373px]:h-4 text-[#4BBB71] flex-shrink-0"
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5"/>
  </svg>
</div>

    {todayTasks.length > 0 
      ? todayTasks.map(task => renderTaskRow(task))
      : <div 
      className="col-span-3 w-full text-center py-6 px-4 text-gray-500 bg-white rounded-2xl border text-sm sm:text-base md:text-lg lg:text-lg break-words"
      style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
        На сегодня задач нет
        </div>
    }
  </>
)}

{/* ==================== ВКЛАДКА "НЕДЕЛЯ" ==================== */}
{activeTab === 'week' && (
  <>
{/* Зелёная подсказка */}
<div className="px-3 py-2 min-[325px]:px-4 min-[325px]:py-2.5 bg-[#4BBB71]/10 flex items-center justify-center gap-2 text-[9px] min-[325px]:text-[10px] min-[373px]:text-xs sm:text-sm text-[#4BBB71] border-b">
  <span>Нажми на задачу, чтобы отметить её выполненной</span>
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className="w-[14px] h-[14px] min-[325px]:w-[15px] min-[373px]:w-4 min-[373px]:h-4 text-[#4BBB71] flex-shrink-0"
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5"/>
  </svg>
</div>

    {weekTasks.length > 0 
      ? weekTasks.map(task => renderTaskRow(task))
      : <div className="col-span-3 w-full text-center py-6 px-4 text-gray-500 bg-white rounded-2xl border text-sm sm:text-base md:text-lg lg:text-lg break-words"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>На этой неделе задач нет</div>
    }
  </>
)}

{/* ==================== ВКЛАДКА "ВСЕ" ==================== */}
{activeTab === 'all' && (
  <>
{/* Зелёная подсказка */}
<div className="px-3 py-2 min-[325px]:px-4 min-[325px]:py-2.5 bg-[#4BBB71]/10 flex items-center justify-center gap-2 text-[9px] min-[325px]:text-[10px] min-[373px]:text-xs sm:text-sm text-[#4BBB71] border-b">
  <span>Нажми на задачу, чтобы отметить её выполненной</span>
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className="w-[14px] h-[14px] min-[325px]:w-[15px] min-[373px]:w-4 min-[373px]:h-4 text-[#4BBB71] flex-shrink-0"
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5"/>
  </svg>
</div>

    {allTasks.length > 0 
      ? allTasks.map(task => renderTaskRow(task))
      : <div className="col-span-3 w-full text-center py-6 px-4 text-gray-500 bg-white rounded-2xl border text-sm sm:text-base md:text-lg lg:text-lg break-words"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>Запланированных задач нет</div>
    }
  </>
)}

{/* ==================== ВКЛАДКА "КАЛЕНДАРЬ" ==================== */}
{activeTab === 'calendar' && (
  <div className="flex flex-col md:flex-row">
    
    {/* Левая часть — Календарь */}
    <div className="w-full md:w-1/3 p-4 md:p-6 border-b md:border-r md:border-b-0 bg-white md:sticky md:top-6 md:self-start">
      <ReactCalendar
  value={selectedDate}
  onChange={(date: any) => setSelectedDate(new Date(date))}
tileClassName={({ date, view }) => {
  if (view === 'month') {
    const hasTask = events.some(e => 
      new Date(e.start_at).toDateString() === date.toDateString() && !e.is_completed
    );
    const isSelected = date.toDateString() === selectedDate.toDateString();
    const isToday = date.toDateString() === new Date().toDateString();

    let classes = '';

    if (isSelected) {
      classes += ' !bg-[#1F2421] !text-white rounded-2xl font-medium';
    } 
    else if (hasTask) {
      classes += ' bg-[#4BBB71] text-white rounded-full font-semibold shadow-sm';
    } 
    else if (isToday) {
      classes += ' bg-[#E9F5ED] text-[#1F2421] rounded-2xl font-medium';
    }

    return classes;
  }

  // === Вид "год" (выбор месяца) ===
  if (view === 'year') {
    const isSelectedMonth = 
      date.getMonth() === selectedDate.getMonth() && 
      date.getFullYear() === selectedDate.getFullYear();

    if (isSelectedMonth) {
      return '!bg-[#1F2421] !text-white rounded-2xl font-medium';
    }
  }

  // === Вид "десятилетие" (выбор года / десятилетия) ===
  if (view === 'decade') {
    const isSelectedDecade = date.getFullYear() === selectedDate.getFullYear();

    if (isSelectedDecade) {
      return '!bg-[#1F2421] !text-white rounded-2xl font-medium';
    }
  }

  return '';
}}
  className="w-full border-0 text-sm bg-transparent react-calendar-custom"
  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
/>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
        <span>Есть задачи</span>
      </div>
    </div>

    {/* Правая часть — Задачи */}
    <div className="w-full md:w-2/3 bg-white flex flex-col">
      
      {/* Зелёная подсказка */}
      <div className="px-3 py-2 min-[325px]:px-4 min-[325px]:py-2.5 bg-[#4BBB71]/10 flex items-center justify-center gap-2 text-[9px] min-[325px]:text-[10px] min-[373px]:text-xs sm:text-sm text-[#4BBB71] border-b">
        <span>Нажми на задачу, чтобы отметить её выполненной</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-[14px] h-[14px] min-[325px]:w-[15px] min-[373px]:w-4 min-[373px]:h-4 text-[#4BBB71] flex-shrink-0"
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tasksForSelectedDate.length > 0 ? (
          tasksForSelectedDate.map(task => renderTaskRow(task))
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <p className="col-span-3 w-full text-center py-6 px-4 text-gray-500 bg-white rounded-2xl text-sm sm:text-base md:text-lg lg:text-lg break-words"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>На эту дату задач нет</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}

{/* ==================== ВКЛАДКА "ИСТОРИЯ" ==================== */}
{activeTab === 'history' && (
  <>
   
{/* Подсказка — на всю ширину белой плашки */}
<div 
  className="px-4 py-2.5 bg-[#1F2421]/10 flex items-center justify-center gap-2 text-[10px] min-[360px]:text-xs sm:text-sm text-[#1F2421] border-b"
  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
>
  <span>Нажми на задачу, чтобы просмотреть её</span>
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className="w-[15px] h-[15px] min-[360px]:w-4 min-[360px]:h-4 text-[#1F2421] flex-shrink-0"
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
</div>

    {/* Список задач или пустое состояние */}
    {historyTasks.length > 0 
      ? historyTasks.map((task, index) => 
          renderHistoryTaskRow(task, index === historyTasks.length - 1)
        )
      : <div className="col-span-3 w-full text-center py-6 px-4 text-gray-500 bg-white rounded-2xl border text-sm sm:text-base md:text-lg lg:text-lg break-words"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>Выполненных задач пока нет</div>
    }
  </>
)}
</div>
      </div>

      {/* Модальные окна */}
      <AddTaskModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      <EditTaskModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedTask(null); }} task={selectedTask} />
      <CompleteTaskModal 
        isOpen={showCompleteModal} 
        onClose={() => {
          setShowCompleteModal(false);
          setSelectedTask(null);
          setPendingCompleteTask(null);
        }} 
        task={selectedTask} 
      />
      <ViewTaskModal 
        isOpen={showViewModal} 
        onClose={() => {
          setShowViewModal(false);
          setSelectedTask(null);
        }} 
        task={selectedTask} 
        onEdit={(task) => {
          setShowViewModal(false);
          setSelectedTask(task);
          setShowEditModal(true);
        }}
      />
      <DeleteTaskModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        task={selectedTask} 
      />      
    </div>
  );
};

export default Calendar;