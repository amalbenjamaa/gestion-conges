import { useEffect, useState } from 'react';

function Dashboard({ userEmail, onNewRequest, refresh }) {
  const [demandes, setDemandes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:8000/api/requests')
      .then(res => res.json())
      .then(data => {
        setDemandes(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Erreur lors du chargement des demandes');
        setLoading(false);
      });
  }, [refresh]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Tableau de bord</h2>
        <button onClick={onNewRequest} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Nouvelle Demande</button>
      </div>
      <div className="mb-3">Connecté comme : <b>{userEmail}</b></div>
      {loading && <div>Chargement...</div>}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {!loading && demandes && (
        Array.isArray(demandes) && demandes.length === 0 ? (
          <div>Aucune demande enregistrée.</div>
        ) : (
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-2">ID</th>
                <th className="border px-3 py-2">Date début</th>
                <th className="border px-3 py-2">Date fin</th>
                <th className="border px-3 py-2">Statut</th>
                <th className="border px-3 py-2">Nb jours</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(demandes) ? demandes.map(demande => (
                <tr key={demande.id}>
                  <td className="border px-3 py-1 text-center">{demande.id}</td>
                  <td className="border px-3 py-1">{demande.date_debut}</td>
                  <td className="border px-3 py-1">{demande.date_fin}</td>
                  <td className="border px-3 py-1">{demande.statut}</td>
                  <td className="border px-3 py-1 text-center">{demande.nb_jours}</td>
                </tr>
              )) : null}
            </tbody>
          </table>
        )
      )}
    </div>
  );
}

export default Dashboard;
