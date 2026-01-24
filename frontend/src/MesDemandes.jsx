import { useState, useEffect } from 'react';

function badgeColor(status) {
  if (status === 'validee') return 'bg-green-600 text-white';
  if (status === 'refusee') return 'bg-red-600 text-white';
  if (status === 'en_attente') return 'bg-yellow-400 text-black';
  if (status === 'annulee') return 'bg-gray-400 text-white';
  return 'bg-gray-200 text-black';
}

function MesDemandes({ userId }) {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
  setLoading(true);
  fetch('http://localhost:8000/api/requests', { credentials: 'include' })
    .then((res) => res.json())
    .then((data) => {
      setDemandes(Array.isArray(data) ? data.filter(d => String(d.utilisateur_id) === String(userId || null)) : []);
      setLoading(false);
    })
      .catch(() => {
        setError('Erreur lors du chargement des demandes');
        setLoading(false);
      });
  }, [userId]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Mes Demandes</h2>
      {loading && <div>Chargement…</div>}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {!loading && demandes.length === 0 && <div>Aucune demande trouvée.</div>}
      {!loading && demandes.length > 0 && (
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-3 py-2">Date début</th>
              <th className="border px-3 py-2">Date fin</th>
              <th className="border px-3 py-2">Statut</th>
              <th className="border px-3 py-2">Nb jours</th>
              <th className="border px-3 py-2">Motif</th>
            </tr>
          </thead>
          <tbody>
            {demandes.map((d) => (
              <tr key={d.id}>
                <td className="border px-3 py-1">{d.date_debut}</td>
                <td className="border px-3 py-1">{d.date_fin}</td>
                <td className="border px-3 py-1">
                  <span className={`px-3 py-1 rounded text-xs font-bold ${badgeColor(d.statut)}`}>
                    {d.statut}
                  </span>
                </td>
                <td className="border px-3 py-1">{d.nb_jours}</td>
                <td className="border px-3 py-1">{d.motif}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MesDemandes;