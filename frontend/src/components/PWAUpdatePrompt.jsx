import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

function PWAUpdatePrompt() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('✅ Service Worker enregistré:', r);
    },
    onRegisterError(error) {
      console.error('❌ Erreur d\'enregistrement du Service Worker:', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowUpdatePrompt(true);
    }
  }, [needRefresh]);

  const handleUpdate = () => {
    updateServiceWorker(true);
    setShowUpdatePrompt(false);
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
    setNeedRefresh(false);
  };

  // Message "Application prête hors ligne"
  if (offlineReady) {
    return (
      <div className="fixed bottom-4 left-4 z-50 animate-slide-up">
        <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 mb-1">
                Application prête !
              </h3>
              <p className="text-sm text-green-700">
                L'application est maintenant disponible hors ligne.
              </p>
            </div>
            <button
              onClick={() => setOfflineReady(false)}
              className="flex-shrink-0 text-green-400 hover:text-green-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Message de mise à jour disponible
  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-slide-up">
      <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">
              Mise à jour disponible
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Une nouvelle version de l'application est disponible.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Mettre à jour
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors text-sm"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PWAUpdatePrompt;