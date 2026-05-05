import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { pets } = useSelector((state: RootState) => state.pets);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Добро пожаловать, {user?.name?.split(' ')[0] || 'друг'}! 👋
          </h1>
          <p className="text-gray-600 mt-2">Вот что происходит с твоими питомцами сегодня</p>
        </div>

        {/* Динамическая статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="text-emerald-500 text-3xl mb-2">🐾</div>
            <div className="text-3xl font-bold">{pets.length}</div>
            <div className="text-gray-600">Питомца</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="text-blue-500 text-3xl mb-2">📅</div>
            <div className="text-3xl font-bold">7</div>
            <div className="text-gray-600">Событий на этой неделе</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="text-orange-500 text-3xl mb-2">💊</div>
            <div className="text-3xl font-bold">2</div>
            <div className="text-gray-600">Напоминания</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="text-purple-500 text-3xl mb-2">💰</div>
            <div className="text-3xl font-bold">12 450 ₽</div>
            <div className="text-gray-600">Расходы за месяц</div>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Быстрые действия</h2>
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/pets" 
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
              + Добавить питомца
            </Link>
            <Link 
              to="/calendar" 
              className="px-6 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Создать событие
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;