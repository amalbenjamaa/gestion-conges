import { Link, useLocation } from 'react-router-dom';

function Sidebar({ userRole, isOpen, onClose }) {
  const location = useLocation();

  let menuItems;

  if (userRole === 'manager') {
    menuItems = [
      { path: '/dashboard', label: 'Tableau de bord', icon: '📊' },
      { path: '/calendrier', label: 'Calendrier', icon: '📅' },
      { path: '/statistiques', label: 'Statistiques', icon: '📈' },
      { path: '/validation', label: 'Validation', icon: '✓' },
      { path: '/profil', label: 'Profil', icon: '👤' },
    ];
  } else {
    menuItems = [
      { path: '/dashboard', label: 'Mes Demandes', icon: '👤' },
      { path: '/nouvelle-demande', label: '+ Nouvelle Demande', icon: '+' },
      { path: '/calendrier', label: 'Calendrier', icon: '📅' },
      { path: '/profil', label: 'Profil & Solde', icon: '🧾' },
    ];
  }

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Overlay - seulement sur mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 z-50 h-full
        w-64 bg-white/70 backdrop-blur-md text-gray-800 shadow-lg border-r border-white/20
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:z-10
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Bouton fermer - seulement sur mobile */}
        <div className="lg:hidden flex justify-end p-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  // Fermer la sidebar sur mobile après un clic
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white font-semibold shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}

export default Sidebar;