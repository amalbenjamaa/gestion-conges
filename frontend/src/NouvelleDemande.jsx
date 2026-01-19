import { useState } from 'react';

function NouvelleDemande({ onCancel, onSuccess, userEmail }) {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [typeConge, setTypeConge] = useState('1'); // test: default ID 1
  const [motif, setMotif] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Pour simplifier, type_conge = 1 = Congé Payé. Pour aller plus loin, fetch dispo depuis l'API.
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
      setError('Tous les champs sont obligatoires');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const nb_jours = (new Date(dateFin) - new Date(dateDebut)) / (1000*60*60*24) + 1;
      const body = {
        utilisateur_id: 1, // à remplacer si authentif réelle, hardcodé ici pour test
        type_id: Number(typeConge),
        date_debut: dateDebut,
        date_fin: dateFin,
        nb_jours: nb_jours,
        motif: motif
      };
      const res = await fetch('http://localhost:8000/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Erreur serveur');
      setSuccess(true);
      setMotif('');
      setDateDebut('');
      setDateFin('');
      if (onSuccess) onSuccess();
    } catch (error) {
      setError('Erreur lors de l\'enregistrement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-4">Nouvelle Demande de Congé</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Date début :</label>
          <input type="date" value={dateDebut} onChange={e=>setDateDebut(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <div className="mb-3">
          <label>Date fin :</label>
          <input type="date" value={dateFin} onChange={e=>setDateFin(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <div className="mb-3">
          <label>Type de congé :</label>
          <select value={typeConge} onChange={e=>setTypeConge(e.target.value)} className="w-full border rounded p-2">
            {typeOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.nom}</option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label>Motif :</label>
          <textarea value={motif} onChange={e=>setMotif(e.target.value)} className="w-full border rounded p-2" />
        </div>
        {/* Champ pièce jointe à faire plus tard */}
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">Demande envoyée avec succès !</div>}
        <div className="flex gap-2">
          <button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-4 py-2 rounded">Envoyer</button>
          <button type="button" onClick={onCancel} className="bg-gray-400 text-white px-4 py-2 rounded">Annuler</button>
        </div>
      </form>
    </div>
  );
}

export default NouvelleDemande;



