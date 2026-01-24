import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

function badgeColor(status) {
  if (status === 'validee') return 'bg-green-600 text-white';
  if (status === 'refusee') return 'bg-red-600 text-white';
  if (status === 'en_attente') return 'bg-yellow-400 text-black';
  if (status === 'annulee') return 'bg-gray-400 text-white';
  return 'bg-gray-200 text-black';
}

function MesDemandes({ userEmail, userRole, userId, onLogout }) {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`http://localhost:8000/api/requests?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setDemandes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Erreur lors du chargement des demandes');
        setLoading(false);
      });
  }, [userId]);

  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Mes Demandes</h2>
        <p className="text-gray-600 text-sm">Historique de toutes vos demandes de congé</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        {loading && (
          <div className="text-center py-8 text-gray-500">Chargement…</div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {!loading && demandes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Aucune demande trouvée.</p>
          </div>
        )}
        {!loading && demandes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date début</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date fin</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nb jours</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Motif</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {demandes.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.date_debut}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.date_fin}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{d.type_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColor(d.statut)}`}>
                        {d.statut === 'validee' ? 'Validé' : d.statut === 'refusee' ? 'Refusé' : d.statut === 'en_attente' ? 'En attente' : d.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{d.nb_jours} j</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{d.motif || '-'}</td>
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

export default MesDemandes;


