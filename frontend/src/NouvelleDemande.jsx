import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

function NouvelleDemande({ userEmail, userRole, onLogout, userId }) {
  const navigate = useNavigate();
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [typeConge, setTypeConge] = useState('1');
  const [motif, setMotif] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const typeOptions = [
    { id: 1, nom: 'Congé Payé' },
    { id: 2, nom: 'Maladie' },
    { id: 3, nom: 'Sans Solde' },
    { id: 4, nom: 'RTT' },
    { id: 5, nom: 'Événement Familial' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dateDebut || !dateFin || !typeConge) {
      setError('Veuillez remplir les champs requis');
      return;
    }

    try {
      setIsLoading(true);
      if (!userId) {
        setError('Utilisateur non authentifié');
        setIsLoading(false);
        return;
      }
      const res = await fetch('http://localhost:8000/api/requests', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type_id: Number(typeConge),
          date_debut: dateDebut,
          date_fin: dateFin,
          motif: motif || null
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      setSuccess(true);
      setTimeout(() => navigate('/mes-demandes'), 800);
    } catch (err) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">Nouvelle demande de congé</h2>
        {error && <div className="text-red-600 mb-3">{error}</div>}
        {success && <div className="text-green-600 mb-3">Demande créée</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date début</label>
            <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="mt-1 block w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date fin</label>
            <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="mt-1 block w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type de congé</label>
            <select value={typeConge} onChange={(e) => setTypeConge(e.target.value)} className="mt-1 block w-full">
              {typeOptions.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Motif</label>
            <textarea value={motif} onChange={(e) => setMotif(e.target.value)} className="mt-1 block w-full" />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={isLoading}>
              {isLoading ? 'En cours...' : 'Envoyer la demande'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default NouvelleDemande;


