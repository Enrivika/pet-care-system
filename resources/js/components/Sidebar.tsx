import { NavLink } from 'react-router-dom';
import { Home, Users, Calendar, Heart, DollarSign, Settings, LogOut } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Дашборд' },
    { to: '/pets', icon: Users, label: 'Мои питомцы' },
    { to: '/calendar', icon: Calendar, label: 'Календарь' },
    { to: '/health', icon: Heart, label: 'Здоровье' },
    { to: '/expenses', icon: DollarSign, label: 'Расходы' },
  ];

  return (
    <div className="w-64 bg-white border-r h-screen flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-2xl">🐾</span>
          </div>
          <div>
            <div className="font-bold text-xl text-gray-900">Petopia</div>
            <div className="text-xs text-gray-500">Уход за питомцами</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive 
                    ? 'bg-emerald-50 text-emerald-600 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Выйти
        </button>
      </div>
    </div>
  );
};

export default Sidebar;