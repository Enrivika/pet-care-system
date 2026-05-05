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
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false); // ← Для тихого обновления

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
      const todayStr = now.toDateString(); // "Mon May 05 2026"

      const overdueTasks = events.filter((task: any) => {
        if (task.is_completed) return false;

        const taskDate = new Date(task.start_at);
        const taskDateStr = taskDate.toDateString();
        const taskHours = taskDate.getHours();
        const taskMinutes = taskDate.getMinutes();

        const isAllDayTask = taskHours === 0 && taskMinutes === 0;

        if (isAllDayTask) {
          // Задача на весь день → уходит в историю ТОЛЬКО если дата СТРОГО меньше сегодняшней
          return taskDateStr < todayStr;
        } else {
          // Обычная задача с временем → уходит сразу после наступления времени
          return taskDate < now;
        }
      });

      for (const task of overdueTasks) {
        try {
          await dispatch(completeTask({ 
            id: task.id, 
            notes: 'Автоматически завершено (время истекло)' 
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
      return '–';
    }
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.notes && event.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const todayTasks = filteredEvents.filter(e => {
    const eventDate = new Date(e.start_at).toDateString();
    const today = new Date().toDateString();
    return eventDate === today && !e.is_completed;
  });

  const weekTasks = filteredEvents.filter(e => {
    const eventDate = new Date(e.start_at);
    const today = new Date();
    const weekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return eventDate >= today && eventDate <= weekLater && !e.is_completed;
  });

  const allTasks = filteredEvents.filter(e => !e.is_completed);
  const historyTasks = filteredEvents.filter(e => e.is_completed);

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
      <div className="flex items-center gap-4 flex-1">
        {!isHistory && (
          <input 
            type="checkbox" 
            className="w-5 h-5 accent-emerald-500 cursor-pointer"
            checked={pendingCompleteTask === task.id}
            onChange={() => handleComplete(task)}
          />
        )}
        
        <div className="text-2xl">
          {task.event_type === 'Кормление' ? '🍽️' : 
           task.event_type === 'Поение' ? '💧' : 
           task.event_type === 'Прогулка' ? '🚶' : 
           task.event_type === 'Укол' ? '💉' : '📋'}
        </div>

        <div className="flex-1">
          <div className="font-medium">{task.title}</div>
          <div className="text-sm text-gray-500">
            {new Date(task.start_at).toLocaleDateString('ru-RU')} 
            {' в '}
            <span className="font-medium">{formatTime(task.start_at)}</span>
          </div>
          
          {isHistory && (
            <div className="mt-1 text-sm text-gray-600">
              {task.completed_at && (
                <div>✅ Выполнено: {new Date(task.completed_at).toLocaleDateString('ru-RU')} в {new Date(task.completed_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
              )}
              {task.notes && <div className="italic mt-1">💬 {task.notes}</div>}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isHistory ? (
          <button onClick={() => handleEdit(task)} className="px-4 py-1.5 text-sm bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 font-medium">
            Просмотр
          </button>
        ) : (
          <button onClick={() => handleEdit(task)} className="text-gray-400 hover:text-emerald-600" title="Редактировать">✏️</button>
        )}
        <button onClick={() => handleDelete(task)} className="text-gray-400 hover:text-red-600" title="Удалить">🗑️</button>
      </div>
    </div>
  );

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
            <div className="p-8">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-4">Календарный вид</h3>
                  <p className="text-gray-600">Кликни на дату, чтобы увидеть задачи</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border max-w-md mx-auto">
                  <ReactCalendar
                    onChange={(date: any) => {
                      const selectedDate = new Date(date).toDateString();
                      const tasksOnDate = filteredEvents.filter(e => 
                        new Date(e.start_at).toDateString() === selectedDate && !e.is_completed
                      );
                      if (tasksOnDate.length > 0) {
                        const taskList = tasksOnDate.map(t => `• ${t.title} (${formatTime(t.start_at)})`).join('\n');
                        alert(`📅 ${new Date(date).toLocaleDateString('ru-RU')}\n\n${taskList}`);
                      } else {
                        alert(`На ${new Date(date).toLocaleDateString('ru-RU')} задач нет`);
                      }
                    }}
                    tileClassName={({ date, view }) => {
                      if (view === 'month') {
                        const hasTask = filteredEvents.some(e => 
                          new Date(e.start_at).toDateString() === date.toDateString() && !e.is_completed
                        );
                        return hasTask ? 'bg-emerald-100 text-emerald-700 rounded-full font-semibold' : '';
                      }
                    }}
                  />
                </div>
                <div className="mt-6 text-center text-sm text-gray-500">💡 Даты с задачами подсвечены зелёным</div>
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
              {historyTasks.length > 0 ? historyTasks.map(task => renderTaskRow(task, true)) : (
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
    </div>
  );
};

export default Calendar;