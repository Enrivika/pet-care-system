import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchPets } from '../store/slices/petsSlice';
import AddHealthRecordModal from '../components/AddHealthRecordModal';
import ViewHealthRecordModal from '../components/ViewHealthRecordModal';
import EditHealthRecordModal from '../components/EditHealthRecordModal';
import DeleteTaskModal from '../components/DeleteTaskModal';

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

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<any>(null);

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

  const getCategoryColor = (type: string) => {
    const colors: Record<string, string> = {
      'Укол': '#625AAE',
      'Ветеринар': '#5E8086',
      'Лекарство': '#C4585A',
      'Другое': '#6F6F6F',
    };
    return colors[type] || '#6F6F6F';
  };

  const handleView = (record: any) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  const openDeleteRecord = (record: any) => {
    setRecordToDelete(record);
    setShowDeleteModal(true);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Загрузка...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-4 md:mb-5">
          <h1 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold text-[#1F2421]" 
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
            Медицинский журнал
          </h1>
          <p className="mt-1 sm:mt-1.5 text-[#1F2421]/70 text-sm sm:text-base md:text-lg max-w-2xl"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
            Всего записей в медицинской истории: <span className="font-semibold text-[#4BBB71]">{records.length}</span>
          </p>
        </div>

        {/* Поиск + Кнопка "Добавить запись" в одной строке (как на "Все питомцы", breakpoint 530px) */}
        <div className="flex flex-col gap-3 min-[530px]:flex-row min-[530px]:items-center mb-6 md:mb-8">
          {/* Поисковая строка */}
          <div className="relative flex-1 min-w-0">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1F2421]/60 pointer-events-none">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-[18px] h-[18px] min-[325px]:w-5 min-[325px]:h-5" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.34-4.34" />
              </svg>
            </div>

            <input
              type="text"
              placeholder="Поиск записи по имени питомца..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 min-[325px]:pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl 
                        text-[#1F2421] placeholder:text-[#1F2421]/60 
                        hover:border-gray-300 hover:shadow-sm
                        focus:outline-none focus:ring-2 focus:ring-[#4BBB71] focus:border-[#4BBB71]
                        transition-all text-xs min-[325px]:text-sm sm:text-base"
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
                      whitespace-nowrap flex-shrink-0 w-full min-[530px]:w-auto shadow-sm transition-all 
                      min-h-[48px] min-[530px]:min-h-0"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            + Добавить запись
          </button>
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

        <div className="space-y-2">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => {
              const catColor = getCategoryColor(record.event_type);
              return (
                <div 
                  key={record.id} 
                  className="bg-white rounded-2xl border shadow-md hover:shadow-lg flex overflow-hidden hover:bg-gray-50 cursor-pointer relative"
                  onClick={() => handleView(record)}
                >
                  {/* Цветовая полоса категории, приклеенная к левому краю */}
                  <div 
                    className="w-1.5 flex-shrink-0 rounded-l-2xl"
                    style={{ backgroundColor: catColor }}
                  />

                  <div className="flex-1 p-3 pr-12 sm:p-4 sm:pr-14 flex items-center gap-0.5 sm:gap-1">
                    {/* Иконка категории - большего размера, на прозрачном фоне */}
                    <div className="flex-shrink-0">
                      <img 
                        src={`/images/${record.event_type}.png`} 
                        alt={record.event_type}
                        className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12" 
                      />
                    </div>

                    {/* Дата и время */}
                    <div className="w-14 min-[438px]:w-16 sm:w-20 md:w-28 text-[10px] min-[438px]:text-xs sm:text-sm flex-shrink-0 text-center">
                      {(() => {
                        const { dateLabel, timeStr } = formatDateLabel(record);
                        let displayDate = dateLabel;
                        let yearPart = '';
                        if (dateLabel.includes(' г.')) {
                          const match = dateLabel.match(/(.+?) (\d{4} г\.)/);
                          if (match) {
                            displayDate = match[1];
                            yearPart = match[2];
                          }
                        }
                        return (
                          <>
                            <div className="font-semibold text-gray-900">{displayDate}</div>
                            {yearPart && <div className="font-semibold text-gray-900">{yearPart}</div>}
                            {timeStr && (
                              <div className="text-gray-500 text-[10px] min-[438px]:text-xs sm:text-sm mt-0.5">({timeStr})</div>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* Информация о записи */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-[10px] min-[438px]:text-xs sm:text-sm truncate">{record.pet?.name}</span>
                        <span 
                          className="px-2 py-0.5 sm:px-3 sm:py-0.5 rounded-full text-[10px] min-[438px]:text-xs sm:text-sm font-medium flex-shrink-0"
                          style={{ backgroundColor: `${catColor}20`, color: catColor }}
                        >
                          {record.event_type}
                        </span>
                      </div>
                      
                      <div className="text-[10px] min-[438px]:text-xs sm:text-sm text-gray-700 mt-0.5 line-clamp-2">{record.title || '—'}</div>
                    </div>
                  </div>

                  {/* Иконка удаления (корзинка) - фиксированная в правом верхнем углу, перекрывает контент */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteRecord(record);
                    }}
                    className="absolute top-1/2 -translate-y-1/2 right-4 w-8 h-8 flex items-center justify-center group text-[#1F2421] hover:text-red-600 transition-colors z-10"
                    aria-label={`Удалить медицинскую запись для ${record.pet?.name || 'питомца'}`}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="w-5 h-5 transition-transform group-hover:scale-110"
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
            })
          ) : (
            <div 
              className="bg-white rounded-2xl border shadow-md w-full text-center py-6 px-4 text-gray-500 text-sm sm:text-base md:text-lg lg:text-lg break-words"
              style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >Медицинских записей пока нет</div>
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

      <DeleteTaskModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setRecordToDelete(null);
        }}
        task={recordToDelete}
        onSuccess={fetchRecords}
      />
    </div>
  );
};

export default HealthRecords;