import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';


function Dashboard({ userEmail, userRole, onLogout }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [employes, setEmployes] = useState([]);
  const [demandesRecentes, setDemandesRecentes] = useState([]);
  const [loading, setLoading] = useState(true);
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord Manager</h1>
    <p className="text-gray-600">Vue d'ensemble de l'activité</p>
  </div>

  <div className="flex items-center gap-3">
    <Link
      to="/ajouter-utilisateur"
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition"
    >
      {/* Icône + texte */}
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Ajouter un utilisateur
    </Link>
  </div>
</div>
  useEffect(() => {
    console.log('🔄 Chargement Dashboard Manager...');
    
    // Charger les stats
    fetch('http://localhost:8000/api/stats', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        console.log('📊 Stats:', data);
        setStats(data);
      })
      .catch(err => console.error('❌ Erreur stats:', err));

    // Charger les employés
    fetch('http://localhost:8000/api/employes', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        console.log('👥 Employés:', data);
        setEmployes(data.employes || []);
      })
      .catch(err => console.error('❌ Erreur employés:', err));

    // Charger les demandes des 7 derniers jours (tous statuts)
    fetch('http://localhost:8000/api/requests/recent', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        console.log('📋 Demandes 7j reçues:', data);
        const demandes = data.requests || [];
        console.log('✅ Nombre de demandes 7j:', demandes.length);
        setDemandesRecentes(demandes);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Erreur demandes récentes:', err);
        setLoading(false);
      });
  }, []);

  const getStatusBadge = (statut) => {
    const badges = {
      'en_attente': <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">⏳ En attente</span>,
      'validee': <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">✅ Validée</span>,
      'refusee': <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">❌ Refusée</span>
    };
    return badges[statut] || badges['en_attente'];
  };

  if (loading) {
    return (
      <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-500">Chargement...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      <div className="space-y-6">
        {/* En-tête */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord Manager</h1>
          <p className="text-gray-600">Vue d'ensemble de l'activité</p>
        </div>

        {/* Cartes statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-blue-100 text-sm font-medium mb-1">Total Employés</p>
            <p className="text-4xl font-bold">{employes.length}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-green-100 text-sm font-medium mb-1">Présents</p>
            <p className="text-4xl font-bold">{stats?.presentAujourdhui || stats?.present_aujourdhui || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-orange-100 text-sm font-medium mb-1">En congé</p>
            <p className="text-4xl font-bold">{stats?.enConge || stats?.conges_en_cours || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-yellow-100 text-sm font-medium mb-1">Demandes 7j</p>
            <p className="text-4xl font-bold">{demandesRecentes.length}</p>
          </div>
        </div>

        {/* 2 COLONNES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* GAUCHE : Demandes récentes (7 derniers jours, tous statuts) */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Demandes récentes ({demandesRecentes.length})
              </h2>
              <span className="text-sm text-gray-500">7 derniers jours</span>
            </div>

            <div className="p-4 max-h-[600px] overflow-y-auto">
              {demandesRecentes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="font-medium">Aucune demande récente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {demandesRecentes.map((demande) => (
                    <div key={demande.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {demande.prenom?.[0]}{demande.nom?.[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {demande.nom_complet || `${demande.prenom} ${demande.nom}`}
                            </p>
                            <p className="text-xs text-gray-400">
                              📅 Envoyée le {demande.date_demande_formatted}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(demande.statut)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs">Type</p>
                          <p className="font-medium text-gray-900">{demande.type_conge}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Durée</p>
                          <p className="font-medium text-gray-900">{demande.nb_jours} jour{demande.nb_jours > 1 ? 's' : ''}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-500 text-xs">Période</p>
                          <p className="font-medium text-gray-900">
                            {demande.date_debut_formatted} → {demande.date_fin_formatted}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* DROITE : Liste des employés - CLIQUABLES */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Employés ({employes.length})
              </h2>
            </div>

            <div className="p-4 max-h-[600px] overflow-y-auto">
              {employes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p className="font-medium">Aucun employé trouvé</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {employes.map((emp) => (
                    <div 
                      key={emp.id} 
                      onClick={() => {
                        console.log('👆 Clic sur employé:', emp.id);
                        navigate(`/employes/${emp.id}`);
                      }}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 hover:shadow-lg transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {emp.nom_complet?.[0] || 'E'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {emp.nom_complet}
                          </p>
                          <p className="text-sm text-gray-500">{emp.email}</p>
                          <p className="text-xs text-gray-400">
                            {emp.position || 'Employé'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-blue-600">
                          {(() => {
                            const total = Number(emp.solde_total ?? emp.quota_annuel ?? 0);
                            const cons = Number(emp.solde_consomme ?? emp.consomme ?? 0);
                            const rest = Number(emp.solde_restant ?? (total - cons));
                            const val = Math.max(0, isNaN(rest) ? (total - cons) : rest);
                            return `${val} jours`;
                          })()}
                        </p>
                        <p className="text-xs text-gray-500">restants</p>
                        {emp.est_en_conge && (
                          <p className="text-xs text-orange-600 font-semibold mt-1">🏖️ En congé</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
