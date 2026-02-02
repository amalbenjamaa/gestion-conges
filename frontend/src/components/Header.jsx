import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Header({ userEmail, userRole, onLogout }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);
  const [userInfo, setUserInfo] = useState({
    nom_complet: '',
    position: ''
  });

  // Charger les infos utilisateur complètes
  useEffect(() => {
    fetch('http://localhost:8000/api/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setUserAvatar(data.avatar_url);
        setUserInfo({
          nom_complet: data.nom_complet || userEmail,
          position: data.position || 'Non spécifié'
        });
      })
      .catch(() => {});
  }, [userEmail]);

  // Recharger l'avatar toutes les 5 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('http://localhost:8000/api/me', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.avatar_url !== userAvatar) {
            setUserAvatar(data.avatar_url);
          }
          if (data.nom_complet && data.nom_complet !== userInfo.nom_complet) {
            setUserInfo(prev => ({ 
              ...prev, 
              nom_complet: data.nom_complet,
              position: data.position || 'Non spécifié'
            }));
          }
        })
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [userAvatar, userInfo.nom_complet]);

  // Écouter les événements de mise à jour d'avatar
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
    if (userRole === 'manager') {
      fetch('http://localhost:8000/api/notifications', { credentials: 'include' })
        .then(res => res.json())
        .then(data => setNotifications(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
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

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo et titre selon le rôle AVEC nom et fonction */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              {userRole === 'manager' ? (
                <>
                  <h1 className="text-xl font-bold text-gray-900">Espace Manager</h1>
                  <p className="text-sm text-gray-700 font-medium">{userInfo.nom_complet}</p>
                  <p className="text-xs text-gray-500">{userInfo.position}</p>
                </>
              ) : (
                <>
                  <h1 className="text-xl font-bold text-gray-900">Espace Employé</h1>
                  <p className="text-sm text-gray-700 font-medium">{userInfo.nom_complet}</p>
                  <p className="text-xs text-gray-500">{userInfo.position}</p>
                </>
              )}
            </div>
          </div>

          {/* Actions et profil */}
          <div className="flex items-center gap-6">
            {/* Notifications (seulement pour managers) */}
            {userRole === 'manager' && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-96 overflow-auto z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-bold text-gray-900">Notifications</h3>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-sm">Aucune notification</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.slice(0, 5).map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-4 hover:bg-gray-50 transition-colors ${!notif.is_read ? 'bg-blue-50' : ''}`}
                          >
                            <p className="text-sm text-gray-900 font-medium">{notif.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notif.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Info utilisateur avec avatar */}
            <div 
              onClick={() => navigate('/profil')}
              className="flex items-center gap-3 hover:bg-gray-100 rounded-xl px-3 py-2 transition-colors cursor-pointer"
            >
              {/* Avatar avec photo */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg overflow-hidden border-2 border-white">
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
              
              {/* Nom seulement */}
              <span className="text-sm font-semibold text-gray-900">
                {userInfo.nom_complet || userEmail}
              </span>
            </div>

            {/* Bouton Déconnexion */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg font-medium transition-all hover:bg-red-50"
              title="Déconnexion"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;