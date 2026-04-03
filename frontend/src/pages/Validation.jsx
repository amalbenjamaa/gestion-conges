import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { API_BASE_URL } from '../apiBase.js';

function Validation({ userEmail, userRole, onLogout }) {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [refusMotif, setRefusMotif] = useState('');
  const [showRefusModal, setShowRefusModal] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadDemandes = () => {
    console.log('🔄 Chargement des demandes en attente...');
    setLoading(true);
    
    fetch(`${API_BASE_URL}/api/requests`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        console.log('📋 Demandes reçues:', data);
        const demandesList = data.requests || [];
        console.log('✅ Nombre de demandes:', demandesList.length);
        setDemandes(demandesList);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Erreur:', err);
        setDemandes([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDemandes();
  }, []);

  const handleValidation = (demandeId, statut) => {
    if (statut === 'refusee' && !refusMotif.trim()) {
      setFeedback({ type: 'error', message: 'Veuillez indiquer un motif de refus' });
      return;
    }

    setProcessing(demandeId);
    console.log(`🔄 ${statut === 'validee' ? 'Validation' : 'Refus'} de la demande #${demandeId}`);

    fetch(`${API_BASE_URL}/api/requests/${demandeId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        status: statut,
        handle_comment: statut === 'refusee' ? refusMotif : null
      })
    })
      .then(res => res.json())
      .then(data => {
        console.log('✅ Réponse:', data);
        
        if (data.success) {
          setShowRefusModal(null);
          setRefusMotif('');
          loadDemandes();
          window.dispatchEvent(new CustomEvent('demandeStatusChanged'));
          setFeedback({ type: 'success', message: statut === 'validee' ? 'Demande validée' : 'Demande refusée' });
        } else {
          setFeedback({ type: 'error', message: data.error || 'Erreur inconnue' });
        }
      })
      .catch(err => {
        console.error('❌ Erreur:', err);
        setFeedback({ type: 'error', message: 'Erreur lors du traitement' });
      })
      .finally(() => {
        setProcessing(null);
      });
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

  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Validation des demandes</h1>
          <p className="text-gray-600">
            {demandes.length} demande{demandes.length > 1 ? 's' : ''} en attente
          </p>
        </div>
        {feedback && (
          <div className={`rounded-2xl shadow-lg p-4 flex items-start gap-3 ${feedback.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {feedback.type === 'success' ? '✅' : '❌'}
            </div>
            <div className="flex-1">
              <p className={`font-semibold ${feedback.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{feedback.message}</p>
              <p className="text-xs text-gray-500 mt-1">Action effectuée</p>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✖
            </button>
          </div>
        )}

        {demandes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xl font-medium text-gray-900">Aucune demande en attente</p>
            <p className="text-gray-500 mt-2">Toutes les demandes ont été traitées</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {demandes.map((demande) => (
              <div key={demande.id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-lg">
                          {demande.prenom?.[0]}{demande.nom?.[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">
                          {demande.nom_complet || `${demande.prenom} ${demande.nom}`}
                        </h3>
                        <p className="text-sm text-gray-500">{demande.email}</p>
                      </div>
                    </div>
                    <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                      En attente
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Type</p>
                      <p className="font-semibold text-gray-900">{demande.type_conge}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Date début</p>
                      <p className="font-semibold text-gray-900">{demande.date_debut_formatted}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Date fin</p>
                      <p className="font-semibold text-gray-900">{demande.date_fin_formatted}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Durée</p>
                      <p className="font-semibold text-gray-900">{demande.nb_jours} jour{demande.nb_jours > 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {demande.motif && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Motif</p>
                      <p className="text-sm text-gray-700">{demande.motif}</p>
                    </div>
                  )}

                  {/* ✅ BOUTONS PETITS */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleValidation(demande.id, 'validee')}
                      disabled={processing === demande.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {processing === demande.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span className="text-xs">Validation...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Valider
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowRefusModal(demande.id)}
                      disabled={processing === demande.id}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Refuser
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de refus */}
        {showRefusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Motif de refus</h3>
              <textarea
                value={refusMotif}
                onChange={(e) => setRefusMotif(e.target.value)}
                placeholder="Indiquez le motif du refus..."
                className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows="4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRefusModal(null);
                    setRefusMotif('');
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleValidation(showRefusModal, 'refusee')}
                  disabled={!refusMotif.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  Confirmer le refus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Validation;
