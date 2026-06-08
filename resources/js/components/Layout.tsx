import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';
import UserProfileModal from './UserProfileModal';
import Scrollbar from './Scrollbar';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [showProfile, setShowProfile] = useState(false);

  const openProfile = () => setShowProfile(true);
  const closeProfile = () => setShowProfile(false);

  return (
    <div className="flex h-screen bg-[#E9F5ED]">
      {/* Десктопная боковая панель */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0">
        {/* Верхняя навигационная панель (мобильная с #1F2421 + десктопная с #E9F5ED, обе sticky, с одинаковыми иконками) */}
        <Topbar onOpenProfile={openProfile} />

        {/* Контент */}
        <Scrollbar className="flex-1">
          {children}
        </Scrollbar>
      </div>

      {/* Нижняя навигация (мобильная) */}
      <BottomNav />

      {/* Общая модалка профиля */}
      <UserProfileModal 
        isOpen={showProfile} 
        onClose={closeProfile} 
      />

    </div>
  );
};

export default Layout;