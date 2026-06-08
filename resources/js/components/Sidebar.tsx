import { NavLink, Link } from 'react-router-dom';

const Sidebar = () => {
  
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
          className="lucide lucide-house-icon lucide-house w-6 h-6 xl:w-7 xl:h-7 2xl:w-8 2xl:h-8"
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
          className="lucide lucide-paw-print-icon lucide-paw-print w-6 h-6 xl:w-7 xl:h-7 2xl:w-8 2xl:h-8"
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
          className="lucide lucide-calendar-check-icon lucide-calendar-check w-6 h-6 xl:w-7 xl:h-7 2xl:w-8 2xl:h-8"
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
          className="lucide lucide-square-activity-icon lucide-square-activity w-6 h-6 xl:w-7 xl:h-7 2xl:w-8 2xl:h-8"
          style={{ color: isActive ? ICON_COLORS.active : ICON_COLORS.inactive }}
        >
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M17 12h-2l-2 5-2-10-2 5H7" />
        </svg>
      ),
    },
  ];

  return (
    <div className="lg:w-64 xl:w-72 2xl:w-80 h-screen flex flex-col rounded-r-3xl overflow-hidden shadow-2xl" 
         style={{ backgroundColor: '#1F2421' }}>
      
      {/* Логотип */}
      <div className="p-6 xl:p-7 2xl:p-8">
        <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img 
            src="/images/Petopia.png" 
            alt="Petopia" 
            className="w-11 h-11 xl:w-12 xl:h-12 2xl:w-14 2xl:h-14 rounded-xl object-contain"
          />
          <div>
            <div 
              className="font-bold text-2xl xl:text-3xl 2xl:text-[36px] text-white" 
              style={{ 
                fontFamily: 'Itim, cursive',
                letterSpacing: '-0.02em'
              }}
            >
              Petopia
            </div>
          </div>
        </Link>
      </div>

      {/* Навигация */}
      <nav className="flex-1 p-4 xl:p-5 2xl:p-6 flex flex-col justify-center">
        <div className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-4 xl:gap-5 px-5 xl:px-6 py-3.5 xl:py-4 rounded-2xl transition-all ${
                  isActive 
                    ? 'bg-[#4BBB71] shadow-lg' 
                    : 'hover:bg-white/10'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.icon(isActive)}
                  <span 
                    className="font-medium text-[15px] xl:text-base"
                    style={{ 
                      fontFamily: 'Inter, sans-serif',
                      letterSpacing: '-0.02em',
                      color: isActive ? ICON_COLORS.active : ICON_COLORS.inactive
                    }}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

    </div>
  );
};

export default Sidebar;