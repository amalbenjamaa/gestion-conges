import { useState, useEffect } from 'react';

function OnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showNotification) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className={`${
        isOnline ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
      } border rounded-lg shadow-lg p-4 max-w-sm`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`}></div>
          <div>
            <p className={`font-semibold text-sm ${isOnline ? 'text-green-900' : 'text-orange-900'}`}>
              {isOnline ? 'Connexion rétablie' : 'Mode hors ligne'}
            </p>
            <p className={`text-xs ${isOnline ? 'text-green-700' : 'text-orange-700'}`}>
              {isOnline ? 'Synchronisation en cours...' : 'Certaines fonctionnalités sont limitées'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnlineStatus;