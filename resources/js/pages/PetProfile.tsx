import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const PetProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { pets } = useSelector((state: RootState) => state.pets);
  const pet = pets.find(p => p.id === Number(id));

  const [activeTab, setActiveTab] = useState<'info' | 'health' | 'history' | 'schedule' | 'expenses'>('info');

  if (!pet) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Питомец не найден</h2>
        <Link to="/pets" className="text-emerald-600 hover:underline">Вернуться к списку питомцев</Link>
      </div>
    );
  }

  const tabs = [
    { id: 'info', label: 'Инфо', icon: '📋' },
    { id: 'health', label: 'Здоровье', icon: '💊' },
    { id: 'history', label: 'История', icon: '📜' },
    { id: 'schedule', label: 'Расписание', icon: '📅' },
    { id: 'expenses', label: 'Расходы', icon: '💰' },
  ];

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Шапка профиля */}
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-5xl">
            {pet.species === 'cat' ? '🐱' : pet.species === 'dog' ? '🐶' : pet.species === 'bird' ? '🐦' : '🐾'}
          </div>
          <div>
            <h1 className="text-4xl font-bold">{pet.name}</h1>
            <p className="text-xl text-gray-600">{pet.breed || pet.species}</p>
            <p className="text-sm text-gray-500 mt-1">ID: {pet.id}</p>
          </div>
        </div>

        {/* Вкладки */}
        <div className="flex border-b mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Контент вкладок */}
        <div className="bg-white rounded-2xl p-8 border shadow-sm min-h-[400px]">
          {activeTab === 'info' && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Основная информация</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-500">Имя</div>
                  <div className="text-lg font-medium">{pet.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Вид</div>
                  <div className="text-lg font-medium">{pet.species}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Порода</div>
                  <div className="text-lg font-medium">{pet.breed || 'Не указана'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Дата рождения</div>
                  <div className="text-lg font-medium">{pet.birth_date || 'Не указана'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Вес</div>
                  <div className="text-lg font-medium">{pet.weight ? `${pet.weight} кг` : 'Не указан'}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Здоровье и медицинские данные</h2>
              <div className="text-gray-600">
                <p>Здесь будет информация об аллергиях, хронических заболеваниях, прививках и текущем статусе здоровья.</p>
                <div className="mt-8 p-6 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Статус: <span className="text-green-600 font-medium">Здоров</span></p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">История событий</h2>
              <div className="text-gray-600">
                <p>Здесь будет хронология всех медицинских событий: прививки, визиты к ветеринару, болезни, операции.</p>
                <div className="mt-6 text-sm text-gray-500">Пока нет записей в истории.</div>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Индивидуальное расписание</h2>
              <div className="text-gray-600">
                <p>Здесь будет индивидуальное расписание кормления, прогулок и процедур для этого питомца.</p>
                <div className="mt-6 text-sm text-gray-500">Расписание ещё не настроено.</div>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Расходы на питомца</h2>
              <div className="text-gray-600">
                <p>Здесь будет статистика трат именно на этого питомца (корм, ветеринария, аксессуары).</p>
                <div className="mt-6 text-sm text-gray-500">Пока нет данных о расходах.</div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link to="/pets" className="text-emerald-600 hover:underline flex items-center gap-2">
            ← Вернуться к списку питомцев
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PetProfile;