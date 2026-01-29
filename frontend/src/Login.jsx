import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Détecter le mode offline/online
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Veuillez saisir votre email.');
      return;
    }

    setError('');

    // Si offline, vérifier si l'utilisateur est en cache
    if (isOffline) {
      const cachedEmail = localStorage.getItem('cached_email');
      if (cachedEmail === email) {
        // Connexion offline avec données en cache
        const cachedUserId = localStorage.getItem('cached_userId') || '1';
        onLogin(email, parseInt(cachedUserId));
        navigate('/dashboard');
      } else {
        setError('Mode hors ligne : Impossible de se connecter. Veuillez vous connecter en ligne au moins une fois.');
      }
      return;
    }

    // Mode online : authentification normale
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        // Sauvegarder en cache pour le mode offline
        localStorage.setItem('cached_email', email);
        localStorage.setItem('cached_userId', data.user?.id || '1');
        
        onLogin(email, data.user?.id || 1);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Identifiants incorrects');
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError('Impossible de contacter le serveur. Vérifiez le backend.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Indicateur de statut connexion */}
      {isOffline && (
        <div className="mb-4 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg max-w-md w-full mx-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-medium text-sm">Mode hors ligne</p>
            <p className="text-xs">Connectez-vous à Internet pour vous authentifier</p>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">DYNAMIX SERVICES</h1>
          <h2 className="text-xl font-semibold text-gray-600">Gestion des Congés</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="votre.email@entreprise.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              autoFocus
              disabled={isOffline}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              disabled={isOffline}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isOffline}
            className={`w-full px-4 py-3 rounded-lg transition-colors font-semibold shadow-md ${
              isOffline 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
            }`}
          >
            {isOffline ? 'Connexion Internet requise' : 'Se connecter'}
          </button>
        </form>

        {/* Info mode offline */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">Mode PWA</p>
              <p className="text-xs text-blue-700 mt-1">
                Connectez-vous en ligne une première fois pour pouvoir utiliser l'application hors connexion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;