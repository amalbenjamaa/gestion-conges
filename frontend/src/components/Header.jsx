import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Header({ userEmail, userRole, onLogout }) {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const isManager = userRole === 2;

  const getUserName = () => {
    if (!userEmail) return 'Utilisateur';
    const name = userEmail.split('@')[0];
    return name.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || userEmail;
  };

  const userName = getUserName();
  const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleProfileClick = () => {
    navigate('/profil');
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const handleAddUser = () => {
    navigate('/ajouter-utilisateur');
  };

  const notifications = [
    { id: 1, type: 'success', message: 'Demande de congé validée', time: '2 min' },
    { id: 2, type: 'info', message: 'Nouvelle demande en attente', time: '1h' },
  ];

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-white bg-slate-800 px-4 py-2 rounded">DYNAMIX SERVICES</h1>
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {isManager ? 'Espace Manager' : 'Espace Employé'}
          </h2>
          <p className="text-xs text-gray-500">
            {isManager ? 'Gestion et validation des congés' : 'Gestion de mes demandes'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Bouton Ajouter Utilisateur (Manager uniquement) */}
        {isManager && (
          <button
            onClick={handleAddUser}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter Utilisateur
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-30">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer ${
                      notif.type === 'success' ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-blue-500'
                    }`}
                  >
                    <p className="text-sm text-gray-800">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profil */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
            isManager ? 'bg-blue-600' : 'bg-green-600'
          }`}>
            {initials}
          </div>
          <div className="flex flex-col">
            <p className="font-semibold text-sm text-gray-800">{userName}</p>
            <p className="text-xs text-gray-500">{isManager ? 'Manager' : 'Employé'}</p>
          </div>
        </div>

        {/* Boutons */}
        <button
          onClick={handleProfileClick}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Mon Profil
        </button>

        <button
          onClick={handleLogoutClick}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Déconnexion
        </button>
      </div>
    </div>
  );
}

export default Header;