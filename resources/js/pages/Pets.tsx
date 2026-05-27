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

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPet, setEditingPet] = useState<any>(null);

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
      if (petAge) formData.append('age', petAge);
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

  // === Редактирование питомца (из списка) ===
  const handleEditPet = (pet: any) => {
    setEditingPet({ ...pet });
    setShowEditModal(true);
  };

  const handleUpdatePet = async () => {
    if (!editingPet) return;

    toast.success(`Питомец "${editingPet.name}" обновлён!`);
    setShowEditModal(false);
    setEditingPet(null);
    dispatch(fetchPets() as any);
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
      if (updatedPet.age) formData.append('age', updatedPet.age);
      if (updatedPet.photo) formData.append('photo', updatedPet.photo);

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
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Мои питомцы</h1>
            <p className="text-gray-600 mt-1">Управляйте профилями своих любимцев</p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 flex items-center gap-2"
          >
            + Добавить питомца
          </button>
        </div>

        {/* Поиск */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Поиск питомца по имени..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {isLoading && <div className="text-center py-12">Загрузка...</div>}
        {error && <div className="text-red-500 text-center py-12">{error}</div>}

        {!isLoading && filteredPets.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border">
            <div className="text-6xl mb-4">🐱🐶</div>
            <h3 className="text-2xl font-semibold mb-2">Питомцы не найдены</h3>
          </div>
        )}

        {/* Карточки питомцев */}
        {!isLoading && filteredPets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPets.map((pet: any) => {
              const hasTasks = hasUpcomingTasks(pet.id);

              return (
                <div
                  key={pet.id}
                  onClick={() => openPetProfile(pet)}
                  className="bg-white rounded-3xl p-6 border shadow-sm hover:shadow-lg transition-all cursor-pointer relative group"
                >
                  <div className="flex justify-center mb-4">
                    <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-md">
                      <img
                        src={getPetAvatar(pet)}
                        alt={pet.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="text-center mb-3">
                    <h3 className="text-2xl font-bold">{pet.name}</h3>
                    <p className="text-gray-600 mt-1">
                      {formatAge(pet.age) || 'Возраст не указан'}
                    </p>
                  </div>

                  <div className="flex justify-center">
                    {hasTasks ? (
                      <span className="px-4 py-1 bg-emerald-500 text-white text-sm font-medium rounded-full">
                        Есть задача!
                      </span>
                    ) : (
                      <span className="px-4 py-1 bg-gray-200 text-gray-600 text-sm font-medium rounded-full">
                        Задач нет
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(pet.id, pet.name);
                    }}
                    className="absolute top-4 right-4 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Модалка добавления питомца */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold text-center mb-6">Добавление питомца</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Имя питомца *</label>
                <input
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Введите имя питомца..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Возраст</label>
                <input
                  type="number"
                  value={petAge}
                  onChange={(e) => setPetAge(e.target.value)}
                  className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Введите возраст питомца..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Загрузить фото</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPetPhoto(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-2xl hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleAddPet}
                disabled={isAdding}                    
                className="flex-1 py-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isAdding ? 'Добавление...' : 'Добавить питомца'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка редактирования питомца (из списка) */}
      {showEditModal && editingPet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold text-center mb-6">Редактирование питомца</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Имя питомца *</label>
                <input
                  type="text"
                  value={editingPet.name}
                  onChange={(e) => setEditingPet({ ...editingPet, name: e.target.value })}
                  className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Возраст</label>
                <input
                  type="number"
                  value={editingPet.age || ''}
                  onChange={(e) => setEditingPet({ ...editingPet, age: e.target.value })}
                  className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPet(null);
                }}
                className="flex-1 py-3 border border-gray-300 rounded-2xl hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleUpdatePet}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600"
              >
                Сохранить изменения
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка удаления питомца */}
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