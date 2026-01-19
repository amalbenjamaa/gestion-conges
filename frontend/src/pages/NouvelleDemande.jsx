import { useState } from 'react';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';

function NouvelleDemande({ userEmail, userRole }) {
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
      setError('Tous les champs sont obligatoires');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const nb_jours = Math.ceil((new Date(dateFin) - new Date(dateDebut)) / (1000*60*60*24)) + 1;
      const body = {
        utilisateur_id: 1,
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
      setTimeout(() => {
        navigate('/mes-demandes');
      }, 1500);
    } catch (error) {
      setError('Erreur lors de l\'enregistrement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout userEmail={userEmail} userRole={userRole}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Soumettre une demande</h2>
          <p className="text-gray-600 text-sm">Remplissez le formulaire ci-dessous pour créer une nouvelle demande de congé</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date début *</label>
                <input 
                  type="date" 
                  value={dateDebut} 
                  onChange={e=>setDateDebut(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date fin *</label>
                <input 
                  type="date" 
                  value={dateFin} 
                  onChange={e=>setDateFin(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
                  required 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type de congé *</label>
              <select 
                value={typeConge} 
                onChange={e=>setTypeConge(e.target.value)} 
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
                required
              >
                {typeOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Motif / Commentaire</label>
              <textarea 
                value={motif} 
                onChange={e=>setMotif(e.target.value)} 
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
                rows="4"
                placeholder="Décrivez la raison de votre demande de congé..."
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                ✓ Demande envoyée avec succès ! Redirection en cours...
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <button 
                type="submit" 
                disabled={isLoading} 
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex-1"
              >
                {isLoading ? 'Envoi en cours...' : 'Envoyer la demande'}
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/dashboard')} 
                className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default NouvelleDemande;


