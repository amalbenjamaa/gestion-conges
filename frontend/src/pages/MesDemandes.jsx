import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

function MesDemandes({ userEmail, userRole, onLogout }) {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDemandes = () => {
    console.log('🔄 Chargement de mes demandes...');
    setLoading(true);
    
    fetch('http://localhost:8000/api/requests', { 
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    })
      .then(res => {
        console.log('📡 Status:', res.status);
        if (!res.ok) {
          throw new Error(`Erreur HTTP: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('✅ Données reçues:', data);
        console.log('📋 Nombre de demandes:', data.requests?.length || 0);
        
        if (data.requests && Array.isArray(data.requests)) {
          setDemandes(data.requests);
          setError('');
        } else {
          console.error('❌ Format de données incorrect:', data);
          setDemandes([]);
          setError('Format de données incorrect');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Erreur chargement:', err);
        setError(err.message);
        setDemandes([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDemandes();
    
    // Recharger toutes les 30 secondes
    const interval = setInterval(loadDemandes, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (statut) => {
    const badges = {
      'en_attente': (
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          En attente
        </span>
      ),
      'validee': (
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Validée
        </span>
      ),
      'refusee': (
        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Refusée
        </span>
      )
    };
    return badges[statut] || badges['en_attente'];
  };

  if (loading) {
    return (
      <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Chargement de vos demandes...</span>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes demandes</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <p className="font-semibold">❌ Erreur de chargement</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={loadDemandes}
              className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Réessayer
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes demandes</h1>
            <p className="text-gray-600">
              {demandes.length > 0 
                ? `${demandes.length} demande${demandes.length > 1 ? 's' : ''} au total`
                : 'Aucune demande pour le moment'}
            </p>
          </div>
          <Link
            to="/nouvelle-demande"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle demande
          </Link>
        </div>

        {/* Liste des demandes */}
        {demandes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-xl font-medium text-gray-900 mb-2">Aucune demande</p>
            <p className="text-gray-500 mb-6">Vous n'avez pas encore créé de demande de congé</p>
            <Link
              to="/nouvelle-demande"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Créer une demande
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type de congé
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date début
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date fin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durée
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Détails
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {demandes.map((demande) => (
                    <tr key={demande.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: demande.type_couleur || '#3b82f6' }}
                          ></div>
                          <span className="font-medium text-gray-900">{demande.type_conge}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {demande.date_debut_formatted}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {demande.date_fin_formatted}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className="font-semibold">{demande.nb_jours}</span> jour{demande.nb_jours > 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(demande.statut)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {demande.motif && (
                          <div className="mb-1">
                            <span className="text-gray-500">Motif: </span>
                            {demande.motif}
                          </div>
                        )}
                        {demande.handle_comment && (
                          <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                            <span className="font-semibold">Refus: </span>
                            {demande.handle_comment}
                          </div>
                        )}
                        {!demande.motif && !demande.handle_comment && (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default MesDemandes;