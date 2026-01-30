import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

function Validation({ userEmail, userRole, onLogout }) {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('en_attente');

  useEffect(() => {
    loadDemandes();
  }, [filter]);

  const loadDemandes = () => {
    setLoading(true);
    fetch(`/api/demandes?statut=${filter}`)
      .then(res => res.json())
      .then(data => {
        setDemandes(data.demandes || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleValidation = async (demandeId, newStatus, commentaire = '') => {
    try {
      const response = await fetch(`/api/demandes/${demandeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          statut: newStatus,
          commentaire_manager: commentaire
        })
      });

      if (response.ok) {
        loadDemandes();
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Validation des Demandes</h2>
        <p className="text-gray-600 text-sm">Approuvez ou refusez les demandes de congés</p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('en_attente')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'en_attente'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            En attente
          </button>
          <button
            onClick={() => setFilter('validee')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'validee'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Validées
          </button>
          <button
            onClick={() => setFilter('refusee')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'refusee'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Refusées
          </button>
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === ''
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toutes
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Chargement...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md">
          {demandes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employé</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Période</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {demandes.map((demande) => (
                    <tr key={demande.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {demande.nom_complet}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {demande.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {demande.date_debut} → {demande.date_fin}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {demande.nb_jours_ouvrables} jours
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          demande.statut === 'en_attente' ? 'bg-orange-100 text-orange-800' :
                          demande.statut === 'validee' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {demande.statut === 'en_attente' ? 'En attente' :
                           demande.statut === 'validee' ? 'Validée' : 'Refusée'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {demande.statut === 'en_attente' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleValidation(demande.id, 'validee')}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs font-medium"
                            >
                              Valider
                            </button>
                            <button
                              onClick={() => handleValidation(demande.id, 'refusee')}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs font-medium"
                            >
                              Refuser
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Aucune demande {filter && `(${filter})`}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

export default Validation;