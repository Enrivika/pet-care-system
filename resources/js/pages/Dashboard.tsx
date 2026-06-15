import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { fetchPets, updatePet } from '../store/slices/petsSlice';
import { toast } from 'sonner';
import { fetchAllTasks } from '../store/slices/calendarEventsSlice';
import { Link } from 'react-router-dom';
import PetProfileModal from '../components/PetProfileModal';
import CompleteTaskModal from '../components/CompleteTaskModal';
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

  // Количество питомцев, которое показываем в блоке (всегда в один ряд, максимум 4).
  // 3 карточки от ~380px до ~640px, 4 — от ~640px и шире, 2 — только на самых узких телефонах.
  // Показываем ограниченное количество, чтобы бейджи не ломались.
  const [petsToShow, setPetsToShow] = useState(4);

  // Загрузка данных
  useEffect(() => {
    dispatch(fetchPets() as any);
    dispatch(fetchAllTasks() as any);
  }, [dispatch]);

  // Определяем, сколько питомцев показывать в зависимости от ширины экрана (всегда один ряд).
  // 2 — только на самых узких (<~380px), 3 — от ~380px до ~640px,
  // 4 — от ~640px и шире (максимум 4 карточки).
  // Ограничено, чтобы бейджи помещались и не ломались.
  useEffect(() => {
    const updatePetsToShow = () => {
      if (window.innerWidth < 380) {
        setPetsToShow(2);      // Самые узкие телефоны
      } else if (window.innerWidth < 640) {
        setPetsToShow(3);      // От ~380px до ~640px — 3 карточки
      } else {
        setPetsToShow(4);      // От ~640px и шире
      }
    };

    updatePetsToShow();
    window.addEventListener('resize', updatePetsToShow);
    return () => window.removeEventListener('resize', updatePetsToShow);
  }, []);
 
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

  // Вспомогательные функции для категорий (в стиле дизайна)
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

  const formatTaskTime = (task: any) => {
    const startAt = task.start_at;
    const isAllDay = !!task.is_all_day;

    const date = new Date(startAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((taskDay.getTime() - today.getTime()) / (1000 * 3600 * 24));
    const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    // Специальная обработка для задач "На весь день":
    // Вместо "Сегодня, в 00:00" показываем "Сегодня, до конца дня" (как просил пользователь).
    if (isAllDay) {
      if (diffDays === 0) return `Сегодня, до конца дня`;
      if (diffDays === 1) return `Завтра, до конца дня`;
      return `${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}, до конца дня`;
    }

    if (diffDays === 0) return `Сегодня, в ${time}`;
    if (diffDays === 1) return `Завтра, в ${time}`;
    return `${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}, в ${time}`;
  };

  // === ПИТОМЦЫ С ПРИОРИТЕТОМ (сначала те, у кого есть задачи) ===
  // Всегда показываем в один ряд: 2 (только <~380px) / 3 (от ~380px до ~640px) / 4 (максимум).
  // Горизонтального скролла нет — пользователь может посмотреть всех через кнопку "Все питомцы".
  const sortedPets = [...pets].sort((a, b) => {
    const aHasTask = events.some((e: any) => e.pet_id === a.id && !e.is_completed);
    const bHasTask = events.some((e: any) => e.pet_id === b.id && !e.is_completed);
    if (aHasTask && !bHasTask) return -1;
    if (!aHasTask && bHasTask) return 1;
    return 0;
  }).slice(0, petsToShow);

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

  // Для сравнения с прошлым месяцем
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const tasksLastMonth = events.filter((e: any) => {
    if (!e.is_completed || !e.completed_at) return false;
    const completedDate = new Date(e.completed_at);
    return completedDate.getMonth() === lastMonth && completedDate.getFullYear() === lastMonthYear;
  }).length;
  const tasksChange = tasksThisMonth - tasksLastMonth;
  const tasksChangePercent = tasksLastMonth > 0 
    ? Math.round((tasksChange / tasksLastMonth) * 100) 
    : (tasksThisMonth > 0 ? 100 : 0);
  const tasksChangeText = `${tasksChange >= 0 ? '+' : ''}${tasksChangePercent}% в сравнении с прошлым месяцем`;

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
  const mostCommonCount = mostCommonCategory !== '—' ? (categoryCount[mostCommonCategory] || 0) : 0;

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

  const lastVetPetName = vetVisits.length > 0 ? (vetVisits[0]?.pet?.name || null) : null;

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
     try {
      const formData = new FormData();
      formData.append('name', updatedPet.name);
      // Always send age (even if 0 or null) so backend can clear it. Use empty string for null.
      formData.append('age', updatedPet.age != null ? String(updatedPet.age) : '');
      
      if (updatedPet.photo instanceof File) {
        formData.append('photo', updatedPet.photo);
      }
      
      await dispatch(updatePet({ 
        petId: updatedPet.id, 
        formData 
      }) as any).unwrap();
 
      toast.success(`Питомец "${updatedPet.name}" обновлён!`);
 
      dispatch(fetchPets() as any);
    } catch (err: any) {
      toast.error(err || 'Ошибка обновления питомца');
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#E9F5ED] min-h-full">
      <div className="max-w-7xl mx-auto space-y-8 md:space-y-10">
        {/* Приветствие */}
        <div className="mb-6 md:mb-8">
          <h1 
            className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold text-[#1F2421]" 
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
            Добрый день, {user?.name?.split(' ')[0] || 'друг'}!
          </h1>
          <p 
            className="mt-1 sm:mt-1.5 text-gray-600 text-sm sm:text-base md:text-lg lg:text-lg max-w-2xl"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            Давай ухаживать за твоими питомцами?
          </p>
        </div>

        {/* БЛОК 1: Питомцы */}
        <div>
          <div className="flex justify-between items-center mb-3 md:mb-4">
            <h2 
              className="text-xl sm:text-xl md:text-2xl lg:text-2xl font-bold text-[#1F2421]"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >Мои питомцы</h2>
            <Link 
              to="/pets" 
              className="inline-flex items-center gap-1 bg-[#1F2421] hover:bg-black active:bg-[#161A18] transition-colors text-[#E9F5ED] px-2.5 py-1 text-xs min-h-[28px] sm:px-3 sm:py-1.5 sm:text-xs sm:min-h-[32px] rounded-lg font-medium min-w-[112px] sm:min-w-[124px] justify-center whitespace-nowrap"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >
              Все питомцы →
            </Link>
          </div>

          {/* Питомцы - сетка без горизонтального скролла (всегда один ряд, максимум 4 карточки).
              2 карточки — только на самых узких экранах (<~380px).
              3 карточки — от ~380px до ~640px.
              4 карточки — от ~640px и шире (больше одного ряда быть не может). */}
          {pets.length > 0 ? (
            <div className="grid grid-cols-2 min-[380px]:grid-cols-3 min-[640px]:grid-cols-4 gap-4 md:gap-6">
              {sortedPets.map((pet: any) => {
              const hasTask = events.some((e: any) => e.pet_id === pet.id && !e.is_completed);
              return (
                <div
                  key={pet.id}
                  onClick={() => handlePetClick(pet)}
                  className="group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-lg hover:bg-gray-100 transition-all cursor-pointer border border-gray-100 flex flex-col"
                >
                  {/* Аватарка питомца — крупная, во всю ширину верха карточки.
                      Чтобы карточки были более вертикально прямоугольными (особенно на lg/xl где шире),
                      фото выше. Нижние края очень сильно скруглены (большой rounded-b), для овальной формы снизу. */}
                  <div className="w-full h-36 sm:h-40 md:h-44 lg:h-52 xl:h-56 overflow-hidden rounded-b-[4rem] sm:rounded-b-[4.5rem] md:rounded-b-[5rem] lg:rounded-b-[6rem] xl:rounded-b-[6.5rem]">
                    <img 
                      src={pet.photo_url || "/images/Cat_and_dog.png"} 
                      alt={pet.name} 
                      className="w-full h-full object-cover transition-all group-hover:brightness-90"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (target.src !== "/images/Cat_and_dog.png") {
                          target.src = "/images/Cat_and_dog.png";
                        }
                      }}
                    />
                  </div>

                  {/* Контент под фото с внутренним отступом */}
                  <div className="p-3 sm:p-4 md:p-5 flex-1 flex flex-col">
                    <div className="text-center">
                      <h3 
                        className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-[#1F2421] tracking-[-0.01em] truncate" 
                        style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                        title={pet.name}
                      >
                        {pet.name}
                      </h3>
                      <p 
                        className="text-gray-500 text-[10px] sm:text-xs md:text-sm lg:text-base mt-0.5 truncate"
                        style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                      >
                        {formatAge(pet.age)}
                      </p>
                    </div>

                    <div className="mt-auto pt-1.5 sm:pt-2 flex justify-center w-full">
                      {hasTask ? (
                        <span 
                          className="inline-flex items-center justify-center leading-none px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 bg-[#4BBB71] text-white text-[10px] sm:text-xs md:text-sm font-medium rounded-full tracking-tight whitespace-nowrap flex-shrink-0 max-w-full"
                          style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                        >
                          Есть задача
                        </span>
                      ) : (
                        <span 
                          className="inline-flex items-center justify-center leading-none px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 bg-gray-200 text-gray-600 text-[10px] sm:text-xs md:text-sm font-medium rounded-full tracking-tight whitespace-nowrap flex-shrink-0 max-w-full"
                          style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                        >
                          Нет задач
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          ) : (
            <div 
              className="w-full text-center py-6 px-4 text-gray-500 bg-white rounded-2xl border text-sm sm:text-base md:text-lg lg:text-lg break-words"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >Нет добавленных питомцев</div>
          )}
        </div>

        {/* БЛОК 2: Ближайшие задачи */}
        <div>
          <div className="flex justify-between items-center mb-3 md:mb-4">
            <h2 
              className="text-xl sm:text-xl md:text-2xl lg:text-2xl font-bold text-[#1F2421]"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >Ближайшие задачи</h2>
            <Link 
              to="/calendar" 
              className="inline-flex items-center gap-1 bg-[#1F2421] hover:bg-black active:bg-[#161A18] transition-colors text-[#E9F5ED] px-2.5 py-1 text-xs min-h-[28px] sm:px-3 sm:py-1.5 sm:text-xs sm:min-h-[32px] rounded-lg font-medium min-w-[112px] sm:min-w-[124px] justify-center whitespace-nowrap"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >
              Все задачи →
            </Link>
          </div>

          {/* Ближайшие задачи 
              - На мобильных и планшетах (до lg) — всегда в столбик (как в мобильном макете)
              - Только на десктопе (lg+) переходят в 3 колонки
              - На десктопе карточки в строке всегда одинаковой высоты (подстраиваются под самую высокую)
          */}
          <div className="space-y-3 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task: any) => {
                const catColor = getCategoryColor(task.event_type);
                return (
                  <div 
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="bg-white rounded-3xl border border-gray-100 shadow-md hover:shadow-lg hover:bg-gray-100 transition-all cursor-pointer flex overflow-hidden h-full"
                  >
                    {/* Цветовая черточка — прибита к левому краю карточки */}
                    <div 
                      className="w-1.5 flex-shrink-0 rounded-l-3xl" 
                      style={{ backgroundColor: catColor }} 
                    />
                    
                    <div className="flex-1 p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col min-w-0">
                      {/* Иконка + имя питомца + категория (время теперь всегда снизу) */}
                      <div className="flex items-start gap-2 sm:gap-3">
                        <img 
                          src={`/images/${task.event_type}.png`} 
                          alt={task.event_type}
                          className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex-shrink-0 mt-0.5"
                        />
                        <div className="min-w-0 flex-1 pt-0.5">
                          <div 
                            className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-[#1F2421] tracking-[-0.01em] truncate" 
                            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                            title={task.pet?.name}
                          >
                            {task.pet?.name}
                          </div>
                          <div 
                            className="text-xs sm:text-sm md:text-base font-semibold truncate"
                            style={{ color: catColor, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                          >
                            {task.event_type}
                          </div>
                        </div>
                      </div>

                      {/* Название задачи */}
                      <div className="flex-1">
                        {task.title && (
                          <div 
                            className="text-gray-500 text-[10px] sm:text-xs md:text-sm lg:text-base mt-1.5 lg:mt-2 line-clamp-2" 
                            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                            title={task.title}
                          >
                            {task.title}
                          </div>
                        )}
                      </div>

                      {/* Время — всегда снизу от названия задачи (и в столбике на мобилке, и в строке на десктопе).
                          Размер в точности как бейдж статуса питомца. */}
                      <div className="pt-2 sm:pt-3">
                        <div 
                          className="inline-flex items-center justify-center leading-none px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-[10px] sm:text-xs md:text-sm font-medium rounded-full text-white whitespace-nowrap tracking-tight"
                          style={{ backgroundColor: catColor, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                        >
                          {formatTaskTime(task)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div 
                className="col-span-3 w-full text-center py-6 px-4 text-gray-500 bg-white rounded-2xl border text-sm sm:text-base md:text-lg lg:text-lg break-words"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
              >Нет ближайших задач</div>
            )}
          </div>
        </div>

        {/* БЛОК 3: Статистики 
            - На мобильных и планшетах (до lg) — в столбик (как в мобильном макете)
            - Только на десктопе (lg+) — в 3 колонки
        */}
        <div className="pt-2">
          <h2 
            className="text-xl sm:text-xl md:text-2xl lg:text-2xl font-bold mb-4 text-[#1F2421]"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >Статистики</h2>
          
          <div className="space-y-3 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0 lg:pt-10 xl:pt-12">
            {/* Карточка 1: Задачи в этом месяце */}
            <div className="bg-[#1F2421]/10 rounded-2xl px-3 py-4 sm:px-4 sm:py-5 lg:px-3 lg:py-5 relative ml-6 sm:ml-8 lg:ml-0">
              {/* Иконка: в мобильной — на половину левее карточки (вертикально по центру), 
                  в десктопной — на половину выше карточки (по центру по ширине). 
                  Размер значительно увеличен. */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 lg:left-1/2 lg:top-0 lg:-translate-x-1/2 lg:-translate-y-1/2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24"
                viewBox="0 0 48 48"
                fill="none"
                stroke="#1F2421"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Lucide circle-check-big, масштаб 2x под 48x48 */}
                <path d="M43.602 20A20 20 0 1 1 34 6.67" />
                <path d="m18 22 6 6L44 8" />
              </svg>
              </div>
              <div className="pl-5 sm:pl-6 pr-3 sm:pr-4 lg:pt-10 lg:px-2 xl:pt-12 text-center">
                <div className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold text-[#1F2421] tracking-[-0.02em]">{tasksThisMonth}</div>
                <div 
                  className="text-[#1F2421]/80 text-xs sm:text-sm md:text-base leading-tight mt-0.5 lg:mt-1 break-words"
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                >
                  задач выполнено в текущем месяце
                </div>
                <div 
                  className="text-[#1F2421]/50 text-xs sm:text-sm mt-4 lg:mt-6 break-words"
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                >
                  {tasksChangeText}
                </div>
              </div>
            </div>

            {/* Карточка 2: Самая частая категория */}
            <div className="bg-[#1F2421]/10 rounded-2xl px-3 py-4 sm:px-4 sm:py-5 lg:px-3 lg:py-5 relative ml-6 sm:ml-8 lg:ml-0">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 lg:left-1/2 lg:top-0 lg:-translate-x-1/2 lg:-translate-y-1/2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24"
                viewBox="0 0 48 48"
                fill="none"
                stroke="#1F2421"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* lucide-chart-bar-stacked, масштаб 2x под 48x48 */}
                <path d="M22 26v8" />
                <path d="M30 10v8" />
                <path d="M6 6v32a4 4 0 0 0 4 4h32" />
                <rect x="14" y="26" width="18" height="8" rx="2" />
                <rect x="14" y="10" width="24" height="8" rx="2" />
              </svg>
              </div>
              <div className="pl-5 sm:pl-6 pr-3 sm:pr-4 lg:pt-10 lg:px-2 xl:pt-12 text-center">
                <div 
                  className="text-[#1F2421]/70 text-xs sm:text-sm md:text-base"
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                >
                  Самая частая категория:
                </div>
                <div className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold text-[#1F2421] tracking-[-0.02em] mt-0.5 break-words">
                  {mostCommonCategory}
                </div>
                <div 
                  className="text-[#1F2421]/50 text-xs sm:text-sm mt-4 lg:mt-6 break-words"
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                >
                  {mostCommonCount} раз за всё время
                </div>
              </div>
            </div>

            {/* Карточка 3: Дней с последнего визита к ветеринару */}
            <div className="bg-[#1F2421]/10 rounded-2xl px-3 py-4 sm:px-4 sm:py-5 lg:px-3 lg:py-5 relative ml-6 sm:ml-8 lg:ml-0">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 lg:left-1/2 lg:top-0 lg:-translate-x-1/2 lg:-translate-y-1/2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24"
              viewBox="0 0 48 48"
              fill="none"
              stroke="#1F2421"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* lucide-hospital, масштаб 2x под 48x48 */}
              <path d="M24 14v8" />
              <path d="M28 42v-6a4 4 0 0 0-8 0v6" />
              <path d="M28 18h-8" />
              <path d="M36 22h4a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V20a4 4 0 0 1 4-4h4" />
              <path d="M36 42V10a4 4 0 0 0-4-4H16a4 4 0 0 0-4 4v32" />
            </svg>
              </div>
              <div className="pl-5 sm:pl-6 pr-3 sm:pr-4 lg:pt-10 lg:px-2 xl:pt-12 text-center">
                <div className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold text-[#1F2421] tracking-[-0.02em]">
                  {daysSinceLastVet} {daysWord}
                </div>
                <div 
                  className="text-[#1F2421]/80 text-xs sm:text-sm md:text-base leading-tight mt-0.5 lg:mt-1 break-words"
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                >
                  с последнего визита к ветеринару
                </div>
                <div 
                  className="text-[#1F2421]/50 text-xs sm:text-sm mt-4 lg:mt-6 break-words"
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                >
                  {lastVetPetName ? `Ходил ${lastVetPetName}` : 'Нет данных'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative cat face (from design/Исправления/Котик.png) - subtle background pattern */}
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
       onClose={() => {
          setShowEditPetModal(false);
          setEditingPet(null);
        }}
        pet={editingPet}
        onSave={handleSavePet}
      />
    </div>
  );
};

export default Dashboard;