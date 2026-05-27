import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { Bell, User, RefreshCw } from 'lucide-react';
import UserProfileModal from './UserProfileModal';
import { fetchNotifications, markAsRead, markAllAsRead, clearAllNotifications } from '../store/slices/notificationsSlice';
import { toast } from 'sonner';

const Topbar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { notifications, unreadCount, loading } = useSelector((state: RootState) => state.notifications);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');

  const notificationRef = useRef<HTMLDivElement>(null);

  // Загружаем уведомления при старте
  useEffect(() => {
    dispatch(fetchNotifications() as any);
  }, [dispatch]);

  // Авто-обновление каждые 15 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchNotifications() as any);
    }, 15000);
    return () => clearInterval(interval);
  }, [dispatch]);

  // Закрытие при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const unreadNotifications = notifications.filter(n => !n.read_at);
  const readNotifications = notifications.filter(n => n.read_at);

  const handleMarkAsRead = async (id: number) => {
    await dispatch(markAsRead(id) as any);
  };

  const handleMarkAllAsRead = async () => {
    await dispatch(markAllAsRead() as any);
    toast.success('Все уведомления прочитаны');
  };

  const handleClearAll = async () => {
    if (!confirm('Очистить всю историю уведомлений?')) return;

    try {
      await dispatch(clearAllNotifications() as any).unwrap();
      toast.success('История уведомлений очищена');
    } catch (err) {
      toast.error('Не удалось очистить историю');
    }
  };

  return (
    <>
      <div className="bg-white border-b h-16 flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Колокольчик */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-gray-100 rounded-full relative transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </button>

            {/* Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-96 bg-white rounded-3xl shadow-2xl border z-[100] overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
                  <h2 className="text-xl font-bold">Уведомления</h2>
                  <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="flex border-b">
                  <button onClick={() => setActiveTab('unread')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'unread' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500'}`}>
                    Непрочитанные ({unreadNotifications.length})
                  </button>
                  <button onClick={() => setActiveTab('read')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'read' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500'}`}>
                    Прочитанные ({readNotifications.length})
                  </button>
                </div>

                <div className="max-h-[420px] overflow-y-auto">
                  {loading ? (
                    <div className="p-8 text-center text-gray-500">Загрузка...</div>
                  ) : (activeTab === 'unread' ? unreadNotifications : readNotifications).length > 0 ? (
                    (activeTab === 'unread' ? unreadNotifications : readNotifications).map((notif) => (
                      <div key={notif.id} onClick={() => handleMarkAsRead(notif.id)} className="p-4 border-b hover:bg-gray-50 cursor-pointer flex gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">🐾</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900">{notif.title}</div>
                          <div className="text-sm text-gray-600 line-clamp-2 mt-0.5">{notif.body}</div>
                          <div className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleDateString('ru-RU')}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      {activeTab === 'unread' ? 'Нет непрочитанных уведомлений' : 'Нет прочитанных уведомлений'}
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t bg-gray-50">
                  {activeTab === 'unread' ? (
                    <button onClick={handleMarkAllAsRead} className="w-full py-3 bg-emerald-500 text-white rounded-2xl font-medium hover:bg-emerald-600">
                      Пометить все как прочитанные
                    </button>
                  ) : (
                    <button onClick={handleClearAll} className="w-full py-3 bg-red-500 text-white rounded-2xl font-medium hover:bg-red-600">
                      Очистить историю
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Профиль */}
          <div onClick={() => setShowProfile(true)} className="flex items-center gap-3 pl-4 border-l cursor-pointer hover:bg-gray-50 rounded-xl p-2 transition-colors">
            <div className="text-right">
              <div className="font-medium text-sm">{user?.name}</div>
              <div className="text-xs text-gray-500">{user?.email}</div>
            </div>
            <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      <UserProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </>
  );
};

export default Topbar;