import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { fetchPets } from '../store/slices/petsSlice';
import { fetchAllTasks } from '../store/slices/calendarEventsSlice';
import { Link } from 'react-router-dom';
import PetProfileModal from '../components/PetProfileModal';
import CompleteTaskModal from '../components/CompleteTaskModal';
import { useState } from 'react';
import EditPetModal from '../components/EditPetModal';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { pets } = useSelector((state: RootState) => state.pets);
  const { events } = useSelector((state: RootState) => state.calendarEvents);

  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showEditPetModal, setShowEditPetModal] = useState(false);
  const [editingPet, setEditingPet] = useState<any>(null);

  // Загрузка данных
  useEffect(() => {
    dispatch(fetchPets() as any);
    dispatch(fetchAllTasks() as any);
  }, [dispatch]);
 
  // ==== Тихое автообновление блока "Ближайшие задачи" ====
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchAllTasks() as any);
    }, 60000); // 60 секунд

    return () => clearInterval(interval);
  }, [dispatch]);  

  const formatAge = (age: number | null | undefined): string => {
    if (!age || age <= 0) return 'Возраст не указан';
    const lastDigit = age % 10;
    const lastTwoDigits = age % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return `${age} лет`;
    if (lastDigit === 1) return `${age} год`;
    if (lastDigit >= 2 && lastDigit <= 4) return `${age} года`;
    return `${age} лет`;
  };  

  // === ПИТОМЦЫ С ПРИОРИТЕТОМ (сначала те, у кого есть задачи) ===
  const sortedPets = [...pets].sort((a, b) => {
    const aHasTask = events.some((e: any) => e.pet_id === a.id && !e.is_completed);
    const bHasTask = events.some((e: any) => e.pet_id === b.id && !e.is_completed);
    if (aHasTask && !bHasTask) return -1;
    if (!aHasTask && bHasTask) return 1;
    return 0;
  }).slice(0, 4);

  // === БЛИЖАЙШИЕ 3 ЗАДАЧИ ===
  const upcomingTasks = events
    .filter((e: any) => !e.is_completed)
    .sort((a: any, b: any) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
    .slice(0, 3);

  // === СТАТИСТИКА ===
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Задачи, выполненные в текущем месяце
  const tasksThisMonth = events.filter((e: any) => {
    if (!e.is_completed || !e.completed_at) return false;
    const completedDate = new Date(e.completed_at);
    return completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear;
  }).length;

  // Самая частая категория
  const categoryCount: Record<string, number> = {};
  events.forEach((e: any) => {
    if (e.is_completed) {
      categoryCount[e.event_type] = (categoryCount[e.event_type] || 0) + 1;
    }
  });
  const mostCommonCategory = Object.keys(categoryCount).length > 0 
    ? Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b)
    : '—';

  // === Дней с последнего визита к ветеринару ===
  const vetVisits = events
    .filter((e: any) => e.is_completed && e.event_type === 'Ветеринар')
    .sort((a: any, b: any) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());

  let daysSinceLastVet = 0;
  let daysWord = 'дней';

  if (vetVisits.length > 0) {
    const lastVetDate = new Date(vetVisits[0].completed_at);
    const diffTime = now.getTime() - lastVetDate.getTime();
    daysSinceLastVet = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const lastDigit = daysSinceLastVet % 10;
    const lastTwoDigits = daysSinceLastVet % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      daysWord = 'дней';
    } else if (lastDigit === 1) {
      daysWord = 'день';
    } else if (lastDigit >= 2 && lastDigit <= 4) {
      daysWord = 'дня';
    } else {
      daysWord = 'дней';
    }
  }

  const handlePetClick = (pet: any) => {
    setSelectedPet(pet);
    setShowProfileModal(true);
  };

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setShowCompleteModal(true);
  };

  // === ОБРАБОТЧИК РЕДАКТИРОВАНИЯ ПИТОМЦА ===
  const handleEditPet = (pet: any) => {
    setEditingPet(pet);
    setShowProfileModal(false);     // закрываем профиль
    setShowEditPetModal(true);      // открываем редактирование
  };

  const handleSavePet = async (updatedPet: any) => {
    // dispatch(updatePet);
    setShowEditPetModal(false);
    setEditingPet(null);
    dispatch(fetchPets() as any); // обновляем список питомцев
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Приветствие */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Добрый день, {user?.name?.split(' ')[0] || 'друг'}! 👋
          </h1>
          <p className="text-gray-600 mt-2">Как сегодня твои питомцы?</p>
        </div>

        {/* БЛОК 1: Питомцы */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Мои питомцы</h2>
            <Link to="/pets" className="text-emerald-600 hover:underline flex items-center gap-1">
              Все питомцы →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sortedPets.map((pet: any) => {
              const hasTask = events.some((e: any) => e.pet_id === pet.id && !e.is_completed);
              return (
                <div
                  key={pet.id}
                  onClick={() => handlePetClick(pet)}
                  className="bg-white rounded-3xl p-5 border shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex justify-center mb-4">
                    <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-white shadow">
                      <img 
                        src={pet.photo_url || "/images/Cat_and_dog.png"} 
                        alt={pet.name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold">{pet.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">{formatAge(pet.age)}</p>
                  </div>
                  <div className="mt-3 flex justify-center">
                    {hasTask ? (
                      <span className="px-4 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full">
                        Есть задача!
                      </span>
                    ) : (
                      <span className="px-4 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
                        Задач нет
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* БЛОК 2: Ближайшие задачи */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Ближайшие задачи</h2>
            <Link to="/calendar" className="text-emerald-600 hover:underline flex items-center gap-1">
              Все задачи →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task: any) => (
                <div 
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="bg-white rounded-3xl p-5 border shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">
                      {task.event_type === 'Поение' ? '💧' : 
                       task.event_type === 'Укол' ? '💉' : 
                       task.event_type === 'Кормление' ? '🍽️' : '📋'}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{task.pet?.name}</div>
                      <div className="text-sm text-gray-500">{task.event_type}</div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {task.title || 'Без названия'}
                  </div>

                  <div className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full inline-block">
                    {new Date(task.start_at).toLocaleDateString('ru-RU')} в {new Date(task.start_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-gray-500">
                Нет ближайших задач
              </div>
            )}
          </div>
        </div>

        {/* БЛОК 3: Статистики */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Статистики</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">✅</span>
                </div>
                <div>
                  <div className="text-4xl font-bold">{tasksThisMonth}</div>
                  <div className="text-gray-600">задач выполнено в текущем месяце</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">📊</span>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Самая частая категория</div>
                  <div className="text-2xl font-bold">{mostCommonCategory}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">🩺</span>
                </div>
                <div>
                  <div className="text-4xl font-bold">{daysSinceLastVet}</div>
                  <div className="text-gray-600">{daysWord} с последнего визита к ветеринару</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальные окна */}
      <PetProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        pet={selectedPet}
        onEditPet={handleEditPet}          
      />

      <CompleteTaskModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        task={selectedTask}
      />
      
      <EditPetModal
        isOpen={showEditPetModal}
        onClose={() => setShowEditPetModal(false)}
        pet={editingPet}
        onSave={handleSavePet}
      />
    </div>
  );
};

export default Dashboard;