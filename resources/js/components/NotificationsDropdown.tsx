import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { markAsRead, markAllAsRead, clearAllNotifications } from '../store/slices/notificationsSlice';
import { toast } from 'sonner';

interface NotificationsDropdownProps {
  show: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ show, onClose, isMobile = false }) => {
  const dispatch = useDispatch();
  const { notifications, unreadCount, loading } = useSelector((state: RootState) => state.notifications);

  const [activeTab, setActiveTab] = React.useState<'unread' | 'read'>('unread');

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

  if (!show) return null;

  const containerClasses = isMobile 
    ? "fixed inset-0 bg-black/50 z-[200] flex items-start justify-center pt-16" 
    : "absolute right-0 mt-3 w-96 bg-white rounded-3xl shadow-2xl border z-[100] overflow-hidden";

  const contentClasses = isMobile 
    ? "bg-white w-full max-w-md mx-4 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]" 
    : "bg-white w-full";

  return (
    <div 
      className={containerClasses}
      onClick={(e) => {
        // Закрываем только если клик точно по бэкдропу
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className={contentClasses}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
          <h2 className="text-xl font-bold">Уведомления</h2>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }} 
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="flex border-b">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('unread');
            }} 
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'unread' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500'}`}
          >
            Непрочитанные ({unreadNotifications.length})
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('read');
            }} 
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'read' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500'}`}
          >
            Прочитанные ({readNotifications.length})
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto flex-1">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Загрузка...</div>
          ) : (activeTab === 'unread' ? unreadNotifications : readNotifications).length > 0 ? (
            (activeTab === 'unread' ? unreadNotifications : readNotifications).map((notif) => (
              <div 
                key={notif.id} 
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAsRead(notif.id);
                }} 
                className="p-4 border-b hover:bg-gray-50 cursor-pointer flex gap-3"
              >
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

        {(activeTab === 'unread' ? unreadNotifications.length > 0 : readNotifications.length > 0) && (
          <div className="p-4 border-t bg-gray-50">
            {activeTab === 'unread' ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAllAsRead();
                }}
                className="w-full py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                Пометить все как прочитанные
              </button>
            ) : (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
                className="w-full py-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                Очистить историю
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsDropdown;