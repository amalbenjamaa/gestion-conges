import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';

function Validation({ userEmail, userRole, onLogout }) {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [commentaire, setCommentaire] = useState('');
  const [toast, setToast] = useState(null);
  const [searchParams] = useSearchParams();

  const loadDemandes = () => {
    console.log('🔄 Chargement des demandes en attente...');
    setLoading(true);
    
    fetch('http://localhost:8000/api/requests?status=en_attente', {
      credentials: 'include'
    })
      .then(res => {
        console.log('📡 Réponse API reçue, status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('📦 Données reçues:', data);
        console.log('📊 Nombre de demandes:', Array.isArray(data) ? data.length : 0);
        
        const list = Array.isArray(data) ? data : [];
        setDemandes(list);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Erreur chargement:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDemandes();
  }, [searchParams]);

  useEffect(() => {
    const handleUpdate = () => {
      console.log('🔔 Événement demandeUpdated reçu');
      loadDemandes();
    };

    window.addEventListener('demandeUpdated', handleUpdate);
    return () => window.removeEventListener('demandeUpdated', handleUpdate);
  }, []);

  const handleAction = async (id, status) => {
    console.log(`🎯 Action: ${status} sur demande ${id}`);
    
    try {
      const res = await fetch(`http://localhost:8000/api/requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: status,
          handle_comment: commentaire || null
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Erreur');
      }

      console.log(`✅ Demande ${id} traitée avec succès`);
      
      // Retirer de la liste
      setDemandes(prev => {
        const newList = prev.filter(d => d.id !== id);
        console.log(`📋 Demandes restantes: ${newList.length}`);
        return newList;
      });
      
      setSelectedId(null);
      setCommentaire('');

      window.dispatchEvent(new CustomEvent('demandeUpdated', { detail: { id, status } }));

      setToast({
        type: status === 'validee' ? 'success' : 'error',
        message: status === 'validee' ? '✓ Demande validée' : '✗ Demande refusée'
      });
      
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('❌ Erreur action:', error);
      setToast({
        type: 'error',
        message: 'Erreur: ' + error.message
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  console.log('🎨 Rendu Validation - Demandes:', demandes.length, 'Loading:', loading);

  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-6 py-4 rounded-lg shadow-xl ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">{toast.message}</span>
            <button className="text-white/80 hover:text-white" onClick={() => setToast(null)}>✕</button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Validation des Demandes</h2>
        <p className="text-gray-600 text-sm">
          Traitez uniquement les demandes en attente
          {demandes.length > 0 && (
            <span className="ml-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold">
              {demandes.length} en attente
            </span>
          )}
        </p>
      </div>

      <div className="bg-white/70 backdrop-blur-md p-4 sm:p-6 rounded-lg shadow-md border border-white/20">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement des demandes...</p>
          </div>
        ) : demandes.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-24 h-24 mx-auto text-green-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xl font-bold text-gray-700 mb-2">Aucune demande en attente</p>
            <p className="text-sm text-gray-500">Toutes les demandes ont été traitées ✓</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Employé</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Début</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Fin</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Jours</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden lg:table-cell">Motif</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/40 divide-y divide-gray-200">
                {demandes.map((d) => (
                  <tr key={d.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {(d.requester_name || `User ${d.utilisateur_id}`).charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {d.requester_name || `User ${d.utilisateur_id}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        {d.type_name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.date_debut}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.date_fin}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{d.nb_jours} j</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 hidden lg:table-cell">{d.motif || '-'}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {selectedId === d.id ? (
                        <div className="space-y-2 min-w-[280px]">
                          <textarea
                            placeholder="Commentaire (optionnel)"
                            value={commentaire}
                            onChange={e => setCommentaire(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            rows="2"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAction(d.id, 'validee')}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 font-semibold"
                            >
                              ✓ Valider
                            </button>
                            <button
                              onClick={() => handleAction(d.id, 'refusee')}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 font-semibold"
                            >
                              ✗ Refuser
                            </button>
                            <button
                              onClick={() => {
                                setSelectedId(null);
                                setCommentaire('');
                              }}
                              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedId(d.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 font-semibold"
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