import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { fetchAllTasks } from '../store/slices/calendarEventsSlice';
import AddTaskModal from '../components/AddTaskModal';
import EditTaskModal from '../components/EditTaskModal';
import CompleteTaskModal from '../components/CompleteTaskModal';
import ViewTaskModal from '../components/ViewTaskModal';
import { toast } from 'sonner';

const PetProfile = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();

  const { pets } = useSelector((state: RootState) => state.pets);
  const { events } = useSelector((state: RootState) => state.calendarEvents);

  const pet = pets.find(p => p.id === Number(id));

  const [activeTab, setActiveTab] = useState<'tasks' | 'history'>('tasks');

  // Модалки
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Загружаем задачи при открытии профиля
  useEffect(() => {
    dispatch(fetchAllTasks() as any);
  }, [dispatch]);

  if (!pet) {
    return (
      <div className="p-4 md:p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Питомец не найден</h2>
        <Link to="/pets" className="text-emerald-600 hover:underline">Вернуться к списку питомцев</Link>
      </div>
    );
  }

  // Фильтруем задачи этого питомца
  const petTasks = events.filter((task: any) => task.pet_id === pet.id);
  const upcomingTasks = petTasks.filter((t: any) => !t.is_completed);
  const historyTasks = petTasks.filter((t: any) => t.is_completed);

  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    if (task.is_completed) {
      setShowViewModal(true);
    } else {
      setShowEditModal(true);
    }
  };

  const handleCompleteTask = (task: any) => {
    setSelectedTask(task);
    setShowCompleteModal(true);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Шапка профиля */}
        <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-emerald-100 rounded-3xl overflow-hidden border-4 border-white shadow-md flex-shrink-0">
            <img 
              src={pet.photo_url || `https://picsum.photos/id/${pet.id}/200/200`} 
              alt={pet.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-4xl font-bold">{pet.name}</h1>
              <span className="px-4 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
                {pet.species === 'cat' ? '🐱 Кошка' : pet.species === 'dog' ? '🐶 Собака' : '🐾 Питомец'}
              </span>
            </div>
            
            <p className="text-xl text-gray-600 mt-1">{pet.breed || 'Порода не указана'}</p>
            
            <div className="flex items-center gap-4 mt-3">
              <div className="text-sm text-gray-500">
                Возраст: <span className="font-medium text-gray-700">{pet.birth_date ? 
                  `${new Date().getFullYear() - new Date(pet.birth_date).getFullYear()} лет` : 'Не указан'}</span>
              </div>
              
              <div className="px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full">
                {upcomingTasks.length > 0 ? 'Есть задачи!' : 'Задач нет'}
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 flex items-center gap-2"
          >
            + Добавить задачу
          </button>
        </div>

        {/* Вкладки (только 2) */}
        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-8 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'tasks' 
                ? 'border-emerald-500 text-emerald-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Задачи ({upcomingTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-8 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'history' 
                ? 'border-emerald-500 text-emerald-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            История ({historyTasks.length})
          </button>
        </div>

        {/* Контент вкладок */}
        <div className="bg-white rounded-2xl border shadow-sm min-h-[500px]">
          {activeTab === 'tasks' && (
            <div>
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Предстоящие задачи</h2>
                  <p className="text-gray-600 text-sm">Всего: {upcomingTasks.length}</p>
                </div>
              </div>

              {upcomingTasks.length > 0 ? (
                <div className="divide-y">
                  {upcomingTasks.map((task: any) => (
                    <div key={task.id} className="p-5 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">
                          {task.event_type === 'Кормление' ? '🍽️' : 
                           task.event_type === 'Поение' ? '💧' : 
                           task.event_type === 'Укол' ? '💉' : '📋'}
                        </div>
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(task.start_at).toLocaleDateString('ru-RU')} в {new Date(task.start_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button onClick={() => handleCompleteTask(task)} className="px-4 py-1.5 text-sm bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200">
                          Выполнить
                        </button>
                        <button onClick={() => handleEditTask(task)} className="px-3 py-1.5 text-sm border rounded-xl hover:bg-gray-50">
                          ✏️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-gray-500">
                  У питомца пока нет предстоящих задач
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">История выполненных задач</h2>
                <p className="text-gray-600 text-sm">Всего выполнено: {historyTasks.length}</p>
              </div>

              {historyTasks.length > 0 ? (
                <div className="divide-y">
                  {historyTasks.map((task: any) => (
                    <div key={task.id} className="p-5 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl opacity-70">✅</div>
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-gray-500">
                            Выполнено: {task.completed_at ? new Date(task.completed_at).toLocaleDateString('ru-RU') : ''}
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleEditTask(task)} 
                        className="px-4 py-1.5 text-sm bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200"
                      >
                        Просмотр
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-gray-500">
                  Пока нет выполненных задач
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link to="/pets" className="text-emerald-600 hover:underline flex items-center gap-2">
            ← Вернуться к списку питомцев
          </Link>
        </div>
      </div>

      {/* Модальные окна */}
      <AddTaskModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      
      <EditTaskModal 
        isOpen={showEditModal} 
        onClose={() => { setShowEditModal(false); setSelectedTask(null); }} 
        task={selectedTask} 
      />
      
      <CompleteTaskModal 
        isOpen={showCompleteModal} 
        onClose={() => { setShowCompleteModal(false); setSelectedTask(null); }} 
        task={selectedTask} 
      />
      
      <ViewTaskModal 
        isOpen={showViewModal} 
        onClose={() => { setShowViewModal(false); setSelectedTask(null); }} 
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

export default PetProfile;