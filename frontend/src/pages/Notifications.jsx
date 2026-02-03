import { useEffect, useState } from 'react';
import Layout from '../components/Layout';

function Notifications({ userEmail, userRole, onLogout }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = () => {
    fetch('http://localhost:8000/api/notifications', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        console.log('📬 Notifications:', data);
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Erreur:', err);
        setNotifications([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = () => {
    fetch('http://localhost:8000/api/notifications/mark-read', {
      method: 'POST',
      credentials: 'include'
    })
      .then(() => loadNotifications())
      .catch(err => console.error('Erreur:', err));
  };

  const markAsRead = (id) => {
    fetch(`http://localhost:8000/api/notifications/${id}/read`, {
      method: 'PATCH',
      credentials: 'include'
    })
      .then(() => loadNotifications())
      .catch(err => console.error('Erreur:', err));
  };

  const deleteNotification = (id) => {
    fetch(`http://localhost:8000/api/notifications/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
      .then(() => loadNotifications())
      .catch(err => console.error('Erreur:', err));
  };

  const deleteAllRead = () => {
    if (!confirm('Supprimer toutes les notifications lues ?')) return;
    fetch('http://localhost:8000/api/notifications/delete-read', {
      method: 'DELETE',
      credentials: 'include'
    })
      .then(() => loadNotifications())
      .catch(err => console.error('Erreur:', err));
  };

  const getIcon = (type) => {
    const icons = {
      success: (
        <div className="bg-green-100 p-3 rounded-full">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
      error: (
        <div className="bg-red-100 p-3 rounded-full">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
      warning: (
        <div className="bg-yellow-100 p-3 rounded-full">
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      ),
      info: (
        <div className="bg-blue-100 p-3 rounded-full">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
    };
    return icons[type] || icons.info;
  };

  if (loading) {
    return (
      <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">
              {unreadCount > 0 
                ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` 
                : 'Aucune nouvelle notification'}
            </p>
          </div>
          <div className="flex gap-3">
            {notifications.some(n => n.lu) && (
              <button
                onClick={deleteAllRead}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Supprimer les lues
              </button>
            )}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tout marquer comme lu
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="font-medium text-lg">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-6 hover:bg-gray-50 transition-all ${
                    !notif.lu ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => !notif.lu && markAsRead(notif.id)}
                >
                  <div className="flex items-start gap-4">
                    {getIcon(notif.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                            {notif.titre}
                            {!notif.lu && (
                              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                            )}
                          </h3>
                          <p className="text-gray-700 text-sm">{notif.message}</p>
                          <p className="text-gray-500 text-xs mt-2">
                            {notif.date_relative || notif.date_formatted}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Notifications;