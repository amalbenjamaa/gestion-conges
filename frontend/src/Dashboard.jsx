import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

function Dashboard({ userEmail, userRole, onLogout }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [employes, setEmployes] = useState([]);
  const [demandesRecentes, setDemandesRecentes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger les statistiques
    fetch('http://localhost:8000/api/stats', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Charger la liste des employés
    fetch('http://localhost:8000/api/collaborateurs', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setEmployes(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Charger les demandes récentes
    fetch('http://localhost:8000/api/requests', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const recent = Array.isArray(data) ? data.slice(0, 10) : [];
        setDemandesRecentes(recent);
      })
      .catch(() => {});
  }, []);

  const getStatusBadge = (statut) => {
    switch (statut) {
      case 'validee':
        return 'bg-green-100 text-green-800';
      case 'refusee':
        return 'bg-red-100 text-red-800';
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (statut) => {
    switch (statut) {
      case 'validee': return 'Validée';
      case 'refusee': return 'Refusée';
      case 'en_attente': return 'En attente';
      default: return statut;
    }
  };

  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
            <p className="text-gray-600">Vue d'ensemble de l'activité et des congés</p>
          </div>
          <button
            onClick={() => navigate('/ajouter-utilisateur')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un Utilisateur
          </button>
        </div>

        {/* Cartes KPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Carte 1 : Total Employés */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm font-medium">Total</p>
                <p className="text-5xl font-bold">{loading ? '...' : stats?.totalEmployes || 0}</p>
              </div>
            </div>
            <p className="text-blue-100 font-semibold text-lg">Employés</p>
          </div>

          {/* Carte 2 : Validations */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white transform transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-green-100 text-sm font-medium">Validées</p>
                <p className="text-5xl font-bold">{loading ? '...' : stats?.demandesValidees || 0}</p>
              </div>
            </div>
            <p className="text-green-100 font-semibold text-lg">Demandes approuvées</p>
          </div>

          {/* Carte 3 : Refusées */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-xl p-6 text-white transform transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-red-100 text-sm font-medium">Refusées</p>
                <p className="text-5xl font-bold">{loading ? '...' : stats?.demandesRefusees || 0}</p>
              </div>
            </div>
            <p className="text-red-100 font-semibold text-lg">Demandes rejetées</p>
          </div>

          {/* Carte 4 : En attente */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white transform transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-orange-100 text-sm font-medium">En attente</p>
                <p className="text-5xl font-bold">{loading ? '...' : stats?.demandesEnAttente || 0}</p>
              </div>
            </div>
            <p className="text-orange-100 font-semibold text-lg">À traiter</p>
          </div>
        </div>

        {/* Deux colonnes : Employés + Demandes récentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colonne gauche : Tous les employés */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Tous les employés</h2>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                {employes.length} employés
              </span>
            </div>
            
            <div className="overflow-auto max-h-[600px]">
              {employes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="font-medium">Aucun employé trouvé</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {employes.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => navigate(`/employes/${emp.id}`)}
                      className="flex items-center justify-between p-4 bg-white rounded-xl hover:shadow-lg transition-all cursor-pointer border border-gray-100 hover:border-blue-300"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                          {emp.nom?.charAt(0)?.toUpperCase() || 'E'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{emp.nom || 'Sans nom'}</p>
                          <p className="text-sm text-gray-600">{emp.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Solde</p>
                        <p className="text-xl font-bold text-green-600">{emp.solde || 0}j</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Colonne droite : Demandes récentes */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Demandes récentes</h2>
              <button
                onClick={() => navigate('/validation')}
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1"
              >
                Voir tout
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="overflow-auto max-h-[600px]">
              {demandesRecentes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="font-medium">Aucune demande récente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {demandesRecentes.map((demande) => (
                    <div
                      key={demande.id}
                      className="p-4 bg-white rounded-xl hover:shadow-lg transition-all border border-gray-100"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-gray-900">{demande.nom_utilisateur || 'Utilisateur'}</p>
                          <p className="text-sm text-gray-600">{demande.type_name || 'Congé'}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(demande.statut)}`}>
                          {getStatusText(demande.statut)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-700">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{demande.date_debut}</span>
                        </div>
                        <span className="text-gray-400">→</span>
                        <span>{demande.date_fin}</span>
                        <div className="ml-auto font-semibold text-blue-600">
                          {demande.nb_jours}j
                        </div>
                      </div>
                      {demande.motif && (
                        <p className="mt-2 text-sm text-gray-600 italic">"{demande.motif}"</p>
                      )}
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