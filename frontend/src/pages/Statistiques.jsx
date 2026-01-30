import { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import Layout from '../components/Layout';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function Statistiques({ userEmail, userRole, onLogout }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = () => {
    setLoading(true);
    fetch('http://localhost:8000/api/stats', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    setTimeout(() => loadStats(), 0);

    // Écouter les mises à jour de demandes
    const handleUpdate = () => setTimeout(() => loadStats(), 0);
    window.addEventListener('demandeUpdated', handleUpdate);

    return () => {
      window.removeEventListener('demandeUpdated', handleUpdate);
    };
  }, []);

  if (loading) return <Layout userEmail={userEmail}><div>Chargement...</div></Layout>;

  const typeData = {
    labels: stats?.byType?.map(t => t.type) || [],
    datasets: [{
      label: 'Nombre de demandes',
      data: stats?.byType?.map(t => parseInt(t.count) || 0) || [],
      backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
    }]
  };

  const monthlyData = {
    labels: stats?.perMonth?.map(m => m.month) || [],
    datasets: [{
      label: 'Jours de congés pris',
      data: stats?.perMonth?.map(m => parseInt(m.total_jours) || 0) || [],
      backgroundColor: '#2563eb',
      borderColor: '#1d4ed8',
      borderWidth: 1,
      borderRadius: 6,
      maxBarThickness: 24
    }]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: 0 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        padding: 10,
        titleFont: { size: 12, weight: '600' },
        bodyFont: { size: 11 }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#4b5563' }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#e5e7eb' },
        ticks: { stepSize: 1, font: { size: 11 }, color: '#4b5563' }
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
          padding: 12,
          font: { size: 11 },
          color: '#374151',
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        padding: 10
      }
    }
  };
  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Statistiques de la société</h1>
          <p className="text-gray-600 text-sm">Visualisation des données et évolution des congés</p>
        </div>

        {/* Cartes KPI */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-lg shadow-sm border border-white/20">
            <p className="text-gray-600 text-sm font-medium mb-1">Total Employés</p>
            <p className="text-3xl font-bold text-gray-800">{stats?.totalEmployes || 0}</p>
          </div>
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-lg shadow-sm border border-white/20">
            <p className="text-gray-600 text-sm font-medium mb-1">Présents aujourd'hui</p>
            <p className="text-3xl font-bold text-gray-800">{stats?.presentAujourdhui || 0}</p>
          </div>
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-lg shadow-sm border border-white/20">
            <p className="text-gray-600 text-sm font-medium mb-1">En congé</p>
            <p className="text-3xl font-bold text-gray-800">{stats?.enConge || 0}</p>
          </div>
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-lg shadow-sm border border-white/20">
            <p className="text-gray-600 text-sm font-medium mb-1">Demandes en attente</p>
            <p className="text-3xl font-bold text-gray-800">{stats?.demandesEnAttente || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/70 backdrop-blur-md p-4 rounded-lg shadow-sm border border-white/20">
            <h3 className="text-lg font-bold mb-3 text-gray-800">Évolution des demandes</h3>
            <div className="h-56">
              <Bar data={monthlyData} options={barOptions} />
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-md p-4 rounded-lg shadow-sm border border-white/20">
            <h3 className="text-lg font-bold mb-3 text-gray-800">Répartition par type</h3>
            <div className="h-56">
              <Doughnut data={typeData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Statistiques;
