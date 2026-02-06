import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoMonconge from '../assets/monconge-logo.png';

function Header({ userEmail, userRole, onLogout, onToggleSidebar }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);
  const [userInfo, setUserInfo] = useState({
    nom_complet: '',
    position: '',
    departement: ''
  });

  // ... tous les useEffect existants (ne pas les modifier)

  useEffect(() => {
    fetch('http://localhost:8000/api/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setUserAvatar(data.avatar_url);
        setUserInfo({
          nom_complet: data.nom_complet || userEmail,
          position: data.position || '',
          departement: data.departement || ''
        });
      })
      .catch(() => {});
  }, [userEmail]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('http://localhost:8000/api/me', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.avatar_url !== userAvatar) {
            setUserAvatar(data.avatar_url);
          }
          if (data.nom_complet && data.nom_complet !== userInfo.nom_complet) {
            setUserInfo({
              nom_complet: data.nom_complet,
              position: data.position || '',
              departement: data.departement || ''
            });
          }
        })
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [userAvatar, userInfo.nom_complet]);

  useEffect(() => {
    const handleAvatarUpdate = (event) => {
      if (event.detail?.avatar_url) {
        setUserAvatar(event.detail.avatar_url);
      }
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
  }, []);

  useEffect(() => {
    fetch('http://localhost:8000/api/notifications', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data?.notifications) ? data.notifications : (Array.isArray(data) ? data : []);
        setNotifications(list);
      })
      .catch(() => {});
  }, [userRole]);

  const handleLogout = () => {
    fetch('http://localhost:8000/api/logout', {
      method: 'POST',
      credentials: 'include'
    })
      .then(() => {
        onLogout();
        navigate('/login');
      })
      .catch(() => {
        onLogout();
        navigate('/login');
      });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllAsRead = async () => {
    try {
      await fetch('http://localhost:8000/api/notifications/mark-read', {
        method: 'POST',
        credentials: 'include'
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Erreur marquage notifications:', err);
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          {/* Bouton hamburger + Logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* ✅ BOUTON HAMBURGER - visible seulement sur mobile/tablette */}
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Menu"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo */}
            <img 
              src={logoMonconge} 
              alt="Moncongé" 
              className="h-8 sm:h-10 w-auto object-contain flex-shrink-0"
            />
            
            {/* Info utilisateur */}
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">
                {userRole === 'manager' ? 'Espace Manager' : 'Espace Employé'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-700 font-medium truncate">
                {userInfo.nom_complet}
              </p>
              {(userInfo.position || userInfo.departement) && (
                <p className="hidden md:block text-xs text-gray-600 truncate">
                  {userInfo.position}
                  {userInfo.position && userInfo.departement && ' • '}
                  {userInfo.departement}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Notifications */}
            <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  title="Notifications"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-center">
                      <h3 className="font-semibold text-white text-sm sm:text-base">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-white/90 hover:text-white underline"
                        >
                          Marquer
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-sm">Aucune notification</p>
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.slice(0, 5).map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-3 sm:p-4 hover:bg-gray-50 transition-colors ${!notif.is_read ? 'bg-blue-50' : ''}`}
                          >
                            <p className="text-sm text-gray-900 font-medium">{notif.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notif.created_at ? new Date(notif.created_at).toLocaleDateString('fr-FR') : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

            {/* Avatar */}
            <div 
              onClick={() => navigate('/profil')}
              className="flex items-center gap-2 hover:bg-gray-100 rounded-xl px-2 py-1 sm:px-3 sm:py-2 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg overflow-hidden border-2 border-white flex-shrink-0">
                {userAvatar ? (
                  <img 
                    src={userAvatar} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.textContent = (userInfo.nom_complet || userEmail).charAt(0).toUpperCase();
                    }}
                  />
                ) : (
                  (userInfo.nom_complet || userEmail).charAt(0).toUpperCase()
                )}
              </div>
              
              <span className="hidden sm:inline text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                {userInfo.nom_complet || userEmail}
              </span>
            </div>

            {/* Déconnexion */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 p-2 sm:px-3 sm:py-2 rounded-lg font-medium transition-all hover:bg-red-50"
              title="Déconnexion"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden lg:inline text-sm">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
