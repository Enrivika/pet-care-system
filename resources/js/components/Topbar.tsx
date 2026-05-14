import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Bell, User } from 'lucide-react';
import NotificationsModal from './NotificationsModal';
import UserProfileModal from './UserProfileModal';

const Topbar = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <div className="bg-white border-b h-16 flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('ru-RU', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Колокольчик */}
          <button 
            onClick={() => setShowNotifications(true)}
            className="p-2 hover:bg-gray-100 rounded-full relative"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
          </button>

          {/* Профиль */}
          <div 
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-3 pl-4 border-l cursor-pointer hover:bg-gray-50 rounded-xl p-2 transition-colors"
          >
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

      <NotificationsModal 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />

      <UserProfileModal 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
      />
    </>
  );
};

export default Topbar;