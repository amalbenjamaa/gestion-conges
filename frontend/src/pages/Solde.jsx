import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

function Solde({ userEmail, userRole, onLogout }) {
  const [soldeData, setSoldeData] = useState({
    solde_total: 0,
    solde_consomme: 0,
    solde_restant: 0,
    historique: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer les données de solde depuis l'API
    setLoading(true);
    
    // Simuler un appel API
    setTimeout(() => {
      const mockData = {
        solde_total: 30,
        solde_consomme: 8,
        solde_restant: 22,
        historique: [
          { id: 1, type: 'Congé Payé', jours: 5, date_debut: '2026-02-10', date_fin: '2026-02-14', statut: 'validee' },
          { id: 2, type: 'RTT', jours: 3, date_debut: '2026-01-20', date_fin: '2026-01-22', statut: 'validee' },
        ]
      };
      setSoldeData(mockData);
      setLoading(false);
    }, 500);

    // Vraie requête API (à décommenter)
    // fetch('/api/user/solde', { credentials: 'include' })
    //   .then(res => res.json())
    //   .then(data => {
    //     setSoldeData(data);
    //     setLoading(false);
    //   })
    //   .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </Layout>
    );
  }

  const pourcentageUtilise = Math.round((soldeData.solde_consomme / soldeData.solde_total) * 100);

  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Mon Solde de Congés</h2>
          <p className="text-gray-600 text-sm">Consultez votre solde et l'historique de vos congés</p>
        </div>

        {/* Cartes de solde */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-blue-700 font-medium">Solde Total</p>
                <p className="text-3xl font-bold text-blue-900">{soldeData.solde_total} jours</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-orange-700 font-medium">Solde Consommé</p>
                <p className="text-3xl font-bold text-orange-900">{soldeData.solde_consomme} jours</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-green-700 font-medium">Solde Restant</p>
                <p className="text-3xl font-bold text-green-900">{soldeData.solde_restant} jours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Utilisation du solde</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Consommé</span>
                <span className="text-sm font-semibold text-gray-800">{pourcentageUtilise}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className={`h-4 rounded-full transition-all duration-500 ${
                    pourcentageUtilise > 80 ? 'bg-red-500' : pourcentageUtilise > 50 ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${pourcentageUtilise}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{soldeData.solde_consomme} jours utilisés</span>
                <span>{soldeData.solde_restant} jours restants</span>
              </div>
            </div>
          </div>
        </div>

        {/* Historique des congés */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Historique des congés</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Début</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {soldeData.historique.length > 0 ? (
                  soldeData.historique.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.jours} jours</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.date_debut}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.date_fin}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.statut === 'validee' ? 'bg-green-100 text-green-800' :
                          item.statut === 'en_attente' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.statut === 'validee' ? 'Validé' : item.statut === 'en_attente' ? 'En attente' : 'Refusé'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                      Aucun historique de congés
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Solde;