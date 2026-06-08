import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchPets } from '../store/slices/petsSlice';
import AddHealthRecordModal from '../components/AddHealthRecordModal';
import ViewHealthRecordModal from '../components/ViewHealthRecordModal';
import EditHealthRecordModal from '../components/EditHealthRecordModal';

const HealthRecords = () => {
  const dispatch = useDispatch();
  const { pets } = useSelector((state: RootState) => state.pets);
  const [records, setRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleEdit = (record: any) => {
    setSelectedRecord(record);
    setShowViewModal(false);
    setShowEditModal(true);
  };

  useEffect(() => {
    if (pets.length === 0) {
      dispatch(fetchPets() as any);
    }
  }, [dispatch, pets.length]);

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/calendar-events', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      const medicalRecords = data
      .filter((r: any) => r.is_medical === true && r.is_completed === true)
      .sort((a: any, b: any) => {
        const dateA = new Date(a.completed_at || a.updated_at);
        const dateB = new Date(b.completed_at || b.updated_at);
        return dateB.getTime() - dateA.getTime();
      });
      setRecords(medicalRecords);
    } catch (error) {
      console.error('Ошибка загрузки записей:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Тихое обновление списка каждые 60 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRecords(); // обновляем без "Загрузка..."
    }, 60000);

    return () => clearInterval(interval);
  }, []);  

  const filteredRecords = records.filter(record =>
    (record.pet?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Умное форматирование даты (Сегодня / Вчера / 25 апреля 2026)
  const formatDateLabel = (record: any) => {
    const dateString = record.completed_at || record.updated_at;
    if (!dateString) return '—';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateStr = date.toDateString();
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();

    const timeStr = date.getHours() !== 0 || date.getMinutes() !== 0 
      ? date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      : '';

    let dateLabel = '';
    if (dateStr === todayStr) {
      dateLabel = 'Сегодня';
    } else if (dateStr === yesterdayStr) {
      dateLabel = 'Вчера';
    } else {
      dateLabel = date.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    }

    return { dateLabel, timeStr };
  };

  const getCategoryIcon = (type: string) => {
    const icons: Record<string, string> = {
      'Укол': '💉',
      'Ветеринар': '🩺',
      'Лекарство': '💊',
      'Другое': '📋',
    };
    return icons[type] || '📋';
  };

  const getCategoryColor = (type: string) => {
    const colors: Record<string, string> = {
      'Укол': 'bg-purple-100 text-purple-700',
      'Ветеринар': 'bg-teal-100 text-teal-700',
      'Лекарство': 'bg-red-100 text-red-700',
      'Другое': 'bg-gray-100 text-gray-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const handleView = (record: any) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Загрузка...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900">Медицинский журнал</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">
              Всего {records.length} записей в истории медицинских записей
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 sm:px-6 sm:py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 flex items-center gap-2 text-sm sm:text-base w-fit"
          >
            + Добавить запись
          </button>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Поиск медицинской записи по имени питомца..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="bg-white rounded-2xl border shadow-sm">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => (
              <div key={record.id} className="flex items-start justify-between p-4 border-b hover:bg-gray-50">
                <div className="flex items-start gap-4 flex-1">
                  {/* Иконка категории */}
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 mt-0.5 ${getCategoryColor(record.event_type).replace('text-', 'bg-').replace('-700', '-100')}`}>
                    {getCategoryIcon(record.event_type)}
                  </div>

                  {/* Дата и время */}
                  <div className="w-20 sm:w-28 md:w-36 text-sm flex-shrink-0 text-center">
                    {(() => {
                      const { dateLabel, timeStr } = formatDateLabel(record);
                      return (
                        <>
                          <div className="font-medium text-gray-900">{dateLabel}</div>
                          {timeStr && (
                            <div className="text-gray-500 text-xs mt-0.5">({timeStr})</div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Информация о записи */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{record.pet?.name}</span>
                      <span className={`px-3 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(record.event_type)}`}>
                        {record.event_type}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-700 mt-1">
                      <span className="text-gray-500">Задача:</span> {record.title || '—'}
                    </div>
                    
                    {record.notes && (
                      <div className="text-xs text-gray-600 mt-1">
                        <span className="text-gray-500">Примечание:</span> {record.notes}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleView(record)}
                  className="px-5 py-2 text-sm bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 font-medium flex-shrink-0"
                >
                  Просмотр
                </button>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-500">
              Медицинских записей пока нет
            </div>
          )}
        </div>
      </div>

      <AddHealthRecordModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchRecords}
        pets={pets}
      />

      <ViewHealthRecordModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        record={selectedRecord}
        onUpdated={fetchRecords}
        onEdit={handleEdit}
      />

      <EditHealthRecordModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        record={selectedRecord}
        onSuccess={fetchRecords}
        pets={pets}
      />
    </div>
  );
};

export default HealthRecords;