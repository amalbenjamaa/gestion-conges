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

  // Charger les demandes récentes avec les infos utilisateur
  fetch('http://localhost:8000/api/requests', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      const recent = Array.isArray(data) ? data.slice(0, 10) : [];
      console.log('Demandes récentes chargées:', recent);
      setDemandesRecentes(recent);
    })
    .catch(err => {
      console.error('Erreur chargement demandes:', err);
    });
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
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un Utilisateur
          </button>
        </div>

        {/* Cartes KPI - Identiques à la page Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Carte 1 : Total Employés - Bleu */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform transition-all hover:scale-105 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Total Employés</p>
                <p className="text-5xl font-bold mb-2">{loading ? '...' : stats?.totalEmployes || 0}</p>
                <p className="text-blue-100 text-sm">Collaborateurs</p>
              </div>
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Carte 2 : Présents - Vert */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white transform transition-all hover:scale-105 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">Présents aujourd'hui</p>
                <p className="text-5xl font-bold mb-2">{loading ? '...' : stats?.presentAujourdhui || 0}</p>
                <p className="text-green-100 text-sm">Au bureau</p>
              </div>
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Carte 3 : En congé - Orange */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white transform transition-all hover:scale-105 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium mb-1">En congé</p>
                <p className="text-5xl font-bold mb-2">{loading ? '...' : stats?.enConge || 0}</p>
                <p className="text-orange-100 text-sm">Absents</p>
              </div>
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Carte 4 : En attente - Jaune */}
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl shadow-xl p-6 text-white transform transition-all hover:scale-105 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium mb-1">Demandes en attente</p>
                <p className="text-5xl font-bold mb-2">{loading ? '...' : stats?.demandesEnAttente || 0}</p>
                <p className="text-yellow-100 text-sm">À traiter</p>
              </div>
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Division en 2 colonnes : Employés + Demandes récentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Colonne GAUCHE : Tous les employés */}
<div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
  <div className="p-6 border-b border-gray-200">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-gray-900">Tous les employés</h2>
      <span className="bg-blue-100 text-blue-800 px-4 py-1.5 rounded-full text-sm font-bold">
        {employes.length} employés
      </span>
    </div>
  </div>
  
  <div className="p-6 overflow-auto max-h-[700px]">
    {employes.length === 0 ? (
      <div className="text-center py-16 text-gray-500">
        <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="font-semibold text-lg">Aucun employé trouvé</p>
      </div>
    ) : (
      <div className="space-y-3">
        {employes.map((emp) => (
          <div
            key={emp.id}
            onClick={() => navigate(`/employes/${emp.id}`)}
            className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-blue-50 rounded-xl hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-blue-300 group"
          >
            <div className="flex items-center gap-4">
              {/* Avatar avec photo ou initiale */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform overflow-hidden">
                {emp.avatar_url ? (
                  <img 
                    src={emp.avatar_url} 
                    alt={emp.nom || 'Avatar'} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.textContent = emp.nom?.charAt(0)?.toUpperCase() || 'E';
                    }}
                  />
                ) : (
                  emp.nom?.charAt(0)?.toUpperCase() || 'E'
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{emp.nom || 'Sans nom'}</p>
                <p className="text-sm text-gray-600">{emp.email}</p>
                {emp.position && (
                  <p className="text-xs text-gray-500 mt-1">📋 {emp.position}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600 mb-1">Solde restant</p>
              <p className="text-2xl font-bold text-green-600">{emp.solde || 0}j</p>
              <p className="text-xs text-gray-500">sur {emp.quota_annuel || 25}j</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
{/* Colonne DROITE : Demandes récentes */}
<div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
  <div className="p-6 border-b border-gray-200">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-gray-900">Demandes récentes</h2>
      <button
        onClick={() => navigate('/validation')}
        className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all"
      >
        Voir tout
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>

  <div className="p-6 overflow-auto max-h-[700px]">
    {demandesRecentes.length === 0 ? (
      <div className="text-center py-16 text-gray-500">
        <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="font-semibold text-lg">Aucune demande récente</p>
      </div>
    ) : (
      <div className="space-y-3">
        {demandesRecentes.map((demande) => {
          const isNew = new Date() - new Date(demande.date_demande) < 24 * 60 * 60 * 1000;
          
          return (
            <div
              key={demande.id}
              className="p-5 bg-white rounded-xl hover:shadow-lg transition-all border-2 border-gray-100 hover:border-gray-300"
            >
              {/* En-tête avec avatar, nom et statut */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  {/* Avatar avec photo de profil */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg overflow-hidden border-2 border-purple-200">
                    {demande.avatar_url ? (
                      <img 
                        src={demande.avatar_url} 
                        alt={demande.nom_utilisateur || 'Avatar'} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.textContent = (demande.nom_utilisateur || demande.email_utilisateur || 'U').charAt(0).toUpperCase();
                        }}
                      />
                    ) : (
                      (demande.nom_utilisateur || demande.email_utilisateur || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  
                  {/* Nom et email */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 text-lg">
                        {demande.nom_utilisateur || 'Utilisateur inconnu'}
                      </p>
                      {isNew && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                          NOUVEAU
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {demande.email_utilisateur || ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {demande.type_name || 'Congé'}
                    </p>
                  </div>
                </div>

                {/* Badge de statut */}
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${getStatusBadge(demande.statut)}`}>
                  {getStatusText(demande.statut)}
                </span>
              </div>
              
              {/* Dates et durée */}
              <div className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">{demande.date_debut}</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <span className="font-medium">{demande.date_fin}</span>
                <div className="ml-auto bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold text-sm">
                  {demande.nb_jours} jour{demande.nb_jours > 1 ? 's' : ''}
                </div>
              </div>

              {/* Motif si présent */}
              {demande.motif && (
                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400 mb-3">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Motif :</span> {demande.motif}
                  </p>
                </div>
              )}

              {/* Date de demande (horodatage) */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Demandé {new Date(demande.date_demande).toLocaleDateString('fr-FR', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                
                {/* Temps écoulé depuis la demande */}
                <span className="ml-auto font-semibold text-blue-600">
                  {(() => {
                    const diff = new Date() - new Date(demande.date_demande);
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const days = Math.floor(hours / 24);
                    
                    if (days > 0) return `Il y a ${days}j`;
                    if (hours > 0) return `Il y a ${hours}h`;
                    return 'À l\'instant';
                  })()}
                </span>
              </div>
            </div>
          );
        })}
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