import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPets, createPet, deletePet, updatePet } from '../store/slices/petsSlice';
import { fetchAllTasks } from '../store/slices/calendarEventsSlice';
import { RootState } from '../store';
import { toast } from 'sonner';
import DeletePetModal from '../components/DeletePetModal';
import PetProfileModal from '../components/PetProfileModal';
import EditPetModal from '../components/EditPetModal';

const Pets = () => {
  const dispatch = useDispatch();
  const { pets, isLoading, error } = useSelector((state: RootState) => state.pets);
  const { events } = useSelector((state: RootState) => state.calendarEvents);

  const [showAddModal, setShowAddModal] = useState(false);
  const [petName, setPetName] = useState('');
  const [petAge, setPetAge] = useState('');
  const [petPhoto, setPetPhoto] = useState<File | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [petToDelete, setPetToDelete] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedPetForProfile, setSelectedPetForProfile] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [showEditPetModal, setShowEditPetModal] = useState(false);
  const [editingPetFromProfile, setEditingPetFromProfile] = useState<any>(null);

  const [isAdding, setIsAdding] = useState(false);

  const formatAge = (age: number | null | undefined): string => {
    if (!age || age <= 0) return '';

    const lastDigit = age % 10;
    const lastTwoDigits = age % 100;

    // Исключения 11–19 (всегда "лет")
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return `${age} лет`;
    }

    if (lastDigit === 1) {
      return `${age} год`;
    } else if (lastDigit >= 2 && lastDigit <= 4) {
      return `${age} года`;
    } else {
      return `${age} лет`;
    }
  };

  // Загрузка данных
  useEffect(() => {
    dispatch(fetchPets() as any);
    dispatch(fetchAllTasks() as any);
  }, [dispatch]);

  const filteredPets = pets.filter(pet =>
    pet.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasUpcomingTasks = (petId: number) => {
    return events.some((task: any) => task.pet_id === petId && !task.is_completed);
  };

  // === Добавление питомца ===
  const handleAddPet = async () => {
    if (!petName.trim() || isAdding) return;

    setIsAdding(true);

    try {
      const formData = new FormData();
      formData.append('name', petName);
      // send even if 0
      formData.append('age', petAge || '');
      if (petPhoto) formData.append('photo', petPhoto);

      await dispatch(createPet(formData) as any).unwrap();

      toast.success(`Питомец "${petName}" успешно добавлен!`);
      setShowAddModal(false);
      setPetName('');
      setPetAge('');
      setPetPhoto(null);
      dispatch(fetchPets() as any);
    } catch (err: any) {
      toast.error(err || 'Ошибка добавления питомца');
    } finally {
      setIsAdding(false);
    }
  };

  // === Редактирование питомца ИЗ ПРОФИЛЯ ===
  const handleEditPetFromProfile = (pet: any) => {
    setEditingPetFromProfile(pet);
    setShowEditPetModal(true);
  };

  const handleSavePetFromProfile = async (updatedPet: any) => {
    try {
      const formData = new FormData();
      formData.append('name', updatedPet.name);
      // Always send age (even if 0 or null) so backend can clear it. Use empty string for null.
      formData.append('age', updatedPet.age != null ? String(updatedPet.age) : '');

      // Получаем свежие данные из ответа бэкенда
      const result = await dispatch(updatePet({ 
        petId: updatedPet.id, 
        formData 
      }) as any).unwrap();

      toast.success(`Питомец "${updatedPet.name}" обновлён!`);

      // Обновляем открытый попап профиля сразу
      setSelectedPetForProfile(result);

      dispatch(fetchPets() as any);
    } catch (err: any) {
      toast.error(err || 'Ошибка обновления питомца');
    }
  };

  // === Удаление питомца ===
  const openDeleteModal = (petId: number, petName: string) => {
    setPetToDelete({ id: petId, name: petName });
    setShowDeleteModal(true);
  };

  const confirmDeletePet = async () => {
    if (!petToDelete) return;

    setIsDeleting(true);

    try {
      await dispatch(deletePet(petToDelete.id) as any).unwrap();
      toast.success(`Питомец "${petToDelete.name}" удалён`);
      setShowDeleteModal(false);
      setPetToDelete(null);
    } catch (err: any) {
      toast.error(err || 'Ошибка удаления питомца');
    } finally {
      setIsDeleting(false);
    }
  };

  // Векторная графика
  const getPetAvatar = (pet: any) => {
    if (pet.photo_url) return pet.photo_url;
    return "/images/Cat_and_dog.png";
  };

  // Открытие профиля питомца в попапе
  const openPetProfile = (pet: any) => {
    setSelectedPetForProfile(pet);
    setShowProfileModal(true);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-4 md:mb-5">
          <h1 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold text-[#1F2421]" 
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
            Мои питомцы
          </h1>
          <p className="mt-1 sm:mt-1.5 text-[#1F2421]/70 text-sm sm:text-base md:text-lg max-w-2xl"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
            Всего добавлено питомцев: <span className="font-semibold text-[#4BBB71]">{pets.length}</span>
          </p>
        </div>

        {/* Поиск + Кнопка "Добавить" в одной строке */}
        <div className="flex flex-col gap-3 min-[470px]:flex-row min-[470px]:items-center mb-6 md:mb-8">
          {/* Поисковая строка */}
          <div className="relative flex-1 min-w-0">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1F2421]/60 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" 
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.34-4.34" />
              </svg>
            </div>

            <input
              type="text"
              placeholder="Поиск питомца по имени..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl 
                        text-[#1F2421] placeholder:text-[#1F2421]/60 
                        hover:border-gray-300 hover:shadow-sm
                        focus:outline-none focus:ring-2 focus:ring-[#4BBB71] focus:border-[#4BBB71]
                        transition-all text-sm sm:text-base"
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
                      whitespace-nowrap flex-shrink-0 w-full min-[470px]:w-auto shadow-sm transition-all 
                      min-h-[48px] min-[470px]:min-h-0"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            + Добавить питомца
          </button>
        </div>

        {isLoading && <div className="text-center py-12">Загрузка...</div>}
        {error && <div className="text-red-500 text-center py-12">{error}</div>}

        {!isLoading && filteredPets.length === 0 && (
            <div 
              className="w-full text-center py-6 px-4 text-gray-500 bg-white rounded-2xl border text-sm sm:text-base md:text-lg lg:text-lg break-words"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >Нет добавленных питомцев</div>
        )}

        {/* Карточки питомцев */}
        {!isLoading && filteredPets.length > 0 && (
          <div className="grid grid-cols-2 min-[380px]:grid-cols-3 min-[640px]:grid-cols-4 gap-4 md:gap-6">
            {filteredPets.map((pet: any) => {
              const hasTask = hasUpcomingTasks(pet.id);
              return (
                <div
                  key={pet.id}
                  onClick={() => openPetProfile(pet)}
                  className="group relative bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-lg hover:bg-gray-100 transition-all cursor-pointer border border-gray-100 flex flex-col"
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

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(pet.id, pet.name);
                    }}
                    className="absolute top-3 right-3 w-10 h-10 sm:top-4 sm:right-4 sm:w-10 sm:h-10 
                              bg-white rounded-full flex items-center justify-center 
                              shadow-sm border border-gray-200 z-10
                              hover:shadow-md hover:scale-105 hover:border-gray-300 
                              active:scale-95 active:bg-red-50 active:text-red-600 active:border-red-200 
                              transition-all"
                    style={{ color: '#1F2421' }}
                    aria-label={`Удалить питомца ${pet.name}`}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="w-5 h-5"
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
            })}
          </div>
        )}
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

    
      {/* Модалка добавления питомца */}
{showAddModal && (
  <div
    className="
      fixed inset-0 bg-black/60 z-[80]
      flex items-center justify-center
      max-[325px]:items-end
    "
    style={{
      padding: 'max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))',
    }}
    onClick={(e) => {
      if (e.target === e.currentTarget) setShowAddModal(false);
    }}
  >
    <div
      className="
        bg-white w-full
        max-w-[480px] sm:max-w-[560px] md:max-w-3xl lg:max-w-4xl
        rounded-3xl shadow-2xl overflow-hidden
        max-h-[calc(100vh-24px)]
        max-[325px]:max-h-[calc(100vh-16px)]
      "
      onClick={(e) => e.stopPropagation()}
    >
      {/* ВАЖНО: скролл включится только когда контента больше max-height */}
      <div
        className="p-5 sm:p-6 md:p-8 overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 24px)', fontFamily: 'Inter, sans-serif' }}
      >
        {/* Заголовок */}
        <h2 className="text-2xl md:text-3xl font-bold text-[#1F2421] mb-6 text-center">
          Добавление питомца
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr] gap-6 md:gap-10">
          
         
{/* Левая колонка — фото */}
<div className="flex flex-col items-center md:items-stretch">
  <label className="w-full cursor-pointer md:max-w-none max-w-[240px]">
    {/* Контейнер в форме как у аватарок карточек */}
    <div
      className="
        w-full
        bg-[#E9F5ED]
        border border-[#D7EBDD]
        overflow-hidden
        rounded-3xl
        rounded-b-[4rem] sm:rounded-b-[4.5rem] md:rounded-b-[5rem] lg:rounded-b-[6rem]
        h-40 sm:h-44 md:h-48 lg:h-52
        flex items-center justify-center
      "
    >
      <img
  src={petPhoto ? URL.createObjectURL(petPhoto) : "/images/Cat_and_dog.png"}
  alt="Фото питомца"
  className="w-full h-full object-cover"
/>
    </div>

    <div className="text-center">
      <span className="text-[#4BBB71] font-semibold text-sm">Загрузить фото</span>
    </div>

    <input
      type="file"
      accept="image/*"
      onChange={(e) => setPetPhoto(e.target.files?.[0] || null)}
      className="hidden"
    />
  </label>

  {petPhoto && (
    <button
      type="button"
      onClick={() => setPetPhoto(null)}
      className="text-red-500 hover:text-red-600 font-semibold text-sm"
    >
      Убрать фото
    </button>
  )}
</div>

          {/* Правая колонка — форма */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#1F2421] mb-2">
                Имя питомца <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="Введите имя питомца..."
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4BBB71]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1F2421] mb-2">
                Возраст
              </label>
              <input
                type="number"
                value={petAge}
                onChange={(e) => setPetAge(e.target.value)}
                placeholder="Введите возраст питомца..."
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4BBB71]"
              />
            </div>

            {/* Кнопки */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-2xl hover:bg-gray-50 font-medium"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleAddPet}
                disabled={isAdding}
                className="flex-1 py-3 bg-[#4BBB71] hover:bg-[#3DA35E] text-white rounded-2xl font-medium disabled:opacity-70"
              >
                {isAdding ? 'Добавление...' : 'Добавить питомца'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Удаление питомца */}
      <DeletePetModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPetToDelete(null);
        }}
        petName={petToDelete?.name || ''}
        onConfirm={confirmDeletePet}
        isLoading={isDeleting}
      />

      {/* Попап профиля питомца */}
      <PetProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        pet={selectedPetForProfile}
        onEditPet={handleEditPetFromProfile} 
      />

      {/* Попап редактирования питомца */}
      <EditPetModal
        isOpen={showEditPetModal}
        onClose={() => setShowEditPetModal(false)}
        pet={editingPetFromProfile}
        onSave={handleSavePetFromProfile}
      />
    </div>
  );
};

export default Pets;