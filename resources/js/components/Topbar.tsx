import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { Link } from 'react-router-dom';
import { fetchNotifications, markAsRead, markAllAsRead, clearAllNotifications } from '../store/slices/notificationsSlice';
import { toast } from 'sonner';

interface TopbarProps {
  onOpenProfile?: () => void;
}

const Topbar = ({ onOpenProfile }: TopbarProps) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { notifications, unreadCount, loading } = useSelector((state: RootState) => state.notifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');
  const notificationRef = useRef<HTMLDivElement>(null); 
  const mobileBellRef = useRef<HTMLDivElement>(null);   
  const mobilePanelRef = useRef<HTMLDivElement>(null);  

  // Загружаем уведомления при старте
  useEffect(() => {
    dispatch(fetchNotifications() as any);
  }, [dispatch]);

  // Автообновление каждые 15 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchNotifications() as any);
    }, 15000);
    return () => clearInterval(interval);
  }, [dispatch]);

  // Закрытие при клике вне модального окна.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inDesktop = notificationRef.current && notificationRef.current.contains(target);
      const inMobileBell = mobileBellRef.current && mobileBellRef.current.contains(target);
      const inMobilePanel = mobilePanelRef.current && mobilePanelRef.current.contains(target);

      if (!inDesktop && !inMobileBell && !inMobilePanel) {
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

  // Общий рендерер содержимого списка уведомлений
  const renderNotificationsContent = (compact: boolean = false) => (
    <>
      <div className="flex border-b">
        <button 
          onClick={() => setActiveTab('unread')} 
          className={`flex-1 py-3 text-sm font-medium ${activeTab === 'unread' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500'}`}
          style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
        >
          Непрочитанные ({unreadNotifications.length})
        </button>
        <button 
          onClick={() => setActiveTab('read')} 
          className={`flex-1 py-3 text-sm font-medium ${activeTab === 'read' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500'}`}
          style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
        >
          Прочитанные ({readNotifications.length})
        </button>
      </div>

      <div className={compact ? "max-h-[50vh] overflow-y-auto" : "max-h-[420px] overflow-y-auto"}>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Загрузка...</div>
        ) : (activeTab === 'unread' ? unreadNotifications : readNotifications).length > 0 ? (
          (activeTab === 'unread' ? unreadNotifications : readNotifications).map((notif) => (
            <div key={notif.id} onClick={() => handleMarkAsRead(notif.id)} className="p-4 border-b hover:bg-gray-50 cursor-pointer flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">🐾</div>
              <div className="flex-1 min-w-0">
                <div 
                  className="font-semibold text-gray-900"
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                >{notif.title}</div>
                <div 
                  className="text-sm text-gray-600 line-clamp-2 mt-0.5"
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                >{notif.body}</div>
                <div 
                  className="text-xs text-gray-400 mt-1"
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                >{new Date(notif.created_at).toLocaleDateString('ru-RU')}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            {activeTab === 'unread' ? 'Нет непрочитанных уведомлений' : 'Нет прочитанных уведомлений'}
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-gray-50">
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
    </>
  );

  // Custom SVG icons matching design/icons/ (solid #1F2421 fill, to be identical in both panels)
  const BellIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className={className} 
      viewBox="0 0 24 24" 
      fill="#1F2421"
    >
      <path d="M12 2C8.13 2 5 5.13 5 9v3.5L3.5 14v1h17v-1L19 12.5V9c0-3.87-3.13-7-7-7zm0 18c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2z" />
    </svg>
  );

  const UserIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className={className} 
      viewBox="0 0 24 24" 
      fill="#1F2421"
    >
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );

  return (
    <>
      {/* ========== ВЕРХНЯЯ НАВИГАЦИОННАЯ ПАНЕЛЬ ДЛЯ МОБИЛЬНЫХ И ПЛАНШЕТОВ (< lg) ========== */}
      {/* Тёмная, выше по высоте чем раньше, без даты. Логотип + иконки в белых кругах (как в Figma макетах) */}
      <div className="lg:hidden bg-[#1F2421] text-white px-4 h-16 flex items-center justify-between sticky top-0 z-[50]">
        {/* Логотип (кликабельный, ведёт на главную) */}
        <Link 
          to="/dashboard" 
          className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity"
        >
          <img 
            src="/images/Petopia.png" 
            alt="Petopia" 
            className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10" 
          />
          <span 
            className="font-bold text-lg sm:text-xl md:text-2xl text-white" 
            style={{ fontFamily: 'Itim, cursive', letterSpacing: '-0.02em' }}
          >
            Petopia
          </span>
        </Link>

        {/* Иконки справа: внутри белых кругов, как в макетах */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Колокольчик */}
          <div ref={mobileBellRef} className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center hover:opacity-80 active:scale-[0.95] transition-all"
              aria-label="Уведомления"
            >
              <BellIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
            </button>
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </div>

          {/* Аватар профиля в белом кругу */}
          <button 
            onClick={() => onOpenProfile?.()}
            className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-white rounded-full overflow-hidden hover:opacity-80 active:scale-[0.95] transition-all"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Мобильная панель уведомлений (оверлей + шторка, адаптирована под тач и маленькие экраны).
          Полноэкранный backdrop (z ниже хедера), затемнение всего фона.
          Шторка сдвинута mt-16 чтобы начиналась точно под хедером (высота h-16, как и нижняя навигация), с высоким z чтобы быть поверх хедера и затемнения. */}
      {showNotifications && (
        <div 
          className="lg:hidden fixed inset-0 z-[40] bg-black/50"
          onClick={() => setShowNotifications(false)}
        >
          <div 
            ref={mobilePanelRef}
            className="mt-16 w-full bg-white rounded-3xl shadow-2xl overflow-hidden mx-auto max-w-lg relative z-[60] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-4 border-b flex items-center justify-between bg-gray-50">
              <h2 
                className="text-lg font-bold"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
              >Уведомления</h2>
              <button 
                onClick={() => setShowNotifications(false)} 
                className="text-gray-400 hover:text-gray-600 text-xl leading-none px-1"
              >
                ✕
              </button>
            </div>

            {renderNotificationsContent(true)}
          </div>
        </div>
      )}

      {/* ========== ДЕСКТОПНАЯ ВЕРХНЯЯ НАВИГАЦИОННАЯ ПАНЕЛЬ ========== */}
      {/* Явная панель с фоном #E9F5ED, sticky top (липнет кверху), без даты. 
          Иконки в белых кругах - полностью одинаковые с мобильной версией. */}
      <div className="hidden lg:block bg-[#E9F5ED] sticky top-0 z-[50]">
        <div className="px-8 xl:px-10 2xl:px-12 py-6 xl:py-7 2xl:py-8 flex items-center justify-end">
          <div className="flex items-center gap-2 xl:gap-3">
            {/* Колокольчик - структура иконки полностью как в мобильной панели */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 xl:w-11 xl:h-11 2xl:w-12 2xl:h-12 bg-white rounded-full flex items-center justify-center hover:opacity-80 active:scale-[0.95] transition-all shadow-sm"
                aria-label="Уведомления"
              >
                <BellIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 xl:w-8 xl:h-8 2xl:w-9 2xl:h-9" />
              </button>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-96 bg-white rounded-3xl shadow-2xl border z-[100] overflow-hidden">
                  <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
                    <h2 
                      className="text-xl font-bold"
                      style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                    >Уведомления</h2>
                    <button 
                onClick={() => setShowNotifications(false)} 
                className="text-gray-400 hover:text-gray-600"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
              >✕</button>
                  </div>

                  {renderNotificationsContent(false)}
                </div>
              )}
            </div>

            {/* Профиль - структура иконки полностью как в мобильной панели (внутренняя заливка #1F2421) */}
            <button 
              onClick={() => onOpenProfile?.()} 
              className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 xl:w-11 xl:h-11 2xl:w-12 2xl:h-12 bg-white rounded-full overflow-hidden hover:opacity-80 active:scale-[0.95] transition-all shadow-sm"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 xl:w-8 xl:h-8 2xl:w-9 2xl:h-9" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Topbar;