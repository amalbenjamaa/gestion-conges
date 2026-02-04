import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';

function DetailEmploye({ userEmail, userRole, onLogout }) {
    console.log('🔑 DetailEmploye - Props:', { userEmail, userRole });
  const { id } = useParams();
  const [employe, setEmploye] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('🔄 Chargement profil employé #' + id);
    
    fetch(`http://localhost:8000/api/employes/${id}`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Employé non trouvé');
        return res.json();
      })
      .then(data => {
        console.log('👤 Employé:', data);
        setEmploye(data.employe);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Erreur:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const getStatusBadge = (statut) => {
    const badges = {
      'en_attente': <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">⏳ En attente</span>,
      'validee': <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">✅ Validée</span>,
      'refusee': <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">❌ Refusée</span>
    };
    return badges[statut] || statut;
  };

  if (loading) {
    return (
      <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Chargement...</span>
        </div>
      </Layout>
    );
  }

  if (error || !employe) {
    return (
      <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Employé non trouvé'}
        </div>
        <Link to="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Retour au Dashboard
        </Link>
      </Layout>
    );
  }

  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Bouton retour */}
        <Link to="/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour au Dashboard
        </Link>

        {/* En-tête profil */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl font-bold">
              {employe.nom_complet.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{employe.nom_complet}</h1>
              <p className="text-blue-100 text-lg">{employe.position || 'Employé'}</p>
              <p className="text-blue-100 text-sm">{employe.email}</p>
              {employe.est_en_conge && (
                <div className="mt-3 inline-block px-4 py-2 bg-orange-500 rounded-full font-semibold">
                  🏖️ En congé actuellement
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm mb-1">Solde total</p>
            <p className="text-3xl font-bold text-gray-900">{employe.solde_total} j</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <p className="text-gray-600 text-sm mb-1">Consommé</p>
            <p className="text-3xl font-bold text-gray-900">{employe.solde_consomme} j</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm mb-1">Restant</p>
            <p className="text-3xl font-bold text-gray-900">{employe.solde_restant} j</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm mb-1">Total demandes</p>
            <p className="text-3xl font-bold text-gray-900">{employe.stats.total_demandes}</p>
          </div>
        </div>

        {/* Répartition des demandes */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Statistiques des demandes</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{employe.stats.validees}</p>
              <p className="text-sm text-gray-600">Validées</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">{employe.stats.en_attente}</p>
              <p className="text-sm text-gray-600">En attente</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">{employe.stats.refusees}</p>
              <p className="text-sm text-gray-600">Refusées</p>
            </div>
          </div>
        </div>

        {/* Historique des demandes */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📅 Historique des congés</h2>
          {employe.demandes && employe.demandes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune demande</p>
          ) : (
            <div className="space-y-3">
              {employe.demandes && employe.demandes.map((demande) => (
                <div key={demande.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ 
                          backgroundColor: demande.type_couleur + '20',
                          color: demande.type_couleur
                        }}>
                          {demande.type_conge}
                        </span>
                        {getStatusBadge(demande.statut)}
                      </div>
                      <p className="text-gray-900 font-medium">
                        {demande.date_debut_formatted} → {demande.date_fin_formatted}
                        <span className="text-gray-500 ml-2">({demande.nb_jours} jour{demande.nb_jours > 1 ? 's' : ''})</span>
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Demandé le {demande.date_demande_formatted}</p>
                      {demande.motif && (
                        <p className="text-sm text-gray-600 mt-2 italic">💬 {demande.motif}</p>
                      )}
                      {demande.handle_comment && (
                        <p className="text-sm text-blue-600 mt-2">✍️ Commentaire: {demande.handle_comment}</p>
                      )}
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

export default DetailEmploye;