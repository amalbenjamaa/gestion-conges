import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { API_BASE_URL } from '../apiBase.js';

function MesDemandes({ userEmail, userRole, onLogout }) {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, en_attente, validee, refusee

  useEffect(() => {
    loadDemandes();
  }, []);

  const loadDemandes = () => {
    setLoading(true);
    console.log('🔄 Chargement de mes demandes...');

    fetch(`${API_BASE_URL}/api/my-requests`, {
      credentials: 'include'
    })
      .then(res => {
        console.log('📡 Status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('✅ Données reçues:', data);
        console.log('📋 Nombre de demandes:', data.requests?.length || 0);
        setDemandes(data.requests || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Erreur:', err);
        setDemandes([]);
        setLoading(false);
      });
  };

  const getStatusBadge = (statut) => {
    const badges = {
      'en_attente': (
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold inline-flex items-center gap-1">
          ⏳ En attente
        </span>
      ),
      'validee': (
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold inline-flex items-center gap-1">
          ✅ Validée
        </span>
      ),
      'refusee': (
        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold inline-flex items-center gap-1">
          ❌ Refusée
        </span>
      )
    };
    return badges[statut] || badges['en_attente'];
  };

  const getStatusColor = (statut) => {
    const colors = {
      'en_attente': 'border-l-yellow-500',
      'validee': 'border-l-green-500',
      'refusee': 'border-l-red-500'
    };
    return colors[statut] || 'border-l-gray-500';
  };

  const filteredDemandes = demandes.filter(d => {
    if (filter === 'all') return true;
    return d.statut === filter;
  });

  const stats = {
    all: demandes.length,
    en_attente: demandes.filter(d => d.statut === 'en_attente').length,
    validee: demandes.filter(d => d.statut === 'validee').length,
    refusee: demandes.filter(d => d.statut === 'refusee').length
  };

  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Mes Demandes de Congés</h2>
        <p className="text-gray-600 text-sm">Consultez l'historique de toutes vos demandes</p>
      </div>

      {/* Filtres */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Toutes ({stats.all})
        </button>
        <button
          onClick={() => setFilter('en_attente')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'en_attente'
              ? 'bg-yellow-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          ⏳ En attente ({stats.en_attente})
        </button>
        <button
          onClick={() => setFilter('validee')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'validee'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          ✅ Validées ({stats.validee})
        </button>
        <button
          onClick={() => setFilter('refusee')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'refusee'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          ❌ Refusées ({stats.refusee})
        </button>
      </div>

      {/* Liste des demandes */}
      <div className="bg-white/70 backdrop-blur-md p-6 rounded-lg shadow-md border border-white/20">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Chargement de vos demandes...
          </div>
        ) : filteredDemandes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              {filter === 'all' 
                ? 'Aucune demande pour le moment'
                : `Aucune demande ${filter === 'en_attente' ? 'en attente' : filter}`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDemandes.map((demande) => (
              <div
                key={demande.id}
                className={`border-l-4 ${getStatusColor(demande.statut)} bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {demande.type_conge}
                      </h3>
                      {getStatusBadge(demande.statut)}
                    </div>
                    <p className="text-xs text-gray-400">
                      Demandé le {demande.date_demande_formatted}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">📅 Date de début</p>
                    <p className="font-semibold text-gray-900">{demande.date_debut_formatted}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">📅 Date de fin</p>
                    <p className="font-semibold text-gray-900">{demande.date_fin_formatted}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">⏱️ Durée</p>
                    <p className="font-semibold text-gray-900">
                      {demande.nb_jours} jour{demande.nb_jours > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {demande.motif && (
                  <div className="mt-4 bg-blue-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">💬 Motif</p>
                    <p className="text-gray-700 text-sm">{demande.motif}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Résumé */}
      {!loading && demandes.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/70 backdrop-blur-md p-4 rounded-lg border border-gray-200 text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.all}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
            <p className="text-2xl font-bold text-yellow-800">{stats.en_attente}</p>
            <p className="text-xs text-yellow-600">En attente</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
            <p className="text-2xl font-bold text-green-800">{stats.validee}</p>
            <p className="text-xs text-green-600">Validées</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
            <p className="text-2xl font-bold text-red-800">{stats.refusee}</p>
            <p className="text-xs text-red-600">Refusées</p>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default MesDemandes;