import { Link, useLocation } from 'react-router-dom';

function Sidebar({ userRole }) {
  const location = useLocation();
  const isManager = userRole === 2;

  // Menu pour les MANAGERS
  const managerMenuItems = [
    { path: '/dashboard', label: 'Tableau de bord', icon: '📊' },
    { path: '/statistiques', label: 'Statistiques', icon: '📈' },
    { path: '/calendrier', label: 'Calendrier', icon: '📅' },
    { path: '/validation', label: 'Validation', icon: '✓' }
  ];

  // Menu pour les EMPLOYÉS
  const employeeMenuItems = [
    { path: '/mes-demandes', label: 'Mes Demandes', icon: '📋' },
    { path: '/nouvelle-demande', label: '+ Nouvelle Demande', icon: '✨' },
    { path: '/calendrier', label: 'Calendrier', icon: '📅' },
    { path: '/solde', label: 'Mon Solde', icon: '💰' },
    { path: '/profil', label: 'Mon Profil', icon: '👤' }
  ];

  const menuItems = isManager ? managerMenuItems : employeeMenuItems;
  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 bg-slate-800 text-white min-h-screen fixed left-0 top-0 z-10 shadow-lg">
      <div className="p-6">
        <h1 className="text-xl font-bold mb-2 text-white">DYNAMIX SERVICES</h1>
        <p className="text-xs text-slate-400 mb-8">
          {isManager ? 'Espace Manager' : 'Espace Employé'}
        </p>
        
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white font-semibold shadow-md'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default Sidebar;