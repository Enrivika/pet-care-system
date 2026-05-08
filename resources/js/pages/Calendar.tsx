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
  
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'all' | 'calendar' | 'history'>('today');
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

        const taskDate = new Date(task.start_at);
        const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
        const taskHours = taskDate.getHours();
        const taskMinutes = taskDate.getMinutes();

        const isAllDayTask = task.is_all_day === true || (taskHours === 0 && taskMinutes === 0);

        if (isAllDayTask) {
          return taskDateOnly < todayOnly;
        } else {
          return taskDate < now;
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
      : ` (в ${taskDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })})`;

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

  const renderTaskRow = (task: any, isHistory: boolean = false) => (
    <div key={task.id} className="flex items-center justify-between p-4 border-b hover:bg-gray-50">
      <div className="flex items-center gap-3 flex-1">
        {!isHistory && (
          <input 
            type="checkbox" 
            className="w-5 h-5 accent-emerald-500 cursor-pointer flex-shrink-0"
            checked={pendingCompleteTask === task.id}
            onChange={() => handleComplete(task)}
          />
        )}

        {/* Иконка категории */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          task.event_type === 'Кормление' ? 'bg-orange-100 text-orange-600' :
          task.event_type === 'Поение' ? 'bg-blue-100 text-blue-600' :
          task.event_type === 'Прогулка' ? 'bg-green-100 text-green-600' :
          task.event_type === 'Укол' ? 'bg-purple-100 text-purple-600' :
          task.event_type === 'Лекарство' ? 'bg-red-100 text-red-600' :
          task.event_type === 'Ветеринар' ? 'bg-slate-100 text-slate-600' :
          'bg-gray-100 text-gray-600'
        }`}>
          {task.event_type === 'Кормление' ? '🍽️' : 
          task.event_type === 'Поение' ? '💧' : 
          task.event_type === 'Прогулка' ? '🚶' : 
          task.event_type === 'Укол' ? '💉' : 
          task.event_type === 'Лекарство' ? '💊' :
          task.event_type === 'Ветеринар' ? '🩺' : '📋'}
        </div>

        {/* Время и время */}        
        <div className="text-sm font-semibold text-gray-700 w-44 flex-shrink-0 text-center">
          {activeTab === 'week' || activeTab === 'all' 
            ? formatDateLabel(task.start_at)
            : formatTime(task.start_at) === '–' ? '—' : formatTime(task.start_at)
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{task.pet?.name || 'Питомец'}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
              task.event_type === 'Кормление' ? 'bg-orange-100 text-orange-700' :
              task.event_type === 'Поение' ? 'bg-blue-100 text-blue-700' :
              task.event_type === 'Прогулка' ? 'bg-green-100 text-green-700' :
              task.event_type === 'Укол' ? 'bg-purple-100 text-purple-700' :
              task.event_type === 'Лекарство' ? 'bg-red-100 text-red-700' :
              task.event_type === 'Ветеринар' ? 'bg-slate-100 text-slate-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {task.event_type}
            </span>
          </div>
          
          {task.title && (
            <div className="text-sm text-gray-600 mt-0.5 truncate">
              {task.title}
            </div>
          )}
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
        {isHistory ? (
          <button 
            onClick={() => handleEdit(task)} 
            className="px-4 py-1.5 text-sm bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 font-medium"
          >
            Просмотр
          </button>
        ) : (
          <>
            <button 
              onClick={() => handleEdit(task)} 
              className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors" 
              title="Редактировать"
            >
              ✏️
            </button>
            <button 
              onClick={() => {
                setSelectedTask(task);
                setShowDeleteModal(true);
              }} 
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" 
              title="Удалить"
            >
              🗑️
            </button>
          </>
        )}
      </div>
    </div>
  );

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

    return (
      <div key={task.id} className="flex items-start justify-between p-4 border-b hover:bg-gray-50">
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
          <div className="w-28 flex-shrink-0 text-sm text-center">
            <div className="font-medium text-gray-900">{dateLabel}</div>
            {timeLabel && (
              <div className="text-gray-500 text-xs">({timeLabel})</div>
            )}
          </div>

          {/* Информация о задаче */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{task.pet?.name || 'Питомец'}</span>
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

        {/* Кнопка "Просмотр" (без удаления) */}
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          <button 
            onClick={() => handleEdit(task)} 
            className="px-4 py-1.5 text-sm bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 font-medium"
          >
            Просмотр
          </button>
        </div>
      </div>
    );
  };

  // Вспомогательные функции для цветов и иконок
  const getCategoryColor = (type: string) => {
    const colors: Record<string, string> = {
      'Кормление': 'bg-orange-100 text-orange-600',
      'Поение': 'bg-blue-100 text-blue-600',
      'Прогулка': 'bg-green-100 text-green-600',
      'Укол': 'bg-purple-100 text-purple-600',
      'Лекарство': 'bg-red-100 text-red-600',
      'Ветеринар': 'bg-slate-100 text-slate-600',
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  const getCategoryIcon = (type: string) => {
    const icons: Record<string, string> = {
      'Кормление': '🍽️',
      'Поение': '💧',
      'Прогулка': '🚶',
      'Укол': '💉',
      'Лекарство': '💊',
      'Ветеринар': '🩺',
    };
    return icons[type] || '📋';
  };

  const getCategoryBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Кормление': 'bg-orange-100 text-orange-700',
      'Поение': 'bg-blue-100 text-blue-700',
      'Прогулка': 'bg-green-100 text-green-700',
      'Укол': 'bg-purple-100 text-purple-700',
      'Лекарство': 'bg-red-100 text-red-700',
      'Ветеринар': 'bg-slate-100 text-slate-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };


  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Календарь и задачи</h1>
            <p className="text-gray-600 mt-1">
              Всего запланировано <span className="font-semibold text-emerald-600">{allTasks.length}</span> задач
            </p>
          </div>
          
          <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 flex items-center gap-2">
            + Добавить задачу
          </button>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Поиск задачи по имени питомца..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex border-b mb-6">
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
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border shadow-sm min-h-[500px]">
          {/* Показываем "Загрузка..." ТОЛЬКО при первой загрузке */}
          {!hasInitialLoaded && isLoading && <div className="p-8 text-center">Загрузка...</div>}
          {error && <div className="p-8 text-center text-red-500">{error}</div>}

          {/* Вкладка "Сегодня" */}
          {activeTab === 'today' && (
            <div>
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Сегодня — {new Date().toLocaleDateString('ru-RU')}</h2>
                <p className="text-gray-600">Всего запланировано {todayTasks.length} задач</p>
              </div>
              {todayTasks.length > 0 ? todayTasks.map(task => renderTaskRow(task)) : (
                <div className="p-12 text-center text-gray-500">На сегодня задач нет</div>
              )}
            </div>
          )}

          {/* Вкладка "Неделя" */}
          {activeTab === 'week' && (
            <div>
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">На этой неделе</h2>
                <p className="text-gray-600">Всего запланировано {weekTasks.length} задач</p>
              </div>
              {weekTasks.length > 0 ? weekTasks.map(task => renderTaskRow(task)) : (
                <div className="p-12 text-center text-gray-500">На этой неделе задач нет</div>
              )}
            </div>
          )}

          {/* Вкладка "Все" */}
          {activeTab === 'all' && (
            <div>
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Все запланированные задачи</h2>
                <p className="text-gray-600">Всего {allTasks.length} задач</p>
              </div>
              {allTasks.length > 0 ? allTasks.map(task => renderTaskRow(task)) : (
                <div className="p-12 text-center text-gray-500">Запланированных задач нет</div>
              )}
            </div>
          )}

          {/* Вкладка "Календарь" */}
          {activeTab === 'calendar' && (
            <div className="flex h-[650px]">
              {/* Левая часть — Календарь (уменьшен до ~33%) */}
              <div className="w-1/3 p-6 border-r">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-1">Календарь</h3>
                  <p className="text-sm text-gray-600">Выберите дату</p>
                </div>

                <div className="bg-white rounded-2xl p-4 border shadow-sm">
                  <ReactCalendar
                    value={selectedDate}
                    onChange={(date: any) => setSelectedDate(new Date(date))}
                    tileClassName={({ date, view }) => {
                      if (view === 'month') {
                        const hasTask = events.some(e => 
                          new Date(e.start_at).toDateString() === date.toDateString() && !e.is_completed
                        );
                        if (hasTask) {
                          return 'bg-emerald-500 text-white rounded-full font-semibold shadow-sm';
                        }
                      }
                    }}
                    className="w-full border-0 text-sm"
                  />
                </div>

                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span>Есть задачи</span>
                </div>
              </div>

              {/* Правая часть — Задачи (66%) */}
              <div className="w-2/3 p-8 flex flex-col">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold">
                      {selectedDate.toLocaleDateString('ru-RU', { 
                        weekday: 'long',
                        day: 'numeric', 
                        month: 'long'
                      })}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {tasksForSelectedDate.length} {tasksForSelectedDate.length === 1 ? 'задача' : 'задач'}
                    </p>
                  </div>

                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 flex items-center gap-2 text-sm"
                  >
                    + Добавить задачу
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto border rounded-2xl bg-white">
                  {tasksForSelectedDate.length > 0 ? (
                    tasksForSelectedDate.map(task => renderTaskRow(task))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <div className="text-6xl mb-4 opacity-50">📅</div>
                      <p className="text-xl text-gray-500 mb-2">На эту дату задач нет</p>
                      <p className="text-sm text-gray-400">Выберите другую дату или добавьте новую задачу</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Вкладка "История" */}
          {activeTab === 'history' && (
            <div>
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">История выполненных задач</h2>
                <p className="text-gray-600">Всего выполнено {historyTasks.length} задач</p>
              </div>
              
              {historyTasks.length > 0 ? (
                historyTasks.map(task => renderHistoryTaskRow(task))
              ) : (
                <div className="p-12 text-center text-gray-500">Выполненных задач пока нет</div>
              )}
            </div>
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