import { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function Statistiques({ userEmail, userRole, onLogout }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('🔄 Chargement des statistiques...');
    
    fetch('http://localhost:8000/api/stats', { credentials: 'include' })
      .then(res => {
        console.log('📡 Réponse API stats, status:', res.status);
        if (!res.ok) throw new Error('Erreur de chargement');
        return res.json();
      })
      .then(data => {
        console.log('📊 Stats reçues:', data);
        console.log('📅 Nombre de mois:', data.perMonth?.length);
        console.log('📅 Détails mois:', data.perMonth);
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Erreur stats:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-500 text-lg">Chargement des statistiques...</span>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Erreur : {error}
        </div>
      </Layout>
    );
  }

  // ✅ Données pour le graphique d'évolution mensuelle
  const monthlyData = {
    labels: stats?.perMonth?.map(m => m.month_label || m.month) || [],
    datasets: [{
      label: 'Nombre de demandes',
      data: stats?.perMonth?.map(m => parseInt(m.count || m.cnt) || 0) || [],
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 2,
      borderRadius: 8,
      barThickness: 30
    }]
  };

  // ✅ Camembert plus fin avec cutout
  const typeData = {
    labels: stats?.byType?.map(t => t.type) || [],
    datasets: [{
      label: 'Nombre de demandes',
      data: stats?.byType?.map(t => parseInt(t.count || t.cnt) || 0) || [],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const monthlyOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { display: true, color: 'rgba(0,0,0,0.05)' },
        ticks: { stepSize: 1 }
      },
      y: {
        grid: { display: false }
      }
    }
  };

  // ✅ Options pour camembert plus fin (donut)
  const typeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',  // ✅ Plus c'est élevé, plus c'est fin (70% = très fin)
    plugins: {
      legend: {
        position: 'bottom',
        labels: { 
          padding: 15, 
          font: { size: 12 },
          usePointStyle: true
        }
      }
    }
  };

  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Statistiques</h1>
          <p className="text-gray-600">Analyse détaillée des congés et absences</p>
        </div>

        {/* ✅ 5 CARTES KPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Employés */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-blue-100 text-xs font-medium mb-1">Total Employés</p>
            <p className="text-3xl font-bold">{stats?.totalEmployes || stats?.total_employes || 0}</p>
          </div>

          {/* Présents aujourd'hui */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-green-100 text-xs font-medium mb-1">Présents</p>
            <p className="text-3xl font-bold">{stats?.presentAujourdhui || stats?.present_aujourdhui || 0}</p>
          </div>

          {/* En congé */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-orange-100 text-xs font-medium mb-1">En congé</p>
            <p className="text-3xl font-bold">{stats?.enConge || stats?.conges_en_cours || 0}</p>
          </div>

          {/* ✅ NOUVELLE CARTE : Demandes en attente */}
          <div 
            className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all cursor-pointer"
            onClick={() => navigate('/validation')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-yellow-100 text-xs font-medium mb-1">En attente</p>
            <p className="text-3xl font-bold">{stats?.demandesEnAttente || stats?.conges_en_attente || 0}</p>
          </div>

          {/* Taux d'absence */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-purple-100 text-xs font-medium mb-1">Taux d'absence</p>
            <p className="text-3xl font-bold">{stats?.taux_absence || 0}%</p>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Évolution mensuelle */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Évolution mensuelle (12 mois)
              {stats?.perMonth && (
                <span className="text-sm text-gray-500 ml-2">
                  ({stats.perMonth.length} mois)
                </span>
              )}
            </h2>
            <div style={{ height: '400px' }}>
              {stats?.perMonth && stats.perMonth.length > 0 ? (
                <Bar data={monthlyData} options={monthlyOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </div>

          {/* Répartition par type - Camembert fin */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Répartition par type de congé</h2>
            <div style={{ height: '400px' }}>
              {stats?.byType && stats.byType.length > 0 ? (
                <Doughnut data={typeData} options={typeOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Détails par mois */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Détails par mois
            {stats?.perMonth && (
              <span className="text-sm text-gray-500 ml-2">
                ({stats.perMonth.length} mois affichés)
              </span>
            )}
          </h2>
          {stats?.perMonth && stats.perMonth.length > 0 ? (
            <div className="space-y-3">
              {stats.perMonth.map((m, idx) => {
                const maxCount = Math.max(...stats.perMonth.map(x => x.count || x.cnt || 1));
                const count = m.count || m.cnt || 0;
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700 w-28">
                      {m.month_label || m.month}
                    </span>
                    
                    <div className="flex-1 bg-gray-200 rounded-full h-10 overflow-hidden relative">
                      {count > 0 ? (
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full flex items-center justify-end px-3 text-white text-sm font-bold rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%`, minWidth: '50px' }}
                        >
                          {count}
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
                          Aucun congé
                        </div>
                      )}
                    </div>
                    
                    <span className="text-sm text-gray-600 w-28 text-right font-medium">
                      {m.total_jours || 0} jour{(m.total_jours > 1) ? 's' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="font-medium">Aucune donnée disponible</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Statistiques;