import { Link, useLocation } from 'react-router-dom';

function Sidebar({ userRole }) {
  const location = useLocation();

  // Menus séparés selon le rôle pour que les libellés correspondent bien aux pages
  let menuItems;

  if (userRole === 'manager') {
    // Vue manager : pas de bouton \"Nouvelle Demande\"
    menuItems = [
    { path: '/dashboard', label: 'Tableau de bord', icon: '📊' },
      { path: '/calendrier', label: 'Calendrier', icon: '📅' },
      { path: '/statistiques', label: 'Statistiques', icon: '📈' },
      { path: '/validation', label: 'Validation', icon: '✓' },
      // Le lien \"Gestion Profils\" (dernier lien) est volontairement retiré de la sidebar
    ];
  } else {
    // Vue employé : le dashboard affiche déjà \"Mes Demandes\"
    menuItems = [
      { path: '/dashboard', label: 'Mes Demandes', icon: '👤' },
      { path: '/nouvelle-demande', label: '+ Nouvelle Demande', icon: '+' },
    { path: '/calendrier', label: 'Calendrier', icon: '📅' },
      { path: '/profil', label: 'Profil & Solde', icon: '🧾' },
  ];
  }

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 bg-white/70 backdrop-blur-md text-gray-800 min-h-screen fixed left-0 top-0 z-10 shadow-lg border-r border-white/20">
      <div className="p-6">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
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
  );
}

export default Sidebar;
