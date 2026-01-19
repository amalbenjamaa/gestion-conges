import { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import Layout from '../components/Layout';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function Statistiques({ userEmail, userRole, onLogout }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Layout userEmail={userEmail}><div>Chargement...</div></Layout>;

  const typeData = {
    labels: stats?.byType?.map(t => t.type) || [],
    datasets: [{
      data: stats?.byType?.map(t => parseInt(t.cnt)) || [],
      backgroundColor: ['#10b981', '#3b82f6', '#f97316', '#ef4444', '#8b5cf6']
    }]
  };

  const monthlyData = {
    labels: stats?.perMonth?.map(m => m.month) || [],
    datasets: [{
      label: 'Jours de congés pris',
      data: stats?.perMonth?.map(m => parseInt(m.cnt)) || [],
      backgroundColor: '#3b82f6'
    }]
  };

  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Statistiques et Graphiques</h1>
          <p className="text-gray-600 text-sm">Visualisation des données et évolution des congés</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Évolution des demandes</h3>
            <Bar data={monthlyData} options={{ 
              responsive: true, 
              plugins: { 
                legend: { display: false },
                tooltip: {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  padding: 12,
                  titleFont: { size: 14 },
                  bodyFont: { size: 12 }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    stepSize: 1
                  }
                }
              }
            }} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Répartition par type</h3>
            <Doughnut data={typeData} options={{ 
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    padding: 15,
                    font: { size: 12 }
                  }
                },
                tooltip: {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  padding: 12
                }
              }
            }} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Statistiques;

