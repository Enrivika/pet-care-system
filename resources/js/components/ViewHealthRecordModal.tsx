import { useState } from 'react';

interface ViewHealthRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  onUpdated: () => void;
  onEdit: (record: any) => void;  
}

const ViewHealthRecordModal = ({ isOpen, onClose, record, onUpdated, onEdit }: ViewHealthRecordModalProps) => {
  if (!isOpen || !record) return null;



  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Укол': '#625AAE',
      'Ветеринар': '#5E8086',
      'Лекарство': '#C4585A',
      'Другое': '#6F6F6F',
    };
    return colors[category] || '#6F6F6F';
  };

  // Отображение даты и времени выполнения
  const formatCompletedDate = (record: any) => {
    const dateStr = record.completed_at || record.updated_at;
    if (!dateStr) return '—';

    const date = new Date(dateStr);
    return `${date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-xl mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-8 pt-8 pb-4">
            <h2 className="text-2xl font-bold text-center mb-6">Просмотр медицинской записи</h2>

            {/* Фото питомца + имя */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-md flex-shrink-0">
                <img 
                  src={record.pet?.photo_url || record.pet?.photo || "/images/Cat_and_dog.png"} 
                  alt={record.pet?.name || 'Питомец'} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="text-sm text-gray-500">Питомец</div>
                <div className="font-semibold text-xl">{record.pet?.name || 'Неизвестный питомец'}</div>
              </div>
            </div>

            {/* Дата и время выполнения */}
            <div className="mb-5">
              <div className="text-sm text-gray-500 mb-1">Дата и время выполнения</div>
              <div className="font-medium text-lg">
                {formatCompletedDate(record)}
              </div>
            </div>

            {/* Категория */}
            <div className="mb-5">
              <div className="text-sm text-gray-500 mb-2">Категория</div>
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium"
                style={{ backgroundColor: `${getCategoryColor(record.event_type)}20`, color: getCategoryColor(record.event_type) }}
              >
                <img 
                  src={`/images/${record.event_type}.png`} 
                  alt={record.event_type} 
                  className="w-5 h-5" 
                />
                <span>{record.event_type}</span>
              </div>
            </div>

            {/* Название задачи */}
            <div className="mb-5">
              <div className="text-sm text-gray-500 mb-1">Название задачи</div>
              <div className="font-medium text-lg">{record.title || '—'}</div>
            </div>

            {/* Примечание */}
            <div className="mb-8">
              <div className="text-sm text-gray-500 mb-1">Примечание</div>
              <div className="bg-gray-50 rounded-2xl p-4 text-gray-700 min-h-[80px]">
                {record.notes || '—'}
              </div>
            </div>
          </div>

          {/* Кнопки */}
          <div className="px-8 pb-8 flex gap-3">
            <button 
              onClick={() => onEdit(record)}           
              className="flex-1 py-3.5 bg-black text-white rounded-2xl font-medium hover:bg-gray-800"
            >
              Редактировать запись
            </button>
            <button 
              onClick={onClose}
              className="flex-1 py-3.5 border border-gray-300 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>

    </>
  );
};

export default ViewHealthRecordModal;