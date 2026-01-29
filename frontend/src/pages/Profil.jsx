import { useEffect, useState } from 'react';
import Layout from '../components/Layout';

function Profil({ userEmail, userRole, onLogout }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/api/me', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setMe(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Impossible de charger votre profil');
        setLoading(false);
      });
  }, []);

  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {userRole === 'manager' ? 'Profil' : 'Profil & Solde'}
          </h1>
          <p className="text-gray-600 text-sm">
            {userRole === 'manager' 
              ? 'Consultez vos informations personnelles'
              : 'Consultez vos informations et votre solde de congés'}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Chargement…</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        ) : (
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-lg shadow-md border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                {me?.avatar_url ? (
                  <img src={me.avatar_url} alt="avatar" className="w-16 h-16 object-cover" />
                ) : (
                  (me?.nom_complet || me?.email || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{me?.nom_complet || 'Utilisateur'}</div>
                <div className="text-gray-600">{me?.email}</div>
                {me?.position && (
                  <div className="text-sm text-gray-500 mt-1">📋 {me.position}</div>
                )}
              </div>
          </div>

          {userRole === 'manager' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Téléphone</div>
                <div className="text-lg font-semibold text-gray-900">{me?.telephone || 'Non renseigné'}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Bureau</div>
                <div className="text-lg font-semibold text-gray-900">{me?.bureau || 'Non renseigné'}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Email</div>
                <div className="text-lg font-semibold text-gray-900">{me?.email}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Poste</div>
                <div className="text-lg font-semibold text-gray-900">{me?.position || 'Non renseigné'}</div>
              </div>
            </div>
          )}

          {userRole !== 'manager' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Quota annuel</div>
                <div className="text-2xl font-bold text-gray-900">{me?.solde_total ?? 0} j</div>
              </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Consommé</div>
                  <div className="text-2xl font-bold text-gray-900">{me?.solde_consomme ?? 0} j</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-sm text-green-700">Restant</div>
                  <div className="text-2xl font-bold text-green-700">{me?.solde_restant ?? 0} j</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Profil;
