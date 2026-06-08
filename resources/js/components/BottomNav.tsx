import { NavLink } from 'react-router-dom';

const BottomNav = () => {
  const ICON_COLORS = {
    active: '#1F2421',
    inactive: '#E9F5ED',
  } as const;

  const navItems = [
    {
      to: '/dashboard',
      label: 'Главная',
      icon: (isActive: boolean) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-house-icon lucide-house w-5 h-5 sm:w-6 sm:h-6"
          style={{ color: isActive ? ICON_COLORS.active : ICON_COLORS.inactive }}
        >
          <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
          <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
      ),
    },
    {
      to: '/pets',
      label: 'Все питомцы',
      icon: (isActive: boolean) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-paw-print-icon lucide-paw-print w-5 h-5 sm:w-6 sm:h-6"
          style={{ color: isActive ? ICON_COLORS.active : ICON_COLORS.inactive }}
        >
          <circle cx="11" cy="4" r="2" />
          <circle cx="18" cy="8" r="2" />
          <circle cx="20" cy="16" r="2" />
          <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
        </svg>
      ),
    },
    {
      to: '/calendar',
      label: 'Календарь и задачи',
      icon: (isActive: boolean) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-calendar-check-icon lucide-calendar-check w-5 h-5 sm:w-6 sm:h-6"
          style={{ color: isActive ? ICON_COLORS.active : ICON_COLORS.inactive }}
        >
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M3 10h18" />
          <path d="m9 16 2 2 4-4" />
        </svg>
      ),
    },
    {
      to: '/health',
      label: 'Медицинский журнал',
      icon: (isActive: boolean) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-square-activity-icon lucide-square-activity w-5 h-5 sm:w-6 sm:h-6"
          style={{ color: isActive ? ICON_COLORS.active : ICON_COLORS.inactive }}
        >
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M17 12h-2l-2 5-2-10-2 5H7" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1F2421] z-50 border-t border-white/10">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center text-xs gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 sm:py-2 transition-all h-full ${
                isActive ? 'bg-[#4BBB71] text-[#1F2421] rounded-b-2xl' : 'text-white/70 hover:bg-white/10'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                  {item.icon(isActive)}
                </div>
                <span 
                  className="text-[9px] sm:text-[10px] text-center leading-tight"
                  style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
                >{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;