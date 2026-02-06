import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

function EmployeDetails({ userEmail, userRole, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employe, setEmploye] = useState(null);
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [notif, setNotif] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    nom_complet: '',
    email: '',
    position: '',
    solde_total: 0,
    solde_consomme: 0
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Récupérer les infos de l'employé (priorité /api/employes, fallback /api/collaborateurs)
        let list = [];
        try {
          const res1 = await fetch('http://localhost:8000/api/employes', { credentials: 'include' });
          if (res1.ok) {
            const data1 = await res1.json();
            list = Array.isArray(data1) ? data1 : (Array.isArray(data1?.employes) ? data1.employes : []);
          } else {
            throw new Error('fallback');
          }
        } catch {
          const res2 = await fetch('http://localhost:8000/api/collaborateurs', { credentials: 'include' });
          if (res2.ok) {
            const data2 = await res2.json();
            list = Array.isArray(data2) ? data2 : (Array.isArray(data2?.employes) ? data2.employes : []);
          }
        }

        let found = list.find(e => e.id === parseInt(id));

        if (found) {
          setEmploye(found);
          
          // 2. Récupérer les demandes de cet employé
          // Seulement si l'employé est trouvé
          const resReq = await fetch(`http://localhost:8000/api/requests?user_id=${id}`, { credentials: 'include' });
          const dataReq = await resReq.json();
          setDemandes(Array.isArray(dataReq) ? dataReq : []);
        } else {
          setError('Employé non trouvé');
        }
      } catch (err) {
        console.error(err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (employe) {
      const quota = employe.quota_annuel ?? employe.solde_total ?? 0;
      const consomme = employe.consomme ?? employe.solde_consomme ?? 0;
      setForm({
        nom_complet: employe.nom || '',
        email: employe.email || '',
        position: employe.position || '',
        solde_total: quota || 0,
        solde_consomme: consomme || 0
      });
    }
  }, [employe]);

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
      
      // Update local state
      setEmploye((prev) => ({ ...(prev || {}), avatar_url: data.avatar_url }));
      setNotif({ type: 'success', message: 'Photo mise à jour' });
    } catch (e) {
      setNotif({ type: 'error', message: e.message || 'Erreur upload' });
    } finally {
      setUploading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotif(null);
    try {
      const payload = {
        nom_complet: form.nom_complet,
        email: form.email,
        position: form.position,
        solde_total: parseInt(form.solde_total, 10),
        solde_consomme: parseInt(form.solde_consomme, 10)
      };
      const res = await fetch(`http://localhost:8000/api/employes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la modification');
      }
      setEmploye({
        id: data.id,
        nom: data.nom_complet || form.nom_complet,
        email: data.email || form.email,
        position: data.position || form.position,
        avatar_url: data.avatar_url || employe.avatar_url,
        solde_total: data.solde_total ?? payload.solde_total,
        solde_consomme: data.solde_consomme ?? payload.solde_consomme,
        quota_annuel: data.solde_total ?? payload.solde_total,
        consomme: data.solde_consomme ?? payload.solde_consomme,
        solde: (data.solde_total ?? payload.solde_total) - (data.solde_consomme ?? payload.solde_consomme)
      });
      setEditMode(false);
      setNotif({ type: 'success', message: 'Informations mises à jour' });
    } catch (err) {
      setError(err.message);
      setNotif({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirm = window.confirm('Supprimer définitivement cet employé et toutes ses demandes ?');
    if (!confirm) return;
    setSaving(true);
    setError('');
    setNotif(null);
    try {
      const res = await fetch(`http://localhost:8000/api/employes/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }
      setNotif({ type: 'success', message: 'Employé supprimé' });
      try {
        window.dispatchEvent(new CustomEvent('userDeleted', { detail: { id: parseInt(id, 10) } }));
      } catch {}
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setNotif({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500 text-lg">Chargement...</div>
        </div>
      </Layout>
    );
  }

  if (error || !employe) {
    return (
      <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Employé non trouvé'}
          <button onClick={() => navigate('/dashboard')} className="block mt-2 text-sm underline hover:text-red-800">
            Retour au tableau de bord
          </button>
        </div>
      </Layout>
    );
  }

  // Calcul des soldes (fallback si noms différents)
  const quota = employe.quota_annuel ?? employe.solde_total ?? 0;
  const consomme = employe.consomme ?? employe.solde_consomme ?? 0;
  const restant = employe.solde ?? employe.solde_restant ?? (quota - consomme);

  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      {notif && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${notif.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{notif.message}</span>
            <button className="text-gray-400 hover:text-gray-600 ml-2" onClick={() => setNotif(null)}>✕</button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Navigation et Titre */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Détails de l'employé</h1>
            <p className="text-gray-600 text-sm">Informations personnelles et historique des congés</p>
          </div>
          {userRole === 'manager' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditMode((v) => !v)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors font-semibold shadow-sm"
              >
                {editMode ? 'Annuler' : 'Modifier'}
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Supprimer
              </button>
            </div>
          )}
        </div>

        {/* Carte Profil (Style Profil.jsx) */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-md overflow-hidden ring-4 ring-white">
                {employe.avatar_url ? (
                  <img src={employe.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  (employe.nom || employe.email || 'E').charAt(0).toUpperCase()
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-white text-gray-700 p-1.5 rounded-full shadow-md cursor-pointer hover:bg-gray-50 border border-gray-200 transition-transform hover:scale-105">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                 </svg>
                 <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
                />
              </label>
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{employe.nom}</h2>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                   <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                   {employe.email}
                </div>
                {employe.position && (
                  <div className="flex items-center gap-2">
                     <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                     {employe.position}
                  </div>
                )}
                <div className="flex items-center gap-2">
                   <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                   {employe.telephone || 'Non renseigné'}
                </div>
              </div>
            </div>
          </div>

          {/* Grid Stats Solde */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 border-t border-gray-100 pt-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center hover:bg-gray-100 transition-colors">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quota Annuel</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">{quota} j</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center hover:bg-gray-100 transition-colors">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Consommé</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{consomme} j</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center border border-green-100 hover:bg-green-100 transition-colors">
              <div className="text-xs font-medium text-green-700 uppercase tracking-wide">Solde Restant</div>
              <div className="text-2xl font-bold text-green-700 mt-1">{restant} j</div>
            </div>
          </div>
        </div>

        {editMode && userRole === 'manager' && (
          <form onSubmit={handleEditSubmit} className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nom complet</label>
                <input
                  type="text"
                  name="nom_complet"
                  value={form.nom_complet}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Position / Poste</label>
                <input
                  type="text"
                  name="position"
                  value={form.position}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quota annuel (jours)</label>
                <input
                  type="number"
                  name="solde_total"
                  value={form.solde_total}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  min="0"
                  max="60"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Consommé (jours)</label>
                <input
                  type="number"
                  name="solde_consomme"
                  value={form.solde_consomme}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  min="0"
                  max="60"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-8">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        {/* Historique des demandes */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-800">Historique des demandes</h3>
            <span className="text-xs font-medium px-2.5 py-1 bg-gray-200 text-gray-700 rounded-full">{demandes.length} demandes</span>
          </div>
          
          {demandes.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white">
              <div className="mb-3">
                 <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <p>Aucune demande trouvée pour cet employé.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Durée</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Motif</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {demandes.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{d.date_debut}</div>
                        <div className="text-xs text-gray-500">au {d.date_fin}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                        {d.type_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {d.nb_jours} jours
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          d.statut === 'validee' ? 'bg-green-100 text-green-700 border-green-200' : 
                          d.statut === 'refusee' ? 'bg-red-100 text-red-700 border-red-200' : 
                          d.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 
                          'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          {d.statut === 'validee' ? 'Validé' : d.statut === 'refusee' ? 'Refusé' : d.statut === 'en_attente' ? 'En attente' : d.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={d.motif}>
                        {d.motif || '-'}
                      </td>
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
