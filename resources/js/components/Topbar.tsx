import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { Link } from 'react-router-dom';
import { fetchNotifications, markAsRead, markAllAsRead, clearAllNotifications, deleteNotification } from '../store/slices/notificationsSlice';
import { toast } from 'sonner';
import { usePWAInstall } from '../hooks/usePWAInstall';


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

  // PWA install button (кнопка установки приложения)
  const { canInstall, promptInstall } = usePWAInstall();

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

  const handleDeleteNotification = async (id: number) => {
    if (!confirm('Удалить это уведомление?')) return;

    try {
      await dispatch(deleteNotification(id) as any).unwrap();
    } catch (err) {
      toast.error('Не удалось удалить уведомление');
    }
  };

const renderNotificationsContent = () => (
  <>
    {/* Вкладки */}
    <div className="flex border-b flex-shrink-0">
      <button
        onClick={() => setActiveTab('unread')}
        className={`flex-1 py-3 text-sm min-[360px]:text-sm sm:text-base font-medium transition-all
          ${activeTab === 'unread' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500'}`}
        style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
        type="button"
      >
        Непрочитанные ({unreadNotifications.length})
      </button>
      <button
        onClick={() => setActiveTab('read')}
        className={`flex-1 py-3 text-sm min-[360px]:text-sm sm:text-base font-medium transition-all
          ${activeTab === 'read' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500'}`}
        style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
        type="button"
      >
        Прочитанные ({readNotifications.length})
      </button>
    </div>

    {/* СКРОЛЛИРУЕМАЯ ОБЛАСТЬ */}
    <div className="flex-1 min-h-0 overflow-y-auto">
      {loading && notifications.length === 0 ? (
        <div className="p-8 text-center text-gray-500">Загрузка...</div>
      ) : (activeTab === 'unread' ? unreadNotifications : readNotifications).length > 0 ? (
        <>
          {/* Зелёная плашка-подсказка */}
          {activeTab === 'unread' && (
            <div className="px-3 py-2 min-[325px]:px-4 min-[325px]:py-2.5 bg-[#4BBB71]/10 flex items-center justify-center gap-2 text-[9px] min-[325px]:text-[10px] min-[373px]:text-xs sm:text-sm text-[#4BBB71] border-b">
              <span>Нажми на напоминание, чтобы прочитать его</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-[14px] h-[14px] min-[325px]:w-[15px] min-[373px]:w-4 min-[373px]:h-4 text-[#4BBB71] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
            </div>
          )}

          {/* Красная плашка-подсказка */}
          {activeTab === 'read' && (
            <div className="px-3 py-2 min-[325px]:px-4 min-[325px]:py-2.5 bg-red-100 flex items-center justify-center gap-2 text-[9px] min-[325px]:text-[10px] min-[373px]:text-xs sm:text-sm text-red-600 border-b">
              <span>Нажми на напоминание, чтобы удалить его</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-[14px] h-[14px] min-[325px]:w-[15px] min-[373px]:w-4 min-[373px]:h-4 text-red-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </div>
          )}

          {/* Список уведомлений */}
          {(activeTab === 'unread' ? unreadNotifications : readNotifications).map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                if (activeTab === 'unread') {
                  handleMarkAsRead(notif.id);
                } else {
                  handleDeleteNotification(notif.id);
                }
              }}
              className="p-4 border-b hover:bg-gray-50 cursor-pointer flex gap-3"
            >
              {/* Иконка категории */}
              <div className="w-8 h-8 min-[360px]:w-9 min-[360px]:h-9 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 self-start mt-0.5">
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
                {/* Заголовок */}
                <div 
                  className="text-[#1F2421] text-sm min-[360px]:text-[14px]" 
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                  dangerouslySetInnerHTML={{ __html: notif.title }}
                />

                {/* Тело уведомления */}
                <div 
                  className="text-[#1F2421] text-sm min-[360px]:text-[14px] whitespace-pre-line mt-0.5" 
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                  dangerouslySetInnerHTML={{ __html: notif.body }}
                />

                {/* Дата создания */}
                <div className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
                  {new Date(notif.created_at).toLocaleDateString('ru-RU')}
                </div>
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="p-8 text-center text-gray-500">
          {activeTab === 'unread' ? 'Нет непрочитанных уведомлений' : 'Нет прочитанных уведомлений'}
        </div>
      )}
    </div>
  </>
);

  // Прилипшая кнопка внизу панели (всегда видна, не скроллится вместе со списком)
  const renderActionFooter = () => (
    <div className="p-4 border-t bg-gray-50 flex-shrink-0">
      {activeTab === 'unread' ? (
        <button
          onClick={handleMarkAllAsRead}
          className="w-full py-3 bg-emerald-500 text-white rounded-2xl font-medium hover:bg-emerald-600"
          type="button"
        >
          Пометить все как прочитанные
        </button>
      ) : (
        <button
          onClick={handleClearAll}
          className="w-full py-3 bg-red-500 text-white rounded-2xl font-medium hover:bg-red-600"
          type="button"
        >
          Очистить историю
        </button>
      )}
    </div>
  );

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

const InstallIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="#1F2421"
    aria-hidden="true"
  >
    <path d="M10 3a2 2 0 0 1 4 0v7h2.1a1 1 0 0 1 .7 1.7l-4.1 4.1a1.5 1.5 0 0 1-2.1 0l-4.1-4.1A1 1 0 0 1 7.2 10H10V3zM6 14a2 2 0 0 1 2 2v2h8v-2a2 2 0 1 1 4 0v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2z" />
  </svg>
);

  const bellBtnBase =
    "bg-white rounded-full flex items-center justify-center shadow-sm hover:opacity-80 active:scale-[0.95] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2";

  // mobile sizes
  const bellBtnMobile = "w-9 h-9 sm:w-10 sm:h-10";
  const bellIconMobile = "w-5 h-5 sm:w-6 sm:h-6";
  const badgeMobile =
    "absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 min-w-5 h-5 sm:min-w-6 sm:h-6 px-1 bg-red-500 text-white text-[10px] sm:text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white leading-none";

  // desktop sizes
  const bellBtnDesktop = "w-10 h-10 xl:w-11 xl:h-11 2xl:w-12 2xl:h-12";
  const bellIconDesktop = "w-6 h-6 xl:w-7 xl:h-7 2xl:w-8 2xl:h-8";
  const badgeDesktop =
    "absolute -top-1 -right-1 xl:-top-1.5 xl:-right-1.5 min-w-5 h-5 xl:min-w-6 xl:h-6 px-1 bg-red-500 text-white text-[10px] xl:text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white leading-none";
    
  return (
    <>
      {/* ========== ВЕРХНЯЯ НАВИГАЦИОННАЯ ПАНЕЛЬ ДЛЯ МОБИЛЬНЫХ И ПЛАНШЕТОВ (< lg) ========== */}
      <div className="lg:hidden bg-[#1F2421] text-white px-4 h-16 flex items-center justify-between sticky top-0 z-[50]">
        {/* Логотип */}
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

        {/* Иконки справа */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Кнопка установки PWA (мобильная) */}
          {canInstall && (
            <button
              onClick={promptInstall}
              className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center hover:opacity-80 active:scale-[0.95] transition-all"
              aria-label="Установить приложение"
              title="Установить приложение"
            >
              <InstallIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
            </button>
          )}

          {/* Колокольчик */}
          <div ref={mobileBellRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`${bellBtnBase} ${bellBtnMobile}`}
              aria-label="Уведомления"
              aria-expanded={showNotifications}
              aria-controls="mobile-notifications-panel"
              type="button"
            >
              <BellIcon className={bellIconMobile} />
            </button>

            {unreadCount > 0 && (
              <div className={badgeMobile}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </div>

          {/* Аватар профиля */}
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

      
      {/* Мобильная панель уведомлений */}
      {showNotifications && (
        <div
          className="lg:hidden fixed inset-0 z-[999] bg-black/50"
          onClick={() => setShowNotifications(false)}
        >
          <div
            ref={mobilePanelRef}
            id="mobile-notifications-panel"
            className="
              absolute left-1/2 top-16 -translate-x-1/2
              w-[min(32rem,calc(100vw-1.5rem))]
              bg-white rounded-3xl shadow-2xl overflow-hidden
              max-h-[min(620px,calc(100dvh-4rem))]
              flex flex-col z-[1000]
            "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-4 border-b flex items-center justify-between bg-gray-50 flex-shrink-0">
              <h2
                className="text-lg font-bold"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
              >
                Уведомления
              </h2>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none px-1"
                type="button"
              >
                ✕
              </button>
            </div>

            {/* Средняя часть: tabs + скролл списка. flex-1 даёт место списку для скролла */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {renderNotificationsContent()}
            </div>

            {/* Прилипшая кнопка в самом низу панели (всегда видна) */}
            {renderActionFooter()}
          </div>
        </div>
      )}

      {/* ========== ДЕСКТОПНАЯ ВЕРХНЯЯ НАВИГАЦИОННАЯ ПАНЕЛЬ ========== */}
      <div className="hidden lg:block bg-[#E9F5ED] sticky top-0 z-[50]">
        <div className="px-8 xl:px-10 2xl:px-12 py-6 xl:py-7 2xl:py-8 flex items-center justify-end">
          <div className="flex items-center gap-2 xl:gap-3">
            {/* Кнопка установки PWA (десктоп) */}
            {canInstall && (
              <button
                onClick={promptInstall}
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 xl:w-11 xl:h-11 2xl:w-12 2xl:h-12 bg-white rounded-full flex items-center justify-center hover:opacity-80 active:scale-[0.95] transition-all shadow-sm"
                aria-label="Установить приложение"
                title="Установить приложение"
              >
                <InstallIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 xl:w-8 xl:h-8 2xl:w-9 2xl:h-9" />
              </button>
            )}

            {/* Колокольчик */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`${bellBtnBase} ${bellBtnDesktop}`}
                aria-label="Уведомления"
                aria-expanded={showNotifications}
                aria-controls="desktop-notifications-dropdown"
                type="button"
              >
                <BellIcon className={bellIconDesktop} />
              </button>
              {unreadCount > 0 && (
                <div className={badgeDesktop}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}

              {showNotifications && (
                <div
                  id="desktop-notifications-dropdown"
                  className="absolute right-0 mt-3 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-2xl border z-[100] overflow-hidden max-h-[min(520px,calc(100dvh-6rem))] flex flex-col"
                >
                  <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50 flex-shrink-0">
                    <h2
                      className="text-xl font-bold"
                      style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                    >
                      Уведомления
                    </h2>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-gray-600"
                      style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Средняя часть: tabs + скролл списка уведомлений */}
                  <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    {renderNotificationsContent()}
                  </div>

                  {/* Прилипшая кнопка всегда внизу дропдауна (не уезжает при скролле) */}
                  {renderActionFooter()}
                </div>
              )}
            </div>

            {/* Профиль */}
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