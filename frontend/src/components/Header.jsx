import { useEffect, useState } from 'react';

function Header({ userEmail, userRole, onLogout }) {
  // Extraire le nom depuis l'email (ex: "thomas.leroy@example.com" -> "Thomas Leroy")
  const getUserName = () => {
    if (!userEmail) return 'Utilisateur';
    const name = userEmail.split('@')[0];
    return name.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || userEmail;
  };

  const userName = getUserName();
  const isManager = userRole === 'manager';
  const espaceTitle = isManager ? 'Espace Manager' : 'Espace Employé';
  const roleLabel = isManager ? 'Manager' : 'Employé';
  const description = isManager 
    ? "Vue d'overview et suivi des congés par employé"
    : "Gestion de vos demandes de congés";

  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [userPosition, setUserPosition] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/notifications', {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;
        setNotificationCount(Number(data?.unread || 0));
        setNotifications(Array.isArray(data?.items) ? data.items : []);
      } catch {
        // ignore
      }
    };

    load();
    const interval = setInterval(load, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [userRole]);

  // Charger la position de l'utilisateur
  useEffect(() => {
    fetch('http://localhost:8000/api/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data?.position) setUserPosition(data.position);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="glass-panel shadow-sm border-b border-white/60 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-white bg-slate-800/90 px-4 py-2 rounded-lg shadow-md">DYNAMIX SERVICES</h1>
      <div>
          <h2 className="text-xl font-bold text-gray-800">{espaceTitle}</h2>
          <p className="text-xs text-gray-500">
            {userPosition ? `📋 ${userPosition} • ${description}` : description}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative cursor-pointer rounded-full p-2 hover:bg-white/60 transition-colors"
          onClick={async () => {
            if (notifications.length > 0) {
              const lines = notifications
                .slice(0, 10)
                .map((n) => `- ${n.message}`)
                .join('\n');
              alert(lines);
            } else {
              alert('Aucune notification.');
            }
            try {
              await fetch('http://localhost:8000/api/notifications/mark-read', {
                method: 'POST',
                credentials: 'include',
              });
              setNotificationCount(0);
            } catch {
              // ignore
            }
          }}
        >
          <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border-2 border-white text-[10px] text-white flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
            {userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div className="flex items-center gap-2">
          <div>
              <p className="font-semibold text-sm text-gray-800">{userName}</p>
            <p className="text-xs text-gray-500">{roleLabel}</p>
            </div>
            <button 
              onClick={onLogout} 
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 ml-2 px-2 py-1 rounded hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 11-4 0v-1m0-8V7a2 2 0 114 0v1" />
              </svg>
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;
