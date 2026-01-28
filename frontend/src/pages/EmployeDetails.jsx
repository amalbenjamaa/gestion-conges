import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

function badgeColor(status) {
  if (status === 'validee') return 'bg-green-600 text-white';
  if (status === 'refusee') return 'bg-red-600 text-white';
  if (status === 'en_attente') return 'bg-yellow-400 text-black';
  if (status === 'annulee') return 'bg-gray-400 text-white';
  return 'bg-gray-200 text-black';
}

function EmployeDetails({ userEmail, userRole, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employe, setEmploye] = useState(null);
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Récupérer les infos de l'employé
    fetch('http://localhost:8000/api/collaborateurs')
      .then(res => res.json())
      .then(data => {
        const found = Array.isArray(data) ? data.find(e => e.id === parseInt(id)) : null;
        if (found) {
          setEmploye(found);
        } else {
          setError('Employé non trouvé');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Erreur lors du chargement');
        setLoading(false);
      });

    // Récupérer les demandes de cet employé
    fetch(`http://localhost:8000/api/requests?user_id=${id}`)
      .then(res => res.json())
      .then(data => {
        setDemandes(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, [id]);

  const handleAvatarUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await fetch(`http://localhost:8000/api/employes/${id}/avatar`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur upload');
      setEmploye((prev) => ({ ...(prev || {}), avatar_url: data.avatar_url }));
      // recharge propre
      setEmploye(data);
      alert('Photo mise à jour.');
    } catch (e) {
      alert(e.message || 'Erreur upload');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
        <div className="text-center py-8">Chargement...</div>
      </Layout>
    );
  }

  if (error || !employe) {
    return (
      <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Employé non trouvé'}
        </div>
      </Layout>
    );
  }

  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour au tableau de bord
            </button>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Détails de l'employé</h1>
            <p className="text-gray-600 text-sm">Historique complet des congés</p>
          </div>
        </div>

        {/* Carte info employé */}
        <div className="glass-panel p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-sm overflow-hidden">
              {employe.avatar_url ? (
                <img src={employe.avatar_url} alt="avatar" className="w-16 h-16 object-cover" />
              ) : (
                employe.nom.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{employe.nom}</h2>
              <p className="text-gray-600">{employe.email}</p>
              {employe.position && (
                <p className="text-sm text-gray-500 mt-1">📋 {employe.position}</p>
              )}
              <div className="flex gap-4 mt-2">
                <span className="text-sm text-gray-600">Quota annuel: <strong>{employe.quota_annuel} j</strong></span>
                <span className="text-sm text-gray-600">Consommé: <strong>{employe.consomme} j</strong></span>
                <span className="text-sm text-gray-600">Solde: <strong className="text-green-600">{employe.solde} j</strong></span>
              </div>
            </div>
            <div className="ml-auto">
              <label className="inline-flex items-center gap-2 bg-white/70 hover:bg-white/90 px-4 py-2 rounded-lg cursor-pointer text-sm font-semibold shadow-sm">
                {uploading ? 'Upload…' : 'Changer photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Tableau des demandes */}
        <div className="glass-panel p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Historique des demandes</h3>
          {demandes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Aucune demande trouvée pour cet employé.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/70">
                <thead className="bg-white/60">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date début</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date fin</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nb jours</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Motif</th>
                  </tr>
                </thead>
                <tbody className="bg-white/70 divide-y divide-gray-200/70">
                  {demandes.map((d) => (
                    <tr key={d.id} className="hover:bg-white/80 transition-colors">
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
      </div>
    </Layout>
  );
}

export default EmployeDetails;
