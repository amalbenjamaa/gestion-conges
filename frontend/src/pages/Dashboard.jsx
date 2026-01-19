import Layout from '../components/Layout';
import SuiviCollaborateurs from '../components/SuiviCollaborateurs';

function Dashboard({ userEmail, userRole, onLogout }) {
  return (
    <Layout userEmail={userEmail} userRole={userRole} onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Tableau de bord</h1>
          <p className="text-gray-600 text-sm">Suivi des collaborateurs et gestion des congés</p>
        </div>

        <SuiviCollaborateurs />
      </div>
    </Layout>
  );
}

export default Dashboard;

