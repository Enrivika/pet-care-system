import { NavLink, Link } from 'react-router-dom';

const Sidebar = () => {
  const navItems = [
    { 
      to: '/dashboard', 
      label: 'Главная',
      icon: (isActive: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill={isActive ? "white" : "#9CA3AF"}>
          <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 2.8L18 12v6h-4v-4H10v4H6v-6l6-6.2z"/>
        </svg>
      )
    },
    { 
      to: '/pets', 
      label: 'Все питомцы',
      icon: (isActive: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill={isActive ? "white" : "#9CA3AF"}>
          <path d="M12 2C9.8 2 8 3.8 8 6c0 1.1.4 2.1 1 2.9L12 12l3-3.1c.6-.8 1-1.8 1-2.9 0-2.2-1.8-4-4-4zM6 14c-1.1 0-2 .9-2 2v4h16v-4c0-1.1-.9-2-2-2H6z"/>
        </svg>
      )
    },
    { 
      to: '/calendar', 
      label: 'Календарь и задачи',
      icon: (isActive: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill={isActive ? "white" : "#9CA3AF"}>
          <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
        </svg>
      )
    },
    { 
      to: '/health', 
      label: 'Медицинский журнал',
      icon: (isActive: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill={isActive ? "white" : "#9CA3AF"}>
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>
        </svg>
      )
    },
  ];

  return (
    <div className="w-64 h-screen flex flex-col rounded-r-3xl overflow-hidden shadow-2xl" 
         style={{ backgroundColor: '#1a1a1a' }}>
      
      {/* Логотип */}
      <div className="p-6 border-b border-white/10">
        <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img 
            src="/images/Petopia.png" 
            alt="Petopia" 
            className="w-10 h-10 rounded-xl object-contain"
          />
          <div>
            <div 
              className="font-bold text-2xl text-white" 
              style={{ 
                fontFamily: 'Itim, cursive',
                letterSpacing: '-0.03em'
              }}
            >
              Petopia
            </div>
          </div>
        </Link>
      </div>

      {/* Навигация */}
      <nav className="flex-1 p-4 flex flex-col justify-center">
        <div className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-lg' 
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.icon(isActive)}
                  <span 
                    className="font-medium text-[15px]"
                    style={{ 
                      fontFamily: 'Inter, sans-serif',
                      letterSpacing: '-0.02em'
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