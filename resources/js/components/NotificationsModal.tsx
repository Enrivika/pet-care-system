import { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'sonner';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsModal = ({ isOpen, onClose }: NotificationsModalProps) => {
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');
  interface LocalNotification {
    id: number;
    title: string;
    body: string;
    created_at: string;
    read_at?: string | null;
    category?: string;
  }
  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const [loading, setLoading] = useState(false);

  // Загрузка уведомлений
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const unreadNotifications = notifications.filter(n => !n.read_at);
  const readNotifications = notifications.filter(n => n.read_at);

  // Отметить как прочитанное
  const markAsRead = async (id: number) => {
    try {
      await api.post(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      toast.error('Не удалось отметить как прочитанное');
    }
  };

  // Пометить все как прочитанные
  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      toast.success('Все уведомления прочитаны');
      fetchNotifications();
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  // Очистить все уведомления
  const clearAll = async () => {
    if (!confirm('Очистить всю историю уведомлений?')) return;

    try {
      await api.delete('/notifications/clear');
      toast.success('История очищена');
      setNotifications([]);
    } catch (error) {
      toast.error('Ошибка при очистке');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-start justify-end z-[100] pt-16 pr-4"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden mx-2 flex flex-col max-h-[min(620px,calc(100dvh-5rem))]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">Уведомления</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {/* Вкладки */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'unread' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500'}`}
          >
            Непрочитанные ({unreadNotifications.length})
          </button>
          <button
            onClick={() => setActiveTab('read')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'read' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500'}`}
          >
            Прочитанные ({readNotifications.length})
          </button>
        </div>

        {/* Список уведомлений — скроллится, когда нужно. Кнопки внизу всегда видны */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Загрузка...</div>
          ) : activeTab === 'unread' ? (
            unreadNotifications.length > 0 ? (
              unreadNotifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => markAsRead(notif.id)}
                  className="p-4 border-b hover:bg-gray-50 cursor-pointer flex gap-3"
                >
                  <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    <img
                      src={`/images/${notif.category || 'Другое'}.png`}
                      alt={notif.category || 'Задача'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-lg">🐾</div>';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{notif.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{notif.body}</div>
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(notif.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">Нет непрочитанных уведомлений</div>
            )
          ) : (
            readNotifications.length > 0 ? (
              readNotifications.map((notif) => (
                <div key={notif.id} className="p-4 border-b opacity-70 flex gap-3">
                  <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    <img
                      src={`/images/${notif.category || 'Другое'}.png`}
                      alt={notif.category || 'Задача'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-lg">🐾</div>';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{notif.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{notif.body}</div>
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(notif.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">Нет прочитанных уведомлений</div>
            )
          )}
        </div>

        {/* Нижняя панель */}
        <div className="px-6 py-4 border-t">
          {activeTab === 'unread' ? (
            <button 
              onClick={markAllAsRead}
              className="w-full py-3 bg-emerald-500 text-white rounded-2xl font-medium hover:bg-emerald-600 transition-colors"
            >
              Пометить все как прочитанные
            </button>
          ) : (
            <button 
              onClick={clearAll}
              className="w-full py-3 bg-red-500 text-white rounded-2xl font-medium hover:bg-red-600 transition-colors"
            >
              Очистить историю
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;