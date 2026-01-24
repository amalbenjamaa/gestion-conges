import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SuiviCollaborateurs() {
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Tous');
  const navigate = useNavigate();

  const loadCollaborateurs = () => {
    setLoading(true);
    setError(null);
    fetch('http://localhost:8000/api/collaborateurs')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setCollaborateurs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch collaborateurs:', err);
        setError(err.message || 'Failed to fetch');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadCollaborateurs();
    
    // Écouter les mises à jour de demandes
    const handleUpdate = () => loadCollaborateurs();
    const handleUserCreated = () => loadCollaborateurs();
    window.addEventListener('demandeUpdated', handleUpdate);
    window.addEventListener('userCreated', handleUserCreated);
    
    return () => {
      window.removeEventListener('demandeUpdated', handleUpdate);
      window.removeEventListener('userCreated', handleUserCreated);
    };
  }, []);

  // Filtrer les collaborateurs selon la recherche et le statut
  const filteredCollaborateurs = collaborateurs.filter(collab => {
    const roleLabel = (collab.role_nom || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      collab.nom.toLowerCase().includes(search) ||
      roleLabel.includes(search);
    const matchesStatus = filterStatus === 'Tous' || collab.statut === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (statut) => {
    const styles = {
      'Présent': 'bg-green-100 text-green-800',
      'En congé': 'bg-orange-100 text-orange-800',
      'Maladie': 'bg-red-100 text-red-800'
    };
    return styles[statut] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Suivi des collaborateurs
        </h3>
        <div className="flex gap-2">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64" 
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="Tous">Tous les statuts</option>
            <option value="Présent">Présent</option>
            <option value="En congé">En congé</option>
            <option value="Maladie">Maladie</option>
          </select>
          <button
            type="button"
            onClick={() => {
              // Export CSV (compatible Excel) des collaborateurs filtrés
              const headers = ['Nom', 'Email', 'Rôle', 'Statut', 'Quota annuel', 'Consommé', 'Solde'];
              const rows = filteredCollaborateurs.map((collab) => [
                collab.nom,
                collab.email,
                collab.role_nom || 'Employé',
                collab.statut,
                `${collab.quota_annuel} j`,
                `${collab.consomme} j`,
                `${collab.solde} j`,
              ]);

              const allRows = [headers, ...rows];
              const csv = allRows
                .map((row) =>
                  row
                    .map((value) => `"${String(value).replace(/"/g, '""')}"`)
                    .join(';')
                )
                .join('\n');

              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'dashboard_collaborateurs.csv';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
        </div>
      </div>
      {error ? (
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg inline-block">
            <p className="font-semibold">⚠️ Erreur de chargement</p>
            <p className="text-sm mt-1">{error}</p>
            <button 
              onClick={loadCollaborateurs}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Réessayer
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className="text-center py-8 text-gray-500">Chargement...</div>
      ) : filteredCollaborateurs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Aucun collaborateur trouvé.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">EMPLOYÉ</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">STATUT</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">QUOTA ANNUEL</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">CONSOMMÉ</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">SOLDE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCollaborateurs.map(collab => (
                <tr key={collab.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                        {collab.nom.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{collab.nom}</p>
                        <p className="text-sm text-gray-500">{collab.position || collab.role_nom || 'Employé'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(collab.statut)}`}>
                      {collab.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{collab.quota_annuel} j</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{collab.consomme} j</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                      {collab.solde} j
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/employes/${collab.id}`)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors font-semibold shadow-sm"
                    >
                      Historique
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SuiviCollaborateurs;


