import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

function GestionProfils({ userEmail, userRole, onLogout }) {
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmploye, setSelectedEmploye] = useState(null);
  const [formData, setFormData] = useState({
    nom_complet: '',
    email: '',
    position: '',
    avatar_url: '',
    solde_total: 0,
    solde_consomme: 0
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/api/collaborateurs', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        setEmployes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleSelectEmploye = (employe) => {
    setSelectedEmploye(employe);
    setFormData({
      nom_complet: employe.nom || '',
      email: employe.email || '',
      position: employe.position || '',
      avatar_url: employe.avatar_url || '',
      solde_total: employe.quota_annuel || 0,
      solde_consomme: employe.consomme || 0
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmploye) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`http://localhost:8000/api/employes/${selectedEmploye.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      setSuccess('Profil mis à jour avec succès !');
      
      // Recharger la liste des employés
      const resList = await fetch('http://localhost:8000/api/collaborateurs', { credentials: 'include' });
      const listData = await resList.json();
      setEmployes(Array.isArray(listData) ? listData : []);
      
      // Mettre à jour l'employé sélectionné
      const updated = Array.isArray(listData) ? listData.find(e => e.id === selectedEmploye.id) : null;
      if (updated) {
        setSelectedEmploye(updated);
        setFormData({
          nom_complet: updated.nom || '',
          email: updated.email || '',
          avatar_url: updated.avatar_url || '',
          solde_total: updated.quota_annuel || 0,
          solde_consomme: updated.consomme || 0
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Gestion des Profils Employés</h1>
          <p className="text-gray-600 text-sm">Modifiez les informations et soldes des employés</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Liste des employés */}
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-lg shadow-md border border-white/20">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Liste des employés</h2>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Chargement...</div>
            ) : employes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Aucun employé trouvé</div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {employes.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => handleSelectEmploye(emp)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedEmploye?.id === emp.id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {emp.nom.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{emp.nom}</p>
                        <p className="text-sm text-gray-600">{emp.email}</p>
                        {emp.position && (
                          <p className="text-xs text-gray-500 mt-0.5">📋 {emp.position}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Solde: {emp.solde} j / {emp.quota_annuel} j
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulaire de modification */}
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-lg shadow-md border border-white/20">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {selectedEmploye ? `Modifier: ${selectedEmploye.nom}` : 'Sélectionnez un employé'}
            </h2>

            {selectedEmploye ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nom complet</label>
                  <input
                    type="text"
                    value={formData.nom_complet}
                    onChange={(e) => setFormData({ ...formData, nom_complet: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Position / Poste</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Ex: Développeur, Manager RH..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">URL de l'avatar (optionnel)</label>
                  <input
                    type="url"
                    value={formData.avatar_url}
                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/avatar.jpg"
                  />
                  {formData.avatar_url && (
                    <img
                      src={formData.avatar_url}
                      alt="Avatar preview"
                      className="mt-2 w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Quota annuel (jours)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.solde_total}
                      onChange={(e) => setFormData({ ...formData, solde_total: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Jours consommés</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.solde_consomme}
                      onChange={(e) => setFormData({ ...formData, solde_consomme: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Solde restant:</strong> {formData.solde_total - formData.solde_consomme} jours
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                    {success}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEmploye(null);
                      setError('');
                      setSuccess('');
                    }}
                    className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p>Sélectionnez un employé pour modifier son profil</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default GestionProfils;
