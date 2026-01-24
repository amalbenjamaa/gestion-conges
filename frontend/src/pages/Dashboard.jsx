import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import SuiviCollaborateurs from '../components/SuiviCollaborateurs';

function Dashboard({ userEmail, userRole, onLogout }) {
  const navigate = useNavigate();

  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Tableau de bord</h1>
            <p className="text-gray-600 text-sm">Suivi des collaborateurs et gestion des congés</p>
          </div>
          <button
            onClick={() => navigate('/ajouter-utilisateur')}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un Utilisateur
          </button>
        </div>

        <SuiviCollaborateurs />
      </div>
    </Layout>
  );
}

export default Dashboard;

