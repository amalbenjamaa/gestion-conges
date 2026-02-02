import { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import Layout from '../components/Layout';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function Statistiques({ userEmail, userRole, onLogout }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/api/stats', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Erreur de chargement');
        return res.json();
      })
      .then(data => {
        console.log('Stats reçues:', data);
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erreur stats:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 text-lg">Chargement des statistiques...</div>
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

  // Données pour le graphique HORIZONTAL d'évolution mensuelle
  const monthlyData = {
    labels: stats?.perMonth?.map(m => {
      const [year, month] = m.month?.split('-') || ['', ''];
      return new Date(year, parseInt(month) - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }).reverse() || [],
    datasets: [{
      label: 'Nombre de demandes',
      data: stats?.perMonth?.map(m => parseInt(m.cnt) || 0).reverse() || [],
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 2,
      borderRadius: 8,
      barThickness: 30
    }]
  };

  const typeData = {
    labels: stats?.byType?.map(t => t.type) || [],
    datasets: [{
      label: 'Nombre de demandes',
      data: stats?.byType?.map(t => parseInt(t.cnt) || 0) || [],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)'
      ],
      borderWidth: 0
    }]
  };

  // Options pour barres HORIZONTALES
  const horizontalBarOptions = {
    indexAxis: 'y', // ⭐ HORIZONTAL
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: 'rgba(229, 231, 235, 0.5)' },
        ticks: { stepSize: 1, font: { size: 12 }, color: '#6b7280' }
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: 12 }, color: '#6b7280' }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: { size: 12 },
          color: '#374151',
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        padding: 12
      }
    }
  };

  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Statistiques</h1>
          <p className="text-gray-600">Visualisation des données et évolution des congés</p>
        </div>

        {/* Cartes KPI - IDENTIQUES au Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Carte 1 : Total Employés - Bleu */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform transition-all hover:scale-105 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Total Employés</p>
                <p className="text-5xl font-bold mb-2">{stats?.totalEmployes || 0}</p>
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
                <p className="text-5xl font-bold mb-2">{stats?.presentAujourdhui || 0}</p>
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
                <p className="text-5xl font-bold mb-2">{stats?.enConge || 0}</p>
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
                <p className="text-5xl font-bold mb-2">{stats?.demandesEnAttente || 0}</p>
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

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graphique HORIZONTAL d'évolution mensuelle */}
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/20">
            <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Évolution mensuelle
            </h3>
            <p className="text-gray-600 text-sm mb-4">Demandes par mois (barres horizontales)</p>
            <div className="h-96">
              <Bar data={monthlyData} options={horizontalBarOptions} />
            </div>
          </div>

          {/* Graphique donut */}
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/20">
            <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              Répartition par type
            </h3>
            <p className="text-gray-600 text-sm mb-4">Distribution des types de congés</p>
            <div className="h-96">
              <Doughnut data={typeData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Statistiques;