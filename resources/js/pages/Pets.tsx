import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPets, createPet, deletePet } from '../store/slices/petsSlice';
import { RootState } from '../store';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const Pets = () => {
  const dispatch = useDispatch();
  const { pets, isLoading, error } = useSelector((state: RootState) => state.pets);
  
  const [showModal, setShowModal] = useState(false);
  const [petName, setPetName] = useState('');
  const [petSpecies, setPetSpecies] = useState('cat');
  const [petBreed, setPetBreed] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPet, setEditingPet] = useState<any>(null);

  const handleEditPet = (pet: any) => {
    setEditingPet({...pet});
    setShowEditModal(true);
  };

  const handleUpdatePet = async () => {
    if (!editingPet) return;

    try {
      // Здесь позже будет API-запрос на обновление
      toast.success(`Питомец "${editingPet.name}" обновлён!`);
      setShowEditModal(false);
      setEditingPet(null);
      dispatch(fetchPets() as any);
    } catch (err: any) {
      toast.error(err || 'Ошибка обновления питомца');
    }
  };  

  useEffect(() => {
    dispatch(fetchPets() as any);
  }, [dispatch]);

  // Фильтрация и поиск
  const filteredPets = pets
    .filter(pet => 
      pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pet.breed && pet.breed.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(pet => filterSpecies === 'all' || pet.species === filterSpecies);

  const handleAddPet = async () => {
    if (!petName.trim()) {
      toast.error('Введите имя питомца');
      return;
    }

    try {
      await dispatch(createPet({
        name: petName,
        species: petSpecies,
        breed: petBreed || null,
      }) as any).unwrap();

      toast.success(`Питомец "${petName}" успешно добавлен!`);
      setShowModal(false);
      setPetName('');
      setPetBreed('');
      dispatch(fetchPets() as any);
    } catch (err: any) {
      toast.error(err || 'Ошибка добавления питомца');
    }
  };

  const handleDeletePet = async (petId: number, petName: string) => {
    if (!confirm(`Удалить питомца "${petName}"?`)) return;

    try {
      await dispatch(deletePet(petId) as any).unwrap();
      toast.success(`Питомец "${petName}" удалён`);
    } catch (err: any) {
      toast.error(err || 'Ошибка удаления питомца');
    }
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
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 flex items-center gap-2"
          >
            + Добавить питомца
          </button>
        </div>

        {/* Поиск и фильтры */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Поиск по имени или породе..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          
          <select 
            value={filterSpecies} 
            onChange={(e) => setFilterSpecies(e.target.value)}
            className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Все виды</option>
            <option value="cat">Кошки</option>
            <option value="dog">Собаки</option>
            <option value="bird">Птицы</option>
            <option value="other">Другое</option>
          </select>
        </div>

        {isLoading && <div className="text-center py-12">Загрузка...</div>}

        {error && <div className="text-red-500 text-center py-12">{error}</div>}

        {!isLoading && filteredPets.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border">
            <div className="text-6xl mb-4">🐱🐶</div>
            <h3 className="text-2xl font-semibold mb-2">Питомцы не найдены</h3>
            <p className="text-gray-600 mb-6">Попробуйте изменить параметры поиска</p>
          </div>
        )}

        {!isLoading && filteredPets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPets.map((pet: any) => (
              <div key={pet.id} className="bg-white rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl">
                    {pet.species === 'cat' ? '🐱' : pet.species === 'dog' ? '🐶' : pet.species === 'bird' ? '🐦' : '🐾'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{pet.name}</h3>
                    <p className="text-gray-600">{pet.breed || pet.species}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Link 
                    to={`/pets/${pet.id}`}
                    className="flex-1 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 text-sm text-center"
                  >
                    Подробнее
                  </Link>
                  
                  <button 
                    onClick={() => handleEditPet(pet)}
                    className="flex-1 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 text-sm"
                  >
                    Редактировать
                  </button>
                  
                  <button 
                    onClick={() => handleDeletePet(pet.id, pet.name)}
                    className="flex-1 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 text-sm"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно добавления питомца */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold mb-6">Добавить питомца</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Имя питомца *</label>
                <input
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Мурка"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Вид животного</label>
                <select 
                  value={petSpecies} 
                  onChange={(e) => setPetSpecies(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="cat">Кошка</option>
                  <option value="dog">Собака</option>
                  <option value="bird">Птица</option>
                  <option value="other">Другое</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Порода (необязательно)</label>
                <input
                  type="text"
                  value={petBreed}
                  onChange={(e) => setPetBreed(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Британская короткошёртная"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Отмена
              </button>
              <button 
                onClick={handleAddPet}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"
              >
                Добавить питомца
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Модальное окно редактирования питомца */}
      {showEditModal && editingPet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold mb-6">Редактировать питомца</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Имя питомца *</label>
                <input
                  type="text"
                  value={editingPet.name}
                  onChange={(e) => setEditingPet({...editingPet, name: e.target.value})}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Вид животного</label>
                <select 
                  value={editingPet.species} 
                  onChange={(e) => setEditingPet({...editingPet, species: e.target.value})}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="cat">Кошка</option>
                  <option value="dog">Собака</option>
                  <option value="bird">Птица</option>
                  <option value="other">Другое</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Порода</label>
                <input
                  type="text"
                  value={editingPet.breed || ''}
                  onChange={(e) => setEditingPet({...editingPet, breed: e.target.value})}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPet(null);
                }}
                className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Отмена
              </button>
              <button 
                onClick={handleUpdatePet}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"
              >
                Сохранить изменения
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pets;