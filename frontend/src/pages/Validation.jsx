import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

function Validation({ userEmail, userRole, onLogout }) {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [commentaire, setCommentaire] = useState('');
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/api/requests?status=en_attente')
      .then(res => res.json())
      .then(data => {
        setDemandes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAction = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:8000/api/requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // important pour envoyer le cookie de session
        body: JSON.stringify({
          status: status,
          handle_comment: commentaire || null
        })
      });
      if (!res.ok) {
        let apiErr = 'Erreur';
        try {
          const data = await res.json();
          if (data?.error) apiErr = data.error;
        } catch {
          // on garde le message générique
        }
        throw new Error(apiErr);
      }
      
      // Retirer la demande de la liste
      setDemandes(demandes.filter(d => d.id !== id));
      setSelectedId(null);
      setCommentaire('');
      
      // Notifier les autres composants via un événement personnalisé
      window.dispatchEvent(new CustomEvent('demandeUpdated', { detail: { id, status } }));
      
      alert(status === 'validee' ? 'Demande validée ! Elle apparaîtra dans le calendrier.' : 'Demande refusée.');
    } catch (error) {
      alert('Erreur lors du traitement: ' + (error?.message || 'Failed to fetch'));
    }
  };

  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Validation des Demandes</h2>
        <p className="text-gray-600 text-sm">Traitez les demandes de congé en attente de validation</p>
      </div>
      <div className="glass-panel p-6 rounded-lg shadow-md">
        {loading && (
          <div className="text-center py-8 text-gray-500">Chargement...</div>
        )}
        {!loading && demandes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Aucune demande en attente.</p>
          </div>
        )}
        {!loading && demandes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200/70">
              <thead className="bg-white/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Employé</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date début</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date fin</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nb jours</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Motif</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/70 divide-y divide-gray-200/70">
                {demandes.map((d) => (
                <tr key={d.id} className="hover:bg-white/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {(d.requester_name || `User ${d.utilisateur_id}`).charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{d.requester_name || `User ${d.utilisateur_id}`}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{d.type_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.date_debut}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.date_fin}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">{d.nb_jours} j</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{d.motif || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {selectedId === d.id ? (
                        <div className="space-y-2 min-w-[300px]">
                          <textarea
                            placeholder="Commentaire (optionnel, recommandé pour un refus)"
                            value={commentaire}
                            onChange={e => setCommentaire(e.target.value)}
                            className="w-full border border-white/70 bg-white/80 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                            rows="2"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAction(d.id, 'validee')}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors font-semibold shadow-sm"
                            >
                              ✓ Valider
                            </button>
                            <button
                              onClick={() => handleAction(d.id, 'refusee')}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors font-semibold shadow-sm"
                            >
                              ✗ Refuser
                            </button>
                            <button
                              onClick={() => {
                                setSelectedId(null);
                                setCommentaire('');
                              }}
                              className="bg-white/70 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-white/90 transition-colors shadow-sm"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedId(d.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors font-semibold shadow-sm"
                        >
                          Traiter
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Validation;

